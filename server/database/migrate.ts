import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type Database from 'better-sqlite3'
import { DEFAULT_SETTINGS } from '../../shared/constants'

export function runMigrations(db: Database.Database): void {
  const schema = readFileSync(resolve(process.cwd(), 'server/database/schema.sql'), 'utf8')
  db.exec(schema)

  const now = new Date().toISOString()
  const insertSetting = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO NOTHING
  `)

  insertSetting.run('app_settings', JSON.stringify(DEFAULT_SETTINGS), now)

  db.prepare(`
    INSERT INTO sync_state (id, connected, is_syncing, last_sync_status, imported_activities, created_at, updated_at)
    VALUES (1, 0, 0, 'idle', 0, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `).run(now, now)
}
