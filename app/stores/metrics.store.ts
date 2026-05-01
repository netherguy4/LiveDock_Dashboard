// Snapshot + history state. The single source of truth for live host metrics.
// Polled by the global polling driver in app.vue, never inside components.

import { defineStore } from 'pinia'
import type { HistoryPoint, Snapshot } from '~/composables/useApi'
import { useHostsStore } from '~/stores/hosts.store'

export const useMetricsStore = defineStore('metrics', {
  state: () => ({
    snapshot: null as Snapshot | null,
    history: [] as HistoryPoint[],
    loading: false,
    historyReady: false,
    error: null as string | null,
    lastUpdated: 0,
  }),

  getters: {
    isStale: (s) => s.lastUpdated > 0 && Date.now() - s.lastUpdated > 10_000,
    hostInfo: (s) => s.snapshot?.host ?? null,
    cpuPct: (s) => s.snapshot?.cpu ?? 0,
    memPct: (s) => s.snapshot?.mem_point?.mem ?? 0,
    netBps: (s) => (s.snapshot?.net_rx_bps ?? 0) + (s.snapshot?.net_tx_bps ?? 0),
    diskBps: (s) => (s.snapshot?.disk_read_bps ?? 0) + (s.snapshot?.disk_write_bps ?? 0),
  },

  actions: {
    clear() {
      this.snapshot = null
      this.history = []
      this.loading = false
      this.historyReady = false
      this.error = null
      this.lastUpdated = 0
    },
    async refreshSnapshot() {
      const hosts = useHostsStore()
      this.loading = true
      try {
        this.snapshot = await useApi().snapshot()
        this.lastUpdated = Date.now()
        this.error = null
        hosts.setActiveStatus('online')
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
        hosts.setActiveStatus('offline')
      } finally {
        this.loading = false
      }
    },
    async refreshHistory(minutes = 15) {
      try {
        this.history = await useApi().history(minutes)
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
      } finally {
        this.historyReady = true
      }
    },
  },
})
