import { afterEach, describe, expect, it, vi } from 'vitest'

const sqliteFactory = vi.fn()
const postgresFactory = vi.fn()

vi.mock('../../../server/utils/storage/sqlite', () => ({
  createSqliteStorage: sqliteFactory,
}))

vi.mock('../../../server/utils/storage/postgres', () => ({
  createPostgresStorage: postgresFactory,
}))

describe('storage selection', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    sqliteFactory.mockReset()
    postgresFactory.mockReset()
  })

  it('uses postgres when DATABASE_URL exists', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://example')
    const { createStorage } = await import('../../../server/utils/storage')

    createStorage()

    expect(postgresFactory).toHaveBeenCalledWith('postgres://example')
    expect(sqliteFactory).not.toHaveBeenCalled()
  })

  it('uses postgres when POSTGRES_URL exists', async () => {
    vi.stubEnv('POSTGRES_URL', 'postgres://example-postgres')
    const { createStorage } = await import('../../../server/utils/storage')

    createStorage()

    expect(postgresFactory).toHaveBeenCalledWith('postgres://example-postgres')
    expect(sqliteFactory).not.toHaveBeenCalled()
  })

  it('uses postgres when Supabase DATABASE_POSTGRES_URL exists', async () => {
    vi.stubEnv('DATABASE_POSTGRES_URL', 'postgres://supabase-pooled')
    const { createStorage } = await import('../../../server/utils/storage')

    createStorage()

    expect(postgresFactory).toHaveBeenCalledWith('postgres://supabase-pooled')
    expect(sqliteFactory).not.toHaveBeenCalled()
  })

  it('uses sqlite when no postgres env exists', async () => {
    vi.stubEnv('SQLITE_PATH', '/tmp/livedock.db')
    const { createStorage } = await import('../../../server/utils/storage')

    createStorage()

    expect(sqliteFactory).toHaveBeenCalledWith('/tmp/livedock.db')
  })
})
