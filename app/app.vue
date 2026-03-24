<script setup lang="ts">
import type { ConnectionStatusResponse, SettingsResponse } from '~/shared/types'

const route = useRoute()
const { setLocale, t } = useI18n()
const { data } = await useFetch<Pick<SettingsResponse, 'settings'>>('/api/settings', {
  pick: ['settings']
})
const { data: connectionStatus } = await useFetch<ConnectionStatusResponse>('/api/status/connection')

const isConnected = computed(() => Boolean(connectionStatus.value?.syncStatus.connected))
const shouldShowStravaBanner = computed(() => !isConnected.value)
const shouldShowStravaBannerButton = computed(() => !route.path.startsWith('/settings'))
const canShowPageContent = computed(() =>
  isConnected.value || route.path === '/settings' || route.path === '/strava-setup' || route.path === '/auth/callback'
)

watchEffect(() => {
  if (data.value?.settings.language) {
    setLocale(data.value.settings.language)
  }
})
</script>

<template>
  <div class="shell">
    <TopNavTabs />
    <section v-if="shouldShowStravaBanner" class="connect-banner">
      <div class="connect-banner-inner card">
        <div>
          <p class="connect-banner-title">{{ t('banner.stravaTitle') }}</p>
          <p class="connect-banner-copy">{{ t('banner.stravaCopy') }}</p>
        </div>
        <NuxtLink v-if="shouldShowStravaBannerButton" to="/settings" class="btn connect-banner-button">
          {{ t('banner.stravaButton') }}
        </NuxtLink>
      </div>
    </section>
    <main v-show="canShowPageContent" class="page-shell">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.connect-banner {
  width: min(1200px, calc(100vw - 2rem));
  margin: 0.9rem auto 0;
}

.connect-banner-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-color: rgba(166, 60, 51, 0.28);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0)),
    rgba(166, 60, 51, 0.16);
}

.connect-banner-title {
  margin: 0;
  font-weight: 800;
  color: #7f241d;
}

.connect-banner-copy {
  margin: 0.2rem 0 0;
  color: #7f241d;
}

.connect-banner-button {
  flex-shrink: 0;
  background: #a63c33;
  color: #fffaf6;
}

@media (max-width: 640px) {
  .connect-banner {
    width: min(100vw - 0.65rem, 100%);
    margin-top: 0.55rem;
  }

  .connect-banner-inner {
    align-items: flex-start;
    flex-direction: column;
    padding: 0.85rem 0.9rem;
  }

  .connect-banner-button {
    width: 100%;
  }
}
</style>
