<script setup lang="ts">
import type { PaginatedActivitiesResponse } from '~/shared/types'

const page = ref(1)
const pageSize = 20
const { data, pending } = await useFetch<PaginatedActivitiesResponse>(() => `/api/activities/swimming?page=${page.value}&pageSize=${pageSize}`, { watch: [page] })
</script>

<template>
  <section class="page-grid">
    <LoadingState v-if="pending && !data" />
    <EmptyState
      v-else-if="!data?.items.length"
      title="No swimming activities"
      description="Swims show up here independently and do not affect the running or cycling counters."
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
