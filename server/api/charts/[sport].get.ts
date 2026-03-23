import { createError, getQuery } from 'h3'
import { DATE_RANGES, type DateRange } from '../../../shared/constants'
import { performanceValueForChart } from '../../../shared/format'
import type { ChartSeriesResponse, ActivityListItem } from '../../../shared/types'
import { initializeDatabase } from '../../database/bootstrap'
import { getChartActivities } from '../../repositories/activityRepository'
import { resolveRangeStart } from '../../utils/dateRange'

export default defineEventHandler((event): ChartSeriesResponse => {
  const sport = event.context.params?.sport
  if (sport !== 'running' && sport !== 'cycling') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid chart sport.' })
  }

  const query = getQuery(event)
  const range = (typeof query.range === 'string' && DATE_RANGES.includes(query.range as DateRange) ? query.range : '30d') as DateRange
  const db = initializeDatabase()
  const startDate = resolveRangeStart(range)
  const activities = getChartActivities(db, sport, startDate)

  return {
    sport,
    range,
    zone2: activities
      .filter((activity: ActivityListItem) => activity.classification === 'zone2')
      .map((activity: ActivityListItem) => ({
        date: activity.startDate,
        value: performanceValueForChart(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps) ?? 0,
        label: activity.name
      })),
    hrPerformance: activities
      .filter((activity: ActivityListItem) => activity.averageHeartRate && performanceValueForChart(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps) !== null)
      .map((activity: ActivityListItem) => ({
        date: activity.startDate,
        value: performanceValueForChart(activity.sport, activity.distanceMeters, activity.durationSeconds, activity.averageSpeedMps) ?? 0,
        secondaryValue: activity.averageHeartRate,
        label: activity.name
      }))
  }
})
