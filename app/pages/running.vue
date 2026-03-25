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

function buildSeriesLabels(points: { label: string }[]) {
  return points.map((point) => point.label)
}

const runningZone2 = computed(() => charts.data.value?.zone2 ?? [])
const runningHr = computed(() => charts.data.value?.hrPerformance ?? [])
const runningRelativeEffort = computed(() => charts.data.value?.relativeEffort ?? [])
const runningZoneDistribution = computed(() => charts.data.value?.zoneDistribution ?? { zone2: [], zone3: [], zone4: [], interval: [] })
const runningSessionClassification = computed(() => charts.data.value?.sessionClassification ?? { zone2: [], zone3: [], zone4: [], interval: [] })
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
        <div class="grid-span-6">
          <ChartCard
            :title="t('runningZone2Progress')"
            :subtitle="t('runningZone2Subtitle')"
            :info-text="t('runningZone2Info')"
            primary-metric="runningPace"
            :labels="buildDateLabels(runningZone2)"
            :point-titles="buildPointTitles(runningZone2)"
            :tooltip-detail-lines="runningZone2.map((point) => point.tooltipDetails ?? [])"
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
            :tooltip-detail-lines="runningRelativeEffort.map((point) => point.tooltipDetails ?? [])"
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
            :title="t('runningZoneDistribution')"
            :subtitle="t('runningZoneDistributionSubtitle')"
            :info-text="t('runningZoneDistributionInfo')"
            primary-metric="durationMinutes"
            :labels="buildDateLabels(runningZoneDistribution.zone2)"
            :point-titles="buildPointTitles(runningZoneDistribution.zone2)"
            :tooltip-detail-lines="runningZoneDistribution.zone2.map((point) => point.tooltipDetails ?? [])"
            :datasets="[
              {
                label: t('zone2'),
                data: runningZoneDistribution.zone2.map((point) => point.value),
                borderColor: '#166534',
                backgroundColor: 'rgba(22,101,52,0.18)'
              },
              {
                label: t('zone3'),
                data: runningZoneDistribution.zone3.map((point) => point.value),
                borderColor: '#8a6a18',
                backgroundColor: 'rgba(138,106,24,0.18)'
              },
              {
                label: t('zone4'),
                data: runningZoneDistribution.zone4.map((point) => point.value),
                borderColor: '#9a551f',
                backgroundColor: 'rgba(154,85,31,0.18)'
              },
              {
                label: t('intervalLabel'),
                data: runningZoneDistribution.interval.map((point) => point.value),
                borderColor: '#8b2f24',
                backgroundColor: 'rgba(139,47,36,0.18)'
              }
            ]"
          />
        </div>

        <div class="grid-span-6">
          <ChartCard
            :title="t('runningSessionsByClassification')"
            :subtitle="t('runningSessionsByClassificationSubtitle')"
            :info-text="t('runningSessionsByClassificationInfo')"
            primary-metric="sessionCount"
            variant="bar"
            :labels="buildSeriesLabels(runningSessionClassification.zone2)"
            :datasets="[
              {
                label: t('zone2'),
                data: runningSessionClassification.zone2.map((point) => point.value),
                borderColor: '#166534',
                backgroundColor: 'rgba(22,101,52,0.78)'
              },
              {
                label: t('zone3'),
                data: runningSessionClassification.zone3.map((point) => point.value),
                borderColor: '#8a6a18',
                backgroundColor: 'rgba(138,106,24,0.78)'
              },
              {
                label: t('zone4'),
                data: runningSessionClassification.zone4.map((point) => point.value),
                borderColor: '#9a551f',
                backgroundColor: 'rgba(154,85,31,0.78)'
              },
              {
                label: t('intervalLabel'),
                data: runningSessionClassification.interval.map((point) => point.value),
                borderColor: '#8b2f24',
                backgroundColor: 'rgba(139,47,36,0.78)'
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
