import type Database from 'better-sqlite3'
import type { ActivityListItem, AppSettings } from '../../../shared/types'
import { computeRelativeEffortBreakdown, getStoredRelativeEffortStreams } from '../../domain/hr'
import { getActivityRawPayloads } from '../../repositories/activityRepository'

export function attachRelativeEffortBreakdowns(
  db: Database.Database,
  items: ActivityListItem[],
  settings: AppSettings
): ActivityListItem[] {
  const payloads = getActivityRawPayloads(db, items.map((item) => item.id))

  return items.map((item) => ({
    ...item,
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
