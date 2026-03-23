import process from 'node:process'
import { getDb } from '../server/database/client'
import { runMigrations } from '../server/database/migrate'

const sqlitePath = process.env.SQLITE_PATH || process.env.NUXT_SQLITE_PATH || '/data/training-planner.sqlite'

const db = getDb(sqlitePath)
runMigrations(db)

console.log(`Migrations completed for ${sqlitePath}`)
