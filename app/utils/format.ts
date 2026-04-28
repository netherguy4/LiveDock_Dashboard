export function humanBytes(n: number | undefined | null, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let i = 0
  let v = Math.abs(n)
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(digits)} ${units[i]}`
}

export function humanBps(n: number | undefined | null): string {
  return humanBytes(n, 1) + '/s'
}

export function humanDuration(seconds: number | undefined | null): string {
  if (!seconds || seconds < 0) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function pct(n: number | undefined | null, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${n.toFixed(digits)}%`
}

// "18d 07h 42m 11s" — port of formatUptime from new_frontend App.tsx.
export function formatUptime(secs: number | undefined | null): string {
  if (!secs || secs < 0) return '—'
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}
