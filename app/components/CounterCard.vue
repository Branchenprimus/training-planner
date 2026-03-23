<script setup lang="ts">
import type { CounterSummary } from '~/shared/types'

defineProps<{
  counter: CounterSummary
}>()
</script>

<template>
  <section class="section-card card counter-card">
    <p class="pill">{{ counter.sport === 'running' ? 'Running Counter' : 'Cycling Counter' }}</p>
    <h3 class="section-title">
      {{ counter.intervalDue ? 'Interval due now' : `${counter.easyStreak}/9 easy sessions` }}
    </h3>
    <p class="section-subtitle">
      {{
        counter.intervalDue
          ? 'Your next qualifying hard session should be an interval workout.'
          : `${counter.remainingUntilInterval} easy session${counter.remainingUntilInterval === 1 ? '' : 's'} until interval.`
      }}
    </p>
    <div class="stat-grid">
      <div class="stat-block">
        <div class="stat-label">Easy-session streak</div>
        <div class="stat-value">{{ counter.easyStreak }}</div>
      </div>
      <div class="stat-block">
        <div class="stat-label">Remaining</div>
        <div class="stat-value">{{ counter.remainingUntilInterval }}</div>
      </div>
    </div>
  </section>
</template>
