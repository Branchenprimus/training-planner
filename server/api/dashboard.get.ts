import { getQuery } from 'h3'
import { initializeDatabase } from '../database/bootstrap'
import { getActivitiesForCounter, getRecentActivities } from '../repositories/activityRepository'
import { getSettings } from '../repositories/settingsRepository'
import { getSyncStatus } from '../repositories/syncRepository'
import { buildCounterSummary } from '../domain/training'
import { attachRelativeEffortBreakdowns } from '../services/analysis/activityEnrichmentService'
import type { DashboardSummary } from '../../shared/types'
import { ensureUserScope, resolveCurrentUserEmail } from '../utils/currentUser'

export default defineEventHandler((event): DashboardSummary => {
  const db = initializeDatabase()
  const userEmail = resolveCurrentUserEmail(event)
  ensureUserScope(db, userEmail)
  const query = getQuery(event)
  const recentLimit = Math.min(365, Math.max(1, Number(query.recentLimit ?? 8)))
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const settings = getSettings(db, userEmail)

  return {
    syncStatus: getSyncStatus(db, userEmail),
    counters: [
      buildCounterSummary('running', getActivitiesForCounter(db, userEmail, 'running'), settings.zone2SessionsBeforeInterval, settings.intervalSessionsInBlock),
      buildCounterSummary('cycling', getActivitiesForCounter(db, userEmail, 'cycling'), settings.zone2SessionsBeforeInterval, settings.intervalSessionsInBlock)
    ],
    recentActivities: attachRelativeEffortBreakdowns(db, getRecentActivities(db, userEmail, recentLimit, oneYearAgo.toISOString()), settings)
  }
})
