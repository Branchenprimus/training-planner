<script setup lang="ts">
import type { ChartSeriesResponse, DashboardSummary, DashboardChartId, MultisportWeeklyDistanceResponse, SettingsResponse, SettingsUpdateRequest } from '~/shared/types'
import { DEFAULT_DASHBOARD_CHART_IDS } from '~/shared/constants'
import { useDateRange } from '../composables/useDateRange'

type DashboardChartDefinition = {
  id: DashboardChartId
  title: string
  subtitle: string
  infoText: string
  primaryMetric: 'runningPace' | 'cyclingSpeed' | 'relativeEffort' | 'durationMinutes' | 'sessionCount' | 'distanceKm'
  secondaryMetric?: 'heartRate' | 'durationMinutes'
  invertPrimaryAxis?: boolean
  variant?: 'line' | 'bar'
  labels: string[]
  pointTitles?: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    yAxisID?: string
  }>
  previewLabels: string[]
  previewPointTitles?: string[]
  previewDatasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    yAxisID?: string
  }>
}

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

watch(
  () => settingsState.data.value?.settings.dashboardChartIds,
  (chartIds) => {
    if (!chartIds?.length) {
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

function buildDateLabels(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(new Date(point.date)))
}

function buildPointTitles(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => point.label)
}

function buildSeriesLabels(points: { label: string }[]) {
  return points.map((point) => point.label)
}

const runningZone2 = computed(() => runningCharts.data.value?.zone2 ?? [])
const cyclingZone2 = computed(() => cyclingCharts.data.value?.zone2 ?? [])
const runningHr = computed(() => runningCharts.data.value?.hrPerformance ?? [])
const cyclingHr = computed(() => cyclingCharts.data.value?.hrPerformance ?? [])
const runningRelativeEffort = computed(() => runningCharts.data.value?.relativeEffort ?? [])
const cyclingRelativeEffort = computed(() => cyclingCharts.data.value?.relativeEffort ?? [])
const runningZoneDistribution = computed(() => runningCharts.data.value?.zoneDistribution ?? { zone2: [], zone3: [], zone4: [], interval: [] })
const cyclingZoneDistribution = computed(() => cyclingCharts.data.value?.zoneDistribution ?? { zone2: [], zone3: [], zone4: [], interval: [] })
const runningSessionClassification = computed(() => runningCharts.data.value?.sessionClassification ?? { zone2: [], zone3: [], zone4: [], interval: [] })
const cyclingSessionClassification = computed(() => cyclingCharts.data.value?.sessionClassification ?? { zone2: [], zone3: [], zone4: [], interval: [] })
const multisportWeeklyRunning = computed(() => multisportWeeklyCharts.data.value?.running ?? [])
const multisportWeeklyCycling = computed(() => multisportWeeklyCharts.data.value?.cycling ?? [])
const multisportWeeklySwimming = computed(() => multisportWeeklyCharts.data.value?.swimming ?? [])
const multisportWeeklyLabels = computed(() => multisportWeeklyCharts.data.value?.labels ?? [])
const multisportWeeklyPointTitles = computed(() => multisportWeeklyCharts.data.value?.pointTitles ?? [])

const previewLabels = ['Mar 2', 'Mar 9', 'Mar 16', 'Mar 23']
const previewPointTitles = {
  runningZone2: ['Easy Run Riverside', 'Aerobic Run Park', 'Steady Run Trail', 'Zone 2 Endurance'],
  cyclingZone2: ['Endurance Ride North Loop', 'Steady Ride Canal', 'Coffee Spin South', 'Aerobic Ride Hills'],
  multisportWeekly: ['Week of Mar 3', 'Week of Mar 10', 'Week of Mar 17', 'Week of Mar 24'],
  runningHr: ['Tempo Check', 'Cruise Run', 'Progression Run', 'Controlled Workout'],
  cyclingHr: ['Tempo Ride', 'Rolling Route', 'Threshold Build', 'Fast Group Ride'],
  runningRelativeEffort: ['Easy Run', 'Long Run', 'Hill Session', 'Tempo Run'],
  cyclingRelativeEffort: ['Recovery Ride', 'Endurance Ride', 'Climbing Ride', 'Hard Group Ride'],
  buckets: ['Week of Mar 3', 'Week of Mar 10', 'Week of Mar 17', 'Week of Mar 24']
}

const chartDefinitions = computed(() => [
  {
    id: 'running-zone2',
    title: t('runningZone2Progress'),
    subtitle: t('runningZone2Subtitle'),
    infoText: t('runningZone2Info'),
    primaryMetric: 'runningPace',
    labels: buildDateLabels(runningZone2.value),
    pointTitles: buildPointTitles(runningZone2.value),
    datasets: [
      {
        label: t('zone2'),
        data: runningZone2.value.map((point) => point.value),
        borderColor: '#166534',
        backgroundColor: 'rgba(22,101,52,0.2)'
      }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.runningZone2,
    previewDatasets: [
      {
        label: t('zone2'),
        data: [5.62, 5.48, 5.36, 5.28],
        borderColor: '#166534',
        backgroundColor: 'rgba(22,101,52,0.2)'
      }
    ]
  },
  {
    id: 'cycling-zone2',
    title: t('cyclingZone2Progress'),
    subtitle: t('cyclingZone2Subtitle'),
    infoText: t('cyclingZone2Info'),
    primaryMetric: 'cyclingSpeed',
    labels: buildDateLabels(cyclingZone2.value),
    pointTitles: buildPointTitles(cyclingZone2.value),
    datasets: [
      {
        label: t('zone2'),
        data: cyclingZone2.value.map((point) => point.value),
        borderColor: '#166534',
        backgroundColor: 'rgba(22,101,52,0.2)'
      }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.cyclingZone2,
    previewDatasets: [
      {
        label: t('zone2'),
        data: [24.8, 25.5, 26.1, 26.4],
        borderColor: '#166534',
        backgroundColor: 'rgba(22,101,52,0.2)'
      }
    ]
  },
  {
    id: 'multisport-weekly-distance',
    title: t('multisportWeeklyDistance'),
    subtitle: t('multisportWeeklyDistanceSubtitle'),
    infoText: t('multisportWeeklyDistanceInfo'),
    primaryMetric: 'distanceKm',
    labels: multisportWeeklyLabels.value,
    pointTitles: multisportWeeklyPointTitles.value,
    datasets: [
      {
        label: t('running'),
        data: multisportWeeklyRunning.value.map((point) => point.value),
        borderColor: '#166534',
        backgroundColor: 'rgba(22,101,52,0.18)'
      },
      {
        label: t('cycling'),
        data: multisportWeeklyCycling.value.map((point) => point.value),
        borderColor: '#c97c2a',
        backgroundColor: 'rgba(201,124,42,0.18)'
      },
      {
        label: t('swimming'),
        data: multisportWeeklySwimming.value.map((point) => point.value),
        borderColor: '#2f6fb3',
        backgroundColor: 'rgba(47,111,179,0.18)'
      }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.multisportWeekly,
    previewDatasets: [
      {
        label: t('running'),
        data: [18, 26, 31, 24],
        borderColor: '#166534',
        backgroundColor: 'rgba(22,101,52,0.18)'
      },
      {
        label: t('cycling'),
        data: [62, 84, 96, 78],
        borderColor: '#c97c2a',
        backgroundColor: 'rgba(201,124,42,0.18)'
      },
      {
        label: t('swimming'),
        data: [2.4, 3.1, 2.7, 3.4],
        borderColor: '#2f6fb3',
        backgroundColor: 'rgba(47,111,179,0.18)'
      }
    ]
  },
  {
    id: 'running-hr',
    title: t('runningHrVsPace'),
    subtitle: t('chronologicalView', { metric: t('paceLabel').toLowerCase() }),
    infoText: t('runningHrVsPaceInfo'),
    primaryMetric: 'runningPace',
    secondaryMetric: 'heartRate',
    invertPrimaryAxis: true,
    labels: buildDateLabels(runningHr.value),
    pointTitles: buildPointTitles(runningHr.value),
    datasets: [
      {
        label: t('paceLabel'),
        data: runningHr.value.map((point) => point.value),
        borderColor: '#166534',
        backgroundColor: 'rgba(22,101,52,0.2)'
      },
      {
        label: t('hrLabel'),
        data: runningHr.value.map((point) => point.secondaryValue ?? 0),
        borderColor: '#8b2f24',
        backgroundColor: 'rgba(139,47,36,0.2)',
        yAxisID: 'y1'
      }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.runningHr,
    previewDatasets: [
      {
        label: t('paceLabel'),
        data: [5.26, 5.18, 5.12, 5.03],
        borderColor: '#166534',
        backgroundColor: 'rgba(22,101,52,0.2)'
      },
      {
        label: t('hrLabel'),
        data: [145, 148, 151, 154],
        borderColor: '#8b2f24',
        backgroundColor: 'rgba(139,47,36,0.2)',
        yAxisID: 'y1'
      }
    ]
  },
  {
    id: 'cycling-hr',
    title: t('cyclingHrVsSpeed'),
    subtitle: t('chronologicalView', { metric: t('speedLabel').toLowerCase() }),
    infoText: t('cyclingHrVsSpeedInfo'),
    primaryMetric: 'cyclingSpeed',
    secondaryMetric: 'heartRate',
    labels: buildDateLabels(cyclingHr.value),
    pointTitles: buildPointTitles(cyclingHr.value),
    datasets: [
      {
        label: t('speedLabel'),
        data: cyclingHr.value.map((point) => point.value),
        borderColor: '#c97c2a',
        backgroundColor: 'rgba(201,124,42,0.2)'
      },
      {
        label: t('hrLabel'),
        data: cyclingHr.value.map((point) => point.secondaryValue ?? 0),
        borderColor: '#8b2f24',
        backgroundColor: 'rgba(139,47,36,0.2)',
        yAxisID: 'y1'
      }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.cyclingHr,
    previewDatasets: [
      {
        label: t('speedLabel'),
        data: [27.2, 28.1, 29.4, 30.1],
        borderColor: '#c97c2a',
        backgroundColor: 'rgba(201,124,42,0.2)'
      },
      {
        label: t('hrLabel'),
        data: [138, 142, 149, 153],
        borderColor: '#8b2f24',
        backgroundColor: 'rgba(139,47,36,0.2)',
        yAxisID: 'y1'
      }
    ]
  },
  {
    id: 'running-relative-effort',
    title: t('runningRelativeEffort'),
    subtitle: t('runningRelativeEffortSubtitle'),
    infoText: t('runningRelativeEffortInfo'),
    primaryMetric: 'relativeEffort',
    labels: buildDateLabels(runningRelativeEffort.value),
    pointTitles: buildPointTitles(runningRelativeEffort.value),
    datasets: [
      {
        label: t('intensityLabel'),
        data: runningRelativeEffort.value.map((point) => point.value),
        borderColor: '#8b2f24',
        backgroundColor: 'rgba(139,47,36,0.18)'
      }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.runningRelativeEffort,
    previewDatasets: [
      {
        label: t('intensityLabel'),
        data: [22, 35, 48, 58],
        borderColor: '#8b2f24',
        backgroundColor: 'rgba(139,47,36,0.18)'
      }
    ]
  },
  {
    id: 'cycling-relative-effort',
    title: t('cyclingRelativeEffort'),
    subtitle: t('cyclingRelativeEffortSubtitle'),
    infoText: t('cyclingRelativeEffortInfo'),
    primaryMetric: 'relativeEffort',
    labels: buildDateLabels(cyclingRelativeEffort.value),
    pointTitles: buildPointTitles(cyclingRelativeEffort.value),
    datasets: [
      {
        label: t('intensityLabel'),
        data: cyclingRelativeEffort.value.map((point) => point.value),
        borderColor: '#a63c33',
        backgroundColor: 'rgba(166,60,51,0.18)'
      }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.cyclingRelativeEffort,
    previewDatasets: [
      {
        label: t('intensityLabel'),
        data: [18, 31, 44, 62],
        borderColor: '#a63c33',
        backgroundColor: 'rgba(166,60,51,0.18)'
      }
    ]
  },
  {
    id: 'running-zone-distribution',
    title: t('runningZoneDistribution'),
    subtitle: t('runningZoneDistributionSubtitle'),
    infoText: t('runningZoneDistributionInfo'),
    primaryMetric: 'durationMinutes',
    labels: buildSeriesLabels(runningZoneDistribution.value.zone2),
    datasets: [
      { label: t('zone2'), data: runningZoneDistribution.value.zone2.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.18)' },
      { label: t('zone3'), data: runningZoneDistribution.value.zone3.map((point) => point.value), borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.18)' },
      { label: t('zone4'), data: runningZoneDistribution.value.zone4.map((point) => point.value), borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.18)' },
      { label: t('intervalLabel'), data: runningZoneDistribution.value.interval.map((point) => point.value), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.18)' }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.buckets,
    previewDatasets: [
      { label: t('zone2'), data: [84, 96, 102, 88], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.18)' },
      { label: t('zone3'), data: [18, 22, 28, 20], borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.18)' },
      { label: t('zone4'), data: [8, 0, 14, 10], borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.18)' },
      { label: t('intervalLabel'), data: [0, 12, 8, 0], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.18)' }
    ]
  },
  {
    id: 'cycling-zone-distribution',
    title: t('cyclingZoneDistribution'),
    subtitle: t('cyclingZoneDistributionSubtitle'),
    infoText: t('cyclingZoneDistributionInfo'),
    primaryMetric: 'durationMinutes',
    labels: buildSeriesLabels(cyclingZoneDistribution.value.zone2),
    datasets: [
      { label: t('zone2'), data: cyclingZoneDistribution.value.zone2.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.18)' },
      { label: t('zone3'), data: cyclingZoneDistribution.value.zone3.map((point) => point.value), borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.18)' },
      { label: t('zone4'), data: cyclingZoneDistribution.value.zone4.map((point) => point.value), borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.18)' },
      { label: t('intervalLabel'), data: cyclingZoneDistribution.value.interval.map((point) => point.value), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.18)' }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.buckets,
    previewDatasets: [
      { label: t('zone2'), data: [110, 124, 138, 132], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.18)' },
      { label: t('zone3'), data: [24, 36, 28, 22], borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.18)' },
      { label: t('zone4'), data: [0, 18, 20, 14], borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.18)' },
      { label: t('intervalLabel'), data: [0, 10, 16, 8], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.18)' }
    ]
  },
  {
    id: 'running-session-classification',
    title: t('runningSessionsByClassification'),
    subtitle: t('runningSessionsByClassificationSubtitle'),
    infoText: t('runningSessionsByClassificationInfo'),
    primaryMetric: 'sessionCount',
    variant: 'bar',
    labels: buildSeriesLabels(runningSessionClassification.value.zone2),
    datasets: [
      { label: t('zone2'), data: runningSessionClassification.value.zone2.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)' },
      { label: t('zone3'), data: runningSessionClassification.value.zone3.map((point) => point.value), borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)' },
      { label: t('zone4'), data: runningSessionClassification.value.zone4.map((point) => point.value), borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)' },
      { label: t('intervalLabel'), data: runningSessionClassification.value.interval.map((point) => point.value), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)' }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.buckets,
    previewDatasets: [
      { label: t('zone2'), data: [2, 3, 2, 2], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)' },
      { label: t('zone3'), data: [1, 0, 1, 1], borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)' },
      { label: t('zone4'), data: [0, 1, 1, 0], borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)' },
      { label: t('intervalLabel'), data: [0, 1, 1, 0], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)' }
    ]
  },
  {
    id: 'cycling-session-classification',
    title: t('cyclingSessionsByClassification'),
    subtitle: t('cyclingSessionsByClassificationSubtitle'),
    infoText: t('cyclingSessionsByClassificationInfo'),
    primaryMetric: 'sessionCount',
    variant: 'bar',
    labels: buildSeriesLabels(cyclingSessionClassification.value.zone2),
    datasets: [
      { label: t('zone2'), data: cyclingSessionClassification.value.zone2.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)' },
      { label: t('zone3'), data: cyclingSessionClassification.value.zone3.map((point) => point.value), borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)' },
      { label: t('zone4'), data: cyclingSessionClassification.value.zone4.map((point) => point.value), borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)' },
      { label: t('intervalLabel'), data: cyclingSessionClassification.value.interval.map((point) => point.value), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)' }
    ],
    previewLabels,
    previewPointTitles: previewPointTitles.buckets,
    previewDatasets: [
      { label: t('zone2'), data: [2, 2, 3, 2], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)' },
      { label: t('zone3'), data: [1, 1, 0, 1], borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)' },
      { label: t('zone4'), data: [0, 0, 1, 0], borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)' },
      { label: t('intervalLabel'), data: [0, 1, 1, 1], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)' }
    ]
  },
] satisfies DashboardChartDefinition[])

const visibleCharts = computed(() => chartDefinitions.value.filter((chart) => selectedChartIds.value.includes(chart.id)))

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
  draftChartIds.value = chartDefinitions.value.map((chart) => chart.id)
}

function removeAllDraftCharts() {
  draftChartIds.value = []
}

async function applyChartSelection() {
  const settings = settingsState.data.value?.settings
  if (!settings || isSavingChartSelection.value) {
    return
  }

  const nextChartIds = draftChartIds.value.length ? [...draftChartIds.value] : [...defaultChartIds]
  const payload: SettingsUpdateRequest = {
    ...settings,
    dashboardChartIds: nextChartIds,
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

    <div class="grid-span-12 section-card card stack charts-section-header">
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

    <div
      v-for="chart in visibleCharts"
      :key="chart.id"
      class="grid-span-6"
    >
      <ChartCard
        :title="chart.title"
        :subtitle="chart.subtitle"
        :info-text="chart.infoText"
        :variant="chart.variant"
        :primary-metric="chart.primaryMetric"
        :secondary-metric="chart.secondaryMetric"
        :invert-primary-axis="chart.invertPrimaryAxis"
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
          <p class="section-subtitle">Preview all available dashboard charts with mock data, choose the ones you want, then apply your selection.</p>
        </div>

        <div class="chart-editor-grid">
          <div
            v-for="chart in chartDefinitions"
            :key="`editor-${chart.id}`"
            class="chart-picker"
            :class="{ 'chart-picker-selected': isDraftSelected(chart.id) }"
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
              :primary-metric="chart.primaryMetric"
              :secondary-metric="chart.secondaryMetric"
              :invert-primary-axis="chart.invertPrimaryAxis"
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

<style scoped>
.charts-section-header {
  position: sticky;
  top: 1rem;
  z-index: 14;
  background:
    linear-gradient(180deg, rgba(255, 253, 249, 0.98), rgba(255, 249, 242, 0.94));
  box-shadow:
    0 20px 44px rgba(53, 38, 18, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
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
    top: 0.85rem;
  }

  .chart-editor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
