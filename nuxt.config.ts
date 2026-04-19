export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',
  devtools: { enabled: true },
  ssr: true,
  runtimeConfig: {
    apiUrl: process.env.BACKEND_URL || 'https://api.nether.pp.ua',
    apiToken: process.env.API_TOKEN || '',
    public: {
      pollInterval: Number(process.env.NUXT_PUBLIC_POLL_INTERVAL || 2000),
    },
  },
  app: {
    head: {
      title: 'Monitoring',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  nitro: {
    preset: process.env.NITRO_PRESET || 'vercel',
  },
})
