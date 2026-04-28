// Activate pinia-plugin-persistedstate for the stores that opt in via `persist`.
// Client-only — there's no localStorage on the server.

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  // @ts-expect-error — $pinia is the Pinia instance set up by @pinia/nuxt
  nuxtApp.$pinia.use(piniaPluginPersistedstate)
})
