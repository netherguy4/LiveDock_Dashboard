import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMetricsStore } from '../../../app/stores/metrics.store'
import { useHostsStore } from '../../../app/stores/hosts.store'

const api = {
  snapshot: vi.fn(),
  history: vi.fn(),
}

vi.mock('~/composables/useApi', () => ({
  useApi: () => api,
}))

describe('metrics store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('marks active host online after successful snapshot refresh', async () => {
    api.snapshot.mockResolvedValue({
      ts: '2026-05-01T00:00:00.000Z',
      host: {
        hostname: 'prod-1',
        os: 'linux',
        platform: 'ubuntu',
        platform_version: '22.04',
        kernel_version: '6.8',
        uptime_seconds: 120,
        cpu_model: 'test',
        cpu_cores: 4,
      },
      cpu: 20,
      cpu_per_core: [20, 20, 20, 20],
      mem_point: { mem: 10, mem_used: 1, mem_total: 10 },
      load: [0.1, 0.2, 0.3],
      net_rx_bps: 1,
      net_tx_bps: 1,
      disk_read_bps: 1,
      disk_write_bps: 1,
      disks: [],
      containers: [],
    })

    const hosts = useHostsStore()
    hosts.items = [{ id: 'h1', name: 'prod', url: 'https://prod.example', current: false }]
    hosts.activeId = 'h1'

    const metrics = useMetricsStore()
    await metrics.refreshSnapshot()

    expect(hosts.active?.status).toBe('online')
    expect(metrics.error).toBeNull()
  })

  it('marks active host offline when snapshot refresh fails', async () => {
    api.snapshot.mockRejectedValue(new Error('proxy error'))

    const hosts = useHostsStore()
    hosts.items = [{ id: 'h1', name: 'prod', url: 'https://prod.example', current: false }]
    hosts.activeId = 'h1'

    const metrics = useMetricsStore()
    await metrics.refreshSnapshot()

    expect(hosts.active?.status).toBe('offline')
    expect(metrics.error).toBe('proxy error')
  })

  it('clears snapshot and history state', () => {
    const metrics = useMetricsStore()
    metrics.snapshot = {
      ts: '2026-05-01T00:00:00.000Z',
      host: {
        hostname: 'prod-1',
        os: 'linux',
        platform: 'ubuntu',
        platform_version: '22.04',
        kernel_version: '6.8',
        uptime_seconds: 120,
        cpu_model: 'test',
        cpu_cores: 4,
      },
      cpu: 20,
      cpu_per_core: [20, 20, 20, 20],
      mem_point: { mem: 10, mem_used: 1, mem_total: 10 },
      load: [0.1, 0.2, 0.3],
      net_rx_bps: 1,
      net_tx_bps: 1,
      disk_read_bps: 1,
      disk_write_bps: 1,
      disks: [],
      containers: [],
    }
    metrics.history = [{ ts: 1, cpu: 1, mem: 1, net_rx_bps: 1, net_tx_bps: 1, disk_read_bps: 1, disk_write_bps: 1 }]
    metrics.loading = true
    metrics.historyReady = true
    metrics.error = 'x'
    metrics.lastUpdated = 100

    metrics.clear()

    expect(metrics.snapshot).toBeNull()
    expect(metrics.history).toEqual([])
    expect(metrics.loading).toBe(false)
    expect(metrics.historyReady).toBe(false)
    expect(metrics.error).toBeNull()
    expect(metrics.lastUpdated).toBe(0)
  })
})
