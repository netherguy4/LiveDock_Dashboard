// Tiny HMAC-signed session token. We don't need JWT — just a string that
// proves the server issued it and hasn't expired.
//
// Format: `${userBase64}.${expSeconds}.${hmacHex}`
// Verification is constant-time.

import { createHmac, timingSafeEqual } from 'node:crypto'

const ALGO = 'sha256'

function b64url(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64url')
}
function fromB64url(s: string): string {
  return Buffer.from(s, 'base64url').toString('utf8')
}

export function signSession(user: string, ttlSeconds: number, secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const payload = `${b64url(user)}.${exp}`
  const sig = createHmac(ALGO, secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifySession(
  token: string | undefined,
  secret: string,
): { user: string } | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [userB64, expStr, sig] = parts
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null

  const expected = createHmac(ALGO, secret)
    .update(`${userB64}.${expStr}`)
    .digest('hex')

  // timingSafeEqual requires equal-length buffers, hence the early bail.
  if (sig.length !== expected.length) return null
  const a = Buffer.from(sig, 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  return { user: fromB64url(userB64) }
}

export const SESSION_COOKIE = 'monitoring_auth'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
