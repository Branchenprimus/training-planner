import type Database from 'better-sqlite3'
import { classifyHrZone, computeRelativeEffort, getStoredRelativeEffortStreams } from '../../domain/hr'
import { deriveTrainingFlags } from '../../domain/training'
import { upsertActivityAnalysis } from '../../repositories/activityRepository'
import { formatPerformanceBySport } from '../../../shared/format'
import type { AppSettings, SportType } from '../../../shared/types'

interface ActivityRow {
  id: number
  sport: SportType
  distance_meters: number
  duration_seconds: number
  average_speed_mps: number | null
  average_heart_rate: number | null
  elevation_gain_meters: number | null
  raw_payload: string | null
}

export function reanalyzeActivities(db: Database.Database, userEmail: string, settings: AppSettings): number {
  const activities = db.prepare(`
    SELECT
      activity.id,
      activity.sport,
      activity.distance_meters,
      activity.duration_seconds,
      activity.average_speed_mps,
      activity.average_heart_rate,
      activity.elevation_gain_meters,
      activity.raw_payload
    FROM activities activity
    JOIN athletes athlete ON athlete.id = activity.athlete_id
    WHERE athlete.user_email = ?
    ORDER BY activity.start_date ASC
  `).all(userEmail) as ActivityRow[]

  const transaction = db.transaction((rows: ActivityRow[]) => {
    for (const activity of rows) {
      const hr = classifyHrZone(settings, activity.sport, activity.average_heart_rate)
      const training = deriveTrainingFlags(activity.sport, hr.classification)

      upsertActivityAnalysis(db, {
        activityId: activity.id,
        formattedPerformance: formatPerformanceBySport(
          activity.sport,
          activity.distance_meters,
          activity.duration_seconds,
          activity.average_speed_mps
        ),
        hrPercentOfMax: hr.hrPercentOfMax,
        relativeEffort: computeRelativeEffort(
          settings,
          activity.sport,
          getStoredRelativeEffortStreams(activity.raw_payload)
        ),
        hrZoneLabel: hr.hrZoneLabel,
        classification: hr.classification,
        isEasySession: training.isEasySession,
        isHardSession: training.isHardSession,
        affectsRunningCounter: training.affectsRunningCounter,
        affectsCyclingCounter: training.affectsCyclingCounter,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  })

  transaction(activities)
  return activities.length
}
