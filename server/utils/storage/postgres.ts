import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import type {
  AppStorage,
  CreateHostInput,
  CreateUserInput,
  StoredHost,
  StoredUser,
  UpdateHostInput,
  UpdateUserInput,
} from './types'

type UserRow = {
  id: string
  login: string
  password_hash: string
  created_at: string
  updated_at: string
}

type HostRow = {
  id: string
  user_id: string
  name: string
  url: string
  token: string | null
  created_at: string
  updated_at: string
}

function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    login: row.login,
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function mapHost(row: HostRow): StoredHost {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    url: row.url,
    token: row.token ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function isUniqueLoginError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && e.code === '23505'
}

export function createPostgresStorage(connectionString: string): AppStorage {
  const sql = postgres(connectionString, { max: 1 })
  let schemaPromise: Promise<void> | null = null

  function ensureSchema() {
    schemaPromise ??= (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          login TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS hosts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          token TEXT,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `
    })()
    return schemaPromise
  }

  return {
    async close() {
      await sql.end()
    },

    async listUsers() {
      await ensureSchema()
      const rows = await sql<UserRow[]>`SELECT * FROM users ORDER BY login ASC`
      return rows.map(mapUser)
    },

    async getUserByLogin(login: string) {
      await ensureSchema()
      const [row] = await sql<UserRow[]>`SELECT * FROM users WHERE login = ${login}`
      return row ? mapUser(row) : null
    },

    async createUser(input: CreateUserInput) {
      await ensureSchema()
      const id = randomUUID()
      try {
        const [row] = await sql<UserRow[]>`
          INSERT INTO users (id, login, password_hash, created_at, updated_at)
          VALUES (${id}, ${input.login}, ${input.passwordHash}, NOW(), NOW())
          RETURNING *
        `
        return mapUser(row)
      } catch (e: unknown) {
        if (isUniqueLoginError(e)) throw new Error('login already exists')
        throw e
      }
    },

    async updateUser(id: string, input: UpdateUserInput) {
      await ensureSchema()
      const current = await this.listUsers()
      const user = current.find((item) => item.id === id)
      if (!user) return null
      try {
        const [row] = await sql<UserRow[]>`
          UPDATE users
          SET login = ${input.login ?? user.login},
              password_hash = ${input.passwordHash ?? user.passwordHash},
              updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `
        return row ? mapUser(row) : null
      } catch (e: unknown) {
        if (isUniqueLoginError(e)) throw new Error('login already exists')
        throw e
      }
    },

    async deleteUser(id: string) {
      await ensureSchema()
      const result = await sql`DELETE FROM users WHERE id = ${id}`
      return result.count > 0
    },

    async listHosts(userId: string) {
      await ensureSchema()
      const rows = await sql<HostRow[]>`SELECT * FROM hosts WHERE user_id = ${userId} ORDER BY created_at ASC`
      return rows.map(mapHost)
    },

    async getHost(userId: string, id: string) {
      await ensureSchema()
      const [row] = await sql<HostRow[]>`SELECT * FROM hosts WHERE user_id = ${userId} AND id = ${id}`
      return row ? mapHost(row) : null
    },

    async createHost(userId: string, input: CreateHostInput) {
      await ensureSchema()
      const id = randomUUID()
      const [row] = await sql<HostRow[]>`
        INSERT INTO hosts (id, user_id, name, url, token, created_at, updated_at)
        VALUES (${id}, ${userId}, ${input.name}, ${input.url}, ${input.token ?? null}, NOW(), NOW())
        RETURNING *
      `
      return mapHost(row)
    },

    async updateHost(userId: string, id: string, input: UpdateHostInput) {
      await ensureSchema()
      const current = await this.getHost(userId, id)
      if (!current) return null
      const [row] = await sql<HostRow[]>`
        UPDATE hosts
        SET name = ${input.name ?? current.name},
            url = ${input.url ?? current.url},
            token = ${input.token ?? current.token ?? null},
            updated_at = NOW()
        WHERE user_id = ${userId} AND id = ${id}
        RETURNING *
      `
      return row ? mapHost(row) : null
    },

    async deleteHost(userId: string, id: string) {
      await ensureSchema()
      const result = await sql`DELETE FROM hosts WHERE user_id = ${userId} AND id = ${id}`
      return result.count > 0
    },
  }
}
