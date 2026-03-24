<script setup lang="ts">
import type { ChartSeriesResponse, DashboardSummary } from '~/shared/types'
import { useDateRange } from '../composables/useDateRange'

const { locale, t } = useAppI18n()
const { selectedRange, ranges } = useDateRange('30d')
const recentPageSize = 8
const visibleRecentCount = ref(recentPageSize)
const { data, pending, refresh } = await useFetch<DashboardSummary>(() => `/api/dashboard?recentLimit=${visibleRecentCount.value}`, {
  watch: [visibleRecentCount]
})
const runningCharts = await useFetch<ChartSeriesResponse>(() => `/api/charts/running?range=${selectedRange.value}`, { watch: [selectedRange] })
const cyclingCharts = await useFetch<ChartSeriesResponse>(() => `/api/charts/cycling?range=${selectedRange.value}`, { watch: [selectedRange] })

function buildDateLabels(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(new Date(point.date)))
}

function buildPointTitles(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => point.label)
}

const runningZone2 = computed(() => runningCharts.data.value?.zone2 ?? [])
const cyclingZone2 = computed(() => cyclingCharts.data.value?.zone2 ?? [])
const runningHr = computed(() => runningCharts.data.value?.hrPerformance ?? [])
const cyclingHr = computed(() => cyclingCharts.data.value?.hrPerformance ?? [])
const runningRelativeEffort = computed(() => runningCharts.data.value?.relativeEffort ?? [])
const cyclingRelativeEffort = computed(() => cyclingCharts.data.value?.relativeEffort ?? [])

const canLoadMoreRecent = computed(() => {
  const recentActivities = data.value?.recentActivities ?? []
  return recentActivities.length === visibleRecentCount.value
})

function loadMoreRecent() {
  visibleRecentCount.value += recentPageSize
}
</script>

<template>
  <LoadingState v-if="pending && !data" />
  <div v-else class="dashboard-grid">
    <div class="grid-span-6">
      <CounterCard :counter="data!.counters[0]" />
    </div>

    <div class="grid-span-6">
      <CounterCard :counter="data!.counters[1]" />
    </div>

    <div class="grid-span-12 section-card card stack">
      <div class="inline-actions">
        <div>
          <h2 class="section-title">{{ t('charts') }}</h2>
          <p class="section-subtitle">{{ t('chartsSubtitle') }}</p>
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

    <div class="grid-span-12 stack">
      <section class="section-card card stack">
        <div>
          <h2 class="section-title">{{ t('recentActivities') }}</h2>
          <p class="section-subtitle">{{ t('recentActivitiesSubtitle') }}</p>
        </div>
        <EmptyState
          v-if="!data!.recentActivities.length"
          :title="t('noActivitiesYet')"
          :description="t('connectAndSync')"
        />
        <ActivityTile v-for="activity in data!.recentActivities" :key="activity.id" :activity="activity" />
        <div v-if="data!.recentActivities.length" class="inline-actions">
          <button v-if="canLoadMoreRecent" class="btn btn-secondary" :disabled="pending" @click="loadMoreRecent">
            {{ pending ? `${t('loading')}...` : t('loadMoreActivities') }}
          </button>
          <p v-else class="muted">{{ t('showingRecentActivities') }}</p>
        </div>
      </section>
    </div>
  </div>
</template>
