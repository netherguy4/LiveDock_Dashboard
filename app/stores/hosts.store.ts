// Multi-host support. Backend currently returns a single host; the API is
// shaped as an array so the UI is ready for future multi-host expansion.
//
// Add/remove are kept client-side for now (persisted across reloads via
// pinia-plugin-persistedstate) — once the Go API exposes write endpoints we
// can flip these actions to PUT/DELETE without changing call-sites.

import { defineStore } from 'pinia'
import type { Host } from '~/composables/useApi'
import { STORAGE_KEYS } from '~/constants/storage-keys'

export type LocalHost = Host & {
  status?: 'online' | 'offline' | 'degraded'
  url?: string
  token?: string
}

export const useHostsStore = defineStore('hosts', {
  state: () => ({
    items: [] as LocalHost[],
    activeId: '' as string,
    loading: false,
    error: null as string | null,
    /** Hosts added locally — merged into `items` after `refresh()` */
    localExtras: [] as LocalHost[],
    addDialogOpen: false,
  }),

  getters: {
    active: (s) => s.items.find((h) => h.id === s.activeId) ?? s.items[0] ?? null,
    hasMany: (s) => s.items.length > 1,
    isEmpty: (s) => s.items.length === 0,
  },

  actions: {
    async refresh() {
      this.loading = true
      try {
        const remote = (await useApi().hosts()) as LocalHost[]
        // Mark remote hosts as `online` if status missing — server doesn't
        // emit it today.
        const withStatus = remote.map((h) => ({ status: 'online' as const, ...h }))
        this.items = [...withStatus, ...this.localExtras]
        if (!this.activeId && this.items.length) {
          const cur = this.items.find((h) => h.current) ?? this.items[0]
          this.activeId = cur.id
        }
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
        if (this.localExtras.length) {
          this.items = [...this.localExtras]
          if (!this.activeId) {
            this.activeId = this.localExtras[0].id
          }
        }
      } finally {
        this.loading = false
      }
    },
    select(id: string) {
      this.activeId = id
    },
    add(h: { name: string; url: string; token?: string }) {
      const id = `h${Date.now()}`
      const host: LocalHost = {
        id,
        name: h.name,
        url: h.url,
        token: h.token,
        current: false,
        status: 'online',
      }
      this.localExtras.push(host)
      this.items.push(host)
      this.activeId = id
    },
    remove(id: string) {
      this.items = this.items.filter((h) => h.id !== id)
      this.localExtras = this.localExtras.filter((h) => h.id !== id)
      if (this.activeId === id) {
        this.activeId = this.items[0]?.id ?? ''
      }
    },
    setAddDialogOpen(v: boolean) {
      this.addDialogOpen = v
    },
  },

  persist: [
    {
      key: STORAGE_KEYS.HOSTS_LOCAL,
      pick: ['localExtras', 'activeId'],
      afterHydrate({ store }) {
        const s = store as ReturnType<typeof useHostsStore>
        if (!s.localExtras.length) return
        const ids = new Set(s.items.map((i) => i.id))
        for (const h of s.localExtras) {
          if (!ids.has(h.id)) s.items.push(h)
        }
        if (!s.activeId || !s.items.find((i) => i.id === s.activeId)) {
          s.activeId = s.localExtras[0].id
        }
      },
    },
  ],
})
