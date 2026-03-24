import type { ActivityClassification, AppSettings, RelativeEffortBreakdown, SportType, ZoneSettings } from '../../shared/types'

export interface RelativeEffortStreams {
  time: number[]
  heartrate: number[]
}

interface StoredRelativeEffortPayload {
  streams?: Partial<RelativeEffortStreams> | null
}

const RELATIVE_EFFORT_ZONE_WEIGHTS = {
  z1: 1,
  z2: 2,
  z3: 3,
  z4: 5,
  z5: 8
} as const

const RELATIVE_EFFORT_NORMALIZATION_DIVISOR = 120

export function getSportZoneSettings(settings: AppSettings, sport: SportType): ZoneSettings | null {
  if (sport === 'running') {
    return settings.runningZones
  }

  if (sport === 'cycling') {
    return settings.cyclingZones
  }

  return null
}

export function getSportMaxHr(settings: AppSettings, sport: SportType): number | null {
  if (sport === 'running') {
    return settings.runningMaxHr
  }

  if (sport === 'cycling') {
    return settings.cyclingMaxHr
  }

  return null
}

export function computeHrPercentOfMax(averageHr: number | null, maxHr: number | null): number | null {
  if (!averageHr || !maxHr || averageHr <= 0 || maxHr <= 0) {
    return null
  }

  return Number(((averageHr / maxHr) * 100).toFixed(1))
}

function getRelativeEffortZoneWeight(hrPercent: number, zones: ZoneSettings): number {
  if (hrPercent < zones.zone2.min) {
    return RELATIVE_EFFORT_ZONE_WEIGHTS.z1
  }

  if (hrPercent <= zones.zone2.max) {
    return RELATIVE_EFFORT_ZONE_WEIGHTS.z2
  }

  if (hrPercent <= zones.zone3.max) {
    return RELATIVE_EFFORT_ZONE_WEIGHTS.z3
  }

  if (hrPercent <= zones.zone4.max) {
    return RELATIVE_EFFORT_ZONE_WEIGHTS.z4
  }

  return RELATIVE_EFFORT_ZONE_WEIGHTS.z5
}

export function computeRelativeEffort(
  settings: AppSettings,
  sport: SportType,
  streams: RelativeEffortStreams | null,
  averageHr?: number | null,
  durationSeconds?: number | null
): number | null {
  const maxHr = getSportMaxHr(settings, sport)
  const zones = getSportZoneSettings(settings, sport)
  if (!streams || !maxHr || !zones || sport === 'swimming') {
    if (!maxHr || !zones || sport === 'swimming' || !averageHr || !durationSeconds || durationSeconds <= 0) {
      return null
    }

    const hrPercent = (averageHr / maxHr) * 100
    const weightedLoadSeconds = durationSeconds * getRelativeEffortZoneWeight(hrPercent, zones)
    return Number((weightedLoadSeconds / RELATIVE_EFFORT_NORMALIZATION_DIVISOR).toFixed(2))
  }

  const sampleCount = Math.min(streams.time.length, streams.heartrate.length)
  if (sampleCount < 2) {
    return null
  }

  let weightedLoadSeconds = 0

  for (let index = 0; index < sampleCount - 1; index += 1) {
    const currentTime = streams.time[index]
    const nextTime = streams.time[index + 1]
    const hr = streams.heartrate[index]

    if (!Number.isFinite(currentTime) || !Number.isFinite(nextTime) || !Number.isFinite(hr) || hr <= 0) {
      continue
    }

    const deltaSeconds = nextTime - currentTime
    if (deltaSeconds <= 0) {
      continue
    }

    const hrPercent = (hr / maxHr) * 100
    weightedLoadSeconds += deltaSeconds * getRelativeEffortZoneWeight(hrPercent, zones)
  }

  if (weightedLoadSeconds <= 0) {
    if (!averageHr || !durationSeconds || durationSeconds <= 0) {
      return null
    }

    const hrPercent = (averageHr / maxHr) * 100
    weightedLoadSeconds = durationSeconds * getRelativeEffortZoneWeight(hrPercent, zones)
  }

  return Number((weightedLoadSeconds / RELATIVE_EFFORT_NORMALIZATION_DIVISOR).toFixed(2))
}

export function computeRelativeEffortBreakdown(
  settings: AppSettings,
  sport: SportType,
  streams: RelativeEffortStreams | null,
  averageHr?: number | null,
  durationSeconds?: number | null
): RelativeEffortBreakdown | null {
  const maxHr = getSportMaxHr(settings, sport)
  const zones = getSportZoneSettings(settings, sport)
  if (!maxHr || !zones || sport === 'swimming') {
    return null
  }

  const breakdown: RelativeEffortBreakdown = {
    z1: 0,
    z2: 0,
    z3: 0,
    z4: 0,
    z5: 0,
    method: 'stream'
  }

  const sampleCount = streams ? Math.min(streams.time.length, streams.heartrate.length) : 0
  if (streams && sampleCount >= 2) {
    for (let index = 0; index < sampleCount - 1; index += 1) {
      const currentTime = streams.time[index]
      const nextTime = streams.time[index + 1]
      const hr = streams.heartrate[index]

      if (!Number.isFinite(currentTime) || !Number.isFinite(nextTime) || !Number.isFinite(hr) || hr <= 0) {
        continue
      }

      const deltaSeconds = nextTime - currentTime
      if (deltaSeconds <= 0) {
        continue
      }

      const hrPercent = (hr / maxHr) * 100
      const zoneKey = getRelativeEffortZoneWeight(hrPercent, zones)
      if (zoneKey === RELATIVE_EFFORT_ZONE_WEIGHTS.z1) breakdown.z1 += deltaSeconds
      else if (zoneKey === RELATIVE_EFFORT_ZONE_WEIGHTS.z2) breakdown.z2 += deltaSeconds
      else if (zoneKey === RELATIVE_EFFORT_ZONE_WEIGHTS.z3) breakdown.z3 += deltaSeconds
      else if (zoneKey === RELATIVE_EFFORT_ZONE_WEIGHTS.z4) breakdown.z4 += deltaSeconds
      else breakdown.z5 += deltaSeconds
    }

    const total = breakdown.z1 + breakdown.z2 + breakdown.z3 + breakdown.z4 + breakdown.z5
    if (total > 0) {
      return {
        ...breakdown,
        z1: Math.round(breakdown.z1),
        z2: Math.round(breakdown.z2),
        z3: Math.round(breakdown.z3),
        z4: Math.round(breakdown.z4),
        z5: Math.round(breakdown.z5)
      }
    }
  }

  if (!averageHr || !durationSeconds || durationSeconds <= 0) {
    return null
  }

  const hrPercent = (averageHr / maxHr) * 100
  const fallback: RelativeEffortBreakdown = {
    z1: 0,
    z2: 0,
    z3: 0,
    z4: 0,
    z5: 0,
    method: 'average'
  }
  const zoneWeight = getRelativeEffortZoneWeight(hrPercent, zones)
  if (zoneWeight === RELATIVE_EFFORT_ZONE_WEIGHTS.z1) fallback.z1 = Math.round(durationSeconds)
  else if (zoneWeight === RELATIVE_EFFORT_ZONE_WEIGHTS.z2) fallback.z2 = Math.round(durationSeconds)
  else if (zoneWeight === RELATIVE_EFFORT_ZONE_WEIGHTS.z3) fallback.z3 = Math.round(durationSeconds)
  else if (zoneWeight === RELATIVE_EFFORT_ZONE_WEIGHTS.z4) fallback.z4 = Math.round(durationSeconds)
  else fallback.z5 = Math.round(durationSeconds)

  return fallback
}

export function getStoredRelativeEffortStreams(rawPayload: string | null): RelativeEffortStreams | null {
  if (!rawPayload) {
    return null
  }

  try {
    const parsed = JSON.parse(rawPayload) as StoredRelativeEffortPayload
    const time = parsed?.streams?.time
    const heartrate = parsed?.streams?.heartrate
    if (!Array.isArray(time) || !Array.isArray(heartrate)) {
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

export function classifyHrZone(settings: AppSettings, sport: SportType, averageHr: number | null): {
  hrPercentOfMax: number | null
  hrZoneLabel: string
  classification: ActivityClassification
} {
  const maxHr = getSportMaxHr(settings, sport)
  const zones = getSportZoneSettings(settings, sport)
  const hrPercent = computeHrPercentOfMax(averageHr, maxHr)

  if (sport === 'swimming' || !zones || hrPercent === null) {
    return {
      hrPercentOfMax: hrPercent,
      hrZoneLabel: 'Unavailable',
      classification: 'unclassified'
    }
  }

  const entries: Array<{ key: Exclude<ActivityClassification, 'unclassified'>; label: string; min: number; max: number }> = [
    { key: 'zone2', label: 'Zone 2', min: zones.zone2.min, max: zones.zone2.max },
    { key: 'zone3', label: 'Zone 3', min: zones.zone3.min, max: zones.zone3.max },
    { key: 'zone4', label: 'Zone 4', min: zones.zone4.min, max: zones.zone4.max },
    { key: 'interval', label: 'Interval', min: zones.interval.min, max: zones.interval.max }
  ]

  const matched = entries.find((entry) => hrPercent >= entry.min && hrPercent <= entry.max)
  if (!matched) {
    const belowZone2 = hrPercent < zones.zone2.min
    const aboveInterval = hrPercent > zones.interval.max

    return {
      hrPercentOfMax: hrPercent,
      hrZoneLabel: belowZone2 ? 'Below Zone 2' : aboveInterval ? 'Above Interval' : 'Unclassified',
      classification: 'unclassified'
    }
  }

  return {
    hrPercentOfMax: hrPercent,
    hrZoneLabel: matched.label,
    classification: matched.key
  }
}
