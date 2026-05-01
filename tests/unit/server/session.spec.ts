import { describe, expect, it } from 'vitest'
import { signSession, verifySession } from '../../../server/utils/session'

describe('session utils', () => {
  it('round-trips an admin subject', () => {
    const token = signSession({ kind: 'admin', login: 'root' }, 60, 'secret')

    expect(verifySession(token, 'secret')).toEqual({ kind: 'admin', login: 'root' })
  })

  it('round-trips a user subject', () => {
    const token = signSession({ kind: 'user', userId: 'u1', login: 'alice' }, 60, 'secret')

    expect(verifySession(token, 'secret')).toEqual({ kind: 'user', userId: 'u1', login: 'alice', demo: false })
  })

  it('rejects malformed tokens', () => {
    expect(verifySession('bad.token', 'secret')).toBeNull()
  })

  it('rejects tampered typed tokens', () => {
    const token = signSession({ kind: 'admin', login: 'root' }, 60, 'secret')
    const [, exp, sig] = token.split('.')
    const tamperedSubject = Buffer.from(JSON.stringify({ kind: 'admin', login: 'other' }), 'utf8').toString('base64url')

    expect(verifySession(`${tamperedSubject}.${exp}.${sig}`, 'secret')).toBeNull()
  })
})
