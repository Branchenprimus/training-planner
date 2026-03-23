import { createError, deleteCookie, getCookie, getQuery, sendRedirect } from 'h3'
import { useRuntimeConfig } from '#imports'
import { connectStravaAccount } from '../../../services/strava/syncService'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
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
    await connectStravaAccount(code)
    return sendRedirect(event, '/auth/callback?status=success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect Strava.'
    return sendRedirect(event, `/auth/callback?status=error&message=${encodeURIComponent(message)}`)
  }
})
