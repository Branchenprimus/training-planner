import { createError, readBody } from 'h3'
import type { AppSettings, SettingsResponse } from '../../../shared/types'
import { initializeDatabase } from '../../database/bootstrap'
import { getAthlete } from '../../repositories/athleteRepository'
import { saveSettings, saveStravaCredentials, getStravaAppSettings } from '../../repositories/settingsRepository'
import { getSyncStatus } from '../../repositories/syncRepository'
import { reanalyzeActivities } from '../../services/analysis/reanalysisService'
import { settingsSchema } from '../../utils/settingsValidation'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<SettingsResponse> => {
  const body = await readBody<unknown>(event)
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues.map((issue: { message: string }) => issue.message).join(', ')
    })
  }

  const db = initializeDatabase()
  const config = useRuntimeConfig()
  saveStravaCredentials(db, {
    clientId: parsed.data.stravaClientId,
    clientSecret: parsed.data.stravaClientSecret
  }, {
    stravaClientId: config.stravaClientId,
    stravaClientSecret: config.stravaClientSecret,
    stravaRedirectUri: config.stravaRedirectUri
  })

  const settings = saveSettings(db, {
    runningMaxHr: parsed.data.runningMaxHr,
    cyclingMaxHr: parsed.data.cyclingMaxHr,
    runningZones: parsed.data.runningZones,
    cyclingZones: parsed.data.cyclingZones
  } satisfies AppSettings)
  reanalyzeActivities(db, settings)

  return {
    settings,
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
