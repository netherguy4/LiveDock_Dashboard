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

export type ContainerAction = 'start' | 'stop' | 'restart'
