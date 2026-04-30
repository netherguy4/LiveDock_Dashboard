import { describe, expect, it, vi } from 'vitest'
import { createCachedStorage } from '../../../server/utils/storage'
import type { AppStorage, StoredHost, StoredUser } from '../../../server/utils/storage/types'

const user: StoredUser = {
  id: 'u1',
  login: 'alice',
  passwordHash: 'hash',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const host: StoredHost = {
  id: 'h1',
  userId: 'u1',
  name: 'prod',
  url: 'https://prod.example',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function createFakeStorage(): AppStorage {
  return {
    listUsers: vi.fn().mockResolvedValue([user]),
    getUserByLogin: vi.fn().mockResolvedValue(user),
    createUser: vi.fn().mockResolvedValue(user),
    updateUser: vi.fn().mockResolvedValue(user),
    deleteUser: vi.fn().mockResolvedValue(true),
    listHosts: vi.fn().mockResolvedValue([host]),
    getHost: vi.fn().mockResolvedValue(host),
    createHost: vi.fn().mockResolvedValue(host),
    updateHost: vi.fn().mockResolvedValue(host),
    deleteHost: vi.fn().mockResolvedValue(true),
  }
}

describe('storage cache', () => {
  it('caches repeated user host lists', async () => {
    const inner = createFakeStorage()
    const storage = createCachedStorage(inner, 1000)

    await storage.listHosts('u1')
    await storage.listHosts('u1')

    expect(inner.listHosts).toHaveBeenCalledTimes(1)
  })

  it('invalidates a user host list after host mutations', async () => {
    const inner = createFakeStorage()
    const storage = createCachedStorage(inner, 1000)

    await storage.listHosts('u1')
    await storage.createHost('u1', { name: 'stage', url: 'https://stage.example' })
    await storage.listHosts('u1')

    expect(inner.listHosts).toHaveBeenCalledTimes(2)
  })

  it('caches and invalidates admin users list', async () => {
    const inner = createFakeStorage()
    const storage = createCachedStorage(inner, 1000)

    await storage.listUsers()
    await storage.listUsers()
    await storage.updateUser('u1', { login: 'alice2' })
    await storage.listUsers()

    expect(inner.listUsers).toHaveBeenCalledTimes(2)
  })
})
