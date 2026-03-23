import { useRuntimeConfig } from '#imports'
import { getDb } from './client'
import { runMigrations } from './migrate'

let initialized = false

export function initializeDatabase() {
  const config = useRuntimeConfig()
  const db = getDb(config.sqlitePath)

  if (!initialized) {
    runMigrations(db)
    initialized = true
  }

  return db
}
