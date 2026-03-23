import type { ConnectionStatusResponse } from '../../../shared/types'
import { initializeDatabase } from '../../database/bootstrap'
import { getAthlete } from '../../repositories/athleteRepository'
import { getSyncStatus } from '../../repositories/syncRepository'

export default defineEventHandler((): ConnectionStatusResponse => {
  const db = initializeDatabase()
  return {
    athlete: getAthlete(db),
    syncStatus: getSyncStatus(db)
  }
})
