// Color thresholds for stat cards and progress bars. Mirrors the
// "danger > 85%, warn > 65%, ok else" logic from the old StatCard.

export const THRESHOLDS = {
  CPU_DANGER: 85,
  CPU_WARN: 65,
  MEM_DANGER: 90,
  MEM_WARN: 75,
  DISK_DANGER: 90,
  DISK_WARN: 80,
} as const

export type Tone = 'ok' | 'warn' | 'danger'

export function toneForPct(pct: number, danger: number, warn: number): Tone {
  if (!Number.isFinite(pct)) return 'ok'
  if (pct >= danger) return 'danger'
  if (pct >= warn) return 'warn'
  return 'ok'
}
