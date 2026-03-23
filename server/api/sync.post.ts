import type { SyncNowResponse } from '../../shared/types'
import { runStravaSync } from '../services/strava/syncService'

export default defineEventHandler(async (): Promise<SyncNowResponse> => {
  return {
    syncStatus: await runStravaSync('manual')
  }
})
