<script setup lang="ts">
import type { SettingsResponse } from '~/shared/types'

const { setLocale } = useI18n()
const { data } = await useFetch<Pick<SettingsResponse, 'settings'>>('/api/settings', {
  pick: ['settings']
})

watchEffect(() => {
  if (data.value?.settings.language) {
    setLocale(data.value.settings.language)
  }
})
</script>

<template>
  <div class="shell">
    <TopNavTabs />
    <main class="page-shell">
      <NuxtPage />
    </main>
  </div>
</template>
