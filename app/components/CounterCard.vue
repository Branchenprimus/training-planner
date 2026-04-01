<script setup lang="ts">
import type { CounterSummary } from '~/shared/types'

const props = defineProps<{
  counter: CounterSummary
}>()
const { t } = useI18n()

const infoText = computed(() => {
  return t('counter.info', {
    sportLabel: props.counter.sport === 'running' ? t('sport.running') : t('sport.cycling'),
    easyTarget: props.counter.easyTarget,
    intervalTarget: props.counter.intervalTarget
  })
})
</script>

<template>
  <section class="section-card card counter-card" :class="{ due: counter.intervalDue }">
    <p v-if="counter.intervalDue" class="due-badge">{{ t('counter.dueBadge') }}</p>
    <p class="pill">
      <svg v-if="counter.sport === 'running'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="sport-icon">
        <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="sport-icon">
        <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/>
      </svg>
      {{ counter.sport === 'running' ? t('counter.running') : t('counter.cycling') }}
    </p>
    <div class="counter-header">
      <h3 class="section-title">
        {{
          counter.intervalDue
            ? t('counter.titleDue')
            : t('counter.titleProgress', { easyStreak: counter.easyStreak, easyTarget: counter.easyTarget })
        }}
      </h3>
      <div class="info-trigger" tabindex="0" :aria-label="t('counter.aria', { sport: counter.sport })">
        <span class="info-icon">i</span>
        <div class="info-popover">
          {{ infoText }}
        </div>
      </div>
    </div>
    <p class="section-subtitle">
      {{
        counter.intervalDue
          ? t('counter.descriptionDue')
          : t('counter.descriptionRemaining', {
              remaining: counter.remainingUntilInterval,
              suffix: counter.remainingUntilInterval === 1 ? '' : 's'
            })
      }}
    </p>
    <div class="stat-grid">
      <div class="stat-block">
        <div class="stat-label">{{ t('counter.planRatio') }}</div>
        <div class="stat-value">{{ counter.easyTarget }}:{{ counter.intervalTarget }}</div>
      </div>
      <div class="stat-block">
        <div class="stat-label">{{ t('counter.streak') }}</div>
        <div class="stat-value">{{ counter.easyStreak }}</div>
      </div>
      <div class="stat-block">
        <div class="stat-label">{{ t('counter.remaining') }}</div>
        <div class="stat-value">{{ counter.remainingUntilInterval }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.counter-card {
  position: relative;
  overflow: hidden;
}

.counter-card .pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.sport-icon {
  width: 1.15rem;
  height: 1.15rem;
}

.counter-card .stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  align-items: stretch;
}

.counter-card .stat-block {
  min-width: 0;
}

.counter-card.due {
  border-color: rgba(166, 60, 51, 0.45);
  box-shadow: 0 24px 70px rgba(166, 60, 51, 0.2);
  background:
    radial-gradient(circle at top right, rgba(166, 60, 51, 0.14), transparent 38%),
    linear-gradient(180deg, rgba(255, 247, 245, 0.92), rgba(255, 251, 249, 0.88));
}

.due-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(166, 60, 51, 0.12);
  color: var(--danger);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.counter-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.info-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: #efe5d0;
  color: #5f4a2c;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: help;
  outline: none;
}

.info-popover {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  z-index: 10;
  width: min(20rem, 80vw);
  padding: 0.8rem 0.9rem;
  border-radius: 0.9rem;
  background: #fffaf0;
  border: 1px solid #dfcda9;
  box-shadow: 0 14px 28px rgba(77, 59, 24, 0.14);
  color: #4b3e2a;
  font-size: 0.9rem;
  line-height: 1.4;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition: opacity 120ms ease, transform 120ms ease;
}

.info-trigger:hover .info-popover,
.info-trigger:focus .info-popover,
.info-trigger:focus-within .info-popover {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

@media (max-width: 640px) {
  .counter-card .stat-grid {
    grid-template-columns: 1fr;
  }

  .due-badge {
    position: static;
    display: inline-flex;
    margin-bottom: 0.85rem;
  }
}
</style>
