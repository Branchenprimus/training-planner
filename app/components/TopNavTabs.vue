<script setup lang="ts">
import type { ConnectionStatusResponse } from '~/shared/types'

const route = useRoute()
const { t } = useI18n()
const { data: connectionStatus } = await useFetch<ConnectionStatusResponse>('/api/status/connection')

const tabs = computed(() => [
  { label: t('nav.dashboard'), to: '/' },
  { label: t('nav.running'), to: '/running' },
  { label: t('nav.cycling'), to: '/cycling' },
  { label: t('nav.swimming'), to: '/swimming' },
  { label: t('nav.settings'), to: '/settings' }
])
</script>

<template>
  <header class="top-nav-wrap">
    <div class="top-nav">
      <div class="top-nav-left">
        <a
          href="https://app-dashboard.darwin-labs.org"
          target="_blank"
          rel="noopener noreferrer"
          class="back-link"
          :aria-label="t('nav.back')"
        >
          <span class="back-link-arrow" aria-hidden="true">←</span>
          <span>{{ t('nav.back') }}</span>
        </a>

        <div class="top-nav-brand">
          <div class="brand-row">
            <img
              src="/issue-assets/issue-5-segment-3.png"
              alt="Training Planner logo"
              class="brand-logo"
            >
            <div class="brand-copy">
              <p class="eyebrow">{{ t('nav.eyebrow') }}</p>
              <h1>{{ t('nav.title') }}</h1>
            </div>
          </div>
        </div>
      </div>
      <div class="top-nav-actions">
        <div v-if="connectionStatus?.userEmail" class="signed-in-badge">
          <p class="signed-in-copy">
            {{ t('nav.signedInAs') }} <strong>{{ connectionStatus.userEmail }}</strong>
          </p>
          <a href="/cdn-cgi/access/logout" class="logout-link">
            {{ t('settings.logoutButton') }}
          </a>
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
    </div>
  </header>
</template>

<style scoped>
.top-nav-wrap {
  position: sticky;
  top: 0;
  z-index: 20;
  overflow: visible;
  padding: 1rem 0 0;
}

.top-nav-wrap::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -0.9rem;
  transform: translateX(-50%);
  width: min(36rem, calc(100vw - 10rem));
  height: 1.35rem;
  pointer-events: none;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 251, 245, 0.95), rgba(255, 249, 242, 0));
  filter: blur(10px);
  opacity: 0.95;
}

.top-nav {
  width: min(1200px, calc(100vw - 2rem));
  margin: 0 auto;
  padding: 1rem 1.2rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: flex-start;
  background: var(--surface-strong);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: none;
}

.top-nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
  padding: 0.72rem 0.95rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--border);
  color: var(--text);
  font-weight: 600;
  transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.back-link:hover {
  transform: translateX(-2px);
  background: var(--surface-strong);
  color: var(--brand-strong);
}

.back-link-arrow {
  font-size: 1rem;
}

.top-nav-brand {
  flex: 1 1 auto;
  min-width: 0;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.brand-copy {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.brand-logo {
  display: block;
  width: clamp(2.6rem, 3.2vw, 3.1rem);
  height: clamp(2.6rem, 3.2vw, 3.1rem);
  object-fit: cover;
  object-position: center;
  border-radius: 0.9rem;
  flex-shrink: 0;
}

.eyebrow {
  margin: 0 0 0.25rem;
  max-width: 28rem;
  font-size: clamp(0.72rem, 0.7vw, 0.82rem);
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2vw, 2rem);
  line-height: 1.05;
}

.top-nav-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  min-width: fit-content;
}

.signed-in-badge {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  max-width: min(30rem, 100%);
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  background: #efe5d0;
  color: #5f4a2c;
  font-size: 0.88rem;
  line-height: 1.2;
  text-align: right;
  overflow-wrap: anywhere;
}

.signed-in-copy {
  margin: 0;
}

.logout-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: rgba(95, 74, 44, 0.12);
  color: #5f4a2c;
  font-size: 0.82rem;
  font-weight: 700;
  transition: background 0.18s ease, transform 0.18s ease;
}

.logout-link:hover {
  background: rgba(95, 74, 44, 0.18);
  transform: translateY(-1px);
}

.top-nav-links {
  display: flex;
  grid-column: 1 / -1;
  gap: 0.55rem;
  justify-content: flex-start;
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
  .top-nav-wrap::after {
    width: min(24rem, calc(100vw - 4rem));
    bottom: -0.75rem;
  }

  .top-nav {
    display: flex;
    flex-wrap: wrap;
    width: min(100vw - 1rem, 100%);
    padding: 0.85rem 0.95rem;
    gap: 0.75rem;
  }

  .top-nav-left {
    width: 100%;
    justify-content: space-between;
  }

  .top-nav-actions {
    width: 100%;
    align-items: stretch;
    gap: 0.55rem;
  }

  .signed-in-badge {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    padding: 0.4rem 0.65rem;
    font-size: 0.8rem;
  }

  .top-nav-links {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .top-nav-wrap {
    padding-top: 0.45rem;
  }

  .top-nav {
    width: min(100vw - 0.65rem, 100%);
    padding: 0.6rem 0.7rem;
    gap: 0.55rem;
    border-radius: 18px;
  }

  .top-nav-brand {
    width: 100%;
  }

  .top-nav-left {
    width: 100%;
  }

  .back-link,
  .brand-logo {
    display: none;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.62rem;
    letter-spacing: 0.06em;
  }

  h1 {
    font-size: 1rem;
    line-height: 1.1;
  }

  .top-nav-actions {
    gap: 0.45rem;
  }

  .signed-in-badge {
    padding: 0.28rem 0.55rem;
    font-size: 0.72rem;
    line-height: 1.15;
    border-radius: 12px;
  }

  .logout-link {
    padding: 0.32rem 0.58rem;
    font-size: 0.72rem;
  }

  .top-nav-links {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.35rem;
    width: 100%;
  }

  .nav-link {
    padding: 0.45rem 0.4rem;
    font-size: 0.78rem;
    text-align: center;
  }
}
</style>
