import { createError, getHeader, type H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import type Database from 'better-sqlite3'
import { DEFAULT_SETTINGS } from '../../shared/constants'

export const LEGACY_USER_EMAIL = '__legacy__'

function normalizeEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

export function resolveCurrentUserEmail(event: H3Event): string {
  const config = useRuntimeConfig(event)
  const candidates = [
    getHeader(event, 'cf-access-authenticated-user-email'),
    getHeader(event, 'x-auth-request-email'),
    getHeader(event, 'x-user-email'),
    typeof config.defaultUserEmail === 'string' ? config.defaultUserEmail : ''
  ]

  const email = candidates.map((candidate) => normalizeEmail(candidate)).find(Boolean) ?? ''
  if (email) {
    return email
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'No authenticated email was provided by Cloudflare Access.'
  })
}

function hasUserSettings(db: Database.Database, userEmail: string): boolean {
  const row = db.prepare('SELECT 1 FROM user_settings WHERE user_email = ? LIMIT 1').get(userEmail)
  return Boolean(row)
}

function hasUserSyncState(db: Database.Database, userEmail: string): boolean {
  const row = db.prepare('SELECT 1 FROM user_sync_state WHERE user_email = ? LIMIT 1').get(userEmail)
  return Boolean(row)
}

function hasAthlete(db: Database.Database, userEmail: string): boolean {
  const row = db.prepare('SELECT 1 FROM athletes WHERE user_email = ? LIMIT 1').get(userEmail)
  return Boolean(row)
}

function hasLegacySharedSetting(db: Database.Database, key: string): boolean {
  const row = db.prepare('SELECT 1 FROM settings WHERE key = ? LIMIT 1').get(key)
  return Boolean(row)
}

function normalizeAppSettingsValue(value: Record<string, unknown> | null | undefined) {
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    runningZones: {
      ...DEFAULT_SETTINGS.runningZones,
      ...(value?.runningZones as Record<string, unknown> | undefined),
      zone2: { ...DEFAULT_SETTINGS.runningZones.zone2, ...((value?.runningZones as Record<string, unknown> | undefined)?.zone2 as Record<string, unknown> | undefined) },
      zone3: { ...DEFAULT_SETTINGS.runningZones.zone3, ...((value?.runningZones as Record<string, unknown> | undefined)?.zone3 as Record<string, unknown> | undefined) },
      zone4: { ...DEFAULT_SETTINGS.runningZones.zone4, ...((value?.runningZones as Record<string, unknown> | undefined)?.zone4 as Record<string, unknown> | undefined) },
      interval: { ...DEFAULT_SETTINGS.runningZones.interval, ...((value?.runningZones as Record<string, unknown> | undefined)?.interval as Record<string, unknown> | undefined) }
    },
    cyclingZones: {
      ...DEFAULT_SETTINGS.cyclingZones,
      ...(value?.cyclingZones as Record<string, unknown> | undefined),
      zone2: { ...DEFAULT_SETTINGS.cyclingZones.zone2, ...((value?.cyclingZones as Record<string, unknown> | undefined)?.zone2 as Record<string, unknown> | undefined) },
      zone3: { ...DEFAULT_SETTINGS.cyclingZones.zone3, ...((value?.cyclingZones as Record<string, unknown> | undefined)?.zone3 as Record<string, unknown> | undefined) },
      zone4: { ...DEFAULT_SETTINGS.cyclingZones.zone4, ...((value?.cyclingZones as Record<string, unknown> | undefined)?.zone4 as Record<string, unknown> | undefined) },
      interval: { ...DEFAULT_SETTINGS.cyclingZones.interval, ...((value?.cyclingZones as Record<string, unknown> | undefined)?.interval as Record<string, unknown> | undefined) }
    }
  }
}

function hasInheritedUserSettingClone(db: Database.Database, userEmail: string, key: 'app_settings' | 'strava_app_credentials'): boolean {
  const current = db.prepare(`
    SELECT value
    FROM user_settings
    WHERE user_email = ?
      AND key = ?
    LIMIT 1
  `).get(userEmail, key) as { value: string } | undefined

  if (!current) {
    return false
  }

  const otherRows = db.prepare(`
    SELECT other.value
    FROM user_settings other
    JOIN athletes athlete ON athlete.user_email = other.user_email
    WHERE other.key = ?
      AND other.user_email <> ?
  `).all(key, userEmail) as Array<{ value: string }>

  if (key === 'strava_app_credentials') {
    return otherRows.some((row) => row.value === current.value)
  }

  const currentNormalized = JSON.stringify(normalizeAppSettingsValue(JSON.parse(current.value) as Record<string, unknown>))
  return otherRows.some((row) => currentNormalized === JSON.stringify(normalizeAppSettingsValue(JSON.parse(row.value) as Record<string, unknown>)))
}

function hasNamedUserSetting(db: Database.Database, key: string): boolean {
  const row = db.prepare(`
    SELECT 1
    FROM user_settings
    WHERE key = ?
      AND user_email <> ?
    LIMIT 1
  `).get(key, LEGACY_USER_EMAIL)
  return Boolean(row)
}

function seedUserSettings(db: Database.Database, userEmail: string): void {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO user_settings (user_email, key, value, updated_at)
    VALUES (?, 'app_settings', ?, ?)
    ON CONFLICT(user_email, key) DO NOTHING
  `).run(userEmail, JSON.stringify(DEFAULT_SETTINGS), now)
}

function seedUserSyncState(db: Database.Database, userEmail: string): void {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO user_sync_state (
      user_email, connected, is_syncing, last_sync_status, imported_activities, created_at, updated_at
    )
    VALUES (?, 0, 0, 'idle', 0, ?, ?)
    ON CONFLICT(user_email) DO NOTHING
  `).run(userEmail, now, now)
}

function adoptLegacySharedSetting(db: Database.Database, userEmail: string, key: 'app_settings' | 'strava_app_credentials'): void {
  db.prepare(`
    INSERT INTO user_settings (user_email, key, value, updated_at)
    SELECT ?, key, value, ?
    FROM settings
    WHERE key = ?
    ON CONFLICT(user_email, key) DO NOTHING
  `).run(userEmail, new Date().toISOString(), key)
}

function resetInheritedUserState(db: Database.Database, userEmail: string): void {
  const now = new Date().toISOString()

  if (hasInheritedUserSettingClone(db, userEmail, 'app_settings')) {
    db.prepare(`
      INSERT INTO user_settings (user_email, key, value, updated_at)
      VALUES (?, 'app_settings', ?, ?)
      ON CONFLICT(user_email, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(userEmail, JSON.stringify(DEFAULT_SETTINGS), now)
  }

  if (hasInheritedUserSettingClone(db, userEmail, 'strava_app_credentials')) {
    db.prepare('DELETE FROM user_settings WHERE user_email = ? AND key = ?').run(userEmail, 'strava_app_credentials')
  }

  db.prepare(`
    UPDATE user_sync_state
    SET connected = 0,
        is_syncing = 0,
        last_sync_at = NULL,
        last_sync_status = 'idle',
        last_sync_message = NULL,
        imported_activities = 0,
        updated_at = ?
    WHERE user_email = ?
      AND connected <> 0
  `).run(now, userEmail)
}

export function ensureUserScope(db: Database.Database, userEmail: string): void {
  const normalizedEmail = normalizeEmail(userEmail)
  if (!normalizedEmail || normalizedEmail === LEGACY_USER_EMAIL) {
    return
  }

  const adoptionTransaction = db.transaction(() => {
    const hasCurrentAthlete = hasAthlete(db, normalizedEmail)
    const hasCurrentSettings = hasUserSettings(db, normalizedEmail)
    const hasCurrentSync = hasUserSyncState(db, normalizedEmail)

    const activeNamedUsers = Number(
      (
        db.prepare(`
          SELECT COUNT(DISTINCT user_email) AS count
          FROM athletes
          WHERE user_email <> ?
        `).get(LEGACY_USER_EMAIL) as { count: number }
      ).count
    )

    if (!hasCurrentAthlete && activeNamedUsers === 0) {
      db.prepare('UPDATE athletes SET user_email = ? WHERE user_email = ?').run(normalizedEmail, LEGACY_USER_EMAIL)
    }

    if (!hasCurrentSettings) {
      db.prepare(`
        UPDATE user_settings
        SET user_email = ?
        WHERE user_email = ?
          AND NOT EXISTS (
            SELECT 1 FROM user_settings existing
            WHERE existing.user_email = ?
          )
      `).run(normalizedEmail, LEGACY_USER_EMAIL, normalizedEmail)

      if (!hasNamedUserSetting(db, 'app_settings') && hasLegacySharedSetting(db, 'app_settings')) {
        adoptLegacySharedSetting(db, normalizedEmail, 'app_settings')
      }

      if (!hasNamedUserSetting(db, 'strava_app_credentials') && hasLegacySharedSetting(db, 'strava_app_credentials')) {
        adoptLegacySharedSetting(db, normalizedEmail, 'strava_app_credentials')
      }
    }

    if (!hasCurrentSync) {
      db.prepare(`
        UPDATE user_sync_state
        SET user_email = ?
        WHERE user_email = ?
          AND NOT EXISTS (
            SELECT 1 FROM user_sync_state existing
            WHERE existing.user_email = ?
          )
      `).run(normalizedEmail, LEGACY_USER_EMAIL, normalizedEmail)
    }

    seedUserSettings(db, normalizedEmail)
    seedUserSyncState(db, normalizedEmail)

    if (!hasAthlete(db, normalizedEmail)) {
      resetInheritedUserState(db, normalizedEmail)
    }
  })

  adoptionTransaction()
}
