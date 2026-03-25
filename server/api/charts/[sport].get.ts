import { createError, getQuery } from 'h3'
import { DATE_RANGES, type DateRange } from '../../../shared/constants'
import { formatDistanceKm, formatDuration, formatHr, formatPerformanceBySport, performanceValueForChart } from '../../../shared/format'
import type { ChartPoint, ChartSeriesResponse, ActivityListItem } from '../../../shared/types'
import { initializeDatabase } from '../../database/bootstrap'
import { computeRelativeEffortBreakdown, getStoredRelativeEffortStreams } from '../../domain/hr'
import { getActivityRawPayloads, getChartActivities } from '../../repositories/activityRepository'
import { getSettings } from '../../repositories/settingsRepository'
import { resolveRangeStart } from '../../utils/dateRange'
import { ensureUserScope, resolveCurrentUserEmail } from '../../utils/currentUser'

type BucketGranularity = 'week' | 'month' | 'year'

type ActivityBucket = {
  key: string
  date: string
  label: string
  title: string
  activities: ActivityListItem[]
}

function getBucketGranularity(range: DateRange): BucketGranularity {
  if (range === 'all') {
    return 'year'
  }

  if (range === '90d') {
    return 'month'
  }

  return 'week'
}

function startOfBucket(dateInput: string, granularity: BucketGranularity): Date {
  const date = new Date(dateInput)

  if (granularity === 'year') {
    return new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  }

  if (granularity === 'month') {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  }

  const day = date.getUTCDay()
  const offset = day === 0 ? -6 : 1 - day
  const bucket = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  bucket.setUTCDate(bucket.getUTCDate() + offset)
  return bucket
}

function bucketLabel(bucketDate: Date, granularity: BucketGranularity): string {
  if (granularity === 'year') {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' }).format(bucketDate)
  }

  if (granularity === 'month') {
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(bucketDate)
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(bucketDate)
}

function bucketTitle(bucketDate: Date, granularity: BucketGranularity): string {
  if (granularity === 'year') {
    return `Year ${bucketLabel(bucketDate, granularity)}`
  }

  if (granularity === 'month') {
    return bucketLabel(bucketDate, granularity)
  }

  return `Week of ${bucketLabel(bucketDate, granularity)}`
}

function bucketedActivities(activities: ActivityListItem[], granularity: BucketGranularity): ActivityBucket[] {
  const buckets = new Map<string, ActivityBucket>()

  for (const activity of activities) {
    const bucketDate = startOfBucket(activity.startDate, granularity)
    const key = bucketDate.toISOString()
    const existing = buckets.get(key)

    if (existing) {
      existing.activities.push(activity)
      continue
    }

    buckets.set(key, {
      key,
      date: key,
      label: bucketLabel(bucketDate, granularity),
      title: bucketTitle(bucketDate, granularity),
      activities: [activity]
    })
  }

  return [...buckets.values()].sort((left, right) => left.date.localeCompare(right.date))
}

function buildBucketPoint(bucket: ActivityBucket, value: number): ChartPoint {
  return {
    date: bucket.date,
    value,
    label: bucket.title
  }
}

export default defineEventHandler((event): ChartSeriesResponse => {
  const sport = event.context.params?.sport
  if (sport !== 'running' && sport !== 'cycling') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid chart sport.' })
  }

  const query = getQuery(event)
  const range = (typeof query.range === 'string' && DATE_RANGES.includes(query.range as DateRange) ? query.range : '30d') as DateRange
  const db = initializeDatabase()
  const userEmail = resolveCurrentUserEmail(event)
  ensureUserScope(db, userEmail)
  const startDate = resolveRangeStart(range)
  const activities = getChartActivities(db, userEmail, sport, startDate)
  const settings = getSettings(db, userEmail)
  const payloads = getActivityRawPayloads(db, activities.map((activity) => activity.id))
  const granularity = getBucketGranularity(range)
  const buckets = bucketedActivities(activities, granularity)
  const relativeEffortBreakdowns = new Map(
    activities.map((activity) => [
      activity.id,
      computeRelativeEffortBreakdown(
        settings,
        activity.sport,
        getStoredRelativeEffortStreams(payloads.get(activity.id) ?? null),
        activity.averageHeartRate,
        activity.durationSeconds
      )
    ])
  )

  return {
    sport,
    range,
    performance: activities
      .filter((activity: ActivityListItem) => performanceValueForChart(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps) !== null)
      .map((activity: ActivityListItem) => ({
        date: activity.startDate,
        value: performanceValueForChart(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps) ?? 0,
        label: activity.name
      })),
    zone2: activities
      .filter((activity: ActivityListItem) => activity.classification === 'zone2')
      .map((activity: ActivityListItem) => ({
        date: activity.startDate,
        value: performanceValueForChart(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps) ?? 0,
        label: activity.name,
        tooltipDetails: [
          `${sport === 'cycling' ? 'Speed' : 'Pace'}: ${formatPerformanceBySport(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps)}`,
          `Duration: ${formatDuration(activity.durationSeconds)}`,
          `Distance: ${formatDistanceKm(activity.distanceMeters)}`,
          `HR: ${formatHr(activity.averageHeartRate)}`
        ]
      })),
    hrPerformance: activities
      .filter((activity: ActivityListItem) => activity.averageHeartRate && performanceValueForChart(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps) !== null)
      .map((activity: ActivityListItem) => ({
        date: activity.startDate,
        value: performanceValueForChart(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps) ?? 0,
        secondaryValue: activity.averageHeartRate,
        label: activity.name
      })),
    relativeEffort: activities
      .filter((activity: ActivityListItem) => activity.relativeEffort !== null)
      .map((activity: ActivityListItem) => ({
        date: activity.startDate,
        value: activity.relativeEffort ?? 0,
        label: activity.name,
        tooltipDetails: [
          `${sport === 'cycling' ? 'Speed' : 'Pace'}: ${formatPerformanceBySport(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps)}`,
          `Duration: ${formatDuration(activity.durationSeconds)}`,
          `Distance: ${formatDistanceKm(activity.distanceMeters)}`,
          `HR: ${formatHr(activity.averageHeartRate)}`
        ]
      })),
    distance: activities
      .filter((activity: ActivityListItem) => activity.distanceMeters > 0)
      .map((activity: ActivityListItem) => ({
        date: activity.startDate,
        value: Number((activity.distanceMeters / 1000).toFixed(2)),
        label: activity.name
      })),
    duration: activities
      .filter((activity: ActivityListItem) => activity.durationSeconds > 0)
      .map((activity: ActivityListItem) => ({
        date: activity.startDate,
        value: Number((activity.durationSeconds / 60).toFixed(1)),
        label: activity.name
      })),
    elevation: activities
      .filter((activity: ActivityListItem) => typeof activity.elevationGainMeters === 'number' && activity.elevationGainMeters > 0)
      .map((activity: ActivityListItem) => ({
        date: activity.startDate,
        value: Number((activity.elevationGainMeters ?? 0).toFixed(0)),
        label: activity.name
      })),
    volumeDistance: buckets.map((bucket) => buildBucketPoint(
      bucket,
      Number((bucket.activities.reduce((total, activity) => total + activity.distanceMeters, 0) / 1000).toFixed(2))
    )),
    volumeDuration: buckets.map((bucket) => buildBucketPoint(
      bucket,
      Number((bucket.activities.reduce((total, activity) => total + activity.durationSeconds, 0) / 60).toFixed(1))
    )),
    longestSession: buckets.map((bucket) => buildBucketPoint(
      bucket,
      Number((Math.max(...bucket.activities.map((activity) => activity.durationSeconds), 0) / 60).toFixed(1))
    )),
    zoneDistribution: {
      zone2: activities.map((activity) => ({
        date: activity.startDate,
        value: Number((((relativeEffortBreakdowns.get(activity.id)?.z2 ?? 0) / 60)).toFixed(1)),
        label: activity.name,
        tooltipDetails: [
          `${sport === 'cycling' ? 'Speed' : 'Pace'}: ${formatPerformanceBySport(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps)}`,
          `Duration: ${formatDuration(activity.durationSeconds)}`,
          `Distance: ${formatDistanceKm(activity.distanceMeters)}`,
          `HR: ${formatHr(activity.averageHeartRate)}`
        ]
      })),
      zone3: activities.map((activity) => ({
        date: activity.startDate,
        value: Number((((relativeEffortBreakdowns.get(activity.id)?.z3 ?? 0) / 60)).toFixed(1)),
        label: activity.name,
        tooltipDetails: [
          `${sport === 'cycling' ? 'Speed' : 'Pace'}: ${formatPerformanceBySport(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps)}`,
          `Duration: ${formatDuration(activity.durationSeconds)}`,
          `Distance: ${formatDistanceKm(activity.distanceMeters)}`,
          `HR: ${formatHr(activity.averageHeartRate)}`
        ]
      })),
      zone4: activities.map((activity) => ({
        date: activity.startDate,
        value: Number((((relativeEffortBreakdowns.get(activity.id)?.z4 ?? 0) / 60)).toFixed(1)),
        label: activity.name,
        tooltipDetails: [
          `${sport === 'cycling' ? 'Speed' : 'Pace'}: ${formatPerformanceBySport(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps)}`,
          `Duration: ${formatDuration(activity.durationSeconds)}`,
          `Distance: ${formatDistanceKm(activity.distanceMeters)}`,
          `HR: ${formatHr(activity.averageHeartRate)}`
        ]
      })),
      interval: activities.map((activity) => ({
        date: activity.startDate,
        value: Number((((relativeEffortBreakdowns.get(activity.id)?.z5 ?? 0) / 60)).toFixed(1)),
        label: activity.name,
        tooltipDetails: [
          `${sport === 'cycling' ? 'Speed' : 'Pace'}: ${formatPerformanceBySport(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps)}`,
          `Duration: ${formatDuration(activity.durationSeconds)}`,
          `Distance: ${formatDistanceKm(activity.distanceMeters)}`,
          `HR: ${formatHr(activity.averageHeartRate)}`
        ]
      }))
    },
    sessionClassification: {
      zone2: buckets.map((bucket) => buildBucketPoint(
        bucket,
        bucket.activities.filter((activity) => activity.classification === 'zone2').length
      )),
      zone3: buckets.map((bucket) => buildBucketPoint(
        bucket,
        bucket.activities.filter((activity) => activity.classification === 'zone3').length
      )),
      zone4: buckets.map((bucket) => buildBucketPoint(
        bucket,
        bucket.activities.filter((activity) => activity.classification === 'zone4').length
      )),
      interval: buckets.map((bucket) => buildBucketPoint(
        bucket,
        bucket.activities.filter((activity) => activity.classification === 'interval').length
      ))
    }
  }
})
