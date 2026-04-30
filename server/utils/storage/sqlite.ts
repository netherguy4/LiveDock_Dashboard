import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'
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
    close() {
      db.close()
    },

    id: row.id,
    login: row.login,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapHost(row: HostRow): StoredHost {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    url: row.url,
    token: row.token ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function isUniqueLoginError(e: unknown): boolean {
  return e instanceof Error && e.message.includes('UNIQUE constraint failed: users.login')
}

export function createSqliteStorage(dbPath: string): AppStorage {
  mkdirSync(dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      login TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hosts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      token TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)

  return {
    async listUsers() {
      return db.prepare('SELECT * FROM users ORDER BY login ASC').all().map((row) => mapUser(row as UserRow))
    },

    async getUserByLogin(login: string) {
      const row = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as UserRow | undefined
      return row ? mapUser(row) : null
    },

    async createUser(input: CreateUserInput) {
      const now = new Date().toISOString()
      const id = randomUUID()
      try {
        db.prepare(`
          INSERT INTO users (id, login, password_hash, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(id, input.login, input.passwordHash, now, now)
      } catch (e: unknown) {
        if (isUniqueLoginError(e)) throw new Error('login already exists')
        throw e
      }
      return mapUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow)
    },

    async updateUser(id: string, input: UpdateUserInput) {
      const current = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
      if (!current) return null
      const next = {
        login: input.login ?? current.login,
        passwordHash: input.passwordHash ?? current.password_hash,
        updatedAt: new Date().toISOString(),
      }
      try {
        db.prepare(`
          UPDATE users SET login = ?, password_hash = ?, updated_at = ? WHERE id = ?
        `).run(next.login, next.passwordHash, next.updatedAt, id)
      } catch (e: unknown) {
        if (isUniqueLoginError(e)) throw new Error('login already exists')
        throw e
      }
      return mapUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow)
    },

    async deleteUser(id: string) {
      return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0
    },

    async listHosts(userId: string) {
      return db.prepare('SELECT * FROM hosts WHERE user_id = ? ORDER BY created_at ASC')
        .all(userId)
        .map((row) => mapHost(row as HostRow))
    },

    async getHost(userId: string, id: string) {
      const row = db.prepare('SELECT * FROM hosts WHERE user_id = ? AND id = ?').get(userId, id) as HostRow | undefined
      return row ? mapHost(row) : null
    },

    async createHost(userId: string, input: CreateHostInput) {
      const now = new Date().toISOString()
      const id = randomUUID()
      db.prepare(`
        INSERT INTO hosts (id, user_id, name, url, token, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, input.name, input.url, input.token ?? null, now, now)
      return mapHost(db.prepare('SELECT * FROM hosts WHERE id = ?').get(id) as HostRow)
    },

    async updateHost(userId: string, id: string, input: UpdateHostInput) {
      const current = db.prepare('SELECT * FROM hosts WHERE user_id = ? AND id = ?').get(userId, id) as HostRow | undefined
      if (!current) return null
      db.prepare(`
        UPDATE hosts SET name = ?, url = ?, token = ?, updated_at = ? WHERE user_id = ? AND id = ?
      `).run(
        input.name ?? current.name,
        input.url ?? current.url,
        input.token ?? current.token,
        new Date().toISOString(),
        userId,
        id,
      )
      return this.getHost(userId, id)
    },

    async deleteHost(userId: string, id: string) {
      return db.prepare('DELETE FROM hosts WHERE user_id = ? AND id = ?').run(userId, id).changes > 0
    },
  }
}
