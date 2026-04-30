import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../../server/utils/password'

describe('password utils', () => {
  it('verifies the original password against its hash', async () => {
    const hash = await hashPassword('secret-pass')

    await expect(verifyPassword('secret-pass', hash)).resolves.toBe(true)
    await expect(verifyPassword('other-pass', hash)).resolves.toBe(false)
  })

  it('rejects malformed hashes', async () => {
    await expect(verifyPassword('secret-pass', 'not-a-valid-hash')).resolves.toBe(false)
  })
})
