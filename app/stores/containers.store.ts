// Container list + actions. Separated from `metrics` because the snapshot
// already includes containers, but we also support standalone refresh and
// keep a richer per-container view (sort/filter prefs, optimistic actions).

import { defineStore } from 'pinia'
import { normalizeContainerState, type ContainerStatus } from '~/constants/status'
import { STORAGE_KEYS } from '~/constants/storage-keys'
import type { ContainerAction, ContainerRow } from '~/composables/useApi'

type SortKey = 'name' | 'status' | 'cpu' | 'mem'
type SortDir = 'asc' | 'desc'

export const useContainersStore = defineStore('containers', {
  state: () => ({
    items: [] as ContainerRow[],
    loading: false,
    error: null as string | null,
    // UI prefs (persisted)
    search: '',
    statusFilter: 'all' as 'all' | ContainerStatus,
    sortKey: 'name' as SortKey,
    sortDir: 'asc' as SortDir,
    // Per-container action state for optimistic UI
    pending: {} as Record<string, ContainerAction>,
  }),

  getters: {
    counts: (s) => {
      const out = { running: 0, degraded: 0, stopped: 0, total: s.items.length }
      for (const c of s.items) {
        const k = normalizeContainerState(c.state)
        out[k]++
      }
      return out
    },

    filtered(state): ContainerRow[] {
      const q = state.search.trim().toLowerCase()
      let list = state.items
      if (q) {
        list = list.filter(
          (c) => c.name.toLowerCase().includes(q) || c.image.toLowerCase().includes(q),
        )
      }
      if (state.statusFilter !== 'all') {
        list = list.filter((c) => normalizeContainerState(c.state) === state.statusFilter)
      }
      return [...list].sort((a, b) => {
        const dir = state.sortDir === 'asc' ? 1 : -1
        switch (state.sortKey) {
          case 'name':
            return a.name.localeCompare(b.name) * dir
          case 'status':
            return normalizeContainerState(a.state).localeCompare(
              normalizeContainerState(b.state),
            ) * dir
          case 'cpu':
            return ((a.stat?.cpu ?? 0) - (b.stat?.cpu ?? 0)) * dir
          case 'mem':
            return ((a.stat?.mem ?? 0) - (b.stat?.mem ?? 0)) * dir
        }
      })
    },

    byName: (s) => (name: string) =>
      s.items.find((c) => c.name === name || c.id === name) ?? null,
  },

  actions: {
    syncFromSnapshot(items: ContainerRow[]) {
      this.items = items
    },

    async refresh() {
      this.loading = true
      try {
        this.items = await useApi().containers()
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
      } finally {
        this.loading = false
      }
    },

    async runAction(id: string, action: ContainerAction) {
      this.pending[id] = action
      try {
        await useApi().action(id, action)
        // Pick up new state on the next polling tick — no manual refetch.
      } finally {
        Reflect.deleteProperty(this.pending, id)
      }
    },

    setSort(key: SortKey) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortKey = key
        this.sortDir = 'asc'
      }
    },
  },

  persist: {
    key: STORAGE_KEYS.CONTAINERS_FILTER,
    pick: ['search', 'statusFilter', 'sortKey', 'sortDir'],
    storage: piniaPluginPersistedstate.localStorage(),
  },
})
