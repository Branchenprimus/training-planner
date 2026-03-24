export type SportType = 'running' | 'cycling' | 'swimming'
export type AppLanguage = 'en' | 'de'
export type DashboardChartId =
  | 'running-zone2'
  | 'cycling-zone2'
  | 'running-hr'
  | 'cycling-hr'
  | 'running-relative-effort'
  | 'cycling-relative-effort'

export type ActivityClassification = 'zone2' | 'zone3' | 'zone4' | 'interval' | 'unclassified'

export interface ZoneRange {
  min: number
  max: number
}

export interface ZoneSettings {
  zone2: ZoneRange
  zone3: ZoneRange
  zone4: ZoneRange
  interval: ZoneRange
}

export interface AppSettings {
  language: AppLanguage
  dashboardChartIds: DashboardChartId[]
  syncIntervalMinutes: number
  runningMaxHr: number
  cyclingMaxHr: number
  runningZones: ZoneSettings
  cyclingZones: ZoneSettings
  runningZone2SessionsBeforeInterval: number
  runningIntervalSessionsInBlock: number
  cyclingZone2SessionsBeforeInterval: number
  cyclingIntervalSessionsInBlock: number
}

export interface StravaAppSettings {
  clientId: string
  hasClientSecret: boolean
  hasConfiguredCredentials: boolean
  redirectUri: string
  callbackDomain: string
}

export interface AthleteProfile {
  id: number
  stravaAthleteId: number
  username: string | null
  firstname: string | null
  lastname: string | null
  profileMedium: string | null
  createdAt: string
  updatedAt: string
}

export interface TokenRecord {
  athleteId: number
  accessToken: string
  refreshToken: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface ActivityRecord {
  id: number
  sourceActivityId: number
  sourceType: string
  sport: SportType
  name: string
  description?: string | null
  startDate: string
  timezone: string | null
  durationSeconds: number
  movingTimeSeconds: number | null
  distanceMeters: number
  averageHeartRate: number | null
  elevationGainMeters: number | null
  averageSpeedMps: number | null
  stravaUrl: string
  rawPayload: string | null
  createdAt: string
  updatedAt: string
}

export interface ActivityAnalysisRecord {
  activityId: number
  formattedPerformance: string
  hrPercentOfMax: number | null
  relativeEffort: number | null
  hrZoneLabel: string
  classification: ActivityClassification
  isEasySession: boolean
  isHardSession: boolean
  affectsRunningCounter: boolean
  affectsCyclingCounter: boolean
  createdAt: string
  updatedAt: string
}

export interface RelativeEffortBreakdown {
  z1: number
  z2: number
  z3: number
  z4: number
  z5: number
  method: 'stream' | 'average'
}

export interface ActivityListItem {
  id: number
  sourceActivityId: number
  sport: SportType
  sourceType: string
  name: string
  description?: string | null
  startDate: string
  durationSeconds: number
  movingTimeSeconds: number | null
  distanceMeters: number
  averageHeartRate: number | null
  elevationGainMeters: number | null
  averageSpeedMps: number | null
  stravaUrl: string
  formattedPerformance: string
  hrPercentOfMax: number | null
  relativeEffort: number | null
  hrZoneLabel: string
  classification: ActivityClassification
  isEasySession: boolean
  isHardSession: boolean
  relativeEffortBreakdown?: RelativeEffortBreakdown | null
}

export interface CounterSummary {
  sport: Extract<SportType, 'running' | 'cycling'>
  easyStreak: number
  remainingUntilInterval: number
  intervalDue: boolean
  easyTarget: number
  intervalTarget: number
  lastResetAt: string | null
}

export interface SyncStatus {
  connected: boolean
  isSyncing: boolean
  lastSyncAt: string | null
  lastSyncStatus: 'idle' | 'success' | 'error'
  lastSyncMessage: string | null
  importedActivities: number
}

export interface DashboardSummary {
  syncStatus: SyncStatus
  counters: CounterSummary[]
  recentActivities: ActivityListItem[]
}

export interface ChartPoint {
  date: string
  value: number
  secondaryValue?: number | null
  label: string
}

export interface ChartSeriesResponse {
  sport: Extract<SportType, 'running' | 'cycling'>
  range: '7d' | '30d' | '90d' | 'all'
  performance: ChartPoint[]
  zone2: ChartPoint[]
  hrPerformance: ChartPoint[]
  relativeEffort: ChartPoint[]
  distance: ChartPoint[]
  duration: ChartPoint[]
  elevation: ChartPoint[]
}

export interface ConnectionStatusResponse {
  userEmail: string
  athlete: AthleteProfile | null
  syncStatus: SyncStatus
}

export interface PaginatedActivitiesResponse {
  sport: SportType
  page: number
  pageSize: number
  total: number
  items: ActivityListItem[]
}

export interface SettingsResponse {
  settings: AppSettings
  stravaApp: StravaAppSettings
  connectionStatus: ConnectionStatusResponse
}

export interface SettingsUpdateRequest extends AppSettings {
  stravaClientId: string
  stravaClientSecret?: string
}

export interface SyncNowResponse {
  syncStatus: SyncStatus
}

export interface DisconnectStravaResponse {
  connectionStatus: ConnectionStatusResponse
}
