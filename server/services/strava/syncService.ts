import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { initializeDatabase } from '../../database/bootstrap'
import { getActivityCount, getLatestActivityDate, upsertActivity, upsertActivityAnalysis } from '../../repositories/activityRepository'
import { deleteToken, getAthlete, getToken, listConnectedUserEmails, upsertAthlete, upsertToken } from '../../repositories/athleteRepository'
import { getSettings } from '../../repositories/settingsRepository'
import { getSyncStatus, updateSyncStatus } from '../../repositories/syncRepository'
import { classifyHrZone, computeRelativeEffort, type RelativeEffortStreams } from '../../domain/hr'
import { deriveTrainingFlags } from '../../domain/training'
import { formatPerformanceBySport } from '../../../shared/format'
import type { SportType, SyncStatus } from '../../../shared/types'
import { exchangeCodeForToken, fetchStravaActivities, fetchStravaActivityStreams, refreshStravaToken, type StravaActivity } from './client'

const syncPromises = new Map<string, Promise<SyncStatus>>()

interface StoredActivityPayload {
  activity: StravaActivity
  streams: RelativeEffortStreams | null
}

interface MissingRelativeEffortActivity {
  activityId: number
  sourceActivityId: number
  sport: Extract<SportType, 'running' | 'cycling'>
}

function normalizeSport(activity: StravaActivity): SportType | null {
  const value = activity.sport_type || activity.type
  const normalized = value.toLowerCase()

  if (['run', 'trailrun', 'workoutrun', 'virtualrun'].includes(normalized)) {
    return 'running'
  }

  if (['ride', 'virtualride', 'ebikeride', 'gravelride', 'handcycle', 'mountainbikeride'].includes(normalized)) {
    return 'cycling'
  }

  if (normalized === 'swim') {
    return 'swimming'
  }

  return null
}

async function ensureValidToken(userEmail: string) {
  const db = initializeDatabase()
  const athlete = getAthlete(db, userEmail)
  const token = getToken(db, userEmail)

  if (!athlete || !token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Strava is not connected yet.'
    })
  }

  const expiresAt = new Date(token.expiresAt).getTime()
  const shouldRefresh = expiresAt - Date.now() < 5 * 60 * 1000
  if (!shouldRefresh) {
    return {
      athlete,
      accessToken: token.accessToken
    }
  }

  const refreshed = await refreshStravaToken(token.refreshToken, userEmail)
  const updatedAthlete = refreshed.athlete
    ? upsertAthlete(db, {
        userEmail,
        stravaAthleteId: refreshed.athlete.id,
        username: refreshed.athlete.username,
        firstname: refreshed.athlete.firstname,
        lastname: refreshed.athlete.lastname,
        profileMedium: refreshed.athlete.profile_medium
      })
    : athlete

  upsertToken(db, {
    athleteId: updatedAthlete.id,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: new Date(refreshed.expires_at * 1000).toISOString()
  })

  return {
    athlete: updatedAthlete,
    accessToken: refreshed.access_token
  }
}

export async function connectStravaAccount(code: string, userEmail: string): Promise<SyncStatus> {
  const db = initializeDatabase()
  const tokenResponse = await exchangeCodeForToken(code, userEmail)
  if (!tokenResponse.athlete) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Strava did not return athlete details during authorization.'
    })
  }

  const athlete = upsertAthlete(db, {
    userEmail,
    stravaAthleteId: tokenResponse.athlete.id,
    username: tokenResponse.athlete.username,
    firstname: tokenResponse.athlete.firstname,
    lastname: tokenResponse.athlete.lastname,
    profileMedium: tokenResponse.athlete.profile_medium
  })

  upsertToken(db, {
    athleteId: athlete.id,
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt: new Date(tokenResponse.expires_at * 1000).toISOString()
  })

  updateSyncStatus(db, userEmail, {
    connected: true,
    lastSyncStatus: 'idle',
    lastSyncMessage: 'Strava connected successfully.'
  })

  return await runStravaSync('initial-connect', userEmail)
}

async function fetchRelativeEffortStreams(
  accessToken: string,
  activity: StravaActivity,
  sport: SportType
): Promise<RelativeEffortStreams | null> {
  if (sport === 'swimming' || !activity.average_heartrate) {
    return null
  }

  try {
    const streams = await fetchStravaActivityStreams(accessToken, activity.id)
    const time = streams.time?.data ?? []
    const heartrate = streams.heartrate?.data ?? []
    if (!time.length || !heartrate.length) {
      return null
    }

    return {
      time: time.map((value) => Number(value)).filter(Number.isFinite),
      heartrate: heartrate.map((value) => Number(value)).filter(Number.isFinite)
    }
  } catch {
    return null
  }
}

function serializeActivityPayload(activity: StravaActivity, streams: RelativeEffortStreams | null): string {
  const payload: StoredActivityPayload = {
    activity,
    streams
  }

  return JSON.stringify(payload)
}

function listActivitiesMissingRelativeEffort(
  db: ReturnType<typeof initializeDatabase>,
  athleteId: number
): MissingRelativeEffortActivity[] {
  return db.prepare(`
    SELECT
      activity.id AS activity_id,
      activity.source_activity_id,
      activity.sport
    FROM activities activity
    JOIN activity_analysis analysis ON analysis.activity_id = activity.id
    WHERE activity.athlete_id = ?
      AND activity.sport IN ('running', 'cycling')
      AND activity.average_heart_rate IS NOT NULL
      AND analysis.relative_effort IS NULL
    ORDER BY activity.start_date DESC
  `).all(athleteId) as MissingRelativeEffortActivity[]
}

function updateBackfilledRelativeEffort(
  db: ReturnType<typeof initializeDatabase>,
  activityId: number,
  relativeEffort: number,
  streams: RelativeEffortStreams
) {
  const now = new Date().toISOString()
  db.prepare(`
    UPDATE activity_analysis
    SET relative_effort = ?, updated_at = ?
    WHERE activity_id = ?
  `).run(relativeEffort, now, activityId)

  db.prepare(`
    UPDATE activities
    SET raw_payload = ?, updated_at = ?
    WHERE id = ?
  `).run(JSON.stringify({ streams }), now, activityId)
}

function buildAfterTimestamp(userEmail: string): number | undefined {
  const db = initializeDatabase()
  const activityCount = getActivityCount(db, userEmail)
  if (activityCount === 0) {
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)
    return Math.floor(yearAgo.getTime() / 1000)
  }

  const latest = getLatestActivityDate(db, userEmail)
  if (!latest) {
    return undefined
  }

  const afterDate = new Date(latest)
  afterDate.setDate(afterDate.getDate() - 1)
  return Math.floor(afterDate.getTime() / 1000)
}

export async function runStravaSync(reason = 'manual', userEmail: string): Promise<SyncStatus> {
  const existingPromise = syncPromises.get(userEmail)
  if (existingPromise) {
    return await existingPromise
  }

  const syncPromise = (async () => {
    const db = initializeDatabase()
    const current = getSyncStatus(db, userEmail)
    updateSyncStatus(db, userEmail, {
      ...current,
      connected: Boolean(getAthlete(db, userEmail) && getToken(db, userEmail)),
      isSyncing: true,
      lastSyncMessage: `Sync started (${reason}).`
    })

    try {
      const { athlete, accessToken } = await ensureValidToken(userEmail)
      const settings = getSettings(db, userEmail)
      const after = buildAfterTimestamp(userEmail)

      let page = 1
      let processed = 0
      const perPage = 100

      while (true) {
        const activities = await fetchStravaActivities(accessToken, page, perPage, after)
        if (activities.length === 0) {
          break
        }

        for (const activity of activities) {
          const sport = normalizeSport(activity)
          if (!sport) {
            continue
          }

          const relativeEffortStreams = await fetchRelativeEffortStreams(accessToken, activity, sport)

          const activityId = upsertActivity(db, {
            athleteId: athlete.id,
            sourceActivityId: activity.id,
            sourceType: activity.sport_type || activity.type,
            sport,
            name: activity.name,
            startDate: activity.start_date,
            timezone: activity.timezone,
            durationSeconds: activity.elapsed_time,
            movingTimeSeconds: activity.moving_time,
            distanceMeters: activity.distance,
            averageHeartRate: activity.average_heartrate,
            elevationGainMeters: activity.total_elevation_gain,
            averageSpeedMps: activity.average_speed,
            stravaUrl: `https://www.strava.com/activities/${activity.id}`,
            rawPayload: serializeActivityPayload(activity, relativeEffortStreams)
          })

          const hr = classifyHrZone(settings, sport, activity.average_heartrate)
          const training = deriveTrainingFlags(sport, hr.classification)
          upsertActivityAnalysis(db, {
            activityId,
            formattedPerformance: formatPerformanceBySport(sport, activity.distance, activity.elapsed_time, activity.average_speed),
            hrPercentOfMax: hr.hrPercentOfMax,
            relativeEffort: computeRelativeEffort(settings, sport, relativeEffortStreams, activity.average_heartrate, activity.elapsed_time),
            hrZoneLabel: hr.hrZoneLabel,
            classification: hr.classification,
            isEasySession: training.isEasySession,
            isHardSession: training.isHardSession,
            affectsRunningCounter: training.affectsRunningCounter,
            affectsCyclingCounter: training.affectsCyclingCounter,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })

          processed += 1
        }

        if (activities.length < perPage) {
          break
        }

        page += 1
      }

      for (const activity of listActivitiesMissingRelativeEffort(db, athlete.id)) {
        const relativeEffortStreams = await fetchRelativeEffortStreams(
          accessToken,
          {
            id: activity.sourceActivityId,
            type: activity.sport === 'running' ? 'Run' : 'Ride',
            sport_type: activity.sport === 'running' ? 'Run' : 'Ride',
            name: '',
            start_date: '',
            timezone: null,
            elapsed_time: 0,
            moving_time: null,
            distance: 0,
            average_heartrate: 1,
            total_elevation_gain: null,
            average_speed: null
          },
          activity.sport
        )

        if (!relativeEffortStreams) {
          continue
        }

        const relativeEffort = computeRelativeEffort(settings, activity.sport, relativeEffortStreams)
        if (relativeEffort === null) {
          continue
        }

        updateBackfilledRelativeEffort(db, activity.activityId, relativeEffort, relativeEffortStreams)
      }

      return updateSyncStatus(db, userEmail, {
        connected: true,
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Sync completed (${reason}).`,
        importedActivities: processed
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync error'
      return updateSyncStatus(db, userEmail, {
        connected: Boolean(getAthlete(db, userEmail) && getToken(db, userEmail)),
        isSyncing: false,
        lastSyncStatus: 'error',
        lastSyncMessage: message
      })
    } finally {
      syncPromises.delete(userEmail)
    }
  })()

  syncPromises.set(userEmail, syncPromise)
  return await syncPromise
}

export function disconnectStravaAccount(userEmail: string): SyncStatus {
  if (syncPromises.has(userEmail)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A sync is currently in progress. Please try disconnecting again in a moment.'
    })
  }

  const db = initializeDatabase()
  deleteToken(db, userEmail)

  return updateSyncStatus(db, userEmail, {
    connected: false,
    isSyncing: false,
    lastSyncStatus: 'idle',
    lastSyncMessage: 'Strava disconnected.',
    importedActivities: 0
  })
}

let schedulerStarted = false

export function startSyncScheduler(): void {
  if (schedulerStarted) {
    return
  }

  const config = useRuntimeConfig()
  const intervalMs = Number(config.syncIntervalMinutes) * 60 * 1000
  const timer = setInterval(() => {
    const db = initializeDatabase()
    for (const userEmail of listConnectedUserEmails(db)) {
      if (!getAthlete(db, userEmail) || !getToken(db, userEmail)) {
        continue
      }

      void runStravaSync('scheduled', userEmail)
    }
  }, intervalMs)

  timer.unref?.()
  schedulerStarted = true
}
