<script setup lang="ts">
import type { AppSettings, SettingsResponse } from '~/shared/types'

const { data, pending, refresh } = await useFetch<SettingsResponse>('/api/settings')
const saving = ref(false)
const error = ref<string | null>(null)

async function saveSettings(nextValue: AppSettings) {
  saving.value = true
  error.value = null

  try {
    await $fetch<SettingsResponse>('/api/settings', {
      method: 'PUT',
      body: nextValue
    })
    await refresh()
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Could not save settings.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <LoadingState v-if="pending && !data" />
  <SettingsForm
    v-else-if="data"
    :value="data.settings"
    :sync-interval-minutes="data.syncIntervalMinutes"
    :connection-status="data.connectionStatus"
    :saving="saving"
    :error="error"
    @save="saveSettings"
  />
</template>
