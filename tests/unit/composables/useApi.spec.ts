import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApi } from '~/composables/useApi'
import { useHostsStore } from '~/stores/hosts.store'
import type { LocalHost } from '~/stores/hosts.store'

vi.mock('~/stores/hosts.store', () => ({
  useHostsStore: vi.fn(),
}))

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    vi.stubGlobal('useRequestHeaders', vi.fn(() => ({ cookie: 'monitoring_auth=session' })))
  })

  const setupHost = (host: Partial<LocalHost> | null) => {
    vi.mocked(useHostsStore).mockReturnValue({
      active: host,
    } as unknown as ReturnType<typeof useHostsStore>)
  }

  it('calls snapshot with correct headers', async () => {
    setupHost({ id: 'h1' })
    const api = useApi()
    await api.snapshot()

    expect(mockFetch).toHaveBeenCalledWith('/api/snapshot', {
      headers: { 'X-Mon-Host-Id': 'h1' },
    })
  })

  it('calls snapshotForHost with explicit host header', async () => {
    setupHost({ id: 'h1' })
    const api = useApi()
    await api.snapshotForHost('h2')

    expect(mockFetch).toHaveBeenCalledWith('/api/snapshot', {
      headers: { 'X-Mon-Host-Id': 'h2' },
    })
  })

  it('calls history with correct query and headers', async () => {
    setupHost({ id: 'h1' })
    const api = useApi()
    await api.history(30)

    expect(mockFetch).toHaveBeenCalledWith('/api/history', {
      query: { minutes: 30 },
      headers: { 'X-Mon-Host-Id': 'h1' },
    })
  })

  it('calls containers with correct headers', async () => {
    setupHost({ id: 'h1' })
    const api = useApi()
    await api.containers()

    expect(mockFetch).toHaveBeenCalledWith('/api/containers', {
      headers: { 'X-Mon-Host-Id': 'h1' },
    })
  })

  it('calls containerHistory with correct parameters', async () => {
    setupHost({ id: 'h1' })
    const api = useApi()
    await api.containerHistory('test-id', 60)

    expect(mockFetch).toHaveBeenCalledWith('/api/containers/test-id/history', {
      query: { minutes: 60 },
      headers: { 'X-Mon-Host-Id': 'h1' },
    })
  })

  it('calls logs with correct parameters', async () => {
    setupHost({ id: 'h1' })
    const api = useApi()
    await api.logs('test-id', { tail: 500, since: 12345 })

    expect(mockFetch).toHaveBeenCalledWith('/api/containers/test-id/logs', {
      query: { tail: 500, since: 12345 },
      headers: { 'X-Mon-Host-Id': 'h1' },
    })
  })

  it('calls action with correct body and headers', async () => {
    setupHost({ id: 'h1' })
    const api = useApi()
    await api.action('test-id', 'restart')

    expect(mockFetch).toHaveBeenCalledWith('/api/containers/test-id/action', {
      method: 'POST',
      body: { action: 'restart' },
      headers: { 'X-Mon-Host-Id': 'h1' },
    })
  })

  it('calls requests with correct query and headers', async () => {
    setupHost({ id: 'h1' })
    const api = useApi()
    await api.requests(24)

    expect(mockFetch).toHaveBeenCalledWith('/api/requests', {
      query: { hours: 24 },
      headers: { 'X-Mon-Host-Id': 'h1' },
    })
  })

  it('calls pingHost without host headers', async () => {
    setupHost(null)
    const api = useApi()
    await api.pingHost('http://new.host', 'new-token')

    expect(mockFetch).toHaveBeenCalledWith('/api/ping-host', {
      method: 'POST',
      body: { url: 'http://new.host', token: 'new-token' },
    })
  })

  it('calls host crud endpoints', async () => {
    const api = useApi()

    await api.hosts()
    await api.createHost({ name: 'prod', url: 'https://prod.example', token: 'tok' })
    await api.updateHost('h1', { name: 'prod-2', url: 'https://prod2.example' })
    await api.deleteHost('h1')

    expect(mockFetch).toHaveBeenCalledWith('/api/hosts', {
      headers: { cookie: 'monitoring_auth=session' },
    })
    expect(mockFetch).toHaveBeenCalledWith('/api/hosts', {
      method: 'POST',
      body: { name: 'prod', url: 'https://prod.example', token: 'tok' },
    })
    expect(mockFetch).toHaveBeenCalledWith('/api/hosts/h1', {
      method: 'PATCH',
      body: { name: 'prod-2', url: 'https://prod2.example' },
    })
    expect(mockFetch).toHaveBeenCalledWith('/api/hosts/h1', { method: 'DELETE' })
  })

  it('calls admin user endpoints', async () => {
    const api = useApi()

    await api.adminUsers()
    await api.createUser({ login: 'alice', password: 'secret' })
    await api.updateUser('u1', { password: 'new-secret' })
    await api.deleteUser('u1')

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/users', {
      headers: { cookie: 'monitoring_auth=session' },
    })
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/users', {
      method: 'POST',
      body: { login: 'alice', password: 'secret' },
    })
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/u1', {
      method: 'PATCH',
      body: { password: 'new-secret' },
    })
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/u1', { method: 'DELETE' })
  })

  it('handles fetch rejection', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const api = useApi()
    await expect(api.snapshot()).rejects.toThrow('Network error')
  })

  it('handles non-2xx status code', async () => {
    const errorResponse = new Error('Request failed') as Error & { response: { status: number } }
    errorResponse.response = { status: 500 }
    mockFetch.mockRejectedValue(errorResponse)

    const api = useApi()
    await expect(api.snapshot()).rejects.toThrow('Request failed')
  })
})
