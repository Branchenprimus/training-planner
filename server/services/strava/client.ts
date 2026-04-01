import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { initializeDatabase } from '../../database/bootstrap'
import { getEffectiveStravaCredentials } from '../../repositories/settingsRepository'

export interface StravaTokenResponse {
  token_type: string
  access_token: string
  refresh_token: string
  expires_at: number
  athlete?: {
    id: number
    username: string | null
    firstname: string | null
    lastname: string | null
    profile_medium: string | null
  }
}

export interface StravaActivity {
  id: number
  type: string
  sport_type: string
  name: string
  description?: string | null
  device_name?: string | null
  start_date: string
  timezone: string | null
  elapsed_time: number
  moving_time: number | null
  distance: number
  average_heartrate: number | null
  total_elevation_gain: number | null
  average_speed: number | null
}

interface StravaStream<T> {
  data: T[]
  original_size: number
  resolution: string
  series_type: string
}

export interface StravaActivityStreamsResponse {
  heartrate?: StravaStream<number>
  time?: StravaStream<number>
}

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    const body = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: `Strava request failed: ${body}`
    })
  }

  return await response.json() as T
}

function getRuntimeStravaCredentials(userEmail: string) {
  const config = useRuntimeConfig()
  const db = initializeDatabase()
  const credentials = getEffectiveStravaCredentials(db, userEmail, {
    stravaClientId: config.stravaClientId,
    stravaClientSecret: config.stravaClientSecret,
    stravaRedirectUri: config.stravaRedirectUri
  })

  if (!credentials) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Strava app client ID and client secret are not configured yet.'
    })
  }

  return credentials
}

export async function exchangeCodeForToken(code: string, userEmail: string): Promise<StravaTokenResponse> {
  const credentials = getRuntimeStravaCredentials(userEmail)
  return await fetchJson<StravaTokenResponse>('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      grant_type: 'authorization_code'
    })
  })
}

export async function refreshStravaToken(refreshToken: string, userEmail: string): Promise<StravaTokenResponse> {
  const credentials = getRuntimeStravaCredentials(userEmail)
  return await fetchJson<StravaTokenResponse>('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })
}

export async function fetchStravaActivities(accessToken: string, page: number, perPage: number, after?: number): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage)
  })

  if (after) {
    params.set('after', String(after))
  }

  return await fetchJson<StravaActivity[]>(`https://www.strava.com/api/v3/athlete/activities?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

export async function fetchStravaActivityStreams(accessToken: string, activityId: number): Promise<StravaActivityStreamsResponse> {
  const params = new URLSearchParams({
    keys: 'time,heartrate',
    key_by_type: 'true'
  })

  return await fetchJson<StravaActivityStreamsResponse>(
    `https://www.strava.com/api/v3/activities/${activityId}/streams?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )
}
