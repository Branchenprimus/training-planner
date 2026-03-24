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
  })

  adoptionTransaction()
}
