<script setup lang="ts">
import type { ActivityListItem } from '~/shared/types'
import { formatDistanceKm, formatDuration, formatElevation, formatHr, formatLocalizedDate, formatRelativeEffort } from '~/shared/format'

const props = defineProps<{
  activity: ActivityListItem
}>()

const { locale, t, translateHrZoneLabel, translateSport } = useI18n()
const zoneClass = computed(() => `zone-${props.activity.classification}`)
const relativeEffortBreakdown = computed(() => props.activity.relativeEffortBreakdown ?? null)
const zoneBreakdownChart = computed(() => {
  if (!relativeEffortBreakdown.value) {
    return []
  }

  const segments = [
    { key: 'z2', label: 'Z2', seconds: relativeEffortBreakdown.value.z2, color: '#245233', range: relativeEffortBreakdown.value.zoneRanges?.z2 ?? '' },
    { key: 'z3', label: 'Z3', seconds: relativeEffortBreakdown.value.z3, color: '#6f5516', range: relativeEffortBreakdown.value.zoneRanges?.z3 ?? '' },
    { key: 'z4', label: 'Z4', seconds: relativeEffortBreakdown.value.z4, color: '#7a4512', range: relativeEffortBreakdown.value.zoneRanges?.z4 ?? '' },
    { key: 'z5', label: 'Z5', seconds: relativeEffortBreakdown.value.z5, color: '#7b2323', range: relativeEffortBreakdown.value.zoneRanges?.z5 ?? '' }
  ]

  const maxSeconds = Math.max(...segments.map((segment) => segment.seconds), 1)

  return segments.map((segment, index) => {
    const widthPercent = segment.seconds > 0 ? Math.max((segment.seconds / maxSeconds) * 100, 6) : 0

    return {
      ...segment,
      widthPercent,
      pointX: 56 + widthPercent * 1.92,
      pointY: 18 + index * 28
    }
  })
})

</script>

<template>
  <article class="activity-tile card" :class="zoneClass">
    <div class="activity-head">
      <div class="activity-sport-row">
        <p class="activity-sport">{{ translateSport(activity.sport) }}</p>
        <span v-if="activity.dataOrigin" class="activity-origin-bubble">{{ activity.dataOrigin }}</span>
      </div>
      <h3 class="activity-title">{{ activity.name }}</h3>
      <p v-if="activity.description" class="activity-description">{{ activity.description }}</p>
      <p class="activity-date">{{ formatLocalizedDate(activity.startDate, locale) }}</p>
      
      <div class="activity-actions">
        <a :href="activity.stravaUrl" target="_blank" rel="noreferrer" class="strava-btn">
          {{ t('activity.openInStrava') }}
        </a>
      </div>
    </div>
    
    <div class="metrics">
      <div class="metric metric-transparent">
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
      <div v-if="activity.relativeEffort !== null" class="metric metric-relative-effort">
        <span class="metric-label">{{ t('activity.relativeEffort') }}</span>
        <template v-if="relativeEffortBreakdown">
          <button class="relative-effort-button" type="button">
            <strong>{{ formatRelativeEffort(activity.relativeEffort) }}</strong>
            <span class="relative-effort-hint">{{ t('activity.relativeEffortBreakdownHint') }}</span>
          </button>
          <div class="relative-effort-popover">
            <p class="relative-effort-title">{{ t('activity.relativeEffortBreakdown') }}</p>
            <p class="relative-effort-method">
              {{ relativeEffortBreakdown.method === 'stream' ? t('activity.relativeEffortStreamBased') : t('activity.relativeEffortAverageBased') }}
            </p>
            <div class="relative-effort-chart">
              <div
                v-for="segment in zoneBreakdownChart"
                :key="segment.key"
                class="relative-effort-row"
              >
                <span class="relative-effort-zone">
                  {{ segment.label }}
                  <span v-if="segment.range" class="relative-effort-zone-range">{{ segment.range }}</span>
                </span>
                <div class="relative-effort-track">
                  <div
                    class="relative-effort-bar"
                    :style="{
                      width: `${segment.widthPercent}%`,
                      background: segment.color
                    }"
                  />
                </div>
                <strong class="relative-effort-value">{{ formatDuration(segment.seconds) }}</strong>
              </div>
            </div>
          </div>
        </template>
        <strong v-else>{{ formatRelativeEffort(activity.relativeEffort) }}</strong>
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
  position: relative;
  z-index: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0)),
    var(--tile-tint);
  border-color: var(--tile-border);
  overflow: visible;
}

.activity-head {
  display: flex;
  flex-direction: column;
  padding-top: 0.5rem;
}

.activity-sport-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.activity-sport {
  margin: 0;
  color: var(--accent);
  text-transform: capitalize;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.activity-origin-bubble {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(214, 156, 74, 0.15);
  border: 1px solid rgba(214, 156, 74, 0.3);
  color: #925f20;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
}

.activity-title {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
}

.activity-description {
  margin: 0 0 0.45rem;
  color: var(--text);
  line-height: 1.45;
}

.activity-date {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.activity-actions {
  margin-top: 1rem;
}

.strava-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(64, 45, 22, 0.06);
  border: 1px solid rgba(64, 45, 22, 0.1);
  color: #402d16;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.45rem 1rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.strava-btn:hover {
  background: rgba(64, 45, 22, 0.12);
}

.metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-top: 1rem;
  align-items: stretch;
}

.metric {
  position: relative;
  padding: 0.75rem 0.95rem;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  min-width: 85px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.metric-transparent {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  padding-left: 0;
  padding-right: 0.75rem;
}

.metric-relative-effort {
  overflow: visible;
  z-index: 2;
  min-width: 140px;
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

.relative-effort-button {
  display: grid;
  gap: 0.2rem;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.relative-effort-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.relative-effort-popover {
  position: absolute;
  right: 0;
  left: auto;
  bottom: calc(100% + 0.55rem);
  z-index: 20;
  width: min(20rem, calc(100vw - 3rem), calc(100% + 6rem));
  padding: 0.85rem 0.95rem;
  border-radius: 0.95rem;
  background: #fffaf0;
  border: 1px solid #dfcda9;
  box-shadow: 0 14px 28px rgba(77, 59, 24, 0.14);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition: opacity 120ms ease, transform 120ms ease;
}

.metric-relative-effort:hover .relative-effort-popover,
.metric-relative-effort:focus-within .relative-effort-popover {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.metric-relative-effort:hover,
.metric-relative-effort:focus-within {
  z-index: 6;
}

.activity-tile:has(.metric-relative-effort:hover),
.activity-tile:has(.metric-relative-effort:focus-within) {
  z-index: 8;
}

.relative-effort-title,
.relative-effort-method {
  margin: 0;
}

.relative-effort-title {
  font-weight: 700;
}

.relative-effort-method {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.relative-effort-chart {
  margin-top: 0.85rem;
  display: grid;
  gap: 0.45rem;
}

.relative-effort-row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(4.9rem, 6.2rem) minmax(0, 1fr) 4rem;
  align-items: center;
  gap: 0.55rem;
  min-height: 1.8rem;
}

.relative-effort-zone,
.relative-effort-value {
  position: relative;
  z-index: 1;
}

.relative-effort-zone {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  display: grid;
  gap: 0.08rem;
}

.relative-effort-zone-range {
  font-size: 0.68rem;
  line-height: 1.2;
  font-weight: 500;
}

.relative-effort-track {
  position: relative;
  z-index: 1;
  height: 0.8rem;
  border-radius: 999px;
  background: rgba(141, 125, 99, 0.12);
  overflow: hidden;
}

.relative-effort-bar {
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.relative-effort-value {
  text-align: right;
  font-size: 0.8rem;
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
  .relative-effort-popover {
    left: 50%;
    right: auto;
    bottom: auto;
    top: calc(100% + 0.55rem);
    transform: translate(-50%, -4px);
    width: min(20rem, calc(100vw - 2rem));
  }

  .metric-relative-effort:hover .relative-effort-popover,
  .metric-relative-effort:focus-within .relative-effort-popover {
    transform: translate(-50%, 0);
  }
}
</style>
