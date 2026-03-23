<script setup lang="ts">
import type { ChartSeriesResponse, PaginatedActivitiesResponse } from '~/shared/types'
import { performanceAxisLabel } from '~/shared/format'
import { useDateRange } from '../composables/useDateRange'

const page = ref(1)
const pageSize = 20
const { selectedRange, ranges } = useDateRange('30d')
const { data, pending } = await useFetch<PaginatedActivitiesResponse>(() => `/api/activities/running?page=${page.value}&pageSize=${pageSize}`, { watch: [page] })
const charts = await useFetch<ChartSeriesResponse>(() => `/api/charts/running?range=${selectedRange.value}`, { watch: [selectedRange] })

function buildDateLabels(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(point.date)))
}

const runningZone2 = computed(() => charts.data.value?.zone2 ?? [])
const runningHr = computed(() => charts.data.value?.hrPerformance ?? [])
const runningDistance = computed(() => charts.data.value?.distance ?? [])
const runningDuration = computed(() => charts.data.value?.duration ?? [])
const runningElevation = computed(() => charts.data.value?.elevation ?? [])
</script>

<template>
  <section class="page-grid">
    <section class="section-card card stack">
      <div class="inline-actions">
        <div>
          <h2 class="section-title">Running Analysis</h2>
          <p class="section-subtitle">Track easy pace trends, heart-rate relationship, run volume, and climbing over time.</p>
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

    <div class="dashboard-grid running-chart-grid">
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
          title="Run Distance vs Duration"
          subtitle="Useful for spotting long runs, shorter quality days, and whether your training volume is creeping up."
          primary-metric="distanceKm"
          secondary-metric="durationMinutes"
          :labels="buildDateLabels(runningDistance)"
          :datasets="[
            {
              label: 'Distance',
              data: runningDistance.map((point) => point.value),
              borderColor: '#c97c2a',
              backgroundColor: 'rgba(201,124,42,0.2)'
            },
            {
              label: 'Duration',
              data: runningDuration.map((point) => point.value),
              borderColor: '#6d614f',
              backgroundColor: 'rgba(109,97,79,0.2)',
              yAxisID: 'y1'
            }
          ]"
        />
      </div>

      <div class="grid-span-6">
        <ChartCard
          title="Running Elevation Gain"
          subtitle="Chronological climb trend for hillier runs and terrain shifts across the selected range."
          primary-metric="elevationMeters"
          :labels="buildDateLabels(runningElevation)"
          :datasets="[
            {
              label: 'Elevation',
              data: runningElevation.map((point) => point.value),
              borderColor: '#8a5b21',
              backgroundColor: 'rgba(138,91,33,0.2)'
            }
          ]"
        />
      </div>
    </div>

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

<style scoped>
.running-chart-grid {
  grid-template-columns: repeat(12, 1fr);
}
</style>
