import type Database from 'better-sqlite3'
import { DEFAULT_SETTINGS } from '../../shared/constants'
import { formatPerformanceBySport } from '../../shared/format'
import type { SportType } from '../../shared/types'
import { classifyHrZone, computeRelativeEffort, type RelativeEffortStreams } from '../domain/hr'
import { deriveTrainingFlags } from '../domain/training'
import { upsertActivity, upsertActivityAnalysis } from '../repositories/activityRepository'
import { getAthlete, getToken, upsertAthlete, upsertToken } from '../repositories/athleteRepository'
import { getSettings } from '../repositories/settingsRepository'
import { getSyncStatus, updateSyncStatus } from '../repositories/syncRepository'
import { ensureUserScope } from '../utils/currentUser'

interface MockActivitySeed {
  sourceActivityId: number
  sport: SportType
  sourceType: string
  name: string
  startDate: string
  timezone: string
  durationSeconds: number
  movingTimeSeconds: number
  distanceMeters: number
  averageHeartRate: number | null
  elevationGainMeters: number | null
  averageSpeedMps: number | null
  streams: RelativeEffortStreams | null
}

function buildStreams(durationSeconds: number, heartRates: number[]): RelativeEffortStreams | null {
  if (!heartRates.length || durationSeconds <= 0) {
    return null
  }

  const step = Math.max(Math.round(durationSeconds / heartRates.length), 1)
  const time = heartRates.map((_, index) => Math.min(index * step, durationSeconds))
  if (time[time.length - 1] !== durationSeconds) {
    time.push(durationSeconds)
  }

  const heartrate = [...heartRates]
  if (heartrate.length < time.length) {
    heartrate.push(heartRates[heartRates.length - 1] ?? 0)
  }

  return { time, heartrate }
}

function buildMockActivities(): MockActivitySeed[] {
  const now = new Date()
  const makeDate = (daysAgo: number, hour: number, minute: number) => {
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() - daysAgo)
    date.setUTCHours(hour, minute, 0, 0)
    return date.toISOString()
  }

  return [
    {
      sourceActivityId: 991001,
      sport: 'running',
      sourceType: 'Run',
      name: 'Easy Riverside Run',
      startDate: makeDate(2, 6, 30),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 3120,
      movingTimeSeconds: 3045,
      distanceMeters: 9200,
      averageHeartRate: 145,
      elevationGainMeters: 58,
      averageSpeedMps: 2.95,
      streams: buildStreams(3120, [140, 143, 145, 146, 147, 144])
    },
    {
      sourceActivityId: 991002,
      sport: 'cycling',
      sourceType: 'Ride',
      name: 'Morning Endurance Ride',
      startDate: makeDate(4, 7, 10),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 5460,
      movingTimeSeconds: 5210,
      distanceMeters: 40200,
      averageHeartRate: 133,
      elevationGainMeters: 320,
      averageSpeedMps: 7.36,
      streams: buildStreams(5460, [126, 130, 132, 135, 138, 136])
    },
    {
      sourceActivityId: 991003,
      sport: 'running',
      sourceType: 'Run',
      name: 'Track Intervals',
      startDate: makeDate(6, 17, 40),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 3180,
      movingTimeSeconds: 2860,
      distanceMeters: 8100,
      averageHeartRate: 179,
      elevationGainMeters: 44,
      averageSpeedMps: 2.55,
      streams: buildStreams(3180, [150, 165, 178, 184, 181, 170])
    },
    {
      sourceActivityId: 991004,
      sport: 'swimming',
      sourceType: 'Swim',
      name: 'Pool Technique Session',
      startDate: makeDate(8, 18, 15),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 2280,
      movingTimeSeconds: 2100,
      distanceMeters: 1800,
      averageHeartRate: null,
      elevationGainMeters: null,
      averageSpeedMps: 0.79,
      streams: null
    },
    {
      sourceActivityId: 991005,
      sport: 'cycling',
      sourceType: 'Ride',
      name: 'Hill Repeats',
      startDate: makeDate(10, 16, 50),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 4710,
      movingTimeSeconds: 4380,
      distanceMeters: 28100,
      averageHeartRate: 165,
      elevationGainMeters: 540,
      averageSpeedMps: 5.97,
      streams: buildStreams(4710, [138, 150, 166, 171, 168, 160])
    },
    {
      sourceActivityId: 991006,
      sport: 'running',
      sourceType: 'Run',
      name: 'Recovery Jog',
      startDate: makeDate(13, 6, 50),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 2460,
      movingTimeSeconds: 2385,
      distanceMeters: 6100,
      averageHeartRate: 141,
      elevationGainMeters: 32,
      averageSpeedMps: 2.48,
      streams: buildStreams(2460, [137, 140, 142, 143, 141, 139])
    }
  ]
}

function shouldSeedMockStrava(userEmail: string): boolean {
  return process.env.NODE_ENV === 'development' && userEmail.trim().toLowerCase() === 'local@localhost'
}

export function isDevelopmentMockStravaUser(userEmail: string): boolean {
  return shouldSeedMockStrava(userEmail)
}

export function seedMockStravaDataForDevelopment(db: Database.Database, userEmail: string): void {
  if (!shouldSeedMockStrava(userEmail)) {
    return
  }

  ensureUserScope(db, userEmail)

  const existingAthlete = getAthlete(db, userEmail)
  const existingToken = getToken(db, userEmail)
  const existingStatus = getSyncStatus(db, userEmail)
  const existingActivityCount = Number(
    (
      db.prepare(`
        SELECT COUNT(*) AS count
        FROM activities activity
        JOIN athletes athlete ON athlete.id = activity.athlete_id
        WHERE athlete.user_email = ?
      `).get(userEmail) as { count: number }
    ).count
  )

  if (existingAthlete && existingToken && existingStatus.connected && existingActivityCount > 0) {
    return
  }

  const athlete = upsertAthlete(db, {
    userEmail,
    stravaAthleteId: 9000001,
    username: 'local-athlete',
    firstname: 'Local',
    lastname: 'Developer',
    profileMedium: 'https://dgalywyr863hv.cloudfront.net/pictures/athletes/9000001/0000000/2/medium.jpg'
  })

  upsertToken(db, {
    athleteId: athlete.id,
    accessToken: 'mock-strava-access-token',
    refreshToken: 'mock-strava-refresh-token',
    expiresAt: '2099-12-31T23:59:59.000Z'
  })

  const settings = getSettings(db, userEmail) ?? DEFAULT_SETTINGS
  const now = new Date().toISOString()

  for (const activity of buildMockActivities()) {
    const activityId = upsertActivity(db, {
      athleteId: athlete.id,
      sourceActivityId: activity.sourceActivityId,
      sourceType: activity.sourceType,
      sport: activity.sport,
      name: activity.name,
      startDate: activity.startDate,
      timezone: activity.timezone,
      durationSeconds: activity.durationSeconds,
      movingTimeSeconds: activity.movingTimeSeconds,
      distanceMeters: activity.distanceMeters,
      averageHeartRate: activity.averageHeartRate,
      elevationGainMeters: activity.elevationGainMeters,
      averageSpeedMps: activity.averageSpeedMps,
      stravaUrl: `https://www.strava.com/activities/${activity.sourceActivityId}`,
      rawPayload: JSON.stringify({
        activity: {
          id: activity.sourceActivityId,
          type: activity.sourceType,
          sport_type: activity.sourceType,
          name: activity.name,
          start_date: activity.startDate,
          timezone: activity.timezone,
          elapsed_time: activity.durationSeconds,
          moving_time: activity.movingTimeSeconds,
          distance: activity.distanceMeters,
          average_heartrate: activity.averageHeartRate,
          total_elevation_gain: activity.elevationGainMeters,
          average_speed: activity.averageSpeedMps
        },
        streams: activity.streams
      })
    })

    const hr = classifyHrZone(settings, activity.sport, activity.averageHeartRate)
    const training = deriveTrainingFlags(activity.sport, hr.classification)

    upsertActivityAnalysis(db, {
      activityId,
      formattedPerformance: formatPerformanceBySport(
        activity.sport,
        activity.distanceMeters,
        activity.durationSeconds,
        activity.averageSpeedMps
      ),
      hrPercentOfMax: hr.hrPercentOfMax,
      relativeEffort: computeRelativeEffort(
        settings,
        activity.sport,
        activity.streams,
        activity.averageHeartRate,
        activity.durationSeconds
      ),
      hrZoneLabel: hr.hrZoneLabel,
      classification: hr.classification,
      isEasySession: training.isEasySession,
      isHardSession: training.isHardSession,
      affectsRunningCounter: training.affectsRunningCounter,
      affectsCyclingCounter: training.affectsCyclingCounter,
      createdAt: now,
      updatedAt: now
    })
  }

  updateSyncStatus(db, userEmail, {
    connected: true,
    isSyncing: false,
    lastSyncAt: now,
    lastSyncStatus: 'success',
    lastSyncMessage: 'Mock Strava data loaded for local development.',
    importedActivities: buildMockActivities().length
  })
}
