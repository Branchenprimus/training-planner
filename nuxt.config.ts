export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: {
    enabled: true
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Training Planner',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        },
        {
          name: 'description',
          content: 'Personal sports tracking dashboard for Strava activities.'
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg'
        }
      ]
    }
  },
  modules: [],
  nitro: {
    preset: 'node-server'
  },
  runtimeConfig: {
    appOrigin: '',
    stravaClientId: '',
    stravaClientSecret: '',
    stravaRedirectUri: '',
    stravaScopes: 'activity:read_all,profile:read_all',
    sqlitePath: '/data/training-planner.sqlite',
    syncIntervalMinutes: 30,
    sessionCookieName: 'training_planner_state',
    sessionSecret: '',
    defaultUserEmail: 'local@localhost',
    public: {
      appName: 'Training Planner'
    }
  },
  typescript: {
    strict: true,
    typeCheck: process.env.NODE_ENV !== 'development'
  }
})
