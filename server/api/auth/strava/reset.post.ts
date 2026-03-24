import type { DisconnectStravaResponse } from '../../../../shared/types'
import { initializeDatabase } from '../../../database/bootstrap'
import { getAthlete } from '../../../repositories/athleteRepository'
import { getSyncStatus } from '../../../repositories/syncRepository'
import { disconnectStravaAccount } from '../../../services/strava/syncService'
import { ensureUserScope, resolveCurrentUserEmail } from '../../../utils/currentUser'

export default defineEventHandler((event): DisconnectStravaResponse => {
  const db = initializeDatabase()
  const userEmail = resolveCurrentUserEmail(event)
  ensureUserScope(db, userEmail)

  const syncStatus = disconnectStravaAccount(userEmail)

  return {
    connectionStatus: {
      userEmail,
      athlete: getAthlete(db, userEmail),
      syncStatus: getSyncStatus(db, userEmail) ?? syncStatus
    }
  }
})
