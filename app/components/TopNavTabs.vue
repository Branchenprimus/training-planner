<script setup lang="ts">
const route = useRoute()

const tabs = [
  { label: 'Dashboard', to: '/' },
  { label: 'Running', to: '/running' },
  { label: 'Cycling', to: '/cycling' },
  { label: 'Swimming', to: '/swimming' },
  { label: 'Settings', to: '/settings' }
]
</script>

<template>
  <header class="top-nav-wrap">
    <div class="top-nav card">
      <div>
        <p class="eyebrow">Personal Sports Dashboard</p>
        <h1>Training Planner</h1>
      </div>
      <nav class="top-nav-links">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="nav-link"
          :class="{ active: route.path === tab.to }"
        >
          {{ tab.label }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.top-nav-wrap {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 1rem 0 0;
  backdrop-filter: blur(12px);
}

.top-nav {
  width: min(1200px, calc(100vw - 2rem));
  margin: 0 auto;
  padding: 1rem 1.2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2vw, 2rem);
}

.top-nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.nav-link {
  padding: 0.7rem 0.95rem;
  border-radius: 999px;
  color: var(--text-muted);
  font-weight: 600;
}

.nav-link.active {
  background: var(--brand-soft);
  color: var(--brand-strong);
}

@media (max-width: 960px) {
  .top-nav {
    width: min(100vw - 1rem, 100%);
  }
}
</style>
