# Training Planner

Training Planner is a single-user Strava dashboard built for a Raspberry Pi 5 home server. It runs as a Nuxt 3 full-stack app, stores everything in local SQLite, analyzes heart-rate zones for running and cycling, and can be published safely through Cloudflare Tunnel plus Cloudflare Access.

## Stack

- Frontend: Nuxt 3, Vue 3, TypeScript
- Backend: Nuxt server routes with modular TypeScript services
- Database: SQLite via `better-sqlite3`
- Charts: `vue-chartjs` + Chart.js connected line charts
- Deployment: Docker + Docker Compose
- Public access: host-level Cloudflare Tunnel with Cloudflare Access in front

## Features

- Strava OAuth browser login for a single user
- Secure server-side token storage with refresh-token support
- Automatic sync every 30 minutes
- Initial backfill of the last 12 months
- Separate top-level tabs for running, cycling, and swimming
- HR-zone classification by sport using average heart rate
- Independent 9-easy-session counters for running and cycling
- Swimming displayed but excluded from training-counter logic
- Responsive dashboard with progress and HR/performance charts
- Manual sync from the UI
- Settings persisted in SQLite

## Project structure

```text
app/
  components/
  composables/
  pages/
server/
  api/
  database/
  domain/
  repositories/
  services/strava/
  utils/
shared/
scripts/
ops/cloudflared/
```

## Strava app setup

1. Go to https://www.strava.com/settings/api
2. Create a new application.
3. Set the Authorization Callback Domain to the host you will use.
   For local development this is usually `localhost`.
   For Cloudflare exposure this is the public hostname, for example `sports.example.com`.
4. Copy the Client ID and Client Secret into `.env`.
5. Set the redirect URI to:
   `http://localhost:3000/api/auth/strava/callback` for local development, or
   `https://sports.example.com/api/auth/strava/callback` for public deployment.

The app requests these Strava scopes by default:

- `activity:read_all`
- `profile:read_all`

## Environment configuration

Copy the example file and edit it:

```bash
cp .env.example .env
```

Important variables:

- `APP_ORIGIN`: public or local origin for the app
- `NUXT_STRAVA_CLIENT_ID`: Strava client ID
- `NUXT_STRAVA_CLIENT_SECRET`: Strava client secret
- `NUXT_STRAVA_REDIRECT_URI`: exact callback URL registered with Strava
- `NUXT_SQLITE_PATH`: SQLite database path inside the container or locally
- `NUXT_SYNC_INTERVAL_MINUTES`: scheduler interval, default `30`
- `NUXT_SESSION_SECRET`: random string for session-related state handling
Nuxt runtime config uses the `NUXT_` environment prefix, so these values are available server-side without exposing secrets to the browser.

## Local development

Install dependencies:

```bash
npm install
```

Run migrations:

```bash
npm run migrate
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Docker Compose on Raspberry Pi 5

The provided Docker image uses Debian-based Node images that work on Linux ARM64, including Raspberry Pi 5.

Start the app:

```bash
docker compose up -d --build
```

The app is exposed on port `3000` by default.

SQLite persistence is handled through the named volume `training_planner_data`, mounted at `/data`. That volume stores:

- the SQLite database
- Strava tokens
- settings
- imported activities

You can inspect logs with:

```bash
docker compose logs -f app
```

## Automatic sync behavior

- On first successful Strava connection, the app imports the last 12 months of relevant activities.
- After that, the scheduler runs every 30 minutes by default.
- Manual sync from the UI reuses the same import service as the scheduler.
- Duplicate imports are prevented by the unique `source_activity_id` constraint.
- Incremental sync fetches from roughly the latest stored activity date minus one day to safely catch edits without creating duplicates.

## Heart-rate and counter rules

- Running and cycling use independent max HR and zone settings.
- Classification is based on average HR only.
- Running zones default to:
  - Zone 2: 70-80%
  - Zone 3: 81-87%
  - Zone 4: 88-93%
  - Interval: 94-100%
- Cycling zones default to:
  - Zone 2: 65-75%
  - Zone 3: 76-84%
  - Zone 4: 85-90%
  - Interval: 91-100%
- Swimming is displayed but does not affect counters.
- The easy-session streak increments only on Zone 2 sessions.
- The streak resets only on `Interval`.
- Zone 3 and Zone 4 sessions do not reset the streak.

## Cloudflare Tunnel

This repo is now aligned with the pattern used in your other projects: `cloudflared` runs on the host and routes public hostnames to local container ports.

Use the temporary config in [cloudflared.config.tmp.yml](/home/jan/projects/training-planner/cloudflared.config.tmp.yml) as the source for your shared `/etc/cloudflared/config.yml` or `~/.cloudflared/config.yml`.

Current ingress target for this app:

- hostname: `training-planner.darwin-labs.org`
- service: `http://localhost:3000`

If your live Cloudflare config is centralized with the other apps, copy just this ingress block into that shared config:

```yaml
- hostname: training-planner.darwin-labs.org
  service: http://localhost:3000
```

Then restart `cloudflared` on the host.

## Cloudflare Access recommendation

Because this is a single-user dashboard, the recommended production posture is:

1. Put the public hostname behind Cloudflare Access.
2. Require your email identity provider or one-time PIN.
3. Restrict access to your own email or a small allowlist.
4. Keep Strava client secrets only in `.env`, never in frontend code.

This app assumes public exposure only behind Cloudflare Access or another equivalent gate.

## API endpoints

- `GET /api/auth/strava/start`
- `GET /api/auth/strava/callback`
- `POST /api/sync`
- `GET /api/activities/:sport`
- `GET /api/dashboard`
- `GET /api/charts/:sport?range=7d|30d|90d|all`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/status/connection`

## Technical notes and assumptions

- This app is intentionally single-user and stores only one athlete profile and one OAuth token set.
- Strava activity normalization maps `Run`-style activities to running, `Ride`/`VirtualRide`/similar to cycling, and `Swim` to swimming.
- For Raspberry Pi simplicity, the backend runs inside the same Nuxt deployment rather than as a separate service.
- The sync scheduler uses a single in-process interval timer, which is appropriate for one container instance.
- Raw Strava activity payloads are stored in SQLite for debugging and auditing.
- The charts use chronological connected line series; HR/performance charts display both metrics over time rather than as a scatter plot to keep the UI clear on mobile.

## Useful commands

```bash
npm run dev
npm run build
npm run start
npm run migrate
docker compose up -d --build
```

## Limitations

- The app assumes one connected Strava user.
- If you run multiple app containers simultaneously, the in-process scheduler could overlap across instances.
- Swimming HR is shown only if Strava provides it.
