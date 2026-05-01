import { SESSION_COOKIE, verifySession } from '../utils/session'

export default defineEventHandler((event) => {
  const cfg = useRuntimeConfig()
  const cookie = getCookie(event, SESSION_COOKIE)
  const session = cfg.sessionSecret ? verifySession(cookie, cfg.sessionSecret) : null
  return {
    authed: Boolean(session),
    user: session?.login ?? '',
    kind: session?.kind ?? null,
    userId: session?.kind === 'user' ? session.userId : null,
    demo: session?.kind === 'user' ? Boolean(session.demo) : false,
  }
})
