import type { ConnectionStatusResponse } from '../../../shared/types'
import { initializeDatabase } from '../../database/bootstrap'
import { getAthlete } from '../../repositories/athleteRepository'
import { getSyncStatus } from '../../repositories/syncRepository'
import { ensureUserScope, resolveCurrentUserEmail } from '../../utils/currentUser'

export default defineEventHandler((event): ConnectionStatusResponse => {
  const db = initializeDatabase()
  const userEmail = resolveCurrentUserEmail(event)
  ensureUserScope(db, userEmail)
  return {
    userEmail,
    athlete: getAthlete(db, userEmail),
    syncStatus: getSyncStatus(db, userEmail)
  }
})
