import type Database from 'better-sqlite3'
import type { ActivityListItem, AppSettings } from '../../../shared/types'
import { computeRelativeEffortBreakdown, getStoredRelativeEffortStreams } from '../../domain/hr'
import { getActivityRawPayloads } from '../../repositories/activityRepository'

function getStoredActivityDescription(rawPayload: string | null): string | null {
  if (!rawPayload) {
    return null
  }

  try {
    const parsed = JSON.parse(rawPayload) as { activity?: { description?: unknown } }
    const description = parsed?.activity?.description
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
    relativeEffortBreakdown:
      item.relativeEffort !== null
        ? computeRelativeEffortBreakdown(
            settings,
            item.sport,
            getStoredRelativeEffortStreams(payloads.get(item.id) ?? null),
            item.averageHeartRate,
            item.durationSeconds
          )
        : null
  }))
}
