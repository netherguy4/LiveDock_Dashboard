// All localStorage keys live here so we can rename safely and audit usage.
// Versioned prefix lets us bump and discard stale data without surprises.

const PREFIX = 'monitoring:v1:'

export const STORAGE_KEYS = {
  THEME: `${PREFIX}theme`,
  POLLING: `${PREFIX}polling`,
  SIDEBAR_COLLAPSED: `${PREFIX}sidebar.collapsed`,
  ADVANCED_CHARTS: `${PREFIX}charts.advanced`,
  CPU_EXPANDED: `${PREFIX}cpu.expanded`,
  CONTAINERS_SORT: `${PREFIX}containers.sort`,
  CONTAINERS_FILTER: `${PREFIX}containers.filter`,
  LOGS_AUTOSCROLL: `${PREFIX}logs.autoscroll`,
  HOSTS_LOCAL: `${PREFIX}hosts.local`,
} as const
