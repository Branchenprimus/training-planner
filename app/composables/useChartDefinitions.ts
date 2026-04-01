import type { ComputedRef, Ref } from 'vue'
import type { ChartSeriesResponse, DashboardChartId, MultisportWeeklyDistanceResponse } from '~/shared/types'

type ChartMetric = 'runningPace' | 'cyclingSpeed' | 'relativeEffort' | 'durationMinutes' | 'sessionCount' | 'distanceKm' | 'elevationMeters'
export type ChartScope = 'dashboard' | 'running' | 'cycling'
export type AppChartId =
  | DashboardChartId
  | 'running-elevation'
  | 'cycling-elevation'
  | 'running-distance-duration'
  | 'cycling-distance-duration'

type ChartDataset = {
  label: string
  data: number[]
  borderColor: string
  backgroundColor: string
  borderWidth?: number
  yAxisID?: string
}

export type DashboardChartDefinition = {
  id: AppChartId
  title: string
  subtitle: string
  infoText: string
  scopes: ChartScope[]
  primaryMetric: ChartMetric
  secondaryMetric?: 'heartRate' | 'durationMinutes'
  invertPrimaryAxis?: boolean
  stacked?: boolean
  variant?: 'line' | 'bar'
  tooltipTitleMode?: 'default' | 'point-title-only'
  labels: string[]
  pointTitles?: string[]
  tooltipDetailLines?: string[][]
  datasets: ChartDataset[]
  previewLabels: string[]
  previewPointTitles?: string[]
  previewDatasets: ChartDataset[]
}

type I18nTranslate = (key: string, params?: Record<string, string | number>) => string

type ChartDefinitionOptions = {
  locale: Ref<'en' | 'de'>
  t: I18nTranslate
  runningCharts: Ref<ChartSeriesResponse | null | undefined> | ComputedRef<ChartSeriesResponse | null | undefined>
  cyclingCharts: Ref<ChartSeriesResponse | null | undefined> | ComputedRef<ChartSeriesResponse | null | undefined>
  multisportWeeklyCharts?: Ref<MultisportWeeklyDistanceResponse | null | undefined> | ComputedRef<MultisportWeeklyDistanceResponse | null | undefined>
}

export const FEATURED_CHART_ID: DashboardChartId = 'multisport-weekly-distance'

export function hasChartScope(chart: DashboardChartDefinition, scope: ChartScope) {
  return chart.scopes.includes(scope)
}

function buildDateLabels(locale: Ref<'en' | 'de'>, points: ChartSeriesResponse['zone2']) {
  return points.map((point) => new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(new Date(point.date)))
}

function buildPointTitles(points: ChartSeriesResponse['zone2']) {
  return points.map((point) => point.label)
}

function buildWeekRangeTitle(locale: Ref<'en' | 'de'>, weekStartDate: string) {
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

function buildWeekRangeLabel(locale: Ref<'en' | 'de'>, weekStartDate: string) {
  return buildWeekRangeTitle(locale, weekStartDate).replace(/^Week:\s*/, '')
}

function buildBucketAxisLabels(
  locale: Ref<'en' | 'de'>,
  points: ChartSeriesResponse['zone2'],
  range: ChartSeriesResponse['range'] | undefined
) {
  if (range === '90d' || range === 'all') {
    return points.map((point) => point.label)
  }

  return points.map((point) => buildWeekRangeLabel(locale, point.date))
}

function buildBucketPointTitles(
  locale: Ref<'en' | 'de'>,
  points: ChartSeriesResponse['zone2'],
  range: ChartSeriesResponse['range'] | undefined
) {
  if (range === '90d' || range === 'all') {
    return points.map((point) => point.label)
  }

  return points.map((point) => buildWeekRangeTitle(locale, point.date))
}

export function useChartDefinitions(options: ChartDefinitionOptions) {
  const { locale, t, runningCharts, cyclingCharts, multisportWeeklyCharts } = options

  const runningZone2 = computed(() => runningCharts.value?.zone2 ?? [])
  const cyclingZone2 = computed(() => cyclingCharts.value?.zone2 ?? [])
  const runningHr = computed(() => runningCharts.value?.hrPerformance ?? [])
  const cyclingHr = computed(() => cyclingCharts.value?.hrPerformance ?? [])
  const runningRelativeEffort = computed(() => runningCharts.value?.relativeEffort ?? [])
  const cyclingRelativeEffort = computed(() => cyclingCharts.value?.relativeEffort ?? [])
  const runningZoneDistribution = computed(() => runningCharts.value?.zoneDistribution ?? { zone2: [], zone3: [], zone4: [], interval: [] })
  const cyclingZoneDistribution = computed(() => cyclingCharts.value?.zoneDistribution ?? { zone2: [], zone3: [], zone4: [], interval: [] })
  const runningSessionClassification = computed(() => runningCharts.value?.sessionClassification ?? { zone2: [], zone3: [], zone4: [], interval: [] })
  const cyclingSessionClassification = computed(() => cyclingCharts.value?.sessionClassification ?? { zone2: [], zone3: [], zone4: [], interval: [] })
  const runningDistance = computed(() => runningCharts.value?.distance ?? [])
  const cyclingDistance = computed(() => cyclingCharts.value?.distance ?? [])
  const runningDuration = computed(() => runningCharts.value?.duration ?? [])
  const cyclingDuration = computed(() => cyclingCharts.value?.duration ?? [])
  const runningElevation = computed(() => runningCharts.value?.elevation ?? [])
  const cyclingElevation = computed(() => cyclingCharts.value?.elevation ?? [])
  const multisportWeeklyRunning = computed(() => multisportWeeklyCharts?.value?.running ?? [])
  const multisportWeeklyCycling = computed(() => multisportWeeklyCharts?.value?.cycling ?? [])
  const multisportWeeklySwimming = computed(() => multisportWeeklyCharts?.value?.swimming ?? [])
  const multisportWeeklyLabels = computed(() => multisportWeeklyRunning.value.map((point) => buildWeekRangeLabel(locale, point.date)))
  const multisportWeeklyPointTitles = computed(() => multisportWeeklyRunning.value.map((point) => buildWeekRangeTitle(locale, point.date)))

  const previewLabels = ['Mar 2', 'Mar 9', 'Mar 16', 'Mar 23']
  const previewPointTitles = {
    runningZone2: ['Easy Run Riverside', 'Aerobic Run Park', 'Steady Run Trail', 'Zone 2 Endurance'],
    cyclingZone2: ['Endurance Ride North Loop', 'Steady Ride Canal', 'Coffee Spin South', 'Aerobic Ride Hills'],
    runningHr: ['Tempo Check', 'Cruise Run', 'Progression Run', 'Controlled Workout'],
    cyclingHr: ['Tempo Ride', 'Rolling Route', 'Threshold Build', 'Fast Group Ride'],
    runningRelativeEffort: ['Easy Run', 'Long Run', 'Hill Session', 'Tempo Run'],
    cyclingRelativeEffort: ['Recovery Ride', 'Endurance Ride', 'Climbing Ride', 'Hard Group Ride'],
    buckets: ['Week of Mar 3', 'Week of Mar 10', 'Week of Mar 17', 'Week of Mar 24']
  }

  const chartDefinitions = computed<DashboardChartDefinition[]>(() => [
    {
      id: 'multisport-weekly-distance',
      scopes: ['dashboard'],
      title: t('multisportWeeklyDistance'),
      subtitle: t('multisportWeeklyDistanceSubtitle'),
      infoText: t('multisportWeeklyDistanceInfo'),
      primaryMetric: 'distanceKm',
      tooltipTitleMode: 'point-title-only',
      labels: multisportWeeklyLabels.value,
      pointTitles: multisportWeeklyPointTitles.value,
      datasets: [
        { label: t('running'), data: multisportWeeklyRunning.value.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.18)' },
        { label: t('cycling'), data: multisportWeeklyCycling.value.map((point) => point.value), borderColor: '#c97c2a', backgroundColor: 'rgba(201,124,42,0.18)' },
        { label: t('swimming'), data: multisportWeeklySwimming.value.map((point) => point.value), borderColor: '#2f6fb3', backgroundColor: 'rgba(47,111,179,0.18)' }
      ],
      previewLabels,
      previewPointTitles: ['Week: Mar 2 - Mar 8', 'Week: Mar 9 - Mar 15', 'Week: Mar 16 - Mar 22', 'Week: Mar 23 - Mar 29'],
      previewDatasets: [
        { label: t('running'), data: [18, 26, 31, 24], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.18)' },
        { label: t('cycling'), data: [62, 84, 96, 78], borderColor: '#c97c2a', backgroundColor: 'rgba(201,124,42,0.18)' },
        { label: t('swimming'), data: [2.4, 3.1, 2.7, 3.4], borderColor: '#2f6fb3', backgroundColor: 'rgba(47,111,179,0.18)' }
      ]
    },
    {
      id: 'running-zone2',
      scopes: ['dashboard', 'running'],
      title: t('runningZone2Progress'),
      subtitle: t('runningZone2Subtitle'),
      infoText: t('runningZone2Info'),
      primaryMetric: 'runningPace',
      labels: buildDateLabels(locale, runningZone2.value),
      pointTitles: buildPointTitles(runningZone2.value),
      tooltipDetailLines: runningZone2.value.map((point) => point.tooltipDetails ?? []),
      datasets: [{ label: t('zone2'), data: runningZone2.value.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.2)' }],
      previewLabels,
      previewPointTitles: previewPointTitles.runningZone2,
      previewDatasets: [{ label: t('zone2'), data: [5.62, 5.48, 5.36, 5.28], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.2)' }]
    },
    {
      id: 'cycling-zone2',
      scopes: ['dashboard', 'cycling'],
      title: t('cyclingZone2Progress'),
      subtitle: t('cyclingZone2Subtitle'),
      infoText: t('cyclingZone2Info'),
      primaryMetric: 'cyclingSpeed',
      labels: buildDateLabels(locale, cyclingZone2.value),
      pointTitles: buildPointTitles(cyclingZone2.value),
      tooltipDetailLines: cyclingZone2.value.map((point) => point.tooltipDetails ?? []),
      datasets: [{ label: t('zone2'), data: cyclingZone2.value.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.2)' }],
      previewLabels,
      previewPointTitles: previewPointTitles.cyclingZone2,
      previewDatasets: [{ label: t('zone2'), data: [24.8, 25.5, 26.1, 26.4], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.2)' }]
    },
    {
      id: 'running-hr',
      scopes: ['dashboard', 'running'],
      title: t('runningHrVsPace'),
      subtitle: t('chronologicalView', { metric: t('paceLabel').toLowerCase() }),
      infoText: t('runningHrVsPaceInfo'),
      primaryMetric: 'runningPace',
      secondaryMetric: 'heartRate',
      invertPrimaryAxis: true,
      labels: buildDateLabels(locale, runningHr.value),
      pointTitles: buildPointTitles(runningHr.value),
      datasets: [
        { label: t('paceLabel'), data: runningHr.value.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.2)' },
        { label: t('hrLabel'), data: runningHr.value.map((point) => point.secondaryValue ?? 0), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.2)', yAxisID: 'y1' }
      ],
      previewLabels,
      previewPointTitles: previewPointTitles.runningHr,
      previewDatasets: [
        { label: t('paceLabel'), data: [5.26, 5.18, 5.12, 5.03], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.2)' },
        { label: t('hrLabel'), data: [145, 148, 151, 154], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.2)', yAxisID: 'y1' }
      ]
    },
    {
      id: 'cycling-hr',
      scopes: ['dashboard', 'cycling'],
      title: t('cyclingHrVsSpeed'),
      subtitle: t('chronologicalView', { metric: t('speedLabel').toLowerCase() }),
      infoText: t('cyclingHrVsSpeedInfo'),
      primaryMetric: 'cyclingSpeed',
      secondaryMetric: 'heartRate',
      labels: buildDateLabels(locale, cyclingHr.value),
      pointTitles: buildPointTitles(cyclingHr.value),
      datasets: [
        { label: t('speedLabel'), data: cyclingHr.value.map((point) => point.value), borderColor: '#c97c2a', backgroundColor: 'rgba(201,124,42,0.2)' },
        { label: t('hrLabel'), data: cyclingHr.value.map((point) => point.secondaryValue ?? 0), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.2)', yAxisID: 'y1' }
      ],
      previewLabels,
      previewPointTitles: previewPointTitles.cyclingHr,
      previewDatasets: [
        { label: t('speedLabel'), data: [27.2, 28.1, 29.4, 30.1], borderColor: '#c97c2a', backgroundColor: 'rgba(201,124,42,0.2)' },
        { label: t('hrLabel'), data: [138, 142, 149, 153], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.2)', yAxisID: 'y1' }
      ]
    },
    {
      id: 'running-relative-effort',
      scopes: ['dashboard', 'running'],
      title: t('runningRelativeEffort'),
      subtitle: t('runningRelativeEffortSubtitle'),
      infoText: t('runningRelativeEffortInfo'),
      primaryMetric: 'relativeEffort',
      variant: 'bar',
      labels: buildDateLabels(locale, runningRelativeEffort.value),
      pointTitles: buildPointTitles(runningRelativeEffort.value),
      tooltipDetailLines: runningRelativeEffort.value.map((point) => point.tooltipDetails ?? []),
      datasets: [{ label: t('intensityLabel'), data: runningRelativeEffort.value.map((point) => point.value), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.18)' }],
      previewLabels,
      previewPointTitles: previewPointTitles.runningRelativeEffort,
      previewDatasets: [{ label: t('intensityLabel'), data: [22, 35, 48, 58], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.18)' }]
    },
    {
      id: 'cycling-relative-effort',
      scopes: ['dashboard', 'cycling'],
      title: t('cyclingRelativeEffort'),
      subtitle: t('cyclingRelativeEffortSubtitle'),
      infoText: t('cyclingRelativeEffortInfo'),
      primaryMetric: 'relativeEffort',
      variant: 'bar',
      labels: buildDateLabels(locale, cyclingRelativeEffort.value),
      pointTitles: buildPointTitles(cyclingRelativeEffort.value),
      tooltipDetailLines: cyclingRelativeEffort.value.map((point) => point.tooltipDetails ?? []),
      datasets: [{ label: t('intensityLabel'), data: cyclingRelativeEffort.value.map((point) => point.value), borderColor: '#a63c33', backgroundColor: 'rgba(166,60,51,0.18)' }],
      previewLabels,
      previewPointTitles: previewPointTitles.cyclingRelativeEffort,
      previewDatasets: [{ label: t('intensityLabel'), data: [18, 31, 44, 62], borderColor: '#a63c33', backgroundColor: 'rgba(166,60,51,0.18)' }]
    },
    {
      id: 'running-zone-distribution',
      scopes: ['dashboard', 'running'],
      title: t('runningZoneDistribution'),
      subtitle: t('runningZoneDistributionSubtitle'),
      infoText: t('runningZoneDistributionInfo'),
      primaryMetric: 'durationMinutes',
      variant: 'bar',
      stacked: true,
      labels: buildDateLabels(locale, runningZoneDistribution.value.zone2),
      pointTitles: buildPointTitles(runningZoneDistribution.value.zone2),
      tooltipDetailLines: runningZoneDistribution.value.zone2.map((point) => point.tooltipDetails ?? []),
      datasets: [
        { label: t('zone2'), data: runningZoneDistribution.value.zone2.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)', borderWidth: 1 },
        { label: t('zone3'), data: runningZoneDistribution.value.zone3.map((point) => point.value), borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)', borderWidth: 1 },
        { label: t('zone4'), data: runningZoneDistribution.value.zone4.map((point) => point.value), borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)', borderWidth: 1 },
        { label: t('intervalLabel'), data: runningZoneDistribution.value.interval.map((point) => point.value), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)', borderWidth: 1 }
      ],
      previewLabels,
      previewPointTitles: previewPointTitles.buckets,
      previewDatasets: [
        { label: t('zone2'), data: [84, 96, 102, 88], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)', borderWidth: 1 },
        { label: t('zone3'), data: [18, 22, 28, 20], borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)', borderWidth: 1 },
        { label: t('zone4'), data: [8, 0, 14, 10], borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)', borderWidth: 1 },
        { label: t('intervalLabel'), data: [0, 12, 8, 0], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)', borderWidth: 1 }
      ]
    },
    {
      id: 'cycling-zone-distribution',
      scopes: ['dashboard', 'cycling'],
      title: t('cyclingZoneDistribution'),
      subtitle: t('cyclingZoneDistributionSubtitle'),
      infoText: t('cyclingZoneDistributionInfo'),
      primaryMetric: 'durationMinutes',
      variant: 'bar',
      stacked: true,
      labels: buildDateLabels(locale, cyclingZoneDistribution.value.zone2),
      pointTitles: buildPointTitles(cyclingZoneDistribution.value.zone2),
      tooltipDetailLines: cyclingZoneDistribution.value.zone2.map((point) => point.tooltipDetails ?? []),
      datasets: [
        { label: t('zone2'), data: cyclingZoneDistribution.value.zone2.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)', borderWidth: 1 },
        { label: t('zone3'), data: cyclingZoneDistribution.value.zone3.map((point) => point.value), borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)', borderWidth: 1 },
        { label: t('zone4'), data: cyclingZoneDistribution.value.zone4.map((point) => point.value), borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)', borderWidth: 1 },
        { label: t('intervalLabel'), data: cyclingZoneDistribution.value.interval.map((point) => point.value), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)', borderWidth: 1 }
      ],
      previewLabels,
      previewPointTitles: previewPointTitles.buckets,
      previewDatasets: [
        { label: t('zone2'), data: [110, 124, 138, 132], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)', borderWidth: 1 },
        { label: t('zone3'), data: [24, 36, 28, 22], borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)', borderWidth: 1 },
        { label: t('zone4'), data: [0, 18, 20, 14], borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)', borderWidth: 1 },
        { label: t('intervalLabel'), data: [0, 10, 16, 8], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)', borderWidth: 1 }
      ]
    },
    {
      id: 'running-session-classification',
      scopes: ['dashboard', 'running'],
      title: t('runningSessionsByClassification'),
      subtitle: t('runningSessionsByClassificationSubtitle'),
      infoText: t('runningSessionsByClassificationInfo'),
      primaryMetric: 'sessionCount',
      variant: 'bar',
      tooltipTitleMode: 'point-title-only',
      labels: buildBucketAxisLabels(locale, runningSessionClassification.value.zone2, runningCharts.value?.range),
      pointTitles: buildBucketPointTitles(locale, runningSessionClassification.value.zone2, runningCharts.value?.range),
      datasets: [
        { label: t('zone2'), data: runningSessionClassification.value.zone2.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)' },
        { label: t('zone3'), data: runningSessionClassification.value.zone3.map((point) => point.value), borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)' },
        { label: t('zone4'), data: runningSessionClassification.value.zone4.map((point) => point.value), borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)' },
        { label: t('intervalLabel'), data: runningSessionClassification.value.interval.map((point) => point.value), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)' }
      ],
      previewLabels: ['Mar 2 - Mar 8', 'Mar 9 - Mar 15', 'Mar 16 - Mar 22', 'Mar 23 - Mar 29'],
      previewPointTitles: ['Week: Mar 2 - Mar 8', 'Week: Mar 9 - Mar 15', 'Week: Mar 16 - Mar 22', 'Week: Mar 23 - Mar 29'],
      previewDatasets: [
        { label: t('zone2'), data: [2, 3, 2, 2], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)' },
        { label: t('zone3'), data: [1, 0, 1, 1], borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)' },
        { label: t('zone4'), data: [0, 1, 1, 0], borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)' },
        { label: t('intervalLabel'), data: [0, 1, 1, 0], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)' }
      ]
    },
    {
      id: 'cycling-session-classification',
      scopes: ['dashboard', 'cycling'],
      title: t('cyclingSessionsByClassification'),
      subtitle: t('cyclingSessionsByClassificationSubtitle'),
      infoText: t('cyclingSessionsByClassificationInfo'),
      primaryMetric: 'sessionCount',
      variant: 'bar',
      tooltipTitleMode: 'point-title-only',
      labels: buildBucketAxisLabels(locale, cyclingSessionClassification.value.zone2, cyclingCharts.value?.range),
      pointTitles: buildBucketPointTitles(locale, cyclingSessionClassification.value.zone2, cyclingCharts.value?.range),
      datasets: [
        { label: t('zone2'), data: cyclingSessionClassification.value.zone2.map((point) => point.value), borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)' },
        { label: t('zone3'), data: cyclingSessionClassification.value.zone3.map((point) => point.value), borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)' },
        { label: t('zone4'), data: cyclingSessionClassification.value.zone4.map((point) => point.value), borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)' },
        { label: t('intervalLabel'), data: cyclingSessionClassification.value.interval.map((point) => point.value), borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)' }
      ],
      previewLabels: ['Mar 2 - Mar 8', 'Mar 9 - Mar 15', 'Mar 16 - Mar 22', 'Mar 23 - Mar 29'],
      previewPointTitles: ['Week: Mar 2 - Mar 8', 'Week: Mar 9 - Mar 15', 'Week: Mar 16 - Mar 22', 'Week: Mar 23 - Mar 29'],
      previewDatasets: [
        { label: t('zone2'), data: [2, 2, 3, 2], borderColor: '#166534', backgroundColor: 'rgba(22,101,52,0.78)' },
        { label: t('zone3'), data: [1, 1, 0, 1], borderColor: '#8a6a18', backgroundColor: 'rgba(138,106,24,0.78)' },
        { label: t('zone4'), data: [0, 0, 1, 0], borderColor: '#9a551f', backgroundColor: 'rgba(154,85,31,0.78)' },
        { label: t('intervalLabel'), data: [0, 1, 1, 1], borderColor: '#8b2f24', backgroundColor: 'rgba(139,47,36,0.78)' }
      ]
    },
    {
      id: 'running-elevation',
      scopes: ['dashboard', 'running'],
      title: t('runningElevationGain'),
      subtitle: t('runningElevationGainSubtitle'),
      infoText: t('runningElevationGainInfo'),
      primaryMetric: 'elevationMeters',
      labels: buildDateLabels(locale, runningElevation.value),
      pointTitles: buildPointTitles(runningElevation.value),
      datasets: [{ label: t('elevationLabel'), data: runningElevation.value.map((point) => point.value), borderColor: '#8a5b21', backgroundColor: 'rgba(138,91,33,0.2)' }],
      previewLabels,
      previewPointTitles: previewPointTitles.runningZone2,
      previewDatasets: [{ label: t('elevationLabel'), data: [42, 58, 96, 74], borderColor: '#8a5b21', backgroundColor: 'rgba(138,91,33,0.2)' }]
    },
    {
      id: 'cycling-elevation',
      scopes: ['dashboard', 'cycling'],
      title: t('cyclingElevationGain'),
      subtitle: t('cyclingElevationGainSubtitle'),
      infoText: t('cyclingElevationGainInfo'),
      primaryMetric: 'elevationMeters',
      labels: buildDateLabels(locale, cyclingElevation.value),
      pointTitles: buildPointTitles(cyclingElevation.value),
      datasets: [{ label: t('elevationLabel'), data: cyclingElevation.value.map((point) => point.value), borderColor: '#8a5b21', backgroundColor: 'rgba(138,91,33,0.2)' }],
      previewLabels,
      previewPointTitles: previewPointTitles.cyclingZone2,
      previewDatasets: [{ label: t('elevationLabel'), data: [180, 420, 260, 610], borderColor: '#8a5b21', backgroundColor: 'rgba(138,91,33,0.2)' }]
    },
    {
      id: 'running-distance-duration',
      scopes: ['running'],
      title: t('runDistanceVsDuration'),
      subtitle: t('runDistanceVsDurationSubtitle'),
      infoText: t('runDistanceVsDurationInfo'),
      primaryMetric: 'distanceKm',
      secondaryMetric: 'durationMinutes',
      labels: buildDateLabels(locale, runningDistance.value),
      pointTitles: buildPointTitles(runningDistance.value),
      datasets: [
        { label: t('distanceLabel'), data: runningDistance.value.map((point) => point.value), borderColor: '#c97c2a', backgroundColor: 'rgba(201,124,42,0.2)' },
        { label: t('durationLabel'), data: runningDuration.value.map((point) => point.value), borderColor: '#6d614f', backgroundColor: 'rgba(109,97,79,0.2)', yAxisID: 'y1' }
      ],
      previewLabels,
      previewPointTitles: previewPointTitles.runningZone2,
      previewDatasets: [
        { label: t('distanceLabel'), data: [8.2, 10.5, 13.8, 16.1], borderColor: '#c97c2a', backgroundColor: 'rgba(201,124,42,0.2)' },
        { label: t('durationLabel'), data: [46, 58, 76, 91], borderColor: '#6d614f', backgroundColor: 'rgba(109,97,79,0.2)', yAxisID: 'y1' }
      ]
    },
    {
      id: 'cycling-distance-duration',
      scopes: ['cycling'],
      title: t('cyclingDistanceVsDuration'),
      subtitle: t('cyclingDistanceVsDurationSubtitle'),
      infoText: t('cyclingDistanceVsDurationInfo'),
      primaryMetric: 'distanceKm',
      secondaryMetric: 'durationMinutes',
      labels: buildDateLabels(locale, cyclingDistance.value),
      pointTitles: buildPointTitles(cyclingDistance.value),
      datasets: [
        { label: t('distanceLabel'), data: cyclingDistance.value.map((point) => point.value), borderColor: '#c97c2a', backgroundColor: 'rgba(201,124,42,0.2)' },
        { label: t('durationLabel'), data: cyclingDuration.value.map((point) => point.value), borderColor: '#6d614f', backgroundColor: 'rgba(109,97,79,0.2)', yAxisID: 'y1' }
      ],
      previewLabels,
      previewPointTitles: previewPointTitles.cyclingZone2,
      previewDatasets: [
        { label: t('distanceLabel'), data: [28, 41, 56, 72], borderColor: '#c97c2a', backgroundColor: 'rgba(201,124,42,0.2)' },
        { label: t('durationLabel'), data: [62, 88, 118, 146], borderColor: '#6d614f', backgroundColor: 'rgba(109,97,79,0.2)', yAxisID: 'y1' }
      ]
    }
  ])

  return {
    chartDefinitions
  }
}
