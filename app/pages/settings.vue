<script setup lang="ts">
import type { DisconnectStravaResponse, SettingsResponse, SettingsUpdateRequest } from '~/shared/types'

const { setLocale } = useI18n()
const { data, pending, refresh } = await useFetch<SettingsResponse>('/api/settings')
const error = ref<string | null>(null)
let latestSaveRequest = 0

async function saveSettings(nextValue: SettingsUpdateRequest) {
  error.value = null
  const requestId = ++latestSaveRequest

  try {
    await $fetch<SettingsResponse>('/api/settings', {
      method: 'PUT',
      body: nextValue
    })
    setLocale(nextValue.language)
    if (requestId === latestSaveRequest) {
      await refresh()
    }
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Could not save settings.'
  }
}

async function resetStrava() {
  error.value = null

  try {
    await $fetch<DisconnectStravaResponse>('/api/auth/strava/reset', {
      method: 'POST'
    })
    await refresh()
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Could not reset the Strava connection.'
  }
}
</script>

<template>
  <LoadingState v-if="pending && !data" />
  <SettingsForm
    v-else-if="data"
    :value="data.settings"
    :strava-app="data.stravaApp"
    :sync-interval-minutes="data.syncIntervalMinutes"
    :connection-status="data.connectionStatus"
    :error="error"
    @save="saveSettings"
    @reset-strava="resetStrava"
  />
</template>
