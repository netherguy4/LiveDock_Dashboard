import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createSqliteStorage } from '../../../server/utils/storage/sqlite'

let dir = ''
let closeStorage: (() => void) | null = null

afterEach(() => {
  closeStorage?.()
  closeStorage = null
  if (dir) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch (e: unknown) {
      if (!(e instanceof Error) || !e.message.includes('EBUSY')) throw e
    }
  }
  dir = ''
})

describe('sqlite storage', () => {
  it('creates users and enforces unique logins', async () => {
    dir = mkdtempSync(join(tmpdir(), 'livedock-sqlite-'))
    const storage = createSqliteStorage(join(dir, 'test.db'))
    closeStorage = storage.close

    const user = await storage.createUser({ login: 'alice', passwordHash: 'hash-1' })

    expect(user.login).toBe('alice')
    await expect(storage.createUser({ login: 'alice', passwordHash: 'hash-2' })).rejects.toThrow('login already exists')
  })

  it('scopes hosts by user id', async () => {
    dir = mkdtempSync(join(tmpdir(), 'livedock-sqlite-'))
    const storage = createSqliteStorage(join(dir, 'test.db'))
    closeStorage = storage.close
    const alice = await storage.createUser({ login: 'alice', passwordHash: 'hash-1' })
    const bob = await storage.createUser({ login: 'bob', passwordHash: 'hash-2' })

    const host = await storage.createHost(alice.id, { name: 'prod', url: 'https://prod.example', token: 'tok' })

    expect(await storage.listHosts(alice.id)).toHaveLength(1)
    expect(await storage.listHosts(bob.id)).toHaveLength(0)
    await expect(storage.getHost(bob.id, host.id)).resolves.toBeNull()
  })
})
