import { resolve } from 'node:path'
import type { AppStorage } from './types'
import { createPostgresStorage } from './postgres'
import { createSqliteStorage } from './sqlite'

let storage: AppStorage | null = null
const STORAGE_CACHE_TTL_MS = 5000

export function createStorage(): AppStorage {
  const postgresUrl =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.DATABASE_POSTGRES_PRISMA_URL ||
    process.env.DATABASE_POSTGRES_URL_NON_POOLING
  if (postgresUrl) return createPostgresStorage(postgresUrl)

  const sqlitePath = process.env.SQLITE_PATH || resolve(process.cwd(), '.data', 'livedock.sqlite')
  return createSqliteStorage(sqlitePath)
}

export function useAppStorage(): AppStorage {
  storage ??= createCachedStorage(createStorage(), STORAGE_CACHE_TTL_MS)
  return storage
}

export function resetStorageForTests() {
  storage = null
}

type CacheEntry<T> = {
  expiresAt: number
  value: T
}

export function createCachedStorage(inner: AppStorage, ttlMs: number): AppStorage {
  let usersCache: CacheEntry<Awaited<ReturnType<AppStorage['listUsers']>>> | null = null
  const hostsCache = new Map<string, CacheEntry<Awaited<ReturnType<AppStorage['listHosts']>>>>()

  function isFresh<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
    return Boolean(entry && entry.expiresAt > Date.now())
  }

  function invalidateUsers() {
    usersCache = null
  }

  function invalidateHosts(userId?: string) {
    if (userId) {
      hostsCache.delete(userId)
      return
    }
    hostsCache.clear()
  }

  return {
    close: inner.close ? () => inner.close?.() : undefined,

    async listUsers() {
      if (isFresh(usersCache)) return [...usersCache.value]
      const value = await inner.listUsers()
      usersCache = { value, expiresAt: Date.now() + ttlMs }
      return [...value]
    },

    getUserByLogin(login: string) {
      return inner.getUserByLogin(login)
    },

    async createUser(input) {
      const user = await inner.createUser(input)
      invalidateUsers()
      return user
    },

    async updateUser(id, input) {
      const user = await inner.updateUser(id, input)
      invalidateUsers()
      return user
    },

    async deleteUser(id) {
      const deleted = await inner.deleteUser(id)
      if (deleted) {
        invalidateUsers()
        invalidateHosts()
      }
      return deleted
    },

    async listHosts(userId) {
      const cached = hostsCache.get(userId) ?? null
      if (isFresh(cached)) return [...cached.value]
      const value = await inner.listHosts(userId)
      hostsCache.set(userId, { value, expiresAt: Date.now() + ttlMs })
      return [...value]
    },

    getHost(userId, id) {
      return inner.getHost(userId, id)
    },

    async createHost(userId, input) {
      const host = await inner.createHost(userId, input)
      invalidateHosts(userId)
      return host
    },

    async updateHost(userId, id, input) {
      const host = await inner.updateHost(userId, id, input)
      invalidateHosts(userId)
      return host
    },

    async deleteHost(userId, id) {
      const deleted = await inner.deleteHost(userId, id)
      if (deleted) invalidateHosts(userId)
      return deleted
    },

    setDemoFlag(id, value) {
      return inner.setDemoFlag(id, value)
    },
  }
}
