import { createHmac, timingSafeEqual } from 'node:crypto'

const ALGO = 'sha256'

export type SessionSubject =
  | { kind: 'admin'; login: string }
  | { kind: 'user'; userId: string; login: string }

function encodeSubject(subject: SessionSubject): string {
  return Buffer.from(JSON.stringify(subject), 'utf8').toString('base64url')
}

function decodeSubject(value: string): SessionSubject | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<SessionSubject>
    if (parsed.kind === 'admin' && typeof parsed.login === 'string') {
      return { kind: 'admin', login: parsed.login }
    }
    if (parsed.kind === 'user' && typeof parsed.userId === 'string' && typeof parsed.login === 'string') {
      return { kind: 'user', userId: parsed.userId, login: parsed.login }
    }
    return null
  } catch {
    return null
  }
}

export function signSession(subject: SessionSubject, ttlSeconds: number, secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const payload = `${encodeSubject(subject)}.${exp}`
  const sig = createHmac(ALGO, secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifySession(
  token: string | undefined,
  secret: string,
): SessionSubject | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [subjectB64, expStr, sig] = parts
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null

  const expected = createHmac(ALGO, secret)
    .update(`${subjectB64}.${expStr}`)
    .digest('hex')

  if (sig.length !== expected.length) return null
  const a = Buffer.from(sig, 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  return decodeSubject(subjectB64)
}

export const SESSION_COOKIE = 'monitoring_auth'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
