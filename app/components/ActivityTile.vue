<script setup lang="ts">
import type { ActivityListItem } from '~/shared/types'
import { formatDistanceKm, formatDuration, formatElevation, formatHr, formatLocalizedDate } from '~/shared/format'

defineProps<{
  activity: ActivityListItem
}>()
</script>

<template>
  <article class="activity-tile card">
    <div class="activity-head">
      <div>
        <p class="activity-sport">{{ activity.sport }}</p>
        <h3>{{ activity.name }}</h3>
        <p class="muted">{{ formatLocalizedDate(activity.startDate) }}</p>
      </div>
      <a :href="activity.stravaUrl" target="_blank" rel="noreferrer" class="btn btn-secondary">
        Open in Strava
      </a>
    </div>
    <div class="metrics">
      <div class="metric">
        <span class="metric-label">{{ activity.sport === 'cycling' ? 'Speed' : 'Pace' }}</span>
        <strong>{{ activity.formattedPerformance }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">HR</span>
        <strong>{{ formatHr(activity.averageHeartRate) }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">HR zone</span>
        <strong>{{ activity.hrZoneLabel }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">Distance</span>
        <strong>{{ formatDistanceKm(activity.distanceMeters) }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">Elevation</span>
        <strong>{{ formatElevation(activity.elevationGainMeters) }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">Duration</span>
        <strong>{{ formatDuration(activity.durationSeconds) }}</strong>
      </div>
    </div>
  </article>
</template>

<style scoped>
.activity-tile {
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.activity-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.activity-sport {
  margin: 0 0 0.35rem;
  color: var(--accent);
  text-transform: capitalize;
  font-weight: 700;
  letter-spacing: 0.04em;
}

h3 {
  margin: 0 0 0.25rem;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.8rem;
}

.metric {
  padding: 0.85rem;
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  border: 1px solid var(--border);
}

.metric-label {
  display: block;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

@media (max-width: 700px) {
  .activity-head {
    flex-direction: column;
  }
}
</style>
