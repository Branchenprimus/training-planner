import { createError, deleteCookie, getCookie, getQuery, sendRedirect } from 'h3'
import { useRuntimeConfig } from '#imports'
import { initializeDatabase } from '../../../database/bootstrap'
import { connectStravaAccount } from '../../../services/strava/syncService'
import { ensureUserScope, resolveCurrentUserEmail } from '../../../utils/currentUser'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const userEmail = resolveCurrentUserEmail(event)
  const db = initializeDatabase()
  ensureUserScope(db, userEmail)
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''
  const cookieState = getCookie(event, config.sessionCookieName)

  if (!code || !state || !cookieState || state !== cookieState) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid OAuth state.'
    })
  }

  deleteCookie(event, config.sessionCookieName, { path: '/' })

  try {
    await connectStravaAccount(code, userEmail)
    return sendRedirect(event, '/')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect Strava.'
    return sendRedirect(event, `/strava-setup?status=error&message=${encodeURIComponent(message)}`)
  }
})
