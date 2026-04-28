// Validate credentials against runtimeConfig (env LOGIN/PASSWORD) and
// issue an httpOnly session cookie. Same-origin form, SameSite=Lax — that
// covers the basic CSRF case for this admin tool.

import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from '../utils/session'

interface LoginBody {
  login?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  if (!cfg.sessionSecret) {
    setResponseStatus(event, 500)
    return { error: 'SESSION_SECRET not configured' }
  }

  // Light Origin check — reject cross-site form posts.
  const origin = getRequestHeader(event, 'origin')
  const host = getRequestHeader(event, 'host')
  if (origin && host) {
    try {
      const o = new URL(origin)
      if (o.host !== host) {
        setResponseStatus(event, 403)
        return { error: 'forbidden' }
      }
    } catch {
      setResponseStatus(event, 403)
      return { error: 'forbidden' }
    }
  }

  const body = await readBody<LoginBody>(event)
  const login = (body?.login ?? '').trim()
  const password = body?.password ?? ''

  if (!login || !password || login !== cfg.login || password !== cfg.password) {
    setResponseStatus(event, 401)
    return { error: 'invalid credentials' }
  }

  const token = signSession(login, SESSION_TTL_SECONDS, cfg.sessionSecret)
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })

  return { ok: true, user: login }
})
