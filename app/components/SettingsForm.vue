<script setup lang="ts">
import type { AppSettings, SettingsResponse, SettingsUpdateRequest } from '~/shared/types'

const props = defineProps<{
  value: AppSettings
  stravaApp: SettingsResponse['stravaApp']
  syncIntervalMinutes: number
  connectionStatus: SettingsResponse['connectionStatus']
  saving?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  save: [value: SettingsUpdateRequest]
}>()

const zoneFields = [
  { key: 'zone2', label: 'Zone 2' },
  { key: 'zone3', label: 'Zone 3' },
  { key: 'zone4', label: 'Zone 4' },
  { key: 'interval', label: 'Interval' }
] as const

function cloneAppSettings(value: AppSettings): AppSettings {
  return {
    runningMaxHr: value.runningMaxHr,
    cyclingMaxHr: value.cyclingMaxHr,
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

watch(
  () => props.value,
  (value) => {
    Object.assign(form, createFormState(value, props.stravaApp))
  },
  { deep: true }
)

watch(
  () => props.stravaApp,
  (value) => {
    Object.assign(form, createFormState(props.value, value))
  },
  { deep: true }
)

function submit() {
  emit('save', {
    ...cloneAppSettings(form),
    stravaClientId: form.stravaClientId.trim(),
    stravaClientSecret: form.stravaClientSecret
  })
}

const canStartStravaConnection = computed(() => props.stravaApp.hasConfiguredCredentials)
const clientSecretPlaceholder = computed(() =>
  props.stravaApp.hasClientSecret ? 'Leave blank to keep the current secret' : 'Paste the client secret from Strava'
)
</script>

<template>
  <section class="section-card card stack">
    <div>
      <h2 class="section-title">Settings</h2>
      <p class="section-subtitle">Manage your Strava app connection and the heart-rate rules used to classify imported workouts.</p>
    </div>

    <div class="stat-grid">
      <div class="stat-block">
        <div class="stat-label">Sync interval</div>
        <div class="stat-value">{{ syncIntervalMinutes }} min</div>
      </div>
      <div class="stat-block">
        <div class="stat-label">Connection</div>
        <div class="stat-value">{{ connectionStatus.syncStatus.connected ? 'Connected' : 'Disconnected' }}</div>
      </div>
      <div class="stat-block">
        <div class="stat-label">Strava app</div>
        <div class="stat-value">{{ stravaApp.hasConfiguredCredentials ? 'Configured' : 'Needs setup' }}</div>
      </div>
    </div>

    <form class="stack" @submit.prevent="submit">
      <div class="stack settings-section">
        <div class="section-heading">
          <div>
            <h3 class="section-title">Strava App</h3>
            <p class="section-subtitle">Enter the client ID and client secret from your Strava API application in normal language instead of editing env vars by hand.</p>
          </div>
          <span class="pill">{{ stravaApp.hasConfiguredCredentials ? 'Credentials saved' : 'Credentials missing' }}</span>
        </div>

        <div class="helper-card stack">
          <div>
            <p class="helper-title">Strava setup hint</p>
            <p class="muted">In Strava, open your API application, copy the client ID and client secret into the fields below, then make sure the callback settings match this app exactly.</p>
          </div>
          <div class="stack helper-list">
            <p class="muted"><strong>Authorization Callback Domain:</strong> <code class="inline-code">{{ stravaApp.callbackDomain || 'Set your public app hostname' }}</code></p>
            <p class="muted"><strong>Redirect URI:</strong> <code class="inline-code">{{ stravaApp.redirectUri }}</code></p>
          </div>
          <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
            Open Strava API Settings
          </a>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="stravaClientId">Strava app client ID</label>
            <input id="stravaClientId" v-model.trim="form.stravaClientId" type="text" inputmode="numeric" autocomplete="off" placeholder="Example: 123456">
            <p class="field-help">This is the numeric client ID from your Strava app. It is used only on the server during OAuth.</p>
          </div>
          <div class="field">
            <label for="stravaClientSecret">Strava app client secret</label>
            <input id="stravaClientSecret" v-model.trim="form.stravaClientSecret" type="password" autocomplete="new-password" :placeholder="clientSecretPlaceholder">
            <p class="field-help">The secret is write-only in the UI. Leave it blank to keep the currently saved secret.</p>
          </div>
        </div>
      </div>

      <div class="stack settings-section">
        <div>
          <h3 class="section-title">Heart Rate</h3>
          <p class="section-subtitle">Max heart rate is stored per sport and used to translate average HR into Zone 2, Zone 3, Zone 4, or Interval classifications.</p>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="runningMaxHr">Running max heart rate (bpm)</label>
            <input id="runningMaxHr" v-model.number="form.runningMaxHr" type="number" min="100" max="240">
          </div>
          <div class="field">
            <label for="cyclingMaxHr">Cycling max heart rate (bpm)</label>
            <input id="cyclingMaxHr" v-model.number="form.cyclingMaxHr" type="number" min="100" max="240">
          </div>
        </div>

        <p class="field-help">Saving these values immediately recalculates HR zones, counter logic, and chart series for all imported activities.</p>
      </div>

      <div class="form-grid">
        <div class="stack settings-section">
          <div>
            <h3 class="section-title">Running Zones</h3>
            <p class="section-subtitle">Percentages of your running max heart rate.</p>
          </div>
          <div v-for="zone in zoneFields" :key="`running-${zone.key}`" class="zone-grid">
            <div class="field">
              <label :for="`running-${zone.key}-min`">{{ zone.label }} min (%)</label>
              <input :id="`running-${zone.key}-min`" v-model.number="form.runningZones[zone.key].min" type="number" min="1" max="100">
            </div>
            <div class="field">
              <label :for="`running-${zone.key}-max`">{{ zone.label }} max (%)</label>
              <input :id="`running-${zone.key}-max`" v-model.number="form.runningZones[zone.key].max" type="number" min="1" max="100">
            </div>
          </div>
        </div>

        <div class="stack settings-section">
          <div>
            <h3 class="section-title">Cycling Zones</h3>
            <p class="section-subtitle">Percentages of your cycling max heart rate.</p>
          </div>
          <div v-for="zone in zoneFields" :key="`cycling-${zone.key}`" class="zone-grid">
            <div class="field">
              <label :for="`cycling-${zone.key}-min`">{{ zone.label }} min (%)</label>
              <input :id="`cycling-${zone.key}-min`" v-model.number="form.cyclingZones[zone.key].min" type="number" min="1" max="100">
            </div>
            <div class="field">
              <label :for="`cycling-${zone.key}-max`">{{ zone.label }} max (%)</label>
              <input :id="`cycling-${zone.key}-max`" v-model.number="form.cyclingZones[zone.key].max" type="number" min="1" max="100">
            </div>
          </div>
        </div>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <div class="inline-actions">
        <button class="btn btn-primary" :disabled="saving" type="submit">
          {{ saving ? 'Saving...' : 'Save settings' }}
        </button>
        <a v-if="!connectionStatus.syncStatus.connected && canStartStravaConnection" href="/api/auth/strava/start" class="btn btn-secondary">
          Connect Strava
        </a>
        <p v-else-if="!connectionStatus.syncStatus.connected" class="muted">Save your Strava app client ID and secret first, then connect the account.</p>
      </div>
    </form>
  </section>
</template>
