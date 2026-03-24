import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type Database from 'better-sqlite3'
import { DEFAULT_SETTINGS } from '../../shared/constants'
import { LEGACY_USER_EMAIL } from '../utils/currentUser'

export function runMigrations(db: Database.Database): void {
  const schema = readFileSync(resolve(process.cwd(), 'server/database/schema.sql'), 'utf8')
  db.exec(schema)

  const analysisColumns = db.prepare(`PRAGMA table_info(activity_analysis)`).all() as Array<{ name: string }>
  if (!analysisColumns.some((column) => column.name === 'intensity_score')) {
    db.exec('ALTER TABLE activity_analysis ADD COLUMN intensity_score REAL')
  }
  if (!analysisColumns.some((column) => column.name === 'relative_effort')) {
    db.exec('ALTER TABLE activity_analysis ADD COLUMN relative_effort REAL')
  }

  const athleteColumns = db.prepare(`PRAGMA table_info(athletes)`).all() as Array<{ name: string }>
  if (!athleteColumns.some((column) => column.name === 'user_email')) {
    db.exec(`ALTER TABLE athletes ADD COLUMN user_email TEXT NOT NULL DEFAULT '${LEGACY_USER_EMAIL}'`)
  }
  db.exec(`UPDATE athletes SET user_email = '${LEGACY_USER_EMAIL}' WHERE user_email IS NULL OR trim(user_email) = ''`)
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_athletes_user_email ON athletes (user_email)')

  const now = new Date().toISOString()
  const insertSetting = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO NOTHING
  `)

  insertSetting.run('app_settings', JSON.stringify(DEFAULT_SETTINGS), now)

  db.prepare(`
    INSERT INTO user_settings (user_email, key, value, updated_at)
    SELECT ?, key, value, updated_at
    FROM settings
    WHERE key IN ('app_settings', 'strava_app_credentials')
    ON CONFLICT(user_email, key) DO NOTHING
  `).run(LEGACY_USER_EMAIL)

  db.prepare(`
    INSERT INTO sync_state (id, connected, is_syncing, last_sync_status, imported_activities, created_at, updated_at)
    VALUES (1, 0, 0, 'idle', 0, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `).run(now, now)

  db.prepare(`
    INSERT INTO user_sync_state (
      user_email, connected, is_syncing, last_sync_at, last_sync_status, last_sync_message,
      imported_activities, created_at, updated_at
    )
    SELECT ?, connected, is_syncing, last_sync_at, last_sync_status, last_sync_message,
           imported_activities, created_at, updated_at
    FROM sync_state
    WHERE id = 1
    ON CONFLICT(user_email) DO NOTHING
  `).run(LEGACY_USER_EMAIL)
}
