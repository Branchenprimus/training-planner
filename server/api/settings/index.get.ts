import type { SettingsResponse } from '../../../shared/types'
import { initializeDatabase } from '../../database/bootstrap'
import { getAthlete } from '../../repositories/athleteRepository'
import { getSettings, getStravaAppSettings } from '../../repositories/settingsRepository'
import { getSyncStatus } from '../../repositories/syncRepository'
import { useRuntimeConfig } from '#imports'
import { ensureUserScope, resolveCurrentUserEmail } from '../../utils/currentUser'

export default defineEventHandler((event): SettingsResponse => {
  const db = initializeDatabase()
  const userEmail = resolveCurrentUserEmail(event)
  ensureUserScope(db, userEmail)
  const config = useRuntimeConfig()

  return {
    settings: getSettings(db, userEmail),
    stravaApp: getStravaAppSettings(db, userEmail, {
      stravaClientId: config.stravaClientId,
      stravaClientSecret: config.stravaClientSecret,
      stravaRedirectUri: config.stravaRedirectUri
    }),
    syncIntervalMinutes: Number(config.syncIntervalMinutes),
    connectionStatus: {
      userEmail,
      athlete: getAthlete(db, userEmail),
      syncStatus: getSyncStatus(db, userEmail)
    }
  }
})
