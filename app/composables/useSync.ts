import type { SyncNowResponse, SyncStatus } from '~/shared/types'

export function useSync(onDone?: (status: SyncStatus) => void) {
  const syncing = ref(false)
  const error = ref<string | null>(null)

  async function syncNow() {
    syncing.value = true
    error.value = null

    try {
      const response = await $fetch<SyncNowResponse>('/api/sync', { method: 'POST' })
      onDone?.(response.syncStatus)
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Sync failed.'
    } finally {
      syncing.value = false
    }
  }

  return {
    syncing,
    error,
    syncNow
  }
}
