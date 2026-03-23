import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { initializeDatabase } from '../../database/bootstrap'
import { getActivityCount, getChartActivities, getLatestActivityDate, upsertActivity, upsertActivityAnalysis } from '../../repositories/activityRepository'
import { getAthlete, getToken, upsertAthlete, upsertToken } from '../../repositories/athleteRepository'
import { getSettings } from '../../repositories/settingsRepository'
import { getSyncStatus, updateSyncStatus } from '../../repositories/syncRepository'
import { classifyHrZone } from '../../domain/hr'
import { deriveTrainingFlags } from '../../domain/training'
import { formatPerformanceBySport } from '../../../shared/format'
import type { SportType, SyncStatus } from '../../../shared/types'
import { exchangeCodeForToken, fetchStravaActivities, refreshStravaToken, type StravaActivity } from './client'

let syncPromise: Promise<SyncStatus> | null = null

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

async function ensureValidToken() {
  const db = initializeDatabase()
  const athlete = getAthlete(db)
  const token = getToken(db)

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

  const refreshed = await refreshStravaToken(token.refreshToken)
  const updatedAthlete = upsertAthlete(db, {
    stravaAthleteId: refreshed.athlete.id,
    username: refreshed.athlete.username,
    firstname: refreshed.athlete.firstname,
    lastname: refreshed.athlete.lastname,
    profileMedium: refreshed.athlete.profile_medium
  })

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

export async function connectStravaAccount(code: string): Promise<SyncStatus> {
  const db = initializeDatabase()
  const tokenResponse = await exchangeCodeForToken(code)

  const athlete = upsertAthlete(db, {
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

  updateSyncStatus(db, {
    connected: true,
    lastSyncStatus: 'idle',
    lastSyncMessage: 'Strava connected successfully.'
  })

  return await runStravaSync('initial-connect')
}

function buildAfterTimestamp(): number | undefined {
  const db = initializeDatabase()
  const activityCount = getActivityCount(db)
  if (activityCount === 0) {
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)
    return Math.floor(yearAgo.getTime() / 1000)
  }

  const latest = getLatestActivityDate(db)
  if (!latest) {
    return undefined
  }

  const afterDate = new Date(latest)
  afterDate.setDate(afterDate.getDate() - 1)
  return Math.floor(afterDate.getTime() / 1000)
}

export async function runStravaSync(reason = 'manual'): Promise<SyncStatus> {
  if (syncPromise) {
    return await syncPromise
  }

  syncPromise = (async () => {
    const db = initializeDatabase()
    const current = getSyncStatus(db)
    updateSyncStatus(db, {
      ...current,
      connected: Boolean(getAthlete(db) && getToken(db)),
      isSyncing: true,
      lastSyncMessage: `Sync started (${reason}).`
    })

    try {
      const { athlete, accessToken } = await ensureValidToken()
      const settings = getSettings(db)
      const after = buildAfterTimestamp()

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
            rawPayload: JSON.stringify(activity)
          })

          const hr = classifyHrZone(settings, sport, activity.average_heartrate)
          const training = deriveTrainingFlags(sport, hr.classification)
          upsertActivityAnalysis(db, {
            activityId,
            formattedPerformance: formatPerformanceBySport(sport, activity.distance, activity.elapsed_time, activity.average_speed),
            hrPercentOfMax: hr.hrPercentOfMax,
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

      return updateSyncStatus(db, {
        connected: true,
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Sync completed (${reason}).`,
        importedActivities: processed
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync error'
      return updateSyncStatus(db, {
        connected: Boolean(getAthlete(db) && getToken(db)),
        isSyncing: false,
        lastSyncStatus: 'error',
        lastSyncMessage: message
      })
    } finally {
      syncPromise = null
    }
  })()

  return await syncPromise
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
    if (!getAthlete(db) || !getToken(db)) {
      return
    }

    void runStravaSync('scheduled')
  }, intervalMs)

  timer.unref?.()
  schedulerStarted = true
}
