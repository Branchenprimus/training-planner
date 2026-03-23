import type Database from 'better-sqlite3'
import type { AthleteProfile, TokenRecord } from '../../shared/types'

interface AthleteUpsertInput {
  stravaAthleteId: number
  username: string | null
  firstname: string | null
  lastname: string | null
  profileMedium: string | null
}

interface TokenUpsertInput {
  athleteId: number
  accessToken: string
  refreshToken: string
  expiresAt: string
}

function mapAthlete(row: Record<string, unknown>): AthleteProfile {
  return {
    id: Number(row.id),
    stravaAthleteId: Number(row.strava_athlete_id),
    username: (row.username as string | null) ?? null,
    firstname: (row.firstname as string | null) ?? null,
    lastname: (row.lastname as string | null) ?? null,
    profileMedium: (row.profile_medium as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  }
}

function mapToken(row: Record<string, unknown>): TokenRecord {
  return {
    athleteId: Number(row.athlete_id),
    accessToken: String(row.access_token),
    refreshToken: String(row.refresh_token),
    expiresAt: String(row.expires_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  }
}

export function upsertAthlete(db: Database.Database, input: AthleteUpsertInput): AthleteProfile {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO athletes (strava_athlete_id, username, firstname, lastname, profile_medium, created_at, updated_at)
    VALUES (@stravaAthleteId, @username, @firstname, @lastname, @profileMedium, @now, @now)
    ON CONFLICT(strava_athlete_id) DO UPDATE SET
      username = excluded.username,
      firstname = excluded.firstname,
      lastname = excluded.lastname,
      profile_medium = excluded.profile_medium,
      updated_at = excluded.updated_at
  `).run({ ...input, now })

  const row = db.prepare('SELECT * FROM athletes WHERE strava_athlete_id = ?').get(input.stravaAthleteId) as Record<string, unknown>
  return mapAthlete(row)
}

export function getAthlete(db: Database.Database): AthleteProfile | null {
  const row = db.prepare('SELECT * FROM athletes ORDER BY id LIMIT 1').get() as Record<string, unknown> | undefined
  return row ? mapAthlete(row) : null
}

export function upsertToken(db: Database.Database, input: TokenUpsertInput): TokenRecord {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO oauth_tokens (athlete_id, access_token, refresh_token, expires_at, created_at, updated_at)
    VALUES (@athleteId, @accessToken, @refreshToken, @expiresAt, @now, @now)
    ON CONFLICT(athlete_id) DO UPDATE SET
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at,
      updated_at = excluded.updated_at
  `).run({ ...input, now })

  const row = db.prepare('SELECT * FROM oauth_tokens WHERE athlete_id = ?').get(input.athleteId) as Record<string, unknown>
  return mapToken(row)
}

export function getToken(db: Database.Database): TokenRecord | null {
  const row = db.prepare('SELECT * FROM oauth_tokens ORDER BY athlete_id LIMIT 1').get() as Record<string, unknown> | undefined
  return row ? mapToken(row) : null
}
