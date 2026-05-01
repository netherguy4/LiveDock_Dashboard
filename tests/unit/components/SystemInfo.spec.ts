import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SystemInfo from '../../../app/components/blocks/SystemInfo.vue'
import { useHostsStore } from '../../../app/stores/hosts.store'
import { useMetricsStore } from '../../../app/stores/metrics.store'
import { useUiStore } from '../../../app/stores/ui.store'

const snapshot = (hostname: string, uptime_seconds: number) => ({
  ts: '2026-05-01T12:00:00.000Z',
  host: {
    hostname,
    os: 'linux',
    platform: 'ubuntu',
    platform_version: '22.04',
    kernel_version: '6.8',
    uptime_seconds,
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

describe('SystemInfo', () => {
  let pinia: ReturnType<typeof createPinia> | null = null
  let container: HTMLDivElement | null = null
  let app: ReturnType<typeof createApp> | null = null

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01T12:00:00.000Z'))
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    app?.unmount()
    container?.remove()
    app = null
    container = null
    pinia = null
    vi.useRealTimers()
  })

  it('updates uptime when the active host changes', async () => {
    const hosts = useHostsStore()
    hosts.items = [
      { id: 'h1', name: 'prod', url: 'https://prod.example', current: false },
      { id: 'h2', name: 'stage', url: 'https://stage.example', current: false },
    ]
    hosts.activeId = 'h1'

    const metrics = useMetricsStore()
    metrics.snapshot = snapshot('prod-1', 120)

    useUiStore().paused = true

    app = createApp(SystemInfo)
    app.use(pinia!)
    app.mount(container!)
    await nextTick()

    expect(container!.textContent).toContain('0d 00h 02m 00s')

    hosts.activeId = 'h2'
    metrics.snapshot = snapshot('stage-1', 7200)
    await nextTick()

    expect(container!.textContent).toContain('0d 02h 00m 00s')
  })
})
