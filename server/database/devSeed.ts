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
  dataOrigin?: string | null
  name: string
  description: string
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
      dataOrigin: 'Garmin Forerunner 265',
      name: 'Easy Riverside Run',
      description: 'Settled into an easy aerobic rhythm and kept the effort controlled all the way through.',
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
      dataOrigin: 'Wahoo ELEMNT ROAM',
      name: 'Morning Endurance Ride',
      description: 'Mostly steady Zone 2 with a few short rises on the back half of the loop.',
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
      dataOrigin: 'Garmin Forerunner 265',
      name: 'Track Intervals',
      description: '6 x 800m on the track with jog recoveries, focused on relaxed form at high effort.',
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
      dataOrigin: 'Garmin Swim 2',
      name: 'Pool Technique Session',
      description: 'Technique-focused session with drills, pull buoy work, and smooth aerobic swimming.',
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
      description: 'Repeated the same climb several times and kept cadence high on each ascent.',
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
      description: 'Very light shakeout run to stay loose and recover from the previous hard session.',
      startDate: makeDate(13, 6, 50),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 2460,
      movingTimeSeconds: 2385,
      distanceMeters: 6100,
      averageHeartRate: 141,
      elevationGainMeters: 32,
      averageSpeedMps: 2.48,
      streams: buildStreams(2460, [137, 140, 142, 143, 141, 139])
    },
    {
      sourceActivityId: 991007,
      sport: 'cycling',
      sourceType: 'Ride',
      name: 'Lunch Spin',
      description: 'Short midday spin with low pressure on the pedals and a smooth cadence focus.',
      startDate: makeDate(15, 11, 45),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 3180,
      movingTimeSeconds: 3020,
      distanceMeters: 22100,
      averageHeartRate: 128,
      elevationGainMeters: 140,
      averageSpeedMps: 6.95,
      streams: buildStreams(3180, [122, 125, 129, 131, 130, 127])
    },
    {
      sourceActivityId: 991008,
      sport: 'running',
      sourceType: 'Run',
      name: 'Steady Tempo Run',
      description: 'Continuous tempo block at comfortably hard effort without drifting into interval pace.',
      startDate: makeDate(17, 6, 20),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 3540,
      movingTimeSeconds: 3410,
      distanceMeters: 10300,
      averageHeartRate: 166,
      elevationGainMeters: 66,
      averageSpeedMps: 2.91,
      streams: buildStreams(3540, [150, 158, 164, 168, 170, 166])
    },
    {
      sourceActivityId: 991009,
      sport: 'swimming',
      sourceType: 'Swim',
      name: 'Endurance Laps',
      description: 'Long aerobic swim with even pacing and minimal rest between sets.',
      startDate: makeDate(19, 18, 35),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 2760,
      movingTimeSeconds: 2520,
      distanceMeters: 2200,
      averageHeartRate: null,
      elevationGainMeters: null,
      averageSpeedMps: 0.8,
      streams: null
    },
    {
      sourceActivityId: 991010,
      sport: 'cycling',
      sourceType: 'Ride',
      name: 'Long Saturday Ride',
      description: 'Long outdoor ride with mostly steady endurance work and one sustained climb.',
      startDate: makeDate(21, 8, 0),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 9240,
      movingTimeSeconds: 8710,
      distanceMeters: 68500,
      averageHeartRate: 136,
      elevationGainMeters: 780,
      averageSpeedMps: 7.41,
      streams: buildStreams(9240, [124, 129, 134, 138, 141, 137])
    },
    {
      sourceActivityId: 991011,
      sport: 'running',
      sourceType: 'Run',
      name: 'Park Fartlek',
      description: 'Mixed surges by feel through the park, alternating light floats and quick pickups.',
      startDate: makeDate(24, 17, 55),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 2940,
      movingTimeSeconds: 2760,
      distanceMeters: 7600,
      averageHeartRate: 172,
      elevationGainMeters: 48,
      averageSpeedMps: 2.59,
      streams: buildStreams(2940, [146, 156, 170, 178, 175, 166])
    },
    {
      sourceActivityId: 991012,
      sport: 'running',
      sourceType: 'Run',
      name: 'Zone 2 Base Run',
      description: 'Aerobic base run focused on relaxed breathing and consistent easy turnover.',
      startDate: makeDate(27, 6, 10),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 3360,
      movingTimeSeconds: 3260,
      distanceMeters: 9800,
      averageHeartRate: 148,
      elevationGainMeters: 61,
      averageSpeedMps: 2.92,
      streams: buildStreams(3360, [143, 145, 148, 149, 150, 147])
    },
    {
      sourceActivityId: 991013,
      sport: 'cycling',
      sourceType: 'Ride',
      name: 'Cadence Drills',
      description: 'Leg-speed session with high cadence spins and short resets between repetitions.',
      startDate: makeDate(30, 16, 20),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 2640,
      movingTimeSeconds: 2460,
      distanceMeters: 17200,
      averageHeartRate: 124,
      elevationGainMeters: 95,
      averageSpeedMps: 6.52,
      streams: buildStreams(2640, [118, 121, 124, 126, 127, 123])
    },
    {
      sourceActivityId: 991014,
      sport: 'swimming',
      sourceType: 'Swim',
      name: 'Pull Buoy Set',
      description: 'Pull set to build upper-body endurance while keeping the stroke long and steady.',
      startDate: makeDate(33, 19, 5),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 2100,
      movingTimeSeconds: 1920,
      distanceMeters: 1600,
      averageHeartRate: null,
      elevationGainMeters: null,
      averageSpeedMps: 0.76,
      streams: null
    },
    {
      sourceActivityId: 991015,
      sport: 'running',
      sourceType: 'Run',
      name: 'Threshold Session',
      description: 'Threshold reps with controlled discomfort, focused on holding pace across each block.',
      startDate: makeDate(36, 17, 25),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 4020,
      movingTimeSeconds: 3740,
      distanceMeters: 11100,
      averageHeartRate: 170,
      elevationGainMeters: 72,
      averageSpeedMps: 2.76,
      streams: buildStreams(4020, [149, 158, 166, 171, 173, 169])
    },
    {
      sourceActivityId: 991016,
      sport: 'cycling',
      sourceType: 'Ride',
      name: 'Evening Recovery Ride',
      description: 'Easy spin to flush the legs after a demanding training block.',
      startDate: makeDate(39, 18, 10),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 2880,
      movingTimeSeconds: 2710,
      distanceMeters: 18500,
      averageHeartRate: 120,
      elevationGainMeters: 88,
      averageSpeedMps: 6.42,
      streams: buildStreams(2880, [116, 118, 121, 123, 122, 119])
    },
    {
      sourceActivityId: 991017,
      sport: 'running',
      sourceType: 'Run',
      name: 'Long Easy Run',
      description: 'Weekend long run kept fully aerobic with a calm first half and steady finish.',
      startDate: makeDate(42, 7, 30),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 6120,
      movingTimeSeconds: 5890,
      distanceMeters: 16800,
      averageHeartRate: 147,
      elevationGainMeters: 110,
      averageSpeedMps: 2.75,
      streams: buildStreams(6120, [142, 145, 147, 149, 150, 147])
    },
    {
      sourceActivityId: 991018,
      sport: 'cycling',
      sourceType: 'Ride',
      name: 'VO2 Climb Repeats',
      description: 'Hard uphill efforts with full commitment on each repeat and easy descents back down.',
      startDate: makeDate(45, 15, 40),
      timezone: '(GMT+01:00) Europe/Berlin',
      durationSeconds: 4980,
      movingTimeSeconds: 4620,
      distanceMeters: 29400,
      averageHeartRate: 167,
      elevationGainMeters: 610,
      averageSpeedMps: 5.9,
      streams: buildStreams(4980, [140, 152, 164, 170, 172, 166])
    }
  ]
}

function shouldSeedMockStrava(userEmail: string): boolean {
  return userEmail.trim().toLowerCase() === 'local@localhost'
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
  const mockActivities = buildMockActivities()

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

  for (const activity of mockActivities) {
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
          device_name: activity.dataOrigin,
          name: activity.name,
          description: activity.description,
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
    importedActivities: mockActivities.length
  })
}
