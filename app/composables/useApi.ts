// API types shared across adapters and stores.
// Wire format mirrors what the Go backend emits — DO NOT change here without
// matching backend/internal/{collector,docker,api}.

export type Snapshot = {
  ts: string
  host: {
    hostname: string
    os: string
    platform: string
    platform_version: string
    kernel_version: string
    uptime_seconds: number
    cpu_model: string
    cpu_cores: number
  }
  cpu: number
  cpu_per_core: number[]
  mem_point: {
    mem: number
    mem_used: number
    mem_total: number
  }
  load: [number, number, number]
  net_rx_bps: number
  net_tx_bps: number
  disk_read_bps: number
  disk_write_bps: number
  disks: { path: string; device: string; total: number; used: number; used_pct: number }[]
  containers: ContainerRow[]
}

export type ContainerRow = {
  id: string
  name: string
  image: string
  state: string
  status: string
  created: number
  state_ts: number
  ports?: string[]
  stat?: {
    cpu: number
    mem: number
    mem_used: number
    mem_limit: number
    net_rx: number
    net_tx: number
    net_rx_bps: number
    net_tx_bps: number
    blk_read: number
    blk_write: number
  }
}

export type HistoryPoint = {
  ts: string
  cpu: number
  cpu_per_core: number[]
  mem: number
  mem_used: number
  mem_total: number
  net_rx_bps: number
  net_tx_bps: number
  disk_read_bps: number
  disk_write_bps: number
  load1: number
  load5: number
  load15: number
}

export type ContainerHistoryPoint = {
  ts: string
  cpu: number
  mem: number
  mem_used: number
  mem_limit: number
  net_rx_bps: number
  net_tx_bps: number
}

export type ContainerAction = 'start' | 'stop' | 'restart'

export type LogsResponse = {
  lines: string[]
  fetched: number // unix nanoseconds — pass back as `since` for next poll
}

export type RequestsPoint = {
  ts: number   // unix seconds, truncated to minute
  count: number
}

export type Host = {
  id: string
  name: string
  url: string
  current: boolean
}

// hostHeaders attaches the active host's URL/token to a proxied request so the
// Nuxt server can route to the right backend. Empty if no active host is set.
function hostHeaders(): Record<string, string> {
  // Avoid pulling in the store on the server during SSR — the proxy runs on
  // the server too, so headers are only meaningful for browser-originated calls.
  if (typeof window === 'undefined') return {}
  try {
    const store = useHostsStore()
    const h = store.active
    if (!h || !h.url) return {}
    const out: Record<string, string> = { 'X-Mon-Url': h.url }
    if (h.token) out['X-Mon-Token'] = h.token
    return out
  } catch {
    return {}
  }
}

// Lightweight typed wrapper for $fetch — keeps URLs in one place and avoids
// repeating `as Foo` casts at call sites.
export const useApi = () => {
  const headers = () => hostHeaders()
  return {
    snapshot: () => $fetch<Snapshot>('/api/snapshot', { headers: headers() }),
    history: (minutes = 15) =>
      $fetch<HistoryPoint[]>('/api/history', { query: { minutes }, headers: headers() }),
    containers: () => $fetch<ContainerRow[]>('/api/containers', { headers: headers() }),
    containerHistory: (id: string, minutes = 15) =>
      $fetch<ContainerHistoryPoint[]>(`/api/containers/${encodeURIComponent(id)}/history`, {
        query: { minutes },
        headers: headers(),
      }),
    logs: (id: string, opts: { tail?: number; since?: number } = {}) =>
      $fetch<LogsResponse>(`/api/containers/${encodeURIComponent(id)}/logs`, {
        query: { tail: opts.tail ?? 200, since: opts.since },
        headers: headers(),
      }),
    action: (id: string, action: ContainerAction) =>
      $fetch(`/api/containers/${encodeURIComponent(id)}/action`, {
        method: 'POST',
        body: { action },
        headers: headers(),
      }),
    requests: (hours = 12) =>
      $fetch<RequestsPoint[]>('/api/requests', { query: { hours }, headers: headers() }),
    pingHost: (url: string, token?: string) =>
      $fetch<{ ok: boolean; error?: string }>('/api/ping-host', {
        method: 'POST',
        body: { url, token },
      }),
  }
}
