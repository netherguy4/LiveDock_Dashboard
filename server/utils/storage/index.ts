import { resolve } from 'node:path'
import type { AppStorage } from './types'
import { createPostgresStorage } from './postgres'
import { createSqliteStorage } from './sqlite'

let storage: AppStorage | null = null

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
  storage ??= createStorage()
  return storage
}

export function resetStorageForTests() {
  storage = null
}
