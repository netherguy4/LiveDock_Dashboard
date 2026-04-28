// Container state — Docker reports many strings, we normalize to 3 buckets
// for badges/filters and keep the raw string available for tooltips.
export const CONTAINER_STATUS = {
  RUNNING: 'running',
  DEGRADED: 'degraded',
  STOPPED: 'stopped',
} as const

export type ContainerStatus = (typeof CONTAINER_STATUS)[keyof typeof CONTAINER_STATUS]

export function normalizeContainerState(state: string): ContainerStatus {
  const s = state?.toLowerCase() ?? ''
  if (s === 'running') return CONTAINER_STATUS.RUNNING
  if (s === 'restarting' || s === 'paused' || s === 'created') return CONTAINER_STATUS.DEGRADED
  return CONTAINER_STATUS.STOPPED
}

// Log levels used by LogsPanel for color coding.
export const LOG_LEVEL = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL]

// Detect log level from a free-form line (best-effort).
export function detectLogLevel(line: string): LogLevel {
  const m = /\b(error|err|fatal|panic)\b/i.exec(line)
  if (m) return LOG_LEVEL.ERROR
  if (/\b(warn|warning)\b/i.test(line)) return LOG_LEVEL.WARN
  if (/\b(debug|trace)\b/i.test(line)) return LOG_LEVEL.DEBUG
  return LOG_LEVEL.INFO
}
