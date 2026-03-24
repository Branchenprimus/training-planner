import { getQuery } from 'h3'
import { DATE_RANGES, type DateRange } from '../../../shared/constants'
import type { ActivityListItem, ChartPoint, MultisportWeeklyDistanceResponse, SportType } from '../../../shared/types'
import { initializeDatabase } from '../../database/bootstrap'
import { getMultisportChartActivities } from '../../repositories/activityRepository'
import { resolveRangeStart } from '../../utils/dateRange'
import { ensureUserScope, resolveCurrentUserEmail } from '../../utils/currentUser'

type SupportedSport = Extract<SportType, 'running' | 'cycling' | 'swimming'>

type WeeklyBucket = {
  date: string
  label: string
  title: string
  activities: ActivityListItem[]
}

const SPORT_ORDER: SupportedSport[] = ['running', 'cycling', 'swimming']

function startOfWeek(dateInput: string | Date): Date {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput)
  const bucket = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = bucket.getUTCDay()
  const offset = day === 0 ? -6 : 1 - day
  bucket.setUTCDate(bucket.getUTCDate() + offset)
  return bucket
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function formatWeekLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date)
}

function buildWeeklyBuckets(startDate: string | undefined, activities: ActivityListItem[]): WeeklyBucket[] {
  if (!startDate && !activities.length) {
    return []
  }

  const firstWeek = startOfWeek(startDate ?? activities[0]!.startDate)
  const lastWeek = startOfWeek(activities.at(-1)?.startDate ?? new Date())
  const buckets = new Map<string, WeeklyBucket>()

  for (let cursor = new Date(firstWeek); cursor <= lastWeek; cursor = addDays(cursor, 7)) {
    const key = cursor.toISOString()
    const label = formatWeekLabel(cursor)
    buckets.set(key, {
      date: key,
      label,
      title: `Week of ${label}`,
      activities: []
    })
  }

  for (const activity of activities) {
    const bucketDate = startOfWeek(activity.startDate)
    const bucket = buckets.get(bucketDate.toISOString())
    if (bucket) {
      bucket.activities.push(activity)
    }
  }

  return [...buckets.values()]
}

function buildSportPoints(buckets: WeeklyBucket[], sport: SupportedSport): ChartPoint[] {
  return buckets.map((bucket) => ({
    date: bucket.date,
    value: Number((bucket.activities
      .filter((activity) => activity.sport === sport)
      .reduce((total, activity) => total + activity.distanceMeters, 0) / 1000).toFixed(2)),
    label: bucket.title
  }))
}

export default defineEventHandler((event): MultisportWeeklyDistanceResponse => {
  const query = getQuery(event)
  const range = (typeof query.range === 'string' && DATE_RANGES.includes(query.range as DateRange) ? query.range : '30d') as DateRange
  const db = initializeDatabase()
  const userEmail = resolveCurrentUserEmail(event)
  ensureUserScope(db, userEmail)
  const startDate = resolveRangeStart(range)
  const activities = getMultisportChartActivities(db, userEmail, SPORT_ORDER, startDate)
  const buckets = buildWeeklyBuckets(startDate, activities)

  return {
    range,
    labels: buckets.map((bucket) => bucket.label),
    pointTitles: buckets.map((bucket) => bucket.title),
    running: buildSportPoints(buckets, 'running'),
    cycling: buildSportPoints(buckets, 'cycling'),
    swimming: buildSportPoints(buckets, 'swimming')
  }
})
