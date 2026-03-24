import type Database from 'better-sqlite3'
import type { ActivityAnalysisRecord, ActivityClassification, ActivityListItem, SportType } from '../../shared/types'

export interface UpsertActivityInput {
  athleteId: number
  sourceActivityId: number
  sourceType: string
  sport: SportType
  name: string
  startDate: string
  timezone: string | null
  durationSeconds: number
  movingTimeSeconds: number | null
  distanceMeters: number
  averageHeartRate: number | null
  elevationGainMeters: number | null
  averageSpeedMps: number | null
  stravaUrl: string
  rawPayload: string | null
}

export interface UpsertAnalysisInput extends ActivityAnalysisRecord {}

function mapActivityRow(row: Record<string, unknown>): ActivityListItem {
  return {
    id: Number(row.id),
    sourceActivityId: Number(row.source_activity_id),
    sport: row.sport as SportType,
    sourceType: String(row.source_type),
    name: String(row.name),
    startDate: String(row.start_date),
    durationSeconds: Number(row.duration_seconds),
    movingTimeSeconds: row.moving_time_seconds === null ? null : Number(row.moving_time_seconds),
    distanceMeters: Number(row.distance_meters),
    averageHeartRate: row.average_heart_rate === null ? null : Number(row.average_heart_rate),
    elevationGainMeters: row.elevation_gain_meters === null ? null : Number(row.elevation_gain_meters),
    averageSpeedMps: row.average_speed_mps === null ? null : Number(row.average_speed_mps),
    stravaUrl: String(row.strava_url),
    formattedPerformance: String(row.formatted_performance),
    hrPercentOfMax: row.hr_percent_of_max === null ? null : Number(row.hr_percent_of_max),
    relativeEffort: row.relative_effort === null ? null : Number(row.relative_effort),
    hrZoneLabel: String(row.hr_zone_label),
    classification: row.classification as ActivityClassification,
    isEasySession: Boolean(row.is_easy_session),
    isHardSession: Boolean(row.is_hard_session)
  }
}

export function upsertActivity(db: Database.Database, input: UpsertActivityInput): number {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO activities (
      athlete_id, source_activity_id, source_type, sport, name, start_date, timezone, duration_seconds,
      moving_time_seconds, distance_meters, average_heart_rate, elevation_gain_meters, average_speed_mps,
      strava_url, raw_payload, created_at, updated_at
    )
    VALUES (
      @athleteId, @sourceActivityId, @sourceType, @sport, @name, @startDate, @timezone, @durationSeconds,
      @movingTimeSeconds, @distanceMeters, @averageHeartRate, @elevationGainMeters, @averageSpeedMps,
      @stravaUrl, @rawPayload, @now, @now
    )
    ON CONFLICT(source_activity_id) DO UPDATE SET
      source_type = excluded.source_type,
      sport = excluded.sport,
      name = excluded.name,
      start_date = excluded.start_date,
      timezone = excluded.timezone,
      duration_seconds = excluded.duration_seconds,
      moving_time_seconds = excluded.moving_time_seconds,
      distance_meters = excluded.distance_meters,
      average_heart_rate = excluded.average_heart_rate,
      elevation_gain_meters = excluded.elevation_gain_meters,
      average_speed_mps = excluded.average_speed_mps,
      strava_url = excluded.strava_url,
      raw_payload = excluded.raw_payload,
      updated_at = excluded.updated_at
  `).run({ ...input, now })

  const row = db.prepare('SELECT id FROM activities WHERE source_activity_id = ?').get(input.sourceActivityId) as { id: number }
  return row.id
}

export function upsertActivityAnalysis(db: Database.Database, input: UpsertAnalysisInput): void {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO activity_analysis (
      activity_id, formatted_performance, hr_percent_of_max, relative_effort, hr_zone_label, classification,
      is_easy_session, is_hard_session, affects_running_counter, affects_cycling_counter, created_at, updated_at
    )
    VALUES (
      @activityId, @formattedPerformance, @hrPercentOfMax, @relativeEffort, @hrZoneLabel, @classification,
      @isEasySession, @isHardSession, @affectsRunningCounter, @affectsCyclingCounter, @now, @now
    )
    ON CONFLICT(activity_id) DO UPDATE SET
      formatted_performance = excluded.formatted_performance,
      hr_percent_of_max = excluded.hr_percent_of_max,
      relative_effort = excluded.relative_effort,
      hr_zone_label = excluded.hr_zone_label,
      classification = excluded.classification,
      is_easy_session = excluded.is_easy_session,
      is_hard_session = excluded.is_hard_session,
      affects_running_counter = excluded.affects_running_counter,
      affects_cycling_counter = excluded.affects_cycling_counter,
      updated_at = excluded.updated_at
  `).run({
    ...input,
    isEasySession: input.isEasySession ? 1 : 0,
    isHardSession: input.isHardSession ? 1 : 0,
    affectsRunningCounter: input.affectsRunningCounter ? 1 : 0,
    affectsCyclingCounter: input.affectsCyclingCounter ? 1 : 0,
    now
  })
}

export function getActivitiesBySport(
  db: Database.Database,
  userEmail: string,
  sport: SportType,
  page: number,
  pageSize: number,
  startDate?: string
): { total: number; items: ActivityListItem[] } {
  const total = startDate
    ? Number((
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM activities activity
          JOIN athletes athlete ON athlete.id = activity.athlete_id
          WHERE athlete.user_email = ? AND activity.sport = ? AND activity.start_date >= ?
        `).get(userEmail, sport, startDate) as { count: number }
      ).count)
    : Number((
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM activities activity
          JOIN athletes athlete ON athlete.id = activity.athlete_id
          WHERE athlete.user_email = ? AND activity.sport = ?
        `).get(userEmail, sport) as { count: number }
      ).count)

  const rows = startDate
    ? db.prepare(`
        SELECT a.*, aa.formatted_performance, aa.hr_percent_of_max, aa.relative_effort, aa.hr_zone_label, aa.classification, aa.is_easy_session, aa.is_hard_session
        FROM activities a
        JOIN athletes athlete ON athlete.id = a.athlete_id
        JOIN activity_analysis aa ON aa.activity_id = a.id
        WHERE athlete.user_email = ? AND a.sport = ? AND a.start_date >= ?
        ORDER BY a.start_date DESC
        LIMIT ? OFFSET ?
      `).all(userEmail, sport, startDate, pageSize, (page - 1) * pageSize)
    : db.prepare(`
        SELECT a.*, aa.formatted_performance, aa.hr_percent_of_max, aa.relative_effort, aa.hr_zone_label, aa.classification, aa.is_easy_session, aa.is_hard_session
        FROM activities a
        JOIN athletes athlete ON athlete.id = a.athlete_id
        JOIN activity_analysis aa ON aa.activity_id = a.id
        WHERE athlete.user_email = ? AND a.sport = ?
        ORDER BY a.start_date DESC
        LIMIT ? OFFSET ?
      `).all(userEmail, sport, pageSize, (page - 1) * pageSize)

  return {
    total,
    items: (rows as Record<string, unknown>[]).map(mapActivityRow)
  }
}

export function getRecentActivities(db: Database.Database, userEmail: string, limit: number, startDate?: string): ActivityListItem[] {
  const rows = startDate
    ? db.prepare(`
        SELECT a.*, aa.formatted_performance, aa.hr_percent_of_max, aa.relative_effort, aa.hr_zone_label, aa.classification, aa.is_easy_session, aa.is_hard_session
        FROM activities a
        JOIN athletes athlete ON athlete.id = a.athlete_id
        JOIN activity_analysis aa ON aa.activity_id = a.id
        WHERE athlete.user_email = ? AND a.start_date >= ?
        ORDER BY a.start_date DESC
        LIMIT ?
      `).all(userEmail, startDate, limit)
    : db.prepare(`
        SELECT a.*, aa.formatted_performance, aa.hr_percent_of_max, aa.relative_effort, aa.hr_zone_label, aa.classification, aa.is_easy_session, aa.is_hard_session
        FROM activities a
        JOIN athletes athlete ON athlete.id = a.athlete_id
        JOIN activity_analysis aa ON aa.activity_id = a.id
        WHERE athlete.user_email = ?
        ORDER BY a.start_date DESC
        LIMIT ?
      `).all(userEmail, limit) as Record<string, unknown>[]

  return (rows as Record<string, unknown>[]).map(mapActivityRow)
}

export function getActivitiesForCounter(db: Database.Database, userEmail: string, sport: Extract<SportType, 'running' | 'cycling'>): ActivityListItem[] {
  const rows = db.prepare(`
    SELECT a.*, aa.formatted_performance, aa.hr_percent_of_max, aa.relative_effort, aa.hr_zone_label, aa.classification, aa.is_easy_session, aa.is_hard_session
    FROM activities a
    JOIN athletes athlete ON athlete.id = a.athlete_id
    JOIN activity_analysis aa ON aa.activity_id = a.id
    WHERE athlete.user_email = ? AND a.sport = ?
    ORDER BY a.start_date DESC
  `).all(userEmail, sport) as Record<string, unknown>[]

  return rows.map(mapActivityRow)
}

export function getChartActivities(db: Database.Database, userEmail: string, sport: Extract<SportType, 'running' | 'cycling'>, startDate?: string): ActivityListItem[] {
  const rows = startDate
    ? db.prepare(`
        SELECT a.*, aa.formatted_performance, aa.hr_percent_of_max, aa.relative_effort, aa.hr_zone_label, aa.classification, aa.is_easy_session, aa.is_hard_session
        FROM activities a
        JOIN athletes athlete ON athlete.id = a.athlete_id
        JOIN activity_analysis aa ON aa.activity_id = a.id
        WHERE athlete.user_email = ? AND a.sport = ? AND a.start_date >= ?
        ORDER BY a.start_date ASC
      `).all(userEmail, sport, startDate)
    : db.prepare(`
        SELECT a.*, aa.formatted_performance, aa.hr_percent_of_max, aa.relative_effort, aa.hr_zone_label, aa.classification, aa.is_easy_session, aa.is_hard_session
        FROM activities a
        JOIN athletes athlete ON athlete.id = a.athlete_id
        JOIN activity_analysis aa ON aa.activity_id = a.id
        WHERE athlete.user_email = ? AND a.sport = ?
        ORDER BY a.start_date ASC
      `).all(userEmail, sport)

  return (rows as Record<string, unknown>[]).map(mapActivityRow)
}

export function getLatestActivityDate(db: Database.Database, userEmail: string): string | null {
  const row = db.prepare(`
    SELECT activity.start_date
    FROM activities activity
    JOIN athletes athlete ON athlete.id = activity.athlete_id
    WHERE athlete.user_email = ?
    ORDER BY activity.start_date DESC
    LIMIT 1
  `).get(userEmail) as { start_date: string } | undefined
  return row?.start_date ?? null
}

export function getActivityCount(db: Database.Database, userEmail: string): number {
  return Number((
    db.prepare(`
      SELECT COUNT(*) as count
      FROM activities activity
      JOIN athletes athlete ON athlete.id = activity.athlete_id
      WHERE athlete.user_email = ?
    `).get(userEmail) as { count: number }
  ).count)
}

export function getActivityRawPayloads(db: Database.Database, activityIds: number[]): Map<number, string | null> {
  if (!activityIds.length) {
    return new Map()
  }

  const placeholders = activityIds.map(() => '?').join(', ')
  const rows = db.prepare(`
    SELECT id, raw_payload
    FROM activities
    WHERE id IN (${placeholders})
  `).all(...activityIds) as Array<{ id: number; raw_payload: string | null }>

  return new Map(rows.map((row) => [row.id, row.raw_payload ?? null]))
}
