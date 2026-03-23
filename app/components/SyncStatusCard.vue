<script setup lang="ts">
import type { SyncStatus } from '~/shared/types'
import { formatLocalizedDate } from '~/shared/format'

defineProps<{
  status: SyncStatus
  syncing?: boolean
}>()

const emit = defineEmits<{
  sync: []
}>()
</script>

<template>
  <section class="section-card card stack">
    <div class="inline-actions">
      <span class="pill" :class="{ connected: status.connected }">
        {{ status.connected ? 'Strava connected' : 'Strava not connected' }}
      </span>
      <span class="pill">
        {{ status.lastSyncStatus }}
      </span>
    </div>
    <div class="stat-grid">
      <div class="stat-block">
        <div class="stat-label">Last sync</div>
        <div class="stat-value">{{ status.lastSyncAt ? formatLocalizedDate(status.lastSyncAt) : 'Never' }}</div>
      </div>
      <div class="stat-block">
        <div class="stat-label">Imported this run</div>
        <div class="stat-value">{{ status.importedActivities }}</div>
      </div>
    </div>
    <p class="muted">{{ status.lastSyncMessage ?? 'Waiting for first sync.' }}</p>
    <div class="inline-actions">
      <button class="btn btn-primary" :disabled="syncing || status.isSyncing || !status.connected" @click="emit('sync')">
        {{ syncing || status.isSyncing ? 'Syncing...' : 'Sync now' }}
      </button>
      <a v-if="!status.connected" href="/api/auth/strava/start" class="btn btn-secondary">
        Connect Strava
      </a>
    </div>
  </section>
</template>

<style scoped>
.connected {
  background: var(--brand-soft);
  color: var(--brand-strong);
}
</style>
