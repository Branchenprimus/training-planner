<script setup lang="ts">
import type { ChartSeriesResponse, PaginatedActivitiesResponse } from '~/shared/types'
import { hasChartScope, useChartDefinitions } from '../composables/useChartDefinitions'
import { useDateRange } from '../composables/useDateRange'

const { locale, t } = useAppI18n()
const pageSize = 20
const visibleCount = ref(pageSize)
const { selectedRange, ranges } = useDateRange('30d')
const { data, pending } = await useFetch<PaginatedActivitiesResponse>(() => `/api/activities/running?page=1&pageSize=${visibleCount.value}`, { watch: [visibleCount] })
const charts = await useFetch<ChartSeriesResponse>(() => `/api/charts/running?range=${selectedRange.value}`, { watch: [selectedRange] })
const { chartDefinitions } = useChartDefinitions({
  locale,
  t,
  runningCharts: computed(() => charts.data.value),
  cyclingCharts: computed(() => undefined)
})
const runningPageCharts = computed(() => chartDefinitions.value.filter((chart) => hasChartScope(chart, 'running')))

const canLoadMore = computed(() => (data.value?.items.length ?? 0) < (data.value?.total ?? 0))

function loadMore() {
  visibleCount.value += pageSize
}
</script>

<template>
  <section class="page-grid">
    <section class="stack charts-region">
      <div class="section-card card stack charts-section-header">
        <div class="inline-actions charts-header-row">
          <div class="charts-header-copy">
            <h2 class="section-title">{{ t('runningAnalysis') }}</h2>
            <p class="section-subtitle">{{ t('runningAnalysisSubtitle') }}</p>
          </div>
          <div class="inline-actions charts-range-actions">
            <button
              v-for="range in ranges"
              :key="range"
              class="btn charts-range-btn"
              :class="selectedRange === range ? 'btn-primary' : 'btn-secondary'"
              @click="selectedRange = range"
            >
              {{ range }}
            </button>
          </div>
        </div>
      </div>

      <div class="dashboard-grid running-chart-grid charts-content-grid">
        <div v-for="chart in runningPageCharts" :key="chart.id" class="grid-span-6">
          <ChartCard
            :title="chart.title"
            :subtitle="chart.subtitle"
            :info-text="chart.infoText"
            :variant="chart.variant"
            :tooltip-detail-lines="chart.tooltipDetailLines"
            :tooltip-title-mode="chart.tooltipTitleMode"
            :primary-metric="chart.primaryMetric"
            :secondary-metric="chart.secondaryMetric"
            :invert-primary-axis="chart.invertPrimaryAxis"
            :labels="chart.labels"
            :point-titles="chart.pointTitles"
            :datasets="chart.datasets"
          />
        </div>
      </div>
    </section>

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
.charts-region {
  position: relative;
}

.charts-section-header {
  position: sticky;
  top: clamp(8.4rem, 12vw, 10.2rem);
  z-index: 14;
  overflow: visible;
  padding: 0.72rem 0.95rem;
  background:
    linear-gradient(180deg, rgba(255, 253, 249, 0.98), rgba(255, 249, 242, 0.94));
  box-shadow:
    0 10px 20px rgba(53, 38, 18, 0.05),
    0 0 0 1px rgba(64, 45, 22, 0.04);
}

.charts-content-grid {
  align-content: start;
}

.charts-header-row {
  gap: 0.65rem;
  align-items: center;
}

.charts-header-copy .section-title {
  margin-bottom: 0.05rem;
  font-size: clamp(1.05rem, 1.2vw, 1.3rem);
  line-height: 1.05;
}

.charts-header-copy .section-subtitle {
  font-size: 0.92rem;
  line-height: 1.35;
}

.charts-range-actions {
  margin-left: auto;
  justify-content: flex-end;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.charts-range-btn {
  min-height: 2.2rem;
  padding: 0.5rem 0.82rem;
  font-size: 0.92rem;
}

.running-chart-grid {
  grid-template-columns: repeat(12, 1fr);
}

@media (max-width: 960px) {
  .charts-section-header {
    top: clamp(9.1rem, 24vw, 11.2rem);
    padding: 0.68rem 0.82rem;
  }

  .charts-header-row {
    align-items: flex-start;
  }

  .charts-range-actions {
    margin-left: 0;
    justify-content: flex-start;
  }

  .running-chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
