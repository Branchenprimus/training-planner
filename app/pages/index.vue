<script setup lang="ts">
import type { ChartSeriesResponse, DashboardSummary, SyncStatus } from '~/shared/types'
import { performanceAxisLabel } from '~/shared/format'
import { useDateRange } from '../composables/useDateRange'
import { useSync } from '../composables/useSync'

const { selectedRange, ranges } = useDateRange('30d')
const { data, pending, refresh } = await useFetch<DashboardSummary>('/api/dashboard')
const runningCharts = await useFetch<ChartSeriesResponse>(() => `/api/charts/running?range=${selectedRange.value}`, { watch: [selectedRange] })
const cyclingCharts = await useFetch<ChartSeriesResponse>(() => `/api/charts/cycling?range=${selectedRange.value}`, { watch: [selectedRange] })

const localStatus = ref<SyncStatus | null>(null)
watch(
  () => data.value?.syncStatus,
  (value) => {
    if (value) {
      localStatus.value = value
    }
  },
  { immediate: true }
)

const { syncing, error, syncNow } = useSync(async (status) => {
  localStatus.value = status
  await Promise.all([refresh(), runningCharts.refresh(), cyclingCharts.refresh()])
})

function buildDateLabels(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(point.date)))
}

const runningZone2 = computed(() => runningCharts.data.value?.zone2 ?? [])
const cyclingZone2 = computed(() => cyclingCharts.data.value?.zone2 ?? [])
const runningHr = computed(() => runningCharts.data.value?.hrPerformance ?? [])
const cyclingHr = computed(() => cyclingCharts.data.value?.hrPerformance ?? [])
</script>

<template>
  <LoadingState v-if="pending && !data" />
  <div v-else class="dashboard-grid">
    <div class="grid-span-4">
      <SyncStatusCard :status="localStatus ?? data!.syncStatus" :syncing="syncing" @sync="syncNow" />
      <p v-if="error" class="error-text">{{ error }}</p>
    </div>

    <div class="grid-span-4">
      <CounterCard :counter="data!.counters[0]" />
    </div>

    <div class="grid-span-4">
      <CounterCard :counter="data!.counters[1]" />
    </div>

    <div class="grid-span-12 section-card card stack">
      <div class="inline-actions">
        <div>
          <h2 class="section-title">Charts</h2>
          <p class="section-subtitle">Performance trends for easy efforts and heart-rate context.</p>
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
    </div>

    <div class="grid-span-6">
      <ChartCard
        title="Running Zone 2 Progress"
        subtitle="Connected line chart of pace for runs currently classified as Zone 2."
        primary-metric="runningPace"
        :labels="buildDateLabels(runningZone2)"
        :datasets="[
          {
            label: 'Pace',
            data: runningZone2.map((point) => point.value),
            borderColor: '#166534',
            backgroundColor: 'rgba(22,101,52,0.2)'
          }
        ]"
      />
    </div>

    <div class="grid-span-6">
      <ChartCard
        title="Cycling Zone 2 Progress"
        subtitle="Connected line chart of speed for rides currently classified as Zone 2."
        primary-metric="cyclingSpeed"
        :labels="buildDateLabels(cyclingZone2)"
        :datasets="[
          {
            label: 'Speed',
            data: cyclingZone2.map((point) => point.value),
            borderColor: '#c97c2a',
            backgroundColor: 'rgba(201,124,42,0.2)'
          }
        ]"
      />
    </div>

    <div class="grid-span-6">
      <ChartCard
        title="Running HR vs Pace"
        :subtitle="`Chronological view of heart rate and ${performanceAxisLabel('running').toLowerCase()}.`"
        primary-metric="runningPace"
        secondary-metric="heartRate"
        :labels="buildDateLabels(runningHr)"
        :datasets="[
          {
            label: 'Pace',
            data: runningHr.map((point) => point.value),
            borderColor: '#166534',
            backgroundColor: 'rgba(22,101,52,0.2)'
          },
          {
            label: 'HR',
            data: runningHr.map((point) => point.secondaryValue ?? 0),
            borderColor: '#8b2f24',
            backgroundColor: 'rgba(139,47,36,0.2)',
            yAxisID: 'y1'
          }
        ]"
      />
    </div>

    <div class="grid-span-6">
      <ChartCard
        title="Cycling HR vs Speed"
        :subtitle="`Chronological view of heart rate and ${performanceAxisLabel('cycling').toLowerCase()}.`"
        primary-metric="cyclingSpeed"
        secondary-metric="heartRate"
        :labels="buildDateLabels(cyclingHr)"
        :datasets="[
          {
            label: 'Speed',
            data: cyclingHr.map((point) => point.value),
            borderColor: '#c97c2a',
            backgroundColor: 'rgba(201,124,42,0.2)'
          },
          {
            label: 'HR',
            data: cyclingHr.map((point) => point.secondaryValue ?? 0),
            borderColor: '#8b2f24',
            backgroundColor: 'rgba(139,47,36,0.2)',
            yAxisID: 'y1'
          }
        ]"
      />
    </div>

    <div class="grid-span-12 stack">
      <section class="section-card card stack">
        <div>
          <h2 class="section-title">Recent activities</h2>
          <p class="section-subtitle">Latest imported sessions across all sports.</p>
        </div>
        <EmptyState
          v-if="!data!.recentActivities.length"
          title="No activities yet"
          description="Connect Strava and run your first sync to populate the dashboard."
        />
        <ActivityTile v-for="activity in data!.recentActivities" :key="activity.id" :activity="activity" />
      </section>
    </div>
  </div>
</template>
