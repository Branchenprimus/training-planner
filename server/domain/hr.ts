import type { ActivityClassification, AppSettings, SportType, ZoneSettings } from '../../shared/types'

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
