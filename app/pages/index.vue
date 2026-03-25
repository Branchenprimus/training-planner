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
  tooltipTitleMode?: 'default' | 'point-title-only'
  labels: string[]
  pointTitles?: string[]
  tooltipDetailLines?: string[][]
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
const FEATURED_CHART_ID: DashboardChartId = 'multisport-weekly-distance'

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

function buildDateLabels(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(new Date(point.date)))
}

function buildPointTitles(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => point.label)
}

function buildSeriesLabels(points: { label: string }[]) {
  return points.map((point) => point.label)
}

function buildWeekRangeTitle(weekStartDate: string) {
  const start = new Date(weekStartDate)
  const end = new Date(weekStartDate)
  end.setUTCDate(end.getUTCDate() + 6)

  if (locale.value === 'de') {
    const startDay = new Intl.DateTimeFormat('de-DE', { day: 'numeric', timeZone: 'UTC' }).format(start)
    const endFormatted = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(end)
    return `Week: ${startDay}. - ${endFormatted}`
  }

  const startFormatted = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(start)
  const endFormatted = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(end)
  return `Week: ${startFormatted} - ${endFormatted}`
}

function buildWeekRangeLabel(weekStartDate: string) {
  return buildWeekRangeTitle(weekStartDate).replace(/^Week:\s*/, '')
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
const multisportWeeklyLabels = computed(() => multisportWeeklyRunning.value.map((point) => buildWeekRangeLabel(point.date)))
const multisportWeeklyPointTitles = computed(() => multisportWeeklyRunning.value.map((point) => buildWeekRangeTitle(point.date)))

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
    id: 'multisport-weekly-distance',
    title: t('multisportWeeklyDistance'),
    subtitle: t('multisportWeeklyDistanceSubtitle'),
    infoText: t('multisportWeeklyDistanceInfo'),
    primaryMetric: 'distanceKm',
    tooltipTitleMode: 'point-title-only',
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
    previewPointTitles: [
      'Week: Mar 2 - Mar 8',
      'Week: Mar 9 - Mar 15',
      'Week: Mar 16 - Mar 22',
      'Week: Mar 23 - Mar 29'
    ],
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
    id: 'running-zone2',
    title: t('runningZone2Progress'),
    subtitle: t('runningZone2Subtitle'),
    infoText: t('runningZone2Info'),
    primaryMetric: 'runningPace',
    labels: buildDateLabels(runningZone2.value),
    pointTitles: buildPointTitles(runningZone2.value),
    tooltipDetailLines: runningZone2.value.map((point) => point.tooltipDetails ?? []),
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
    tooltipDetailLines: cyclingZone2.value.map((point) => point.tooltipDetails ?? []),
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
    tooltipDetailLines: runningRelativeEffort.value.map((point) => point.tooltipDetails ?? []),
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
    tooltipDetailLines: cyclingRelativeEffort.value.map((point) => point.tooltipDetails ?? []),
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
    labels: buildDateLabels(runningZoneDistribution.value.zone2),
    pointTitles: buildPointTitles(runningZoneDistribution.value.zone2),
    tooltipDetailLines: runningZoneDistribution.value.zone2.map((point) => point.tooltipDetails ?? []),
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
    labels: buildDateLabels(cyclingZoneDistribution.value.zone2),
    pointTitles: buildPointTitles(cyclingZoneDistribution.value.zone2),
    tooltipDetailLines: cyclingZoneDistribution.value.zone2.map((point) => point.tooltipDetails ?? []),
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

const visibleCharts = computed(() => {
  return [...chartDefinitions.value]
    .filter((chart) => selectedChartIds.value.includes(chart.id))
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
                v-for="chart in chartDefinitions"
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
