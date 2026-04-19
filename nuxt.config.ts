export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',
  devtools: { enabled: true },
  ssr: true,
  runtimeConfig: {
    apiUrl: process.env.BACKEND_URL || 'https://api.nether.pp.ua',
    apiToken: process.env.API_TOKEN || '',
    login: process.env.LOGIN || 'admin',
    password: process.env.PASSWORD || '',
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
        { name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
        { name: 'googlebot', content: 'noindex, nofollow' },
      ],
    },
  },
  nitro: {
    preset: process.env.NITRO_PRESET || 'vercel',
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'chart.js',
        'vue-chartjs',
      ],
    },
  },
})
