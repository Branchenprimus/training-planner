import type { SettingsResponse } from '../../../shared/types'
import { initializeDatabase } from '../../database/bootstrap'
import { getAthlete } from '../../repositories/athleteRepository'
import { getSettings, getStravaAppSettings } from '../../repositories/settingsRepository'
import { getSyncStatus } from '../../repositories/syncRepository'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler((): SettingsResponse => {
  const db = initializeDatabase()
  const config = useRuntimeConfig()

  return {
    settings: getSettings(db),
    stravaApp: getStravaAppSettings(db, {
      stravaClientId: config.stravaClientId,
      stravaClientSecret: config.stravaClientSecret,
      stravaRedirectUri: config.stravaRedirectUri
    }),
    syncIntervalMinutes: Number(config.syncIntervalMinutes),
    connectionStatus: {
      athlete: getAthlete(db),
      syncStatus: getSyncStatus(db)
    }
  }
})
