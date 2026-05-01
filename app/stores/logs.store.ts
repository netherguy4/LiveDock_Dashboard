// Per-container tail logs with incremental fetching.
// We keep a bounded ring of the last MAX_LINES so memory doesn't blow up
// during long sessions.

import { defineStore } from 'pinia'

const MAX_LINES = 500

interface ContainerLogs {
  lines: string[]
  since: number   // unix nanoseconds — passed to backend on next fetch
}

export const useLogsStore = defineStore('logs', {
  state: () => ({
    byContainer: {} as Record<string, ContainerLogs>,
    activeId: null as string | null,
    error: null as string | null,
  }),

  getters: {
    activeLines: (s) => (s.activeId ? s.byContainer[s.activeId]?.lines ?? [] : []),
  },

  actions: {
    reset() {
      this.byContainer = {}
      this.activeId = null
      this.error = null
    },
    select(id: string | null) {
      this.activeId = id
    },

    async fetchTail(id: string) {
      const cur = this.byContainer[id] ?? { lines: [], since: 0 }
      try {
        const res = await useApi().logs(id, { tail: 200, since: cur.since || undefined })
        const merged = [...cur.lines, ...(res.lines ?? [])]
        const trimmed = merged.length > MAX_LINES ? merged.slice(-MAX_LINES) : merged
        this.byContainer[id] = { lines: trimmed, since: res.fetched }
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
      }
    },

    async refreshActive() {
      if (this.activeId) await this.fetchTail(this.activeId)
    },

    async refreshAll(ids: string[], concurrency = 8) {
      let i = 0
      const workers = Array.from({ length: Math.min(concurrency, ids.length) }, async () => {
        let id: string | undefined
        while ((id = ids[i++])) {
          await this.fetchTail(id).catch(() => {})
        }
      })
      await Promise.all(workers)
    },

    // prefetch warms the cache for a list of containers so opening the logs
    // panel renders instantly. Runs with bounded concurrency; skips containers
    // already cached within the last 30s.
    async prefetch(ids: string[], concurrency = 4) {
      const FRESH_NS = 30_000_000_000 // 30s in ns
      const now = Date.now() * 1_000_000
      const stale = (id: string) => {
        const c = this.byContainer[id]
        return !c || !c.since || now - c.since > FRESH_NS
      }
      const queue = ids.filter(stale)
      const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
        for (;;) {
          const id = queue.shift()
          if (!id) return
          await this.fetchTail(id).catch(() => {})
        }
      })
      await Promise.all(workers)
    },

    clear(id: string) {
      Reflect.deleteProperty(this.byContainer, id)
    },
  },
})
