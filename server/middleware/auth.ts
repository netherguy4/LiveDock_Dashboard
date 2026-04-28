// Replaces the old Basic Auth middleware. We trust an httpOnly session
// cookie set by /api/login. Public routes (login, logout, me, /login page,
// static assets) are passed through unauthenticated.

import { SESSION_COOKIE, verifySession } from '../utils/session'

const PUBLIC_API = new Set(['/api/login', '/api/logout', '/api/me'])

function isPublicPath(p: string): boolean {
  if (PUBLIC_API.has(p)) return true
  if (p === '/login') return true
  // Static assets / Nuxt internals
  if (p.startsWith('/_nuxt') || p.startsWith('/__nuxt') || p.startsWith('/_payload')) return true
  if (p.startsWith('/_ipx') || p.startsWith('/favicon')) return true
  return false
}

export default defineEventHandler((event) => {
  const url = event.path || event.node.req.url || '/'
  const path = url.split('?')[0]

  if (isPublicPath(path)) return

  const { sessionSecret } = useRuntimeConfig()
  if (!sessionSecret) {
    // Fail closed if SESSION_SECRET isn't configured.
    setResponseStatus(event, 500)
    return { error: 'SESSION_SECRET not configured' }
  }

  const cookie = getCookie(event, SESSION_COOKIE)
  const session = verifySession(cookie, sessionSecret)
  if (session) {
    event.context.session = session
    return
  }

  // API → 401 JSON. Page routes → redirect to /login.
  if (path.startsWith('/api/')) {
    setResponseStatus(event, 401)
    return { error: 'unauthorized' }
  }
  return sendRedirect(event, `/login?redirect=${encodeURIComponent(url)}`)
})
