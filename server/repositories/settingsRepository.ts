import type Database from 'better-sqlite3'
import { DEFAULT_SETTINGS } from '../../shared/constants'
import type { AppSettings, StravaAppSettings } from '../../shared/types'
import { LEGACY_USER_EMAIL } from '../utils/currentUser'

interface RuntimeStravaConfig {
  stravaClientId: string
  stravaClientSecret: string
  stravaRedirectUri: string
}

interface StoredStravaCredentials {
  clientId: string
  clientSecret: string
}

interface LegacyAppSettings extends Partial<AppSettings> {
  zone2SessionsBeforeInterval?: number
  intervalSessionsInBlock?: number
}

function normalizeText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value).trim()
  }

  return ''
}

function getStoredJson<T>(db: Database.Database, key: string): T | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  if (!row) {
    return null
  }

  return JSON.parse(row.value) as T
}

function getUserStoredJson<T>(db: Database.Database, userEmail: string, key: string): T | null {
  const row = db.prepare('SELECT value FROM user_settings WHERE user_email = ? AND key = ?').get(userEmail, key) as { value: string } | undefined
  if (!row) {
    return null
  }

  return JSON.parse(row.value) as T
}

function normalizeSettings(value: LegacyAppSettings | null | undefined): AppSettings {
  const legacyZone2 = typeof value?.zone2SessionsBeforeInterval === 'number'
    ? value.zone2SessionsBeforeInterval
    : DEFAULT_SETTINGS.runningZone2SessionsBeforeInterval
  const legacyInterval = typeof value?.intervalSessionsInBlock === 'number'
    ? value.intervalSessionsInBlock
    : DEFAULT_SETTINGS.runningIntervalSessionsInBlock

  return {
    ...DEFAULT_SETTINGS,
    ...value,
    runningZone2SessionsBeforeInterval: value?.runningZone2SessionsBeforeInterval ?? legacyZone2,
    runningIntervalSessionsInBlock: value?.runningIntervalSessionsInBlock ?? legacyInterval,
    cyclingZone2SessionsBeforeInterval: value?.cyclingZone2SessionsBeforeInterval ?? legacyZone2,
    cyclingIntervalSessionsInBlock: value?.cyclingIntervalSessionsInBlock ?? legacyInterval,
    runningZones: {
      ...DEFAULT_SETTINGS.runningZones,
      ...value?.runningZones,
      zone2: { ...DEFAULT_SETTINGS.runningZones.zone2, ...value?.runningZones?.zone2 },
      zone3: { ...DEFAULT_SETTINGS.runningZones.zone3, ...value?.runningZones?.zone3 },
      zone4: { ...DEFAULT_SETTINGS.runningZones.zone4, ...value?.runningZones?.zone4 },
      interval: { ...DEFAULT_SETTINGS.runningZones.interval, ...value?.runningZones?.interval }
    },
    cyclingZones: {
      ...DEFAULT_SETTINGS.cyclingZones,
      ...value?.cyclingZones,
      zone2: { ...DEFAULT_SETTINGS.cyclingZones.zone2, ...value?.cyclingZones?.zone2 },
      zone3: { ...DEFAULT_SETTINGS.cyclingZones.zone3, ...value?.cyclingZones?.zone3 },
      zone4: { ...DEFAULT_SETTINGS.cyclingZones.zone4, ...value?.cyclingZones?.zone4 },
      interval: { ...DEFAULT_SETTINGS.cyclingZones.interval, ...value?.cyclingZones?.interval }
    }
  }
}

export function getSettings(db: Database.Database, userEmail: string): AppSettings {
  const value = getUserStoredJson<LegacyAppSettings>(db, userEmail, 'app_settings')
    ?? (userEmail === LEGACY_USER_EMAIL ? getStoredJson<LegacyAppSettings>(db, 'app_settings') : null)
  return normalizeSettings(value)
}

export function saveSettings(db: Database.Database, userEmail: string, settings: AppSettings): AppSettings {
  const normalized = normalizeSettings(settings)
  db.prepare(`
    INSERT INTO user_settings (user_email, key, value, updated_at)
    VALUES (?, 'app_settings', ?, ?)
    ON CONFLICT(user_email, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(userEmail, JSON.stringify(normalized), new Date().toISOString())

  return normalized
}

export function getEffectiveStravaCredentials(db: Database.Database, userEmail: string, runtimeConfig: RuntimeStravaConfig): StoredStravaCredentials | null {
  const stored = getUserStoredJson<StoredStravaCredentials>(db, userEmail, 'strava_app_credentials')
    ?? (userEmail === LEGACY_USER_EMAIL ? getStoredJson<StoredStravaCredentials>(db, 'strava_app_credentials') : null)
  const clientId = normalizeText(stored?.clientId ?? runtimeConfig.stravaClientId)
  const clientSecret = normalizeText(stored?.clientSecret ?? runtimeConfig.stravaClientSecret)

  if (!clientId || !clientSecret) {
    return null
  }

  return {
    clientId,
    clientSecret
  }
}

export function getStravaAppSettings(db: Database.Database, userEmail: string, runtimeConfig: RuntimeStravaConfig): StravaAppSettings {
  const credentials = getEffectiveStravaCredentials(db, userEmail, runtimeConfig)
  const runtimeClientId = normalizeText(runtimeConfig.stravaClientId)
  const runtimeClientSecret = normalizeText(runtimeConfig.stravaClientSecret)
  const clientId = credentials?.clientId ?? runtimeClientId

  let callbackDomain = ''
  try {
    callbackDomain = new URL(normalizeText(runtimeConfig.stravaRedirectUri)).host
  } catch {
    callbackDomain = ''
  }

  return {
    clientId,
    hasClientSecret: Boolean(credentials?.clientSecret || runtimeClientSecret),
    hasConfiguredCredentials: Boolean(credentials?.clientId || runtimeClientId) && Boolean(credentials?.clientSecret || runtimeClientSecret),
    redirectUri: normalizeText(runtimeConfig.stravaRedirectUri),
    callbackDomain
  }
}

export function saveStravaCredentials(
  db: Database.Database,
  userEmail: string,
  input: { clientId: string; clientSecret?: string },
  runtimeConfig: RuntimeStravaConfig
): StoredStravaCredentials {
  const current = getEffectiveStravaCredentials(db, userEmail, runtimeConfig)
  const clientId = normalizeText(input.clientId) || current?.clientId || normalizeText(runtimeConfig.stravaClientId)
  const clientSecret = normalizeText(input.clientSecret) || current?.clientSecret || normalizeText(runtimeConfig.stravaClientSecret)

  if (!clientId || !clientSecret) {
    throw new Error('Strava app client ID and client secret must both be configured.')
  }

  const credentials: StoredStravaCredentials = {
    clientId,
    clientSecret
  }

  db.prepare(`
    INSERT INTO user_settings (user_email, key, value, updated_at)
    VALUES (?, 'strava_app_credentials', ?, ?)
    ON CONFLICT(user_email, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(userEmail, JSON.stringify(credentials), new Date().toISOString())

  return credentials
}
