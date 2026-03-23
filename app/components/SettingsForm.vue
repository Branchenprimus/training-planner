<script setup lang="ts">
import type { AppSettings, SettingsResponse } from '~/shared/types'

const props = defineProps<{
  value: AppSettings
  syncIntervalMinutes: number
  connectionStatus: SettingsResponse['connectionStatus']
  saving?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  save: [value: AppSettings]
}>()

const form = reactive<AppSettings>(structuredClone(props.value))

watch(
  () => props.value,
  (value) => {
    Object.assign(form, structuredClone(value))
  },
  { deep: true }
)

function submit() {
  emit('save', structuredClone(form))
}
</script>

<template>
  <section class="section-card card stack">
    <div>
      <h2 class="section-title">Settings</h2>
      <p class="section-subtitle">Heart-rate zones are based on average HR and stored locally in SQLite.</p>
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
    </div>

    <form class="stack" @submit.prevent="submit">
      <div class="form-grid">
        <div class="field">
          <label for="runningMaxHr">Running max HR</label>
          <input id="runningMaxHr" v-model.number="form.runningMaxHr" type="number" min="100" max="240">
        </div>
        <div class="field">
          <label for="cyclingMaxHr">Cycling max HR</label>
          <input id="cyclingMaxHr" v-model.number="form.cyclingMaxHr" type="number" min="100" max="240">
        </div>
      </div>

      <div class="form-grid">
        <div class="stack">
          <h3>Running zones (%)</h3>
          <div v-for="key in ['zone2', 'zone3', 'zone4', 'interval']" :key="`running-${key}`" class="form-grid">
            <div class="field">
              <label :for="`running-${key}-min`">{{ key }} min</label>
              <input :id="`running-${key}-min`" v-model.number="form.runningZones[key as keyof AppSettings['runningZones']].min" type="number" min="1" max="100">
            </div>
            <div class="field">
              <label :for="`running-${key}-max`">{{ key }} max</label>
              <input :id="`running-${key}-max`" v-model.number="form.runningZones[key as keyof AppSettings['runningZones']].max" type="number" min="1" max="100">
            </div>
          </div>
        </div>

        <div class="stack">
          <h3>Cycling zones (%)</h3>
          <div v-for="key in ['zone2', 'zone3', 'zone4', 'interval']" :key="`cycling-${key}`" class="form-grid">
            <div class="field">
              <label :for="`cycling-${key}-min`">{{ key }} min</label>
              <input :id="`cycling-${key}-min`" v-model.number="form.cyclingZones[key as keyof AppSettings['cyclingZones']].min" type="number" min="1" max="100">
            </div>
            <div class="field">
              <label :for="`cycling-${key}-max`">{{ key }} max</label>
              <input :id="`cycling-${key}-max`" v-model.number="form.cyclingZones[key as keyof AppSettings['cyclingZones']].max" type="number" min="1" max="100">
            </div>
          </div>
        </div>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <div class="inline-actions">
        <button class="btn btn-primary" :disabled="saving" type="submit">
          {{ saving ? 'Saving...' : 'Save settings' }}
        </button>
        <a v-if="!connectionStatus.syncStatus.connected" href="/api/auth/strava/start" class="btn btn-secondary">
          Connect Strava
        </a>
      </div>
    </form>
  </section>
</template>
