import { z } from 'zod'

const zoneSchema = z.object({
  min: z.number().min(1).max(100),
  max: z.number().min(1).max(100)
}).refine((value) => value.min <= value.max, 'Zone minimum must be less than or equal to maximum.')

export const appSettingsSchema = z.object({
  language: z.enum(['en', 'de']),
  dashboardChartIds: z.array(z.enum([
    'running-zone2',
    'cycling-zone2',
    'multisport-weekly-distance',
    'running-hr',
    'cycling-hr',
    'running-relative-effort',
    'cycling-relative-effort',
    'running-zone-distribution',
    'cycling-zone-distribution',
    'running-session-classification',
    'cycling-session-classification'
  ])),
  syncIntervalMinutes: z.number().int().min(5).max(1440),
  runningMaxHr: z.number().int().min(100).max(240),
  cyclingMaxHr: z.number().int().min(100).max(240),
  runningZones: z.object({
    zone2: zoneSchema,
    zone3: zoneSchema,
    zone4: zoneSchema,
    interval: zoneSchema
  }),
  cyclingZones: z.object({
    zone2: zoneSchema,
    zone3: zoneSchema,
    zone4: zoneSchema,
    interval: zoneSchema
  }),
  runningZone2SessionsBeforeInterval: z.number().int().min(1).max(30),
  runningIntervalSessionsInBlock: z.number().int().min(1).max(10),
  cyclingZone2SessionsBeforeInterval: z.number().int().min(1).max(30),
  cyclingIntervalSessionsInBlock: z.number().int().min(1).max(10)
})

export const settingsSchema = appSettingsSchema.extend({
  stravaClientId: z.string().trim().max(100).optional().or(z.literal('')),
  stravaClientSecret: z.string().trim().max(200).optional().or(z.literal(''))
})
