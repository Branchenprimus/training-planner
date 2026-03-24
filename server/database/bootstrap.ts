import { useRuntimeConfig } from '#imports'
import { getDb } from './client'
import { runMigrations } from './migrate'
import { getSettings } from '../repositories/settingsRepository'
import { reanalyzeActivities } from '../services/analysis/reanalysisService'
import { LEGACY_USER_EMAIL } from '../utils/currentUser'
import { seedMockStravaDataForDevelopment } from './devSeed'

let initialized = false

export function initializeDatabase() {
  const config = useRuntimeConfig()
  const db = getDb(config.sqlitePath)

  if (!initialized) {
    runMigrations(db)
    seedMockStravaDataForDevelopment(db, String(config.defaultUserEmail || ''))

    const missingRelativeEffortWithStreams = db.prepare(`
      SELECT COUNT(*) AS count
      FROM activity_analysis analysis
      JOIN activities activity ON activity.id = analysis.activity_id
      WHERE analysis.relative_effort IS NULL
        AND activity.sport IN ('running', 'cycling')
        AND activity.average_heart_rate IS NOT NULL
    `).get() as { count: number }

    if (missingRelativeEffortWithStreams.count > 0) {
      const userEmails = db.prepare(`
        SELECT DISTINCT user_email
        FROM athletes
        UNION
        SELECT DISTINCT user_email
        FROM user_settings
      `).all() as Array<{ user_email: string }>

      for (const { user_email: userEmail } of userEmails) {
        reanalyzeActivities(db, userEmail || LEGACY_USER_EMAIL, getSettings(db, userEmail || LEGACY_USER_EMAIL))
      }
    }

    initialized = true
  }

  return db
}
