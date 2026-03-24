<script setup lang="ts">
import type { AppSettings, SettingsResponse, SettingsUpdateRequest } from '~/shared/types'
import { formatLocalizedDate } from '~/shared/format'

const { t } = useI18n()

const props = defineProps<{
  value: AppSettings
  stravaApp: SettingsResponse['stravaApp']
  syncIntervalMinutes: number
  connectionStatus: SettingsResponse['connectionStatus']
  error?: string | null
}>()

const emit = defineEmits<{
  save: [value: SettingsUpdateRequest]
  resetStrava: []
  sync: []
}>()

const zoneFields = [
  { key: 'zone2', label: 'Zone 2' },
  { key: 'zone3', label: 'Zone 3' },
  { key: 'zone4', label: 'Zone 4' },
  { key: 'interval', label: 'Interval' }
] as const

function cloneAppSettings(value: AppSettings): AppSettings {
  return {
    language: value.language,
    runningMaxHr: value.runningMaxHr,
    cyclingMaxHr: value.cyclingMaxHr,
    runningZone2SessionsBeforeInterval: value.runningZone2SessionsBeforeInterval,
    runningIntervalSessionsInBlock: value.runningIntervalSessionsInBlock,
    cyclingZone2SessionsBeforeInterval: value.cyclingZone2SessionsBeforeInterval,
    cyclingIntervalSessionsInBlock: value.cyclingIntervalSessionsInBlock,
    runningZones: {
      zone2: { ...value.runningZones.zone2 },
      zone3: { ...value.runningZones.zone3 },
      zone4: { ...value.runningZones.zone4 },
      interval: { ...value.runningZones.interval }
    },
    cyclingZones: {
      zone2: { ...value.cyclingZones.zone2 },
      zone3: { ...value.cyclingZones.zone3 },
      zone4: { ...value.cyclingZones.zone4 },
      interval: { ...value.cyclingZones.interval }
    }
  }
}

function createFormState(value: AppSettings, stravaApp: SettingsResponse['stravaApp']): SettingsUpdateRequest {
  return {
    ...cloneAppSettings(value),
    stravaClientId: stravaApp.clientId,
    stravaClientSecret: ''
  }
}

const form = reactive<SettingsUpdateRequest>(createFormState(props.value, props.stravaApp))
const saveDebounceMs = 500
let saveTimer: ReturnType<typeof setTimeout> | null = null
let isHydratingFromServer = false
let isSyncingRatios = false
let lastEmittedSignature = settingsSignature(buildPayload())
const ratiosLocked = ref(areRatiosLinked(props.value))

function areRatiosLinked(value: AppSettings) {
  return value.runningZone2SessionsBeforeInterval === value.cyclingZone2SessionsBeforeInterval
    && value.runningIntervalSessionsInBlock === value.cyclingIntervalSessionsInBlock
}

function buildPayload(): SettingsUpdateRequest {
  return {
    ...cloneAppSettings(form),
    stravaClientId: form.stravaClientId.trim(),
    stravaClientSecret: form.stravaClientSecret
  }
}

function settingsSignature(value: SettingsUpdateRequest) {
  return JSON.stringify(value)
}

watch(
  () => props.value,
  (value) => {
    isHydratingFromServer = true
    Object.assign(form, createFormState(value, props.stravaApp))
    ratiosLocked.value = areRatiosLinked(value)
    lastEmittedSignature = settingsSignature(buildPayload())
    queueMicrotask(() => {
      isHydratingFromServer = false
    })
  },
  { deep: true }
)

watch(
  () => props.stravaApp,
  (value) => {
    isHydratingFromServer = true
    Object.assign(form, createFormState(props.value, value))
    ratiosLocked.value = areRatiosLinked(props.value)
    lastEmittedSignature = settingsSignature(buildPayload())
    queueMicrotask(() => {
      isHydratingFromServer = false
    })
  },
  { deep: true }
)

watch(
  () => [
    form.runningZone2SessionsBeforeInterval,
    form.runningIntervalSessionsInBlock,
    form.cyclingZone2SessionsBeforeInterval,
    form.cyclingIntervalSessionsInBlock
  ],
  (next, previous) => {
    if (isHydratingFromServer || isSyncingRatios || !ratiosLocked.value || !previous) {
      return
    }

    const changedIndex = next.findIndex((value, index) => value !== previous[index])
    if (changedIndex === -1) {
      return
    }

    isSyncingRatios = true

    if (changedIndex === 0) {
      form.cyclingZone2SessionsBeforeInterval = form.runningZone2SessionsBeforeInterval
    } else if (changedIndex === 1) {
      form.cyclingIntervalSessionsInBlock = form.runningIntervalSessionsInBlock
    } else if (changedIndex === 2) {
      form.runningZone2SessionsBeforeInterval = form.cyclingZone2SessionsBeforeInterval
    } else if (changedIndex === 3) {
      form.runningIntervalSessionsInBlock = form.cyclingIntervalSessionsInBlock
    }

    queueMicrotask(() => {
      isSyncingRatios = false
    })
  }
)

watch(
  form,
  () => {
    if (isHydratingFromServer) {
      return
    }

    const nextPayload = buildPayload()
    const nextSignature = settingsSignature(nextPayload)
    if (nextSignature === lastEmittedSignature) {
      return
    }

    if (saveTimer) {
      clearTimeout(saveTimer)
    }

    saveTimer = setTimeout(() => {
      lastEmittedSignature = nextSignature
      emit('save', nextPayload)
    }, saveDebounceMs)
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
})

const canStartStravaConnection = computed(() => props.stravaApp.hasConfiguredCredentials)
const clientSecretPlaceholder = computed(() =>
  props.stravaApp.hasClientSecret ? t('settings.clientSecretPlaceholderKeep') : t('settings.clientSecretPlaceholderPaste')
)

const syncStatus = computed(() => props.connectionStatus.syncStatus)
const ratioLockLabel = computed(() => t(ratiosLocked.value ? 'settings.ratioUnlock' : 'settings.ratioLock'))

function bpmFromPercent(maxHr: number, percentage: number) {
  if (!Number.isFinite(maxHr) || !Number.isFinite(percentage) || maxHr <= 0 || percentage <= 0) {
    return null
  }

  return Math.round((maxHr * percentage) / 100)
}

function toggleRatioLock() {
  if (ratiosLocked.value) {
    ratiosLocked.value = false
    return
  }

  ratiosLocked.value = true
  form.cyclingZone2SessionsBeforeInterval = form.runningZone2SessionsBeforeInterval
  form.cyclingIntervalSessionsInBlock = form.runningIntervalSessionsInBlock
}
</script>

<template>
  <section class="section-card card stack">
    <div>
      <h2 class="section-title">{{ t('settings.title') }}</h2>
      <p class="section-subtitle">{{ t('settings.subtitle') }}</p>
    </div>

    <div class="stack">
      <div class="stack settings-section">
        <div>
          <h3 class="section-title">{{ t('settings.trainingRatioTitle') }}</h3>
          <p class="section-subtitle">{{ t('settings.trainingRatioSubtitle') }}</p>
        </div>

        <div class="ratio-editor">
          <div class="ratio-sport-card card">
            <div>
              <h4 class="ratio-sport-title">{{ t('sport.running') }}</h4>
            </div>
            <div class="field">
              <label for="runningZone2SessionsBeforeInterval">{{ t('settings.zone2BeforeInterval') }}</label>
              <input
                id="runningZone2SessionsBeforeInterval"
                v-model.number="form.runningZone2SessionsBeforeInterval"
                type="number"
                min="1"
                max="30"
              >
            </div>
            <div class="field">
              <label for="runningIntervalSessionsInBlock">{{ t('settings.intervalSessions') }}</label>
              <input
                id="runningIntervalSessionsInBlock"
                v-model.number="form.runningIntervalSessionsInBlock"
                type="number"
                min="1"
                max="10"
              >
            </div>
          </div>

          <button
            class="ratio-lock-button"
            type="button"
            :aria-label="ratioLockLabel"
            :title="ratioLockLabel"
            :class="{ 'ratio-lock-button-unlocked': !ratiosLocked }"
            @click="toggleRatioLock"
          >
            <svg v-if="ratiosLocked" class="ratio-lock-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 6.73V17a1 1 0 1 0 2 0v-1.27a2 2 0 1 0-2 0ZM10 9V7a2 2 0 1 1 4 0v2h-4Z"
              />
            </svg>
            <svg v-else class="ratio-lock-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M17 9h-6V7a4 4 0 1 1 7.45 2h-2.41A2 2 0 0 0 16 7a2 2 0 1 0-4 0v2h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1.5v2H7v8h10v-8Zm-6 6.73V17a1 1 0 1 0 2 0v-1.27a2 2 0 1 0-2 0Z"
              />
            </svg>
          </button>

          <div class="ratio-sport-card card">
            <div>
              <h4 class="ratio-sport-title">{{ t('sport.cycling') }}</h4>
            </div>
            <div class="field">
              <label for="cyclingZone2SessionsBeforeInterval">{{ t('settings.zone2BeforeInterval') }}</label>
              <input
                id="cyclingZone2SessionsBeforeInterval"
                v-model.number="form.cyclingZone2SessionsBeforeInterval"
                type="number"
                min="1"
                max="30"
              >
            </div>
            <div class="field">
              <label for="cyclingIntervalSessionsInBlock">{{ t('settings.intervalSessions') }}</label>
              <input
                id="cyclingIntervalSessionsInBlock"
                v-model.number="form.cyclingIntervalSessionsInBlock"
                type="number"
                min="1"
                max="10"
              >
            </div>
          </div>
        </div>

        <p class="field-help">{{ t('settings.currentRunningPlan', { zone2: form.runningZone2SessionsBeforeInterval, interval: form.runningIntervalSessionsInBlock }) }}</p>
        <p class="field-help">{{ t('settings.currentCyclingPlan', { zone2: form.cyclingZone2SessionsBeforeInterval, interval: form.cyclingIntervalSessionsInBlock }) }}</p>
      </div>

      <div class="stack settings-section">
        <div>
          <h3 class="section-title">{{ t('settings.heartRateTitle') }}</h3>
          <p class="section-subtitle">{{ t('settings.heartRateSubtitle') }}</p>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="runningMaxHr">{{ t('settings.runningMaxHr') }}</label>
            <input id="runningMaxHr" v-model.number="form.runningMaxHr" type="number" min="100" max="240">
          </div>
          <div class="field">
            <label for="cyclingMaxHr">{{ t('settings.cyclingMaxHr') }}</label>
            <input id="cyclingMaxHr" v-model.number="form.cyclingMaxHr" type="number" min="100" max="240">
          </div>
        </div>

        <p class="field-help">{{ t('settings.heartRateHelp') }}</p>
      </div>

      <div class="form-grid">
      <div class="stack settings-section">
          <div>
            <h3 class="section-title">{{ t('settings.runningZonesTitle') }}</h3>
            <p class="section-subtitle">{{ t('settings.runningZonesSubtitle') }}</p>
          </div>
          <div v-for="zone in zoneFields" :key="`running-${zone.key}`" class="zone-grid">
            <div class="field">
              <label :for="`running-${zone.key}-min`" class="zone-label">
                <span>{{ t('settings.zoneMin', { zone: zone.label }) }}</span>
                <span v-if="bpmFromPercent(form.runningMaxHr, form.runningZones[zone.key].min) !== null" class="zone-bpm">
                  {{ bpmFromPercent(form.runningMaxHr, form.runningZones[zone.key].min) }} bpm
                </span>
              </label>
              <input :id="`running-${zone.key}-min`" v-model.number="form.runningZones[zone.key].min" type="number" min="1" max="100">
            </div>
            <div class="field">
              <label :for="`running-${zone.key}-max`" class="zone-label">
                <span>{{ t('settings.zoneMax', { zone: zone.label }) }}</span>
                <span v-if="bpmFromPercent(form.runningMaxHr, form.runningZones[zone.key].max) !== null" class="zone-bpm">
                  {{ bpmFromPercent(form.runningMaxHr, form.runningZones[zone.key].max) }} bpm
                </span>
              </label>
              <input :id="`running-${zone.key}-max`" v-model.number="form.runningZones[zone.key].max" type="number" min="1" max="100">
            </div>
          </div>
        </div>

        <div class="stack settings-section">
          <div>
            <h3 class="section-title">{{ t('settings.cyclingZonesTitle') }}</h3>
            <p class="section-subtitle">{{ t('settings.cyclingZonesSubtitle') }}</p>
          </div>
          <div v-for="zone in zoneFields" :key="`cycling-${zone.key}`" class="zone-grid">
            <div class="field">
              <label :for="`cycling-${zone.key}-min`" class="zone-label">
                <span>{{ t('settings.zoneMin', { zone: zone.label }) }}</span>
                <span v-if="bpmFromPercent(form.cyclingMaxHr, form.cyclingZones[zone.key].min) !== null" class="zone-bpm">
                  {{ bpmFromPercent(form.cyclingMaxHr, form.cyclingZones[zone.key].min) }} bpm
                </span>
              </label>
              <input :id="`cycling-${zone.key}-min`" v-model.number="form.cyclingZones[zone.key].min" type="number" min="1" max="100">
            </div>
            <div class="field">
              <label :for="`cycling-${zone.key}-max`" class="zone-label">
                <span>{{ t('settings.zoneMax', { zone: zone.label }) }}</span>
                <span v-if="bpmFromPercent(form.cyclingMaxHr, form.cyclingZones[zone.key].max) !== null" class="zone-bpm">
                  {{ bpmFromPercent(form.cyclingMaxHr, form.cyclingZones[zone.key].max) }} bpm
                </span>
              </label>
              <input :id="`cycling-${zone.key}-max`" v-model.number="form.cyclingZones[zone.key].max" type="number" min="1" max="100">
            </div>
          </div>
        </div>
      </div>

      <div class="stack settings-section">
        <div>
          <h3 class="section-title">{{ t('settings.languageTitle') }}</h3>
          <p class="section-subtitle">{{ t('settings.languageSubtitle') }}</p>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="language">{{ t('settings.languageTitle') }}</label>
            <select id="language" v-model="form.language">
              <option value="en">{{ t('settings.languageEnglish') }}</option>
              <option value="de">{{ t('settings.languageGerman') }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="stack settings-section">
        <div class="section-heading">
          <div>
            <h3 class="section-title">{{ t('settings.stravaTitle') }}</h3>
            <p class="section-subtitle">{{ t('settings.stravaSubtitle') }}</p>
          </div>
          <span class="pill">{{ stravaApp.hasConfiguredCredentials ? t('settings.credentialsSaved') : t('settings.credentialsMissing') }}</span>
        </div>

        <div class="stat-grid">
          <div class="stat-block">
            <div class="stat-label">{{ t('settings.syncInterval') }}</div>
            <div class="stat-value">{{ syncIntervalMinutes }} min</div>
          </div>
          <div class="stat-block">
            <div class="stat-label">{{ t('settings.connection') }}</div>
            <div class="stat-value">{{ connectionStatus.syncStatus.connected ? t('settings.connected') : t('settings.disconnected') }}</div>
          </div>
          <div class="stat-block">
            <div class="stat-label">{{ t('settings.signedInAs') }}</div>
            <div class="stat-value email-value">{{ connectionStatus.userEmail }}</div>
          </div>
          <div class="stat-block">
            <div class="stat-label">{{ t('settings.stravaApp') }}</div>
            <div class="stat-value">{{ stravaApp.hasConfiguredCredentials ? t('settings.configured') : t('settings.needsSetup') }}</div>
          </div>
        </div>

        <div class="helper-card stack">
          <div>
            <p class="helper-title">{{ t('settings.stravaHintTitle') }}</p>
            <p class="muted">{{ t('settings.stravaHintText') }}</p>
          </div>
          <div class="stack helper-list">
            <p class="muted"><strong>{{ t('settings.callbackDomain') }}</strong> <code class="inline-code">{{ stravaApp.callbackDomain || t('settings.callbackDomainFallback') }}</code></p>
            <p class="muted"><strong>{{ t('settings.redirectUri') }}</strong> <code class="inline-code">{{ stravaApp.redirectUri }}</code></p>
          </div>
          <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
            {{ t('settings.openStravaSettings') }}
          </a>
        </div>

        <div class="helper-card stack">
          <div class="section-heading">
            <div>
              <p class="helper-title">{{ t('settings.manualPullTitle') }}</p>
              <p class="muted">{{ t('settings.manualPullSubtitle') }}</p>
            </div>
            <span class="pill" :class="{ 'connected-pill': syncStatus.connected }">
              {{ syncStatus.connected ? t('settings.connected') : t('settings.disconnected') }}
            </span>
          </div>

          <div class="stat-grid">
            <div class="stat-block">
              <div class="stat-label">{{ t('settings.lastDataPull') }}</div>
              <div class="stat-value">
                {{ syncStatus.lastSyncAt ? formatLocalizedDate(syncStatus.lastSyncAt) : t('settings.neverSynced') }}
              </div>
            </div>
            <div class="stat-block">
              <div class="stat-label">{{ t('settings.lastPullStatus') }}</div>
              <div class="stat-value">{{ syncStatus.lastSyncStatus }}</div>
            </div>
            <div class="stat-block">
              <div class="stat-label">{{ t('settings.importedThisRun') }}</div>
              <div class="stat-value">{{ syncStatus.importedActivities }}</div>
            </div>
          </div>

          <p class="muted">{{ syncStatus.lastSyncMessage ?? t('settings.waitingForFirstSync') }}</p>

          <div class="inline-actions">
            <button
              class="btn btn-primary"
              type="button"
              :disabled="syncStatus.isSyncing || !syncStatus.connected"
              @click="emit('sync')"
            >
              {{ syncStatus.isSyncing ? t('settings.syncingNow') : t('settings.manualPullButton') }}
            </button>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="stravaClientId">{{ t('settings.clientId') }}</label>
            <input id="stravaClientId" v-model.trim="form.stravaClientId" type="text" inputmode="numeric" autocomplete="off" :placeholder="t('settings.clientIdPlaceholder')">
            <p class="field-help">{{ t('settings.clientIdHelp') }}</p>
          </div>
          <div class="field">
            <label for="stravaClientSecret">{{ t('settings.clientSecret') }}</label>
            <input id="stravaClientSecret" v-model.trim="form.stravaClientSecret" type="password" autocomplete="new-password" :placeholder="clientSecretPlaceholder">
            <p class="field-help">{{ t('settings.clientSecretHelp') }}</p>
          </div>
        </div>

        <div class="inline-actions">
          <button class="btn btn-secondary btn-danger-soft" type="button" @click="emit('resetStrava')">
            {{ t('settings.resetStrava') }}
          </button>
        </div>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <div class="inline-actions">
        <a v-if="!connectionStatus.syncStatus.connected && canStartStravaConnection" href="/api/auth/strava/start" class="btn btn-secondary">
          {{ t('settings.connectStrava') }}
        </a>
        <p v-else-if="!connectionStatus.syncStatus.connected" class="muted">{{ t('settings.connectHint') }}</p>
      </div>

      <div class="settings-footer-actions">
        <a
          href="https://github.com/Branchenprimus/training-planner/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-secondary"
        >
          <svg class="github-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.91c.58.1.79-.25.79-.56v-2.17c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.69.08-.69 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.78 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.58.24 2.75.12 3.04.74.8 1.18 1.83 1.18 3.09 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.08.78 2.18v3.23c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
            />
          </svg>
          {{ t('settings.reviewButton') }}
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ratio-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
}

.ratio-sport-card {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
}

.ratio-sport-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}

.ratio-lock-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid rgba(118, 94, 62, 0.18);
  border-radius: 999px;
  background: rgba(166, 60, 51, 0.12);
  color: #7f241d;
  box-shadow: 0 10px 24px rgba(127, 36, 29, 0.08);
  transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.ratio-lock-button:hover {
  transform: translateY(-1px);
}

.ratio-lock-button-unlocked {
  background: rgba(118, 94, 62, 0.08);
  color: #765e3e;
}

.ratio-lock-icon {
  width: 1.2rem;
  height: 1.2rem;
}

.btn-danger-soft {
  background: rgba(166, 60, 51, 0.12);
  color: var(--danger);
}

.connected-pill {
  background: var(--brand-soft);
  color: var(--brand-strong);
}

.settings-footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.github-icon {
  width: 1rem;
  height: 1rem;
}

.zone-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.zone-bpm {
  color: #6d614f;
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;
}

.email-value {
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}

@media (max-width: 900px) {
  .ratio-editor {
    grid-template-columns: 1fr;
  }

  .ratio-lock-button {
    justify-self: center;
  }
}
</style>
