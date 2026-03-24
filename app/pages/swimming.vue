<script setup lang="ts">
import type { PaginatedActivitiesResponse } from '~/shared/types'

const { t } = useAppI18n()
const pageSize = 20
const visibleCount = ref(pageSize)
const { data, pending } = await useFetch<PaginatedActivitiesResponse>(() => `/api/activities/swimming?page=1&pageSize=${visibleCount.value}`, { watch: [visibleCount] })

const canLoadMore = computed(() => (data.value?.items.length ?? 0) < (data.value?.total ?? 0))

function loadMore() {
  visibleCount.value += pageSize
}
</script>

<template>
  <section class="page-grid">
    <LoadingState v-if="pending && !data" />
    <EmptyState
      v-else-if="!data?.items.length"
      :title="t('noSwimmingActivities')"
      :description="t('swimmingActivitiesDescription')"
    />
    <template v-else>
      <ActivityTile v-for="activity in data.items" :key="activity.id" :activity="activity" />
      <div class="inline-actions">
        <button v-if="canLoadMore" class="btn btn-secondary" :disabled="pending" @click="loadMore">
          {{ pending ? `${t('loading')}...` : t('loadMoreSwims') }}
        </button>
        <p v-else class="muted">{{ t('showingAllSwimming') }}</p>
      </div>
    </template>
  </section>
</template>
