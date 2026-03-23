export type SportType = 'running' | 'cycling' | 'swimming'

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
  runningMaxHr: number
  cyclingMaxHr: number
  runningZones: ZoneSettings
  cyclingZones: ZoneSettings
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
  hrZoneLabel: string
  classification: ActivityClassification
  isEasySession: boolean
  isHardSession: boolean
  affectsRunningCounter: boolean
  affectsCyclingCounter: boolean
  createdAt: string
  updatedAt: string
}

export interface ActivityListItem {
  id: number
  sourceActivityId: number
  sport: SportType
  sourceType: string
  name: string
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
  hrZoneLabel: string
  classification: ActivityClassification
  isEasySession: boolean
  isHardSession: boolean
}

export interface CounterSummary {
  sport: Extract<SportType, 'running' | 'cycling'>
  easyStreak: number
  remainingUntilInterval: number
  intervalDue: boolean
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
  zone2: ChartPoint[]
  hrPerformance: ChartPoint[]
}

export interface ConnectionStatusResponse {
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
  syncIntervalMinutes: number
  connectionStatus: ConnectionStatusResponse
}

export interface SettingsUpdateRequest extends AppSettings {
  stravaClientId: string
  stravaClientSecret?: string
}

export interface SyncNowResponse {
  syncStatus: SyncStatus
}
