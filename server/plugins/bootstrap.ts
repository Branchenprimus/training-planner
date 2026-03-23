import { defineNitroPlugin } from 'nitropack/runtime'
import { initializeDatabase } from '../database/bootstrap'
import { startSyncScheduler } from '../services/strava/syncService'

export default defineNitroPlugin(() => {
  initializeDatabase()
  startSyncScheduler()
})
