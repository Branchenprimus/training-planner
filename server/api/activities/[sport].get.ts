import { createError, getQuery } from 'h3'
import { initializeDatabase } from '../../database/bootstrap'
import { getActivitiesBySport } from '../../repositories/activityRepository'
import type { PaginatedActivitiesResponse, SportType } from '../../../shared/types'

const SPORTS: SportType[] = ['running', 'cycling', 'swimming']

export default defineEventHandler((event): PaginatedActivitiesResponse => {
  const sport = event.context.params?.sport as SportType | undefined
  if (!sport || !SPORTS.includes(sport)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid sport.' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize ?? 20)))

  const db = initializeDatabase()
  const result = getActivitiesBySport(db, sport, page, pageSize)

  return {
    sport,
    page,
    pageSize,
    total: result.total,
    items: result.items
  }
})
