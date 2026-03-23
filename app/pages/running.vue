<script setup lang="ts">
import type { ConnectionStatusResponse, PaginatedActivitiesResponse, SyncStatus } from '~/shared/types'
import { useSync } from '../composables/useSync'

const page = ref(1)
const pageSize = 20
const { data, pending, refresh } = await useFetch<PaginatedActivitiesResponse>(() => `/api/activities/running?page=${page.value}&pageSize=${pageSize}`, { watch: [page] })
const connection = await useFetch<ConnectionStatusResponse>('/api/status/connection')
const localStatus = ref<SyncStatus | null>(null)

watch(
  () => connection.data.value?.syncStatus,
  (value) => {
    if (value) {
      localStatus.value = value
    }
  },
  { immediate: true }
)

const { syncing, error, syncNow } = useSync(async () => {
  await Promise.all([refresh(), connection.refresh()])
})

const connectionStatus = computed(() => localStatus.value ?? connection.data.value?.syncStatus ?? {
  connected: false,
  isSyncing: false,
  lastSyncAt: null,
  lastSyncStatus: 'idle' as const,
  lastSyncMessage: null,
  importedActivities: 0
})
</script>

<template>
  <section class="page-grid">
    <SyncStatusCard
      :status="connectionStatus"
      :syncing="syncing"
      @sync="syncNow"
    />
    <p v-if="error" class="error-text">{{ error }}</p>
    <LoadingState v-if="pending && !data" />
    <EmptyState
      v-else-if="!data?.items.length"
      title="No running activities"
      description="Once Strava sync imports runs, they will appear here as mobile-friendly tiles."
    />
    <template v-else>
      <ActivityTile v-for="activity in data.items" :key="activity.id" :activity="activity" />
      <div class="inline-actions">
        <button class="btn btn-secondary" :disabled="page === 1" @click="page -= 1">Previous</button>
        <button class="btn btn-secondary" :disabled="page * pageSize >= (data.total ?? 0)" @click="page += 1">Next</button>
      </div>
    </template>
  </section>
</template>
