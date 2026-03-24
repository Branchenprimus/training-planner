<script setup lang="ts">
import type { ActivityListItem } from '~/shared/types'
import { formatDistanceKm, formatDuration, formatElevation, formatHr, formatLocalizedDate, formatRelativeEffort } from '~/shared/format'

const props = defineProps<{
  activity: ActivityListItem
}>()

const { locale, t, translateHrZoneLabel, translateSport } = useI18n()
const zoneClass = computed(() => `zone-${props.activity.classification}`)
</script>

<template>
  <article class="activity-tile card" :class="zoneClass">
    <div class="activity-head">
      <div>
        <p class="activity-sport">{{ translateSport(activity.sport) }}</p>
        <h3>{{ activity.name }}</h3>
        <p class="muted">{{ formatLocalizedDate(activity.startDate, locale) }}</p>
      </div>
      <a :href="activity.stravaUrl" target="_blank" rel="noreferrer" class="btn btn-secondary">
        {{ t('activity.openInStrava') }}
      </a>
    </div>
    <div class="metrics">
      <div class="metric">
        <span class="metric-label">{{ activity.sport === 'cycling' ? t('activity.speed') : t('activity.pace') }}</span>
        <strong>{{ activity.formattedPerformance }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t('activity.hr') }}</span>
        <strong>{{ formatHr(activity.averageHeartRate) }}</strong>
      </div>
      <div class="metric metric-zone">
        <span class="metric-label">{{ t('activity.hrZone') }}</span>
        <strong>{{ translateHrZoneLabel(activity.hrZoneLabel) }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t('activity.distance') }}</span>
        <strong>{{ formatDistanceKm(activity.distanceMeters) }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t('activity.elevation') }}</span>
        <strong>{{ formatElevation(activity.elevationGainMeters) }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t('activity.duration') }}</span>
        <strong>{{ formatDuration(activity.durationSeconds) }}</strong>
      </div>
      <div v-if="activity.relativeEffort !== null" class="metric">
        <span class="metric-label">{{ t('activity.relativeEffort') }}</span>
        <strong>{{ formatRelativeEffort(activity.relativeEffort) }}</strong>
      </div>
    </div>
  </article>
</template>

<style scoped>
.activity-tile {
  --tile-tint: rgba(255, 253, 249, 0.92);
  --tile-border: rgba(64, 45, 22, 0.12);
  --zone-chip-bg: rgba(239, 231, 218, 0.88);
  --zone-chip-border: rgba(64, 45, 22, 0.12);
  --zone-chip-text: var(--text);
  padding: 1rem;
  display: grid;
  gap: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0)),
    var(--tile-tint);
  border-color: var(--tile-border);
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

.metric-zone {
  background: var(--zone-chip-bg);
  border-color: var(--zone-chip-border);
}

.metric-zone strong {
  color: var(--zone-chip-text);
}

.metric-label {
  display: block;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.zone-zone2 {
  --tile-tint: rgba(226, 244, 231, 0.94);
  --tile-border: rgba(122, 177, 129, 0.55);
  --zone-chip-bg: rgba(205, 235, 213, 0.96);
  --zone-chip-border: rgba(122, 177, 129, 0.65);
  --zone-chip-text: #245233;
}

.zone-zone3 {
  --tile-tint: rgba(252, 245, 205, 0.95);
  --tile-border: rgba(214, 186, 97, 0.55);
  --zone-chip-bg: rgba(248, 237, 178, 0.98);
  --zone-chip-border: rgba(214, 186, 97, 0.7);
  --zone-chip-text: #6f5516;
}

.zone-zone4 {
  --tile-tint: rgba(253, 232, 206, 0.95);
  --tile-border: rgba(222, 160, 98, 0.58);
  --zone-chip-bg: rgba(249, 216, 176, 0.98);
  --zone-chip-border: rgba(222, 160, 98, 0.72);
  --zone-chip-text: #7a4512;
}

.zone-interval {
  --tile-tint: rgba(248, 219, 219, 0.95);
  --tile-border: rgba(207, 126, 126, 0.58);
  --zone-chip-bg: rgba(242, 194, 194, 0.98);
  --zone-chip-border: rgba(207, 126, 126, 0.72);
  --zone-chip-text: #7b2323;
}

.zone-unclassified {
  --tile-tint: rgba(241, 237, 230, 0.95);
  --tile-border: rgba(169, 156, 138, 0.45);
  --zone-chip-bg: rgba(233, 227, 218, 0.98);
  --zone-chip-border: rgba(169, 156, 138, 0.58);
  --zone-chip-text: #5c5245;
}

@media (max-width: 700px) {
  .activity-head {
    flex-direction: column;
  }
}
</style>
