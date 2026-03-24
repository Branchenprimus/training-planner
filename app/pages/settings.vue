<script setup lang="ts">
import type { DisconnectStravaResponse, SettingsResponse, SettingsUpdateRequest, SyncNowResponse } from '~/shared/types'

const { setLocale, t } = useI18n()
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

async function syncNow() {
  error.value = null

  try {
    await $fetch<SyncNowResponse>('/api/sync', {
      method: 'POST'
    })
    await refresh()
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Could not start the Strava sync.'
  }
}

function saveLanguage(language: 'en' | 'de') {
  if (!data.value) {
    return
  }

  void saveSettings({
    language,
    syncIntervalMinutes: data.value.settings.syncIntervalMinutes,
    runningMaxHr: data.value.settings.runningMaxHr,
    cyclingMaxHr: data.value.settings.cyclingMaxHr,
    runningZones: data.value.settings.runningZones,
    cyclingZones: data.value.settings.cyclingZones,
    runningZone2SessionsBeforeInterval: data.value.settings.runningZone2SessionsBeforeInterval,
    runningIntervalSessionsInBlock: data.value.settings.runningIntervalSessionsInBlock,
    cyclingZone2SessionsBeforeInterval: data.value.settings.cyclingZone2SessionsBeforeInterval,
    cyclingIntervalSessionsInBlock: data.value.settings.cyclingIntervalSessionsInBlock,
    stravaClientId: '',
    stravaClientSecret: ''
  })
}

function onLanguageChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  const language = target?.value === 'de' ? 'de' : 'en'
  saveLanguage(language)
}
</script>

<template>
  <LoadingState v-if="pending && !data" />
  <section v-else-if="data && !data.connectionStatus.syncStatus.connected" class="section-card card stack">
    <div>
      <h2 class="section-title">{{ t('settings.title') }}</h2>
      <p class="section-subtitle">{{ t('settings.subtitle') }}</p>
    </div>

    <div class="stack settings-section">
      <div>
        <h3 class="section-title">{{ t('settings.languageTitle') }}</h3>
        <p class="section-subtitle">{{ t('settings.languageSubtitle') }}</p>
      </div>

      <div class="form-grid">
        <div class="field">
          <label for="language">{{ t('settings.languageTitle') }}</label>
          <select id="language" :value="data.settings.language" @change="onLanguageChange">
            <option value="en">{{ t('settings.languageEnglish') }}</option>
            <option value="de">{{ t('settings.languageGerman') }}</option>
          </select>
        </div>
      </div>
    </div>

    <NuxtLink to="/strava-setup" class="settings-wizard-tile card">
      <div>
        <h3 class="section-title">{{ t('wizard.settingsEntryTitle') }}</h3>
        <p class="section-subtitle">{{ t('wizard.settingsEntryCopy') }}</p>
      </div>
      <span class="btn btn-primary settings-wizard-cta">
        <img src="/issue-assets/strava-logo.svg" alt="" class="strava-mark" aria-hidden="true">
        {{ t('wizard.settingsEntryButton') }}
      </span>
    </NuxtLink>

    <p v-if="error" class="error-text">{{ error }}</p>
  </section>
  <SettingsForm
    v-else-if="data"
    :value="data.settings"
    :strava-app="data.stravaApp"
    :connection-status="data.connectionStatus"
    :error="error"
    @save="saveSettings"
    @reset-strava="resetStrava"
    @sync="syncNow"
  />
</template>

<style scoped>
.settings-wizard-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.settings-wizard-tile:hover {
  transform: translateY(-1px);
  border-color: rgba(166, 60, 51, 0.25);
  background: rgba(166, 60, 51, 0.06);
}

.settings-wizard-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.strava-mark {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  border-radius: 0.2rem;
}

@media (max-width: 640px) {
  .settings-wizard-tile {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
