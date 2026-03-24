<script setup lang="ts">
import type { SettingsResponse, SettingsUpdateRequest } from '~/shared/types'

const route = useRoute()
const { t, setLocale } = useI18n()
const { data, pending, refresh } = await useFetch<SettingsResponse>('/api/settings')
const step = ref<'details' | 'credentials' | 'success' | 'error'>('details')
const wizardError = ref<string | null>(null)
const isSubmitting = ref(false)
const copiedField = ref<'website' | 'callbackDomain' | null>(null)

const form = reactive({
  clientId: '',
  clientSecret: ''
})

const websiteValue = computed(() => {
  const redirectUri = data.value?.stravaApp.redirectUri
  if (!redirectUri) {
    return ''
  }

  try {
    return new URL(redirectUri).origin
  } catch {
    return redirectUri
  }
})

const callbackDomainValue = computed(() => data.value?.stravaApp.callbackDomain || t('settings.callbackDomainFallback'))

watchEffect(() => {
  const status = route.query.status
  if (status === 'success') {
    step.value = 'success'
    wizardError.value = null
    return
  }

  if (status === 'error') {
    step.value = 'error'
    const message = route.query.message
    wizardError.value = typeof message === 'string' && message.length ? message : null
    return
  }

  if (data.value?.connectionStatus.syncStatus.connected) {
    step.value = 'success'
  }
})

watch(
  () => data.value?.settings.language,
  (language) => {
    if (language) {
      setLocale(language)
    }
  },
  { immediate: true }
)

function buildPayload(): SettingsUpdateRequest {
  const settings = data.value!.settings
  return {
    language: settings.language,
    runningMaxHr: settings.runningMaxHr,
    cyclingMaxHr: settings.cyclingMaxHr,
    runningZones: settings.runningZones,
    cyclingZones: settings.cyclingZones,
    runningZone2SessionsBeforeInterval: settings.runningZone2SessionsBeforeInterval,
    runningIntervalSessionsInBlock: settings.runningIntervalSessionsInBlock,
    cyclingZone2SessionsBeforeInterval: settings.cyclingZone2SessionsBeforeInterval,
    cyclingIntervalSessionsInBlock: settings.cyclingIntervalSessionsInBlock,
    stravaClientId: form.clientId.trim(),
    stravaClientSecret: form.clientSecret.trim()
  }
}

async function finishSetup() {
  wizardError.value = null
  isSubmitting.value = true

  try {
    await $fetch<SettingsResponse>('/api/settings', {
      method: 'PUT',
      body: buildPayload()
    })
    window.location.href = '/api/auth/strava/start'
  } catch (caughtError) {
    wizardError.value = caughtError instanceof Error ? caughtError.message : 'Could not save the Strava app credentials.'
    isSubmitting.value = false
  }
}

async function copyValue(field: 'website' | 'callbackDomain', value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copiedField.value = field
    window.setTimeout(() => {
      if (copiedField.value === field) {
        copiedField.value = null
      }
    }, 1800)
  } catch {
    wizardError.value = t('wizard.copyFailed')
  }
}
</script>

<template>
  <LoadingState v-if="pending && !data" />
  <section v-else-if="data" class="page-grid">
    <section class="section-card card stack wizard-shell">
      <div>
        <h2 class="section-title">{{ t('wizard.title') }}</h2>
        <p class="section-subtitle">{{ t('wizard.subtitle') }}</p>
      </div>

      <template v-if="step === 'details'">
        <div class="wizard-panel stack">
          <div>
            <p class="wizard-step">01</p>
            <h3 class="section-title">{{ t('wizard.step1Title') }}</h3>
            <p class="section-subtitle">{{ t('wizard.step1Copy') }}</p>
          </div>

          <div class="helper-card stack">
            <div class="wizard-copy-row">
              <div class="wizard-copy-copy">
                <strong>{{ t('settings.website') }}</strong>
                <code class="inline-code wizard-code-block">{{ websiteValue }}</code>
              </div>
              <button
                class="btn btn-secondary wizard-copy-button"
                type="button"
                @click="copyValue('website', websiteValue)"
              >
                {{ copiedField === 'website' ? t('wizard.copied') : t('wizard.copy') }}
              </button>
            </div>

            <div class="wizard-copy-row">
              <div class="wizard-copy-copy">
                <strong>{{ t('settings.callbackDomain') }}</strong>
                <code class="inline-code wizard-code-block">{{ callbackDomainValue }}</code>
              </div>
              <button
                class="btn btn-secondary wizard-copy-button"
                type="button"
                @click="copyValue('callbackDomain', callbackDomainValue)"
              >
                {{ copiedField === 'callbackDomain' ? t('wizard.copied') : t('wizard.copy') }}
              </button>
            </div>

            <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer" class="btn btn-secondary wizard-strava-link">
              <img src="/issue-assets/strava-logo.svg" alt="" class="strava-mark" aria-hidden="true">
              {{ t('wizard.openStravaSettings') }}
            </a>
          </div>

          <div class="inline-actions">
            <NuxtLink class="btn btn-secondary" to="/settings">
              {{ t('wizard.cancel') }}
            </NuxtLink>
            <button class="btn btn-primary" type="button" @click="step = 'credentials'">
              {{ t('wizard.continue') }}
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="step === 'credentials'">
        <div class="wizard-panel stack">
          <div>
            <p class="wizard-step">02</p>
            <h3 class="section-title">{{ t('wizard.step2Title') }}</h3>
            <p class="section-subtitle">{{ t('wizard.step2Copy') }}</p>
          </div>

          <div class="form-grid">
            <div class="field">
              <label for="wizardClientId">{{ t('settings.clientId') }}</label>
              <input id="wizardClientId" v-model.trim="form.clientId" type="text" inputmode="numeric" autocomplete="off" :placeholder="t('settings.clientIdPlaceholder')">
              <p class="field-help">{{ t('settings.clientIdHelp') }}</p>
            </div>
            <div class="field">
              <label for="wizardClientSecret">{{ t('settings.clientSecret') }}</label>
              <input id="wizardClientSecret" v-model.trim="form.clientSecret" type="password" autocomplete="new-password" :placeholder="t('settings.clientSecretPlaceholderPaste')">
              <p class="field-help">{{ t('settings.clientSecretHelp') }}</p>
            </div>
          </div>

          <p v-if="wizardError" class="error-text">{{ wizardError }}</p>

          <div class="inline-actions">
            <NuxtLink class="btn btn-secondary" to="/settings">
              {{ t('wizard.cancel') }}
            </NuxtLink>
            <button class="btn btn-secondary" type="button" @click="step = 'details'">
              {{ t('wizard.back') }}
            </button>
            <button class="btn btn-primary" type="button" :disabled="isSubmitting || !form.clientId || !form.clientSecret" @click="finishSetup">
              {{ isSubmitting ? t('wizard.finishPending') : t('wizard.finish') }}
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="step === 'success'">
        <div class="wizard-panel stack">
          <div>
            <p class="wizard-step success-step">03</p>
            <h3 class="section-title">{{ t('wizard.step3Title') }}</h3>
            <p class="section-subtitle">{{ t('wizard.step3Copy') }}</p>
          </div>
          <div class="inline-actions">
            <NuxtLink class="btn btn-secondary" to="/settings">{{ t('wizard.cancel') }}</NuxtLink>
            <NuxtLink class="btn btn-primary" to="/">Go to dashboard</NuxtLink>
            <NuxtLink class="btn btn-secondary" to="/settings">Open settings</NuxtLink>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="wizard-panel stack">
          <div>
            <p class="wizard-step error-step">!</p>
            <h3 class="section-title">{{ t('wizard.stepErrorTitle') }}</h3>
            <p class="section-subtitle">{{ wizardError || t('wizard.stepErrorCopy') }}</p>
          </div>
          <div class="inline-actions">
            <NuxtLink class="btn btn-secondary" to="/settings">
              {{ t('wizard.cancel') }}
            </NuxtLink>
            <button class="btn btn-secondary" type="button" @click="step = 'details'">
              {{ t('wizard.back') }}
            </button>
            <NuxtLink class="btn btn-primary" to="/settings">Open settings</NuxtLink>
          </div>
        </div>
      </template>
    </section>
  </section>
</template>

<style scoped>
.wizard-shell {
  max-width: 48rem;
  margin: 0 auto;
}

.wizard-panel {
  padding: 1rem;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid var(--border);
}

.wizard-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  margin: 0 0 0.75rem;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--text);
  font-weight: 800;
}

.success-step {
  background: var(--brand-soft);
  color: var(--brand-strong);
}

.error-step {
  background: rgba(166, 60, 51, 0.12);
  color: var(--danger);
}

.wizard-copy-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 0.75rem;
  row-gap: 0.5rem;
  align-items: end;
}

.wizard-copy-copy {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}

.wizard-code-block {
  display: block;
  white-space: normal;
  overflow-wrap: anywhere;
}

.wizard-copy-button {
  align-self: end;
  min-height: 2.25rem;
  padding: 0.45rem 0.8rem;
  font-size: 0.86rem;
  line-height: 1;
}

.wizard-strava-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  width: fit-content;
}

.strava-mark {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  border-radius: 0.2rem;
}

@media (max-width: 720px) {
  .wizard-copy-row {
    grid-template-columns: 1fr;
  }

  .wizard-copy-button {
    width: 100%;
  }
}
</style>
