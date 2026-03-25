import type Database from 'better-sqlite3'
import type { ActivityListItem, AppSettings } from '../../../shared/types'
import { computeRelativeEffortBreakdown, getSportMaxHr, getSportZoneSettings, getStoredRelativeEffortStreams } from '../../domain/hr'
import { getActivityRawPayloads } from '../../repositories/activityRepository'

function formatZoneRange(min: number | null, max: number | null): string {
  if (min === null && max === null) {
    return 'n/a'
  }

  if (min === null) {
    return `<= ${max} bpm`
  }

  if (max === null) {
    return `>= ${min} bpm`
  }

  return `${min}-${max} bpm`
}

function getBreakdownZoneRanges(settings: AppSettings, item: ActivityListItem) {
  const maxHr = getSportMaxHr(settings, item.sport)
  const zones = getSportZoneSettings(settings, item.sport)

  if (!maxHr || !zones) {
    return {
      z1: 'n/a',
      z2: 'n/a',
      z3: 'n/a',
      z4: 'n/a',
      z5: 'n/a'
    }
  }

  const z2Min = Math.round((maxHr * zones.zone2.min) / 100)
  const z2Max = Math.round((maxHr * zones.zone2.max) / 100)
  const z3Min = Math.round((maxHr * zones.zone3.min) / 100)
  const z3Max = Math.round((maxHr * zones.zone3.max) / 100)
  const z4Min = Math.round((maxHr * zones.zone4.min) / 100)
  const z4Max = Math.round((maxHr * zones.zone4.max) / 100)
  const z5Min = Math.round((maxHr * zones.interval.min) / 100)

  return {
    z1: formatZoneRange(null, z2Min - 1),
    z2: formatZoneRange(z2Min, z2Max),
    z3: formatZoneRange(z3Min, z3Max),
    z4: formatZoneRange(z4Min, z4Max),
    z5: formatZoneRange(z5Min, null)
  }
}

function getStoredActivityDescription(rawPayload: string | null): string | null {
  if (!rawPayload) {
    return null
  }

  try {
    const parsed = JSON.parse(rawPayload) as {
      description?: unknown
      activityDescription?: unknown
      activity?: { description?: unknown }
    }
    const description = parsed?.activity?.description ?? parsed?.description ?? parsed?.activityDescription
    return typeof description === 'string' && description.trim().length > 0 ? description.trim() : null
  } catch {
    return null
  }
}

export function attachRelativeEffortBreakdowns(
  db: Database.Database,
  items: ActivityListItem[],
  settings: AppSettings
): ActivityListItem[] {
  const payloads = getActivityRawPayloads(db, items.map((item) => item.id))

  return items.map((item) => ({
    ...item,
    description: getStoredActivityDescription(payloads.get(item.id) ?? null),
    relativeEffortBreakdown: (() => {
      if (item.relativeEffort === null) {
        return null
      }

      const breakdown = computeRelativeEffortBreakdown(
        settings,
        item.sport,
        getStoredRelativeEffortStreams(payloads.get(item.id) ?? null),
        item.averageHeartRate,
        item.durationSeconds
      )

      if (!breakdown) {
        return null
      }

      return {
        ...breakdown,
        zoneRanges: getBreakdownZoneRanges(settings, item)
      }
    })()
  }))
}
