import Database from 'better-sqlite3'
import { dirname } from 'node:path'
import { mkdirSync } from 'node:fs'

let dbInstance: Database.Database | null = null

export function getDb(sqlitePath: string): Database.Database {
  if (dbInstance) {
    return dbInstance
  }

  mkdirSync(dirname(sqlitePath), { recursive: true })
  dbInstance = new Database(sqlitePath)
  dbInstance.pragma('journal_mode = WAL')
  dbInstance.pragma('foreign_keys = ON')
  dbInstance.pragma('synchronous = NORMAL')
  return dbInstance
}
