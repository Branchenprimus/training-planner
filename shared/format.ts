import type { SportType } from './types'

export type ChartMetric =
  | 'runningPace'
  | 'cyclingSpeed'
  | 'swimmingPace'
  | 'heartRate'
  | 'relativeEffort'
  | 'distanceKm'
  | 'durationMinutes'
  | 'sessionCount'
  | 'elevationMeters'

function formatPaceValue(totalSeconds: number, suffix: '/km' | '/100m'): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return 'n/a'
  }

  const roundedSeconds = Math.round(totalSeconds)
  const minutes = Math.floor(roundedSeconds / 60)
  const seconds = roundedSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')} ${suffix}`
}

export function formatDistanceKm(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(distanceMeters >= 10000 ? 1 : 2)} km`
}

export function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600)
  const minutes = Math.floor((durationSeconds % 3600) / 60)
  const seconds = durationSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatElevation(meters: number | null): string {
  if (meters === null || Number.isNaN(meters)) {
    return 'n/a'
  }

  return `${Math.round(meters)} m`
}

export function formatLocalizedDate(date: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date))
}

export function formatHr(hr: number | null): string {
  if (!hr || hr <= 0) {
    return 'n/a'
  }

  return `${Math.round(hr)} bpm`
}

export function formatRelativeEffort(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return 'n/a'
  }

  return `${Math.round(value)}`
}

export function formatPerformanceBySport(sport: SportType, distanceMeters: number, durationSeconds: number, averageSpeedMps: number | null): string {
  if (sport === 'cycling') {
    const speedKmh = averageSpeedMps ? averageSpeedMps * 3.6 : durationSeconds > 0 ? (distanceMeters / durationSeconds) * 3.6 : 0
    if (!speedKmh || Number.isNaN(speedKmh)) {
      return 'n/a'
    }

    return `${speedKmh.toFixed(1)} km/h`
  }

  if (sport === 'swimming') {
    if (distanceMeters <= 0) {
      return 'n/a'
    }

    const secondsPer100m = durationSeconds / (distanceMeters / 100)
    return formatPaceValue(secondsPer100m, '/100m')
  }

  if (distanceMeters <= 0) {
    return 'n/a'
  }

  const secondsPerKm = durationSeconds / (distanceMeters / 1000)
  return formatPaceValue(secondsPerKm, '/km')
}

export function performanceValueForChart(sport: SportType, distanceMeters: number, durationSeconds: number, averageSpeedMps: number | null): number | null {
  if (distanceMeters <= 0 || durationSeconds <= 0) {
    return null
  }

  if (sport === 'cycling') {
    const speedKmh = averageSpeedMps ? averageSpeedMps * 3.6 : (distanceMeters / durationSeconds) * 3.6
    return Number.isFinite(speedKmh) ? Number(speedKmh.toFixed(2)) : null
  }

  if (sport === 'swimming') {
    const secondsPer100m = durationSeconds / (distanceMeters / 100)
    return Number.isFinite(secondsPer100m) ? Number(secondsPer100m.toFixed(2)) : null
  }

  const secondsPerKm = durationSeconds / (distanceMeters / 1000)
  return Number.isFinite(secondsPerKm) ? Number(secondsPerKm.toFixed(2)) : null
}

export function performanceAxisLabel(sport: SportType): string {
  if (sport === 'cycling') {
    return 'Speed (km/h)'
  }

  if (sport === 'swimming') {
    return 'Pace (min/100m)'
  }

  return 'Pace (min/km)'
}

export function chartMetricAxisLabel(metric: ChartMetric): string {
  if (metric === 'cyclingSpeed') {
    return 'Speed (km/h)'
  }

  if (metric === 'distanceKm') {
    return 'Distance (km)'
  }

  if (metric === 'relativeEffort') {
    return 'Relative Effort'
  }

  if (metric === 'durationMinutes') {
    return 'Duration (min)'
  }

  if (metric === 'sessionCount') {
    return 'Sessions'
  }

  if (metric === 'elevationMeters') {
    return 'Elevation Gain (m)'
  }

  if (metric === 'swimmingPace') {
    return 'Pace (min/100m)'
  }

  if (metric === 'heartRate') {
    return 'Heart Rate (bpm)'
  }

  return 'Pace (min/km)'
}

export function formatChartMetricValue(metric: ChartMetric, value: number): string {
  if (metric === 'cyclingSpeed') {
    return `${value.toFixed(1)} km/h`
  }

  if (metric === 'distanceKm') {
    return `${value.toFixed(value >= 10 ? 1 : 2)} km`
  }

  if (metric === 'relativeEffort') {
    return `${Math.round(value)}`
  }

  if (metric === 'durationMinutes') {
    return `${Math.round(value)} min`
  }

  if (metric === 'sessionCount') {
    return `${Math.round(value)}`
  }

  if (metric === 'elevationMeters') {
    return `${Math.round(value)} m`
  }

  if (metric === 'swimmingPace') {
    return formatPaceValue(value, '/100m')
  }

  if (metric === 'heartRate') {
    return `${Math.round(value)} bpm`
  }

  return formatPaceValue(value, '/km')
}
