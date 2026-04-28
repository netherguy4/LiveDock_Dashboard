// Quick "am I authed?" check used by the auth store on hydration.
// Public route (the auth middleware lets this one through and just inspects
// the cookie itself).

import { SESSION_COOKIE, verifySession } from '../utils/session'

export default defineEventHandler((event) => {
  const cfg = useRuntimeConfig()
  const cookie = getCookie(event, SESSION_COOKIE)
  const session = cfg.sessionSecret ? verifySession(cookie, cfg.sessionSecret) : null
  return {
    authed: Boolean(session),
    user: session?.user ?? '',
  }
})
