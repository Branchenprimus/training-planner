import type Database from 'better-sqlite3'
import { DEFAULT_SETTINGS } from '../../shared/constants'
import type { AppSettings, StravaAppSettings } from '../../shared/types'

interface RuntimeStravaConfig {
  stravaClientId: string
  stravaClientSecret: string
  stravaRedirectUri: string
}

interface StoredStravaCredentials {
  clientId: string
  clientSecret: string
}

function getStoredJson<T>(db: Database.Database, key: string): T | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  if (!row) {
    return null
  }

  return JSON.parse(row.value) as T
}

export function getSettings(db: Database.Database): AppSettings {
  const value = getStoredJson<AppSettings>(db, 'app_settings')
  if (!value) {
    return DEFAULT_SETTINGS
  }

  return value
}

export function saveSettings(db: Database.Database, settings: AppSettings): AppSettings {
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('app_settings', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(JSON.stringify(settings), new Date().toISOString())

  return settings
}

export function getEffectiveStravaCredentials(db: Database.Database, runtimeConfig: RuntimeStravaConfig): StoredStravaCredentials | null {
  const stored = getStoredJson<StoredStravaCredentials>(db, 'strava_app_credentials')
  const clientId = (stored?.clientId ?? runtimeConfig.stravaClientId).trim()
  const clientSecret = (stored?.clientSecret ?? runtimeConfig.stravaClientSecret).trim()

  if (!clientId || !clientSecret) {
    return null
  }

  return {
    clientId,
    clientSecret
  }
}

export function getStravaAppSettings(db: Database.Database, runtimeConfig: RuntimeStravaConfig): StravaAppSettings {
  const credentials = getEffectiveStravaCredentials(db, runtimeConfig)
  const clientId = credentials?.clientId ?? runtimeConfig.stravaClientId.trim()

  let callbackDomain = ''
  try {
    callbackDomain = new URL(runtimeConfig.stravaRedirectUri).host
  } catch {
    callbackDomain = ''
  }

  return {
    clientId,
    hasClientSecret: Boolean(credentials?.clientSecret || runtimeConfig.stravaClientSecret.trim()),
    hasConfiguredCredentials: Boolean(credentials?.clientId || runtimeConfig.stravaClientId.trim()) && Boolean(credentials?.clientSecret || runtimeConfig.stravaClientSecret.trim()),
    redirectUri: runtimeConfig.stravaRedirectUri,
    callbackDomain
  }
}

export function saveStravaCredentials(
  db: Database.Database,
  input: { clientId: string; clientSecret?: string },
  runtimeConfig: RuntimeStravaConfig
): StoredStravaCredentials {
  const current = getEffectiveStravaCredentials(db, runtimeConfig)
  const clientId = input.clientId.trim() || current?.clientId || runtimeConfig.stravaClientId.trim()
  const clientSecret = input.clientSecret?.trim() || current?.clientSecret || runtimeConfig.stravaClientSecret.trim()

  if (!clientId || !clientSecret) {
    throw new Error('Strava app client ID and client secret must both be configured.')
  }

  const credentials: StoredStravaCredentials = {
    clientId,
    clientSecret
  }

  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('strava_app_credentials', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(JSON.stringify(credentials), new Date().toISOString())

  return credentials
}
