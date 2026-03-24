import { createError, getQuery } from 'h3'
import { initializeDatabase } from '../../database/bootstrap'
import { getActivitiesBySport } from '../../repositories/activityRepository'
import type { PaginatedActivitiesResponse, SportType } from '../../../shared/types'
import { ensureUserScope, resolveCurrentUserEmail } from '../../utils/currentUser'

const SPORTS: SportType[] = ['running', 'cycling', 'swimming']

export default defineEventHandler((event): PaginatedActivitiesResponse => {
  const sport = event.context.params?.sport as SportType | undefined
  if (!sport || !SPORTS.includes(sport)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid sport.' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page ?? 1))
  const pageSize = Math.min(365, Math.max(1, Number(query.pageSize ?? 20)))
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const db = initializeDatabase()
  const userEmail = resolveCurrentUserEmail(event)
  ensureUserScope(db, userEmail)
  const result = getActivitiesBySport(db, userEmail, sport, page, pageSize, oneYearAgo.toISOString())

  return {
    sport,
    page,
    pageSize,
    total: result.total,
    items: result.items
  }
})
