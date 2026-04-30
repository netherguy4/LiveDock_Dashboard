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
  })

  const setupHost = (host: Partial<LocalHost> | null) => {
    vi.mocked(useHostsStore).mockReturnValue({
      active: host,
    } as unknown as ReturnType<typeof useHostsStore>)
  }

  it('calls snapshot with correct headers', async () => {
    setupHost({ url: 'http://test.host', token: 'test-token' })
    const api = useApi()
    await api.snapshot()

    expect(mockFetch).toHaveBeenCalledWith('/api/snapshot', {
      headers: { 'X-Mon-Url': 'http://test.host', 'X-Mon-Token': 'test-token' },
    })
  })

  it('calls history with correct query and headers', async () => {
    setupHost({ url: 'http://test.host', token: 'test-token' })
    const api = useApi()
    await api.history(30)

    expect(mockFetch).toHaveBeenCalledWith('/api/history', {
      query: { minutes: 30 },
      headers: { 'X-Mon-Url': 'http://test.host', 'X-Mon-Token': 'test-token' },
    })
  })

  it('calls containers with correct headers', async () => {
    setupHost({ url: 'http://test.host', token: 'test-token' })
    const api = useApi()
    await api.containers()

    expect(mockFetch).toHaveBeenCalledWith('/api/containers', {
      headers: { 'X-Mon-Url': 'http://test.host', 'X-Mon-Token': 'test-token' },
    })
  })

  it('calls containerHistory with correct parameters', async () => {
    setupHost({ url: 'http://test.host', token: 'test-token' })
    const api = useApi()
    await api.containerHistory('test-id', 60)

    expect(mockFetch).toHaveBeenCalledWith('/api/containers/test-id/history', {
      query: { minutes: 60 },
      headers: { 'X-Mon-Url': 'http://test.host', 'X-Mon-Token': 'test-token' },
    })
  })

  it('calls logs with correct parameters', async () => {
    setupHost({ url: 'http://test.host', token: 'test-token' })
    const api = useApi()
    await api.logs('test-id', { tail: 500, since: 12345 })

    expect(mockFetch).toHaveBeenCalledWith('/api/containers/test-id/logs', {
      query: { tail: 500, since: 12345 },
      headers: { 'X-Mon-Url': 'http://test.host', 'X-Mon-Token': 'test-token' },
    })
  })

  it('calls action with correct body and headers', async () => {
    setupHost({ url: 'http://test.host', token: 'test-token' })
    const api = useApi()
    await api.action('test-id', 'restart')

    expect(mockFetch).toHaveBeenCalledWith('/api/containers/test-id/action', {
      method: 'POST',
      body: { action: 'restart' },
      headers: { 'X-Mon-Url': 'http://test.host', 'X-Mon-Token': 'test-token' },
    })
  })

  it('calls requests with correct query and headers', async () => {
    setupHost({ url: 'http://test.host', token: 'test-token' })
    const api = useApi()
    await api.requests(24)

    expect(mockFetch).toHaveBeenCalledWith('/api/requests', {
      query: { hours: 24 },
      headers: { 'X-Mon-Url': 'http://test.host', 'X-Mon-Token': 'test-token' },
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

