import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUsersStore } from '../../../app/stores/users.store'

const api = {
  adminUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}

vi.mock('~/composables/useApi', () => ({
  useApi: () => api,
}))

describe('users store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads users from admin api', async () => {
    api.adminUsers.mockResolvedValue([{ id: 'u1', login: 'alice', createdAt: '2026-01-01', updatedAt: '2026-01-01' }])
    const store = useUsersStore()

    await store.load()

    expect(store.items).toHaveLength(1)
  })

  it('creates a user and appends it', async () => {
    api.createUser.mockResolvedValue({ id: 'u1', login: 'alice', createdAt: '2026-01-01', updatedAt: '2026-01-01' })
    const store = useUsersStore()

    await store.create({ login: 'alice', password: 'secret' })

    expect(store.items[0].login).toBe('alice')
  })

  it('updates a user in place', async () => {
    api.updateUser.mockResolvedValue({ id: 'u1', login: 'alice2', createdAt: '2026-01-01', updatedAt: '2026-01-02' })
    const store = useUsersStore()
    store.items = [{ id: 'u1', login: 'alice', createdAt: '2026-01-01', updatedAt: '2026-01-01' }]

    await store.update('u1', { login: 'alice2' })

    expect(store.items[0].login).toBe('alice2')
  })

  it('deletes a user', async () => {
    api.deleteUser.mockResolvedValue({ ok: true })
    const store = useUsersStore()
    store.items = [{ id: 'u1', login: 'alice', createdAt: '2026-01-01', updatedAt: '2026-01-01' }]

    await store.remove('u1')

    expect(store.items).toHaveLength(0)
  })

  it('stores api errors', async () => {
    api.adminUsers.mockRejectedValue(new Error('nope'))
    const store = useUsersStore()

    await expect(store.load()).rejects.toThrow('nope')
    expect(store.error).toBe('nope')
  })
})
