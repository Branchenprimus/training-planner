import { randomBytes } from 'node:crypto'
import { createError, setCookie, sendRedirect } from 'h3'
import { useRuntimeConfig } from '#imports'
import { initializeDatabase } from '../../../database/bootstrap'
import { getEffectiveStravaCredentials } from '../../../repositories/settingsRepository'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const db = initializeDatabase()
  const credentials = getEffectiveStravaCredentials(db, {
    stravaClientId: config.stravaClientId,
    stravaClientSecret: config.stravaClientSecret,
    stravaRedirectUri: config.stravaRedirectUri
  })

  if (!credentials) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Configure your Strava app client ID and client secret in Settings first.'
    })
  }
  const state = randomBytes(16).toString('hex')

  setCookie(event, config.sessionCookieName, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10
  })

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    response_type: 'code',
    redirect_uri: config.stravaRedirectUri,
    approval_prompt: 'auto',
    scope: config.stravaScopes,
    state
  })

  return sendRedirect(event, `https://www.strava.com/oauth/authorize?${params.toString()}`)
})
