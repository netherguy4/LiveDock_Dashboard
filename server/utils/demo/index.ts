import {
  mockCpu, mockCpuPerCore, mockMemory, mockNetworkRxBps, mockNetworkTxBps,
  mockDiskBps, mockLoad, mockRequests,
} from './metrics'

const CONTAINERS = [
  { id: 'c001', name: 'nginx', image: 'nginx:1.25' },
  { id: 'c002', name: 'postgres-14', image: 'postgres:14' },
  { id: 'c003', name: 'redis', image: 'redis:7' },
  { id: 'c004', name: 'node-api', image: 'node:22-alpine' },
  { id: 'c005', name: 'worker', image: 'node:22-alpine' },
]

const LOG_LINES = [
  { level: 'info', msg: 'GET /api/users 200 12ms' },
  { level: 'info', msg: 'POST /api/login 201 45ms' },
  { level: 'info', msg: 'GET /api/containers 200 8ms' },
  { level: 'warn', msg: 'Retry attempt 2/5 for upstream backend:8080' },
  { level: 'warn', msg: 'Connection pool at 85% capacity' },
  { level: 'error', msg: 'Timeout connecting to redis:6379 after 5000ms' },
  { level: 'info', msg: 'Healthcheck passed — all dependencies up' },
  { level: 'info', msg: 'Worker queue processed job #1427 in 340ms' },
  { level: 'error', msg: 'Disk usage on /data exceeds 90% threshold' },
  { level: 'info', msg: 'Cache invalidated for key "user:sessions:*"' },
  { level: 'warn', msg: 'Slow query detected (3200ms): SELECT * FROM events WHERE...' },
  { level: 'info', msg: 'WebSocket client disconnected (idle timeout)' },
  { level: 'info', msg: 'Scheduled task "cleanup" completed in 230ms' },
  { level: 'error', msg: 'ECONNREFUSED 127.0.0.1:5432 — PostgreSQL not reachable' },
  { level: 'info', msg: 'TLS certificate renewed, restarting listener' },
]

const containerOverrides: Record<string, { state: string; status: string }> = {}
const containerTimers: Record<string, ReturnType<typeof setTimeout>> = {}

const ACTION_DELAY_MS = 1500
const TRANSITION_DELAY_MS = 3000

const TRANSITION_STATUS: Record<string, string> = {
  start: 'Starting...',
  stop: 'Stopping...',
  restart: 'Restarting...',
}

const FINAL_STATE: Record<string, { state: string; status: string }> = {
  start: { state: 'running', status: 'Up 2 seconds' },
  stop: { state: 'exited', status: 'Exited (0) 2 seconds ago' },
  restart: { state: 'running', status: 'Up 3 seconds (restarted)' },
}

function applyContainerAction(id: string, action: string) {
  if (!CONTAINERS.some((c) => c.id === id)) return

  if (containerTimers[id]) {
    clearTimeout(containerTimers[id])
  }

  containerOverrides[id] = { state: 'restarting', status: TRANSITION_STATUS[action] ?? 'Transitioning...' }

  containerTimers[id] = setTimeout(() => {
    const final = FINAL_STATE[action]
    if (final) containerOverrides[id] = final
    Reflect.deleteProperty(containerTimers, id)
  }, TRANSITION_DELAY_MS)
}

function getContainerStatus(now: number, id: string, index: number): { state: string; status: string } {
  if (containerOverrides[id]) return containerOverrides[id]
  const cycle = Math.floor(now / 120_000) % CONTAINERS.length
  if (index === cycle) return { state: 'exited', status: 'Exited (0) 5 seconds ago' }
  return { state: 'running', status: 'Up 3 hours' }
}

function generateSnapshot(now: number) {
  const cpu = mockCpu(now)
  const mem = mockMemory(now)
  return {
    ts: new Date(now).toISOString(),
    host: {
      hostname: 'demo-server',
      os: 'linux',
      platform: 'ubuntu',
      platform_version: '24.04',
      kernel_version: '6.8.0-52-generic',
      uptime_seconds: 604800,
      cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
      cpu_cores: 8,
    },
    cpu,
    cpu_per_core: mockCpuPerCore(now, 8),
    mem_point: { mem: mem.mem, mem_used: mem.mem_used, mem_total: mem.mem_total },
    load: mockLoad(now),
    net_rx_bps: Math.round(mockNetworkRxBps(now)),
    net_tx_bps: Math.round(mockNetworkTxBps(now)),
    disk_read_bps: Math.round(mockDiskBps(now)),
    disk_write_bps: Math.round(mockDiskBps(now + 10000) * 0.6),
    disks: [
      { path: '/', device: '/dev/sda1', total: 100 * 1024 * 1024 * 1024, used: 35 * 1024 * 1024 * 1024, used_pct: 35 },
      { path: '/data', device: '/dev/sdb1', total: 500 * 1024 * 1024 * 1024, used: 210 * 1024 * 1024 * 1024, used_pct: 42 },
    ],
    containers: generateContainerRows(now),
  }
}

function generateContainerRows(now: number) {
  return CONTAINERS.map((c, i) => {
    const { state, status } = getContainerStatus(now, c.id, i)
    const cpu = mockCpu(now + i * 5000) / 5
    const mem = mockMemory(now + i * 3000)
    return {
      id: c.id,
      name: c.name,
      image: c.image,
      state,
      status,
      created: Math.floor((now - 7 * 86400_000) / 1000),
      state_ts: Math.floor((now - 10000) / 1000),
      ports: i === 0 ? ['0.0.0.0:80->80/tcp', '0.0.0.0:443->443/tcp'] : undefined,
      stat: state === 'running' ? {
        cpu,
        mem: mem.mem,
        mem_used: mem.mem_used / 5,
        mem_limit: mem.mem_total / 5,
        net_rx: 1024 * 1024 * 100,
        net_tx: 1024 * 1024 * 50,
        net_rx_bps: Math.round(mockNetworkRxBps(now + i * 2000) / 5),
        net_tx_bps: Math.round(mockNetworkTxBps(now + i * 2000) / 5),
        blk_read: 1024 * 1024 * 20,
        blk_write: 1024 * 1024 * 10,
      } : undefined,
    }
  })
}

function generateHistory(now: number, minutes: number) {
  const points = minutes * 1
  const result = []
  for (let i = 0; i < points; i++) {
    const t = now - (points - i) * 60_000
    const cpu = mockCpu(t)
    result.push({
      ts: new Date(t).toISOString(),
      cpu,
      cpu_per_core: mockCpuPerCore(t, 8),
      mem: mockMemory(t).mem,
      mem_used: mockMemory(t).mem_used,
      mem_total: mockMemory(t).mem_total,
      net_rx_bps: Math.round(mockNetworkRxBps(t)),
      net_tx_bps: Math.round(mockNetworkTxBps(t)),
      disk_read_bps: Math.round(mockDiskBps(t)),
      disk_write_bps: Math.round(mockDiskBps(t + 10000) * 0.6),
      load1: mockLoad(t)[0],
      load5: mockLoad(t)[1],
      load15: mockLoad(t)[2],
    })
  }
  return result
}

function generateContainerHistory(id: string, now: number, minutes: number) {
  const idx = CONTAINERS.findIndex((c) => c.id === id)
  const offset = idx >= 0 ? idx * 3000 : 0
  const points = minutes * 1
  const result = []
  for (let i = 0; i < points; i++) {
    const t = now - (points - i) * 60_000
    const mem = mockMemory(t + offset)
    result.push({
      ts: new Date(t).toISOString(),
      cpu: mockCpu(t + offset) / 5,
      mem: mem.mem,
      mem_used: mem.mem_used / 5,
      mem_limit: mem.mem_total / 5,
      net_rx_bps: Math.round(mockNetworkRxBps(t + offset) / 5),
      net_tx_bps: Math.round(mockNetworkTxBps(t + offset) / 5),
    })
  }
  return result
}

function generateLogs(id: string, _now: number, tail: number) {
  const idx = CONTAINERS.findIndex((c) => c.id === id)
  const containerName = CONTAINERS[idx]?.name ?? 'unknown'
  const count = Math.min(tail || 200, 500)
  const lines: string[] = []
  for (let i = 0; i < count; i++) {
    const template = LOG_LINES[i % LOG_LINES.length]
    const ts = new Date(Date.now() - (count - i) * 2000).toISOString()
    const prefix = `[${containerName}] `
    lines.push(`${ts} ${template.level.toUpperCase()} ${prefix}${template.msg}`)
  }
  return { lines, fetched: Date.now() * 1_000_000 }
}

function generateRequests(now: number, hours: number) {
  return mockRequests(now, hours)
}

export function generateDemoData(path: string, query: Record<string, unknown>, method?: string, body?: unknown): unknown {
  const now = Date.now()

  if (path === 'snapshot') return generateSnapshot(now)
  if (path === 'history') return generateHistory(now, Number(query.minutes) || 15)
  if (path === 'containers') return generateContainerRows(now)
  if (path === 'requests') return generateRequests(now, Number(query.hours) || 12)

  const containerHistoryMatch = path.match(/^containers\/([^/]+)\/history$/)
  if (containerHistoryMatch) {
    return generateContainerHistory(containerHistoryMatch[1], now, Number(query.minutes) || 15)
  }

  const containerLogsMatch = path.match(/^containers\/([^/]+)\/logs$/)
  if (containerLogsMatch) {
    return generateLogs(containerLogsMatch[1], now, Number(query.tail) || 200)
  }

  const containerActionMatch = path.match(/^containers\/([^/]+)\/action$/)
  if (containerActionMatch) {
    if (method === 'POST') {
      const actionBody = body as { action?: string } | undefined
      if (actionBody?.action) {
        applyContainerAction(containerActionMatch[1], actionBody.action)
        return new Promise<void>((resolve) => setTimeout(resolve, ACTION_DELAY_MS))
          .then(() => ({ ok: true }))
      }
    }
    return { ok: true }
  }

  if (path === 'ping-host') {
    return { ok: true }
  }

  return { error: `no demo data for path: ${path}` }
}
