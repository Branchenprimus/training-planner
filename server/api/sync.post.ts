import type { SyncNowResponse } from '../../shared/types'
import { runStravaSync } from '../services/strava/syncService'
import { initializeDatabase } from '../database/bootstrap'
import { ensureUserScope, resolveCurrentUserEmail } from '../utils/currentUser'

export default defineEventHandler(async (event): Promise<SyncNowResponse> => {
  const db = initializeDatabase()
  const userEmail = resolveCurrentUserEmail(event)
  ensureUserScope(db, userEmail)
  return {
    syncStatus: await runStravaSync('manual', userEmail)
  }
})
