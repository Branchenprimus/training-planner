import type { AppSettings, SportType } from './types'

export const SPORTS: { label: string; value: SportType }[] = [
  { label: 'Running', value: 'running' },
  { label: 'Cycling', value: 'cycling' },
  { label: 'Swimming', value: 'swimming' }
]

export const DATE_RANGES = ['7d', '30d', '90d', 'all'] as const

export type DateRange = (typeof DATE_RANGES)[number]

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  runningMaxHr: 190,
  cyclingMaxHr: 180,
  runningZones: {
    zone2: { min: 70, max: 80 },
    zone3: { min: 81, max: 87 },
    zone4: { min: 88, max: 93 },
    interval: { min: 94, max: 100 }
  },
  cyclingZones: {
    zone2: { min: 65, max: 75 },
    zone3: { min: 76, max: 84 },
    zone4: { min: 85, max: 90 },
    interval: { min: 91, max: 100 }
  },
  zone2SessionsBeforeInterval: 9,
  intervalSessionsInBlock: 1
}
