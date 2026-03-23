<script setup lang="ts">
const route = useRoute()

const status = computed(() => (route.query.status === 'success' ? 'success' : 'error'))
const message = computed(() => {
  const raw = route.query.message
  return typeof raw === 'string' && raw.length > 0
    ? raw
    : status.value === 'success'
      ? 'Strava connected successfully. You can return to the dashboard and start a sync.'
      : 'The Strava connection could not be completed.'
})
</script>

<template>
  <section class="page-grid">
    <section class="section-card card stack">
      <p class="pill" :class="status === 'success' ? 'success-pill' : 'error-pill'">
        {{ status === 'success' ? 'Connection complete' : 'Connection failed' }}
      </p>
      <div>
        <h2 class="section-title">Strava authorization</h2>
        <p class="section-subtitle">{{ message }}</p>
      </div>
      <div class="inline-actions">
        <NuxtLink class="btn btn-primary" to="/">Go to dashboard</NuxtLink>
        <NuxtLink class="btn btn-secondary" to="/settings">Open settings</NuxtLink>
      </div>
    </section>
  </section>
</template>

<style scoped>
.success-pill {
  background: var(--brand-soft);
  color: var(--brand-strong);
}

.error-pill {
  background: rgba(166, 60, 51, 0.12);
  color: var(--danger);
}
</style>
