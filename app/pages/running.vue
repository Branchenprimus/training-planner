<script setup lang="ts">
import type { ChartSeriesResponse, PaginatedActivitiesResponse } from '~/shared/types'
import { useDateRange } from '../composables/useDateRange'

const { locale, t } = useAppI18n()
const pageSize = 20
const visibleCount = ref(pageSize)
const { selectedRange, ranges } = useDateRange('30d')
const { data, pending } = await useFetch<PaginatedActivitiesResponse>(() => `/api/activities/running?page=1&pageSize=${visibleCount.value}`, { watch: [visibleCount] })
const charts = await useFetch<ChartSeriesResponse>(() => `/api/charts/running?range=${selectedRange.value}`, { watch: [selectedRange] })

function buildDateLabels(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(new Date(point.date)))
}

function buildPointTitles(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => point.label)
}

const runningZone2 = computed(() => charts.data.value?.zone2 ?? [])
const runningHr = computed(() => charts.data.value?.hrPerformance ?? [])
const runningRelativeEffort = computed(() => charts.data.value?.relativeEffort ?? [])
const runningDistance = computed(() => charts.data.value?.distance ?? [])
const runningDuration = computed(() => charts.data.value?.duration ?? [])
const runningElevation = computed(() => charts.data.value?.elevation ?? [])

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
          <h2 class="section-title">{{ t('runningAnalysis') }}</h2>
          <p class="section-subtitle">{{ t('runningAnalysisSubtitle') }}</p>
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
          :title="t('runningZone2Progress')"
          :subtitle="t('runningZone2Subtitle')"
          :info-text="t('runningZone2Info')"
          primary-metric="runningPace"
          :labels="buildDateLabels(runningZone2)"
          :point-titles="buildPointTitles(runningZone2)"
          :datasets="[
            {
              label: t('zone2'),
              data: runningZone2.map((point) => point.value),
              borderColor: '#166534',
              backgroundColor: 'rgba(22,101,52,0.2)'
            }
          ]"
        />
      </div>

      <div class="grid-span-6">
        <ChartCard
          :title="t('runningHrVsPace')"
          :subtitle="t('chronologicalView', { metric: t('paceLabel').toLowerCase() })"
          :info-text="t('runningHrVsPaceInfo')"
          primary-metric="runningPace"
          :invert-primary-axis="true"
          secondary-metric="heartRate"
          :labels="buildDateLabels(runningHr)"
          :point-titles="buildPointTitles(runningHr)"
          :datasets="[
            {
              label: t('paceLabel'),
              data: runningHr.map((point) => point.value),
              borderColor: '#166534',
              backgroundColor: 'rgba(22,101,52,0.2)'
            },
            {
              label: t('hrLabel'),
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
          :title="t('runningRelativeEffort')"
          :subtitle="t('runningRelativeEffortSubtitle')"
          :info-text="t('runningRelativeEffortInfo')"
          primary-metric="relativeEffort"
          :labels="buildDateLabels(runningRelativeEffort)"
          :point-titles="buildPointTitles(runningRelativeEffort)"
          :datasets="[
            {
              label: t('intensityLabel'),
              data: runningRelativeEffort.map((point) => point.value),
              borderColor: '#8b2f24',
              backgroundColor: 'rgba(139,47,36,0.18)'
            }
          ]"
        />
      </div>

      <div class="grid-span-6">
        <ChartCard
          :title="t('runDistanceVsDuration')"
          :subtitle="t('runDistanceVsDurationSubtitle')"
          :info-text="t('runDistanceVsDurationInfo')"
          primary-metric="distanceKm"
          secondary-metric="durationMinutes"
          :labels="buildDateLabels(runningDistance)"
          :point-titles="buildPointTitles(runningDistance)"
          :datasets="[
            {
              label: t('distanceLabel'),
              data: runningDistance.map((point) => point.value),
              borderColor: '#c97c2a',
              backgroundColor: 'rgba(201,124,42,0.2)'
            },
            {
              label: t('durationLabel'),
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
          :title="t('runningElevationGain')"
          :subtitle="t('runningElevationGainSubtitle')"
          :info-text="t('runningElevationGainInfo')"
          primary-metric="elevationMeters"
          :labels="buildDateLabels(runningElevation)"
          :point-titles="buildPointTitles(runningElevation)"
          :datasets="[
            {
              label: t('elevationLabel'),
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
      :title="t('noRunningActivities')"
      :description="t('runningActivitiesDescription')"
    />
    <template v-else>
      <ActivityTile v-for="activity in data.items" :key="activity.id" :activity="activity" />
      <div class="inline-actions">
        <button v-if="canLoadMore" class="btn btn-secondary" :disabled="pending" @click="loadMore">
          {{ pending ? `${t('loading')}...` : t('loadMoreRuns') }}
        </button>
        <p v-else class="muted">{{ t('showingAllRunning') }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.running-chart-grid {
  grid-template-columns: repeat(12, 1fr);
}

@media (max-width: 960px) {
  .running-chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
