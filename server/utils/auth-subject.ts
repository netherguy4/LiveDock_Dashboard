import { createError, type H3Event } from 'h3'
import type { SessionSubject } from './session'

export function getSessionSubject(event: H3Event): SessionSubject | null {
  return (event.context.session as SessionSubject | undefined) ?? null
}

export function requireAdmin(event: H3Event): SessionSubject & { kind: 'admin' } {
  const session = getSessionSubject(event)
  if (session?.kind === 'admin') return session
  throw createError({ statusCode: 403, statusMessage: 'forbidden' })
}

export function requireUser(event: H3Event): SessionSubject & { kind: 'user' } {
  const session = getSessionSubject(event)
  if (session?.kind === 'user') return session
  throw createError({ statusCode: 403, statusMessage: 'forbidden' })
}
