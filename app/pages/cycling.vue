<script setup lang="ts">
import type { ChartSeriesResponse, PaginatedActivitiesResponse } from '~/shared/types'
import { useDateRange } from '../composables/useDateRange'

const { locale, t } = useAppI18n()
const pageSize = 20
const visibleCount = ref(pageSize)
const { selectedRange, ranges } = useDateRange('30d')
const { data, pending } = await useFetch<PaginatedActivitiesResponse>(() => `/api/activities/cycling?page=1&pageSize=${visibleCount.value}`, { watch: [visibleCount] })
const charts = await useFetch<ChartSeriesResponse>(() => `/api/charts/cycling?range=${selectedRange.value}`, { watch: [selectedRange] })

function buildDateLabels(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(new Date(point.date)))
}

function buildPointTitles(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => point.label)
}

const cyclingZone2 = computed(() => charts.data.value?.zone2 ?? [])
const cyclingHr = computed(() => charts.data.value?.hrPerformance ?? [])
const cyclingRelativeEffort = computed(() => charts.data.value?.relativeEffort ?? [])

const canLoadMore = computed(() => (data.value?.items.length ?? 0) < (data.value?.total ?? 0))

function loadMore() {
  visibleCount.value += pageSize
}
</script>

<template>
  <section class="page-grid">
    <section class="section-card card stack">
      <div class="inline-actions">
        <div>
          <h2 class="section-title">{{ t('cyclingAnalysis') }}</h2>
          <p class="section-subtitle">{{ t('cyclingAnalysisSubtitle') }}</p>
        </div>
        <div class="inline-actions">
          <button
            v-for="range in ranges"
            :key="range"
            class="btn"
            :class="selectedRange === range ? 'btn-primary' : 'btn-secondary'"
            @click="selectedRange = range"
          >
            {{ range }}
          </button>
        </div>
      </div>
    </section>

    <div class="dashboard-grid">
      <div class="grid-span-6">
        <ChartCard
          :title="t('cyclingZone2Progress')"
          :subtitle="t('cyclingZone2Subtitle')"
          :info-text="t('cyclingZone2Info')"
          primary-metric="cyclingSpeed"
          :labels="buildDateLabels(cyclingZone2)"
          :point-titles="buildPointTitles(cyclingZone2)"
          :datasets="[
            {
              label: t('zone2'),
              data: cyclingZone2.map((point) => point.value),
              borderColor: '#c97c2a',
              backgroundColor: 'rgba(201,124,42,0.2)'
            }
          ]"
        />
      </div>

      <div class="grid-span-6">
        <ChartCard
          :title="t('cyclingHrVsSpeed')"
          :subtitle="t('chronologicalView', { metric: t('speedLabel').toLowerCase() })"
          :info-text="t('cyclingHrVsSpeedInfo')"
          primary-metric="cyclingSpeed"
          secondary-metric="heartRate"
          :labels="buildDateLabels(cyclingHr)"
          :point-titles="buildPointTitles(cyclingHr)"
          :datasets="[
            {
              label: t('speedLabel'),
              data: cyclingHr.map((point) => point.value),
              borderColor: '#c97c2a',
              backgroundColor: 'rgba(201,124,42,0.2)'
            },
            {
              label: t('hrLabel'),
              data: cyclingHr.map((point) => point.secondaryValue ?? 0),
              borderColor: '#8b2f24',
              backgroundColor: 'rgba(139,47,36,0.2)',
              yAxisID: 'y1'
            }
          ]"
        />
      </div>

      <div class="grid-span-6">
        <ChartCard
          :title="t('cyclingRelativeEffort')"
          :subtitle="t('cyclingRelativeEffortSubtitle')"
          :info-text="t('cyclingRelativeEffortInfo')"
          primary-metric="relativeEffort"
          :labels="buildDateLabels(cyclingRelativeEffort)"
          :point-titles="buildPointTitles(cyclingRelativeEffort)"
          :datasets="[
            {
              label: t('intensityLabel'),
              data: cyclingRelativeEffort.map((point) => point.value),
              borderColor: '#a63c33',
              backgroundColor: 'rgba(166,60,51,0.18)'
            }
          ]"
        />
      </div>
    </div>

    <LoadingState v-if="pending && !data" />
    <EmptyState
      v-else-if="!data?.items.length"
      :title="t('noCyclingActivities')"
      :description="t('cyclingActivitiesDescription')"
    />
    <template v-else>
      <ActivityTile v-for="activity in data.items" :key="activity.id" :activity="activity" />
      <div class="inline-actions">
        <button v-if="canLoadMore" class="btn btn-secondary" :disabled="pending" @click="loadMore">
          {{ pending ? `${t('loading')}...` : t('loadMoreRides') }}
        </button>
        <p v-else class="muted">{{ t('showingAllCycling') }}</p>
      </div>
    </template>
  </section>
</template>
