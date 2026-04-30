import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../../../app/stores/auth.store'

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('$fetch', vi.fn())
  })

  it('should have correct initial state', () => {
    const store = useAuthStore()
    expect(store.isAuthed).toBe(false)
    expect(store.user).toBe('')
    expect(store.checking).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should set isAuthed and user on successful check', async () => {
    const store = useAuthStore()
    const mockFetch = vi.mocked($fetch)
    mockFetch.mockResolvedValue({ authed: true, user: 'test-user' })

    await store.check()

    expect(store.isAuthed).toBe(true)
    expect(store.user).toBe('test-user')
    expect(store.error).toBeNull()
    expect(store.checking).toBe(false)
  })

  it('should set isAuthed to false on failed check', async () => {
    const store = useAuthStore()
    const mockFetch = vi.mocked($fetch)
    mockFetch.mockRejectedValue(new Error('API error'))

    await store.check()

    expect(store.isAuthed).toBe(false)
    expect(store.user).toBe('')
    expect(store.checking).toBe(false)
  })

  it('should set isAuthed to true on successful login', async () => {
    const store = useAuthStore()
    const mockFetch = vi.mocked($fetch)
    // Login succeeds, then check succeeds
    mockFetch.mockResolvedValueOnce({})
    mockFetch.mockResolvedValueOnce({ authed: true, user: 'test-user' })

    await store.login('user', 'pass')

    expect(store.isAuthed).toBe(true)
    expect(store.user).toBe('test-user')
  })

  it('should set error on failed login', async () => {
    const store = useAuthStore()
    const mockFetch = vi.mocked($fetch)
    // Login fails
    mockFetch.mockRejectedValue(new Error('Invalid credentials'))

    await expect(store.login('user', 'pass')).rejects.toThrow('Invalid credentials')
    expect(store.isAuthed).toBe(false)
    expect(store.error).toBe('Invalid credentials')
  })

  it('should reset state on logout', async () => {
    const store = useAuthStore()
    store.isAuthed = true
    store.user = 'user'
    const mockFetch = vi.mocked($fetch)
    mockFetch.mockResolvedValue({})

    await store.logout()

    expect(store.isAuthed).toBe(false)
    expect(store.user).toBe('')
  })
})
