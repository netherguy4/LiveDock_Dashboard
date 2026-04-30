// Client-side guard. Server middleware already redirects unauth'd
// page requests, but this catches client-side navigations and provides
// a smooth in-app redirect (no full page reload).

import { useAuthStore } from '~/stores/auth.store'
import { ROUTES } from '~/configs/routes.config'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  // Hydrate auth state once per session (server-fetched on first nav).
  if (!auth.isAuthed && !auth.checking) {
    await auth.check()
  }

  if (to.path === '/login') {
    if (auth.isAuthed) return navigateTo(auth.kind === 'admin' ? ROUTES.USERS : ROUTES.HOME)
    return
  }

  if (!auth.isAuthed) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  if (auth.kind === 'admin' && to.path === ROUTES.HOME) {
    return navigateTo(ROUTES.USERS)
  }
})
