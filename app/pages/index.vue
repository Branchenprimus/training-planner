<script setup lang="ts">
import type { ChartSeriesResponse, DashboardSummary, DashboardChartId, MultisportWeeklyDistanceResponse, SettingsResponse, SettingsUpdateRequest } from '~/shared/types'
import { DEFAULT_DASHBOARD_CHART_IDS } from '~/shared/constants'
import { FEATURED_CHART_ID, hasChartScope, type DashboardChartDefinition, useChartDefinitions } from '../composables/useChartDefinitions'
import { useDateRange } from '../composables/useDateRange'

const { locale, t } = useAppI18n()
const { selectedRange, ranges } = useDateRange('30d')
const recentPageSize = 8
const visibleRecentCount = ref(recentPageSize)
const { data, pending } = await useFetch<DashboardSummary>(() => `/api/dashboard?recentLimit=${visibleRecentCount.value}`, {
  watch: [visibleRecentCount]
})
const settingsState = await useFetch<SettingsResponse>('/api/settings')
const runningCharts = await useFetch<ChartSeriesResponse>(() => `/api/charts/running?range=${selectedRange.value}`, { watch: [selectedRange] })
const cyclingCharts = await useFetch<ChartSeriesResponse>(() => `/api/charts/cycling?range=${selectedRange.value}`, { watch: [selectedRange] })
const multisportWeeklyCharts = await useFetch<MultisportWeeklyDistanceResponse>(() => `/api/charts/multisport-weekly?range=${selectedRange.value}`, { watch: [selectedRange] })

const defaultChartIds: DashboardChartId[] = [...DEFAULT_DASHBOARD_CHART_IDS]
const selectedChartIds = ref<DashboardChartId[]>([...defaultChartIds])
const draftChartIds = ref<DashboardChartId[]>([...defaultChartIds])
const isChartEditorOpen = ref(false)
const isSavingChartSelection = ref(false)

const { chartDefinitions } = useChartDefinitions({
  locale,
  t,
  runningCharts: computed(() => runningCharts.data.value),
  cyclingCharts: computed(() => cyclingCharts.data.value),
  multisportWeeklyCharts: computed(() => multisportWeeklyCharts.data.value)
})

const dashboardChartDefinitions = computed<(DashboardChartDefinition & { id: DashboardChartId })[]>(() =>
  chartDefinitions.value.filter((chart): chart is DashboardChartDefinition & { id: DashboardChartId } => hasChartScope(chart, 'dashboard'))
)

watch(
  () => settingsState.data.value?.settings.dashboardChartIds,
  (chartIds) => {
    if (!chartIds) {
      selectedChartIds.value = [...defaultChartIds]
      if (!isChartEditorOpen.value) {
        draftChartIds.value = [...defaultChartIds]
      }
      return
    }

    selectedChartIds.value = [...chartIds]
    if (!isChartEditorOpen.value) {
      draftChartIds.value = [...chartIds]
    }
  },
  { immediate: true }
)

const visibleCharts = computed(() => {
  return [...dashboardChartDefinitions.value]
    .filter((chart) => selectedChartIds.value.includes(chart.id as DashboardChartId))
    .sort((left, right) => {
      if (left.id === FEATURED_CHART_ID) {
        return -1
      }

      if (right.id === FEATURED_CHART_ID) {
        return 1
      }

      return 0
    })
})

const canLoadMoreRecent = computed(() => {
  const recentActivities = data.value?.recentActivities ?? []
  return recentActivities.length === visibleRecentCount.value
})

function loadMoreRecent() {
  visibleRecentCount.value += recentPageSize
}

function toggleChartEditor() {
  if (isChartEditorOpen.value) {
    draftChartIds.value = [...selectedChartIds.value]
    isChartEditorOpen.value = false
    return
  }

  draftChartIds.value = [...selectedChartIds.value]
  isChartEditorOpen.value = true
}

function toggleDraftChart(chartId: DashboardChartId) {
  if (draftChartIds.value.includes(chartId)) {
    draftChartIds.value = draftChartIds.value.filter((id) => id !== chartId)
    return
  }

  draftChartIds.value = [...draftChartIds.value, chartId]
}

function addAllDraftCharts() {
  draftChartIds.value = dashboardChartDefinitions.value.map((chart) => chart.id as DashboardChartId)
}

function removeAllDraftCharts() {
  draftChartIds.value = []
}

async function applyChartSelection() {
  const settings = settingsState.data.value?.settings
  if (!settings || isSavingChartSelection.value) {
    return
  }

  const payload: SettingsUpdateRequest = {
    ...settings,
    dashboardChartIds: [...draftChartIds.value],
    stravaClientId: '',
    stravaClientSecret: ''
  }

  isSavingChartSelection.value = true

  try {
    const response = await $fetch<SettingsResponse>('/api/settings', {
      method: 'PUT',
      body: payload
    })
    settingsState.data.value = response
    selectedChartIds.value = [...response.settings.dashboardChartIds]
    draftChartIds.value = [...response.settings.dashboardChartIds]
    isChartEditorOpen.value = false
  } finally {
    isSavingChartSelection.value = false
  }
}

function isDraftSelected(chartId: DashboardChartId) {
  return draftChartIds.value.includes(chartId)
}

function scrollToActivities() {
  const el = document.getElementById('recent-activities')
  if (el) {
    const yOffset = -90 // Offset to prevent sticky headers from hiding the title
    const y = el.getBoundingClientRect().top + window.scrollY + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
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

    <section class="grid-span-12 stack charts-region">
      <div class="section-card card stack charts-section-header">
        <div class="inline-actions charts-header-row">
          <div class="charts-header-copy">
            <h2 class="section-title">{{ t('charts') }}</h2>
            <p class="section-subtitle">{{ t('chartsSubtitle') }}</p>
          </div>
          <div class="inline-actions charts-range-actions">
            <button class="jump-to-activities-btn" type="button" @click="scrollToActivities">
              Jump to activities ↓
            </button>
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

      <div class="dashboard-grid charts-content-grid">
        <div
          v-for="chart in visibleCharts"
          :key="chart.id"
          :class="chart.id === FEATURED_CHART_ID ? 'grid-span-12' : 'grid-span-6'"
        >
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
            :stacked="chart.stacked"
            :featured="chart.id === FEATURED_CHART_ID"
            :labels="chart.labels"
            :point-titles="chart.pointTitles"
            :datasets="chart.datasets"
          />
        </div>

        <div class="grid-span-12">
          <button class="chart-editor-trigger" type="button" @click="toggleChartEditor">
            {{ isChartEditorOpen ? 'Close chart editor' : 'Add more Charts' }}
          </button>
        </div>

        <div v-if="isChartEditorOpen" class="grid-span-12">
          <section class="section-card card stack chart-editor-card">
            <div>
              <h3 class="section-title">Chart Editor</h3>
              <p class="section-subtitle">
                Preview all available dashboard charts with mock data,<br>
                choose the ones you want, then apply your selection.
              </p>
            </div>

            <div class="inline-actions chart-editor-actions">
              <button class="btn btn-secondary" type="button" @click="addAllDraftCharts">
                Add all
              </button>
              <button class="btn btn-secondary" type="button" @click="removeAllDraftCharts">
                Remove all
              </button>
              <button class="btn btn-secondary" type="button" @click="toggleChartEditor">
                Cancel
              </button>
              <button class="btn btn-primary" type="button" @click="applyChartSelection">
                {{ isSavingChartSelection ? 'Applying...' : 'Apply' }}
              </button>
            </div>

            <div class="chart-editor-grid">
              <div
                v-for="chart in dashboardChartDefinitions"
                :key="`editor-${chart.id}`"
                class="chart-picker"
                :class="{
                  'chart-picker-selected': isDraftSelected(chart.id),
                  'chart-picker-featured': chart.id === FEATURED_CHART_ID
                }"
                role="button"
                tabindex="0"
                @click="toggleDraftChart(chart.id)"
                @keydown.enter.prevent="toggleDraftChart(chart.id)"
                @keydown.space.prevent="toggleDraftChart(chart.id)"
              >
                <div class="chart-picker-badge">
                  <span class="pill">{{ isDraftSelected(chart.id) ? 'Selected' : 'Select chart' }}</span>
                </div>
                <ChartCard
                  :title="chart.title"
                  :subtitle="chart.subtitle"
                  :variant="chart.variant"
                  :tooltip-detail-lines="chart.tooltipDetailLines"
                  :tooltip-title-mode="chart.tooltipTitleMode"
                  :primary-metric="chart.primaryMetric"
                  :secondary-metric="chart.secondaryMetric"
                  :invert-primary-axis="chart.invertPrimaryAxis"
                  :stacked="chart.stacked"
                  :labels="chart.previewLabels"
                  :point-titles="chart.previewPointTitles"
                  :datasets="chart.previewDatasets"
                />
              </div>
            </div>

            <div class="inline-actions chart-editor-actions">
              <button class="btn btn-secondary" type="button" @click="addAllDraftCharts">
                Add all
              </button>
              <button class="btn btn-secondary" type="button" @click="removeAllDraftCharts">
                Remove all
              </button>
              <button class="btn btn-secondary" type="button" @click="toggleChartEditor">
                Cancel
              </button>
              <button class="btn btn-primary" type="button" @click="applyChartSelection">
                {{ isSavingChartSelection ? 'Applying...' : 'Apply' }}
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>

    <div id="recent-activities" class="grid-span-12 stack">
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

.jump-to-activities-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-right: 0.8rem;
  min-height: 2.2rem;
  padding: 0.4rem 0.9rem;
  font-size: 0.92rem;
  font-weight: 700;
  color: #654e2f;
  background: transparent;
  border: 1px solid rgba(101, 78, 47, 0.25);
  border-radius: var(--radius, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.jump-to-activities-btn:hover {
  background: rgba(101, 78, 47, 0.05);
  border-color: rgba(101, 78, 47, 0.45);
}

.chart-editor-trigger {
  width: 100%;
  min-height: 4.25rem;
  padding: 1.1rem 1.4rem;
  border: 1px dashed rgba(64, 45, 22, 0.2);
  border-radius: var(--radius);
  background:
    linear-gradient(180deg, rgba(255, 253, 249, 0.96), rgba(255, 249, 242, 0.92));
  color: #5c4528;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.chart-editor-trigger:hover {
  transform: translateY(-1px);
  border-color: rgba(166, 60, 51, 0.28);
  box-shadow: 0 18px 34px rgba(53, 38, 18, 0.08);
}

.chart-editor-card {
  padding-bottom: 1.35rem;
}

.chart-editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.chart-picker {
  position: relative;
  padding: 0.35rem;
  border: 1px solid rgba(64, 45, 22, 0.1);
  border-radius: calc(var(--radius) + 0.2rem);
  background: rgba(255, 252, 247, 0.75);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  cursor: pointer;
  outline: none;
}

.chart-picker-featured {
  grid-column: 1 / -1;
}

.chart-picker:hover,
.chart-picker:focus-visible {
  transform: translateY(-1px);
  border-color: rgba(118, 94, 62, 0.24);
  box-shadow: 0 18px 34px rgba(53, 38, 18, 0.08);
}

.chart-picker-selected {
  border-color: rgba(22, 101, 52, 0.32);
  box-shadow:
    0 0 0 2px rgba(22, 101, 52, 0.08),
    0 18px 34px rgba(22, 101, 52, 0.1);
  background: rgba(248, 255, 250, 0.86);
}

.chart-picker-badge {
  display: flex;
  justify-content: flex-end;
  padding: 0.15rem 0.25rem 0.55rem;
}

.chart-editor-actions {
  justify-content: flex-end;
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

  .chart-editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
