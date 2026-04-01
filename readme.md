# Training Planner

Training Planner is a smart dashboard that connects to your Strava account to visualize, track, and classify your running and cycling activities based on heart-rate zones. Built exclusively for self-hosting on a home server.

## 🚀 Features

- **Automated Strava Sync**: Automatically imports your last 12 months of activities and syncs every 30-minutes.
- **Heart Rate Classification**: Smart categorization of runs and rides into Zone 2, Zone 3, Zone 4, and Interval sessions.
- **Independent Training Counters**: Track easy-effort streaks natively without manually counting. 
- **Relative Effort Tracking**: See the true physiological impact of your workouts based on HR streams.
- **Tenant Isolation**: Settings are safely persisted in SQLite per authenticated Cloudflare Access email.

## 💻 Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Charts**: `vue-chartjs` + Chart.js
- **Backend & Database**: Nuxt Server Routes + `better-sqlite3`
- **Deployment**: Docker + Docker Compose

---

## 🛠️ Development Environment

### 1. Prerequisites
- Create a Strava API application at https://www.strava.com/settings/api
- Set the Authorization Callback Domain to `localhost`
- Obtain your Client ID and Client Secret.

### 2. Environment Variables
Copy the `.env.example` to `.env` and fill in your developer keys:
```bash
cp .env.example .env
```
Ensure `NUXT_STRAVA_REDIRECT_URI` is set to `http://localhost:3000/api/auth/strava/callback`.

### 3. Local Setup (Node.js)
```bash
npm install
npm run migrate
npm run dev
```
Open `http://localhost:3000` to preview.

### 4. Remote Development (Docker & SSH)
To work remotely on a headless server without installing local Node.js binaries, spin up the completely isolated development container. This leverages hot-reloading and maintains a separate development database safely:
```bash
docker compose -f docker-compose.dev.yml up -d --build
```
Bridge the container to your local machine via SSH port forwarding:
```bash
ssh -L 3001:localhost:3001 user@<your-server-ip>
```
Open `http://localhost:3001` on your local browser to preview and develop live.

---

## 🌍 Production Environment

The application is deployed using Docker Compose on a Raspberry Pi 5, securely hidden behind a Cloudflare Tunnel and exposed via Cloudflare Access (Zero Trust).

### Infrastructure Setup
1. Define your public domain in your `.env` file (e.g., `APP_ORIGIN=https://sports.yourdomain.com`).
2. Update the `NUXT_STRAVA_REDIRECT_URI` to use the public domain.
3. Configure your Cloudflare Tunnel (`/etc/cloudflared/config.yml`) to route ingress traffic to the container port:
```yaml
ingress:
  - hostname: sports.yourdomain.com
    service: http://localhost:3000
```
4. Restart the remote `cloudflared` service.

### Deployment Flow
Whenever pushing new code changes to production, simply rebuild and forcefully recreate the Docker container directly on the host server:

```bash
docker compose up -d --build --force-recreate
```
Docker handles all internal setup requirements (volumes persistence, startup scripts) automatically. Tail the application logs using `docker compose logs -f app`.
