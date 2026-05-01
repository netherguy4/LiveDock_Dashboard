import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HOST_STATUS_PROBE_TIMEOUT_MS, useHostsStore } from '../../../app/stores/hosts.store'

const api = {
  hosts: vi.fn(),
  snapshotForHost: vi.fn(),
  createHost: vi.fn(),
  updateHost: vi.fn(),
  deleteHost: vi.fn(),
}

vi.mock('~/composables/useApi', () => ({
  useApi: () => api,
}))

describe('hosts store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('loads hosts from api', async () => {
    api.hosts.mockResolvedValue([{ id: 'h1', name: 'prod', url: 'https://prod.example', current: false }])
    const store = useHostsStore()

    await store.load()

    expect(store.items).toHaveLength(1)
    expect(store.activeId).toBe('h1')
    expect(store.loaded).toBe(true)
  })

  it('marks an empty host list as loaded', async () => {
    api.hosts.mockResolvedValue([])
    const store = useHostsStore()

    await store.load()

    expect(store.items).toEqual([])
    expect(store.activeId).toBe('')
    expect(store.loaded).toBe(true)
  })

  it('selects the first host after load when active id is missing', async () => {
    api.hosts.mockResolvedValue([{ id: 'h2', name: 'stage', url: 'https://stage.example', current: false }])
    const store = useHostsStore()
    store.activeId = 'missing'

    await store.load()

    expect(store.activeId).toBe('h2')
  })

  it('creates a host through api and selects it', async () => {
    api.createHost.mockResolvedValue({ id: 'h1', name: 'prod', url: 'https://prod.example', current: false })
    const store = useHostsStore()

    await store.add({ name: 'prod', url: 'https://prod.example', token: 'tok' })

    expect(api.createHost).toHaveBeenCalledWith({ name: 'prod', url: 'https://prod.example', token: 'tok' })
    expect(store.activeId).toBe('h1')
  })

  it('updates a host through api', async () => {
    api.updateHost.mockResolvedValue({ id: 'h1', name: 'prod-2', url: 'https://prod2.example', current: false })
    const store = useHostsStore()
    store.items = [{ id: 'h1', name: 'prod', url: 'https://prod.example', current: false }]

    await store.update('h1', { name: 'prod-2', url: 'https://prod2.example' })

    expect(store.items[0].name).toBe('prod-2')
  })

  it('removes a host through api and moves active id', async () => {
    api.deleteHost.mockResolvedValue({ ok: true })
    const store = useHostsStore()
    store.items = [
      { id: 'h1', name: 'prod', url: 'https://prod.example', current: false },
      { id: 'h2', name: 'stage', url: 'https://stage.example', current: false },
    ]
    store.activeId = 'h1'

    await store.remove('h1')

    expect(api.deleteHost).toHaveBeenCalledWith('h1')
    expect(store.activeId).toBe('h2')
  })

  it('sets status for active host only', () => {
    const store = useHostsStore()
    store.items = [
      { id: 'h1', name: 'prod', url: 'https://prod.example', current: false },
      { id: 'h2', name: 'stage', url: 'https://stage.example', current: false },
    ]
    store.activeId = 'h2'

    store.setActiveStatus('offline')

    expect(store.items[0].status).toBeUndefined()
    expect(store.items[1].status).toBe('offline')
  })

  it('sets status by host id', () => {
    const store = useHostsStore()
    store.items = [
      { id: 'h1', name: 'prod', url: 'https://prod.example', current: false },
      { id: 'h2', name: 'stage', url: 'https://stage.example', current: false },
    ]

    store.setStatus('h1', 'online')

    expect(store.items[0].status).toBe('online')
    expect(store.items[1].status).toBeUndefined()
  })

  it('refreshes statuses for all hosts', async () => {
    api.snapshotForHost.mockImplementation(async (id: string) => {
      if (id === 'h2') throw new Error('unreachable')
      return {
        ts: '2026-05-01T00:00:00.000Z',
      }
    })

    const store = useHostsStore()
    store.items = [
      { id: 'h1', name: 'prod', url: 'https://prod.example', current: false },
      { id: 'h2', name: 'stage', url: 'https://stage.example', current: false },
    ]

    await store.refreshStatuses()

    expect(api.snapshotForHost).toHaveBeenCalledTimes(2)
    expect(store.items[0].status).toBe('online')
    expect(store.items[1].status).toBe('offline')
    expect(store.statusRefreshing).toBe(false)
  })

  it('does not switch hosts to checking during background refresh', async () => {
    let resolveFirst: (() => void) | null = null
    api.snapshotForHost.mockImplementation((id: string) => new Promise((resolve, reject) => {
      if (id === 'h2') {
        reject(new Error('unreachable'))
        return
      }
      resolveFirst = () => resolve({ ts: '2026-05-01T00:00:00.000Z' })
    }))

    const store = useHostsStore()
    store.items = [
      { id: 'h1', name: 'prod', url: 'https://prod.example', current: false, status: 'online' },
      { id: 'h2', name: 'stage', url: 'https://stage.example', current: false, status: 'offline' },
    ]

    const pending = store.refreshStatuses()
    await Promise.resolve()

    expect(store.items[0].status).toBe('online')
    expect(store.items[1].status).toBe('offline')

    resolveFirst?.()
    await pending

    expect(store.items[0].status).toBe('online')
    expect(store.items[1].status).toBe('offline')
  })

  it('sets checking for unknown statuses while refresh is in flight', async () => {
    let resolveFirst: (() => void) | null = null
    let resolveSecond: (() => void) | null = null
    api.snapshotForHost.mockImplementation((id: string) => new Promise((resolve) => {
      if (id === 'h1') {
        resolveFirst = () => resolve({ ts: '2026-05-01T00:00:00.000Z' })
        return
      }
      resolveSecond = () => resolve({ ts: '2026-05-01T00:00:00.000Z' })
    }))

    const store = useHostsStore()
    store.items = [
      { id: 'h1', name: 'prod', url: 'https://prod.example', current: false },
      { id: 'h2', name: 'stage', url: 'https://stage.example', current: false },
    ]

    const pending = store.refreshStatuses()
    await Promise.resolve()

    expect(store.items[0].status).toBe('checking')
    expect(store.items[1].status).toBe('checking')

    resolveFirst?.()
    resolveSecond?.()
    await pending

    expect(store.items[0].status).toBe('online')
    expect(store.items[1].status).toBe('online')
  })

  it('marks a host offline when status probe times out', async () => {
    vi.useFakeTimers()
    api.snapshotForHost.mockImplementation(() => new Promise(() => {}))

    const store = useHostsStore()
    store.items = [
      { id: 'h1', name: 'prod', url: 'https://prod.example', current: false },
    ]

    const pending = store.refreshStatuses()
    await Promise.resolve()

    expect(store.items[0].status).toBe('checking')

    await vi.advanceTimersByTimeAsync(HOST_STATUS_PROBE_TIMEOUT_MS + 1)
    await pending

    expect(store.items[0].status).toBe('offline')
    expect(store.statusRefreshing).toBe(false)
  })
})
