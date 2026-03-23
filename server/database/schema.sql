CREATE TABLE IF NOT EXISTS athletes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strava_athlete_id INTEGER NOT NULL UNIQUE,
  username TEXT,
  firstname TEXT,
  lastname TEXT,
  profile_medium TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  athlete_id INTEGER PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  athlete_id INTEGER NOT NULL,
  source_activity_id INTEGER NOT NULL UNIQUE,
  source_type TEXT NOT NULL,
  sport TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  timezone TEXT,
  duration_seconds INTEGER NOT NULL,
  moving_time_seconds INTEGER,
  distance_meters REAL NOT NULL,
  average_heart_rate REAL,
  elevation_gain_meters REAL,
  average_speed_mps REAL,
  strava_url TEXT NOT NULL,
  raw_payload TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_sport_date ON activities (sport, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_athlete_date ON activities (athlete_id, start_date DESC);

CREATE TABLE IF NOT EXISTS activity_analysis (
  activity_id INTEGER PRIMARY KEY,
  formatted_performance TEXT NOT NULL,
  hr_percent_of_max REAL,
  hr_zone_label TEXT NOT NULL,
  classification TEXT NOT NULL,
  is_easy_session INTEGER NOT NULL DEFAULT 0,
  is_hard_session INTEGER NOT NULL DEFAULT 0,
  affects_running_counter INTEGER NOT NULL DEFAULT 0,
  affects_cycling_counter INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  connected INTEGER NOT NULL DEFAULT 0,
  is_syncing INTEGER NOT NULL DEFAULT 0,
  last_sync_at TEXT,
  last_sync_status TEXT NOT NULL DEFAULT 'idle',
  last_sync_message TEXT,
  imported_activities INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
