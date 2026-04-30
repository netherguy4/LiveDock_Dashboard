import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHostsStore } from '../../../app/stores/hosts.store'

const api = {
  hosts: vi.fn(),
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
  })

  it('loads hosts from api', async () => {
    api.hosts.mockResolvedValue([{ id: 'h1', name: 'prod', url: 'https://prod.example', current: false }])
    const store = useHostsStore()

    await store.load()

    expect(store.items).toHaveLength(1)
    expect(store.activeId).toBe('h1')
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
})
