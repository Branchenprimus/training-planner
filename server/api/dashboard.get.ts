import { initializeDatabase } from '../database/bootstrap'
import { getActivitiesForCounter, getRecentActivities } from '../repositories/activityRepository'
import { getSyncStatus } from '../repositories/syncRepository'
import { buildCounterSummary } from '../domain/training'
import type { DashboardSummary } from '../../shared/types'

export default defineEventHandler((): DashboardSummary => {
  const db = initializeDatabase()
  return {
    syncStatus: getSyncStatus(db),
    counters: [
      buildCounterSummary('running', getActivitiesForCounter(db, 'running')),
      buildCounterSummary('cycling', getActivitiesForCounter(db, 'cycling'))
    ],
    recentActivities: getRecentActivities(db, 8)
  }
})
