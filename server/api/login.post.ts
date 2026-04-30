import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from '../utils/session'
import { verifyPassword } from '../utils/password'
import { useAppStorage } from '../utils/storage'

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

  if (!login || !password) {
    setResponseStatus(event, 401)
    return { error: 'invalid credentials' }
  }

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  } as const

  if (login === cfg.login && password === cfg.password) {
    const token = signSession({ kind: 'admin', login }, SESSION_TTL_SECONDS, cfg.sessionSecret)
    setCookie(event, SESSION_COOKIE, token, cookieOptions)
    return { ok: true, user: login, kind: 'admin' }
  }

  const user = await useAppStorage().getUserByLogin(login)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    setResponseStatus(event, 401)
    return { error: 'invalid credentials' }
  }

  const token = signSession({ kind: 'user', userId: user.id, login: user.login }, SESSION_TTL_SECONDS, cfg.sessionSecret)
  setCookie(event, SESSION_COOKIE, token, cookieOptions)
  return { ok: true, user: user.login, kind: 'user', userId: user.id }
})
