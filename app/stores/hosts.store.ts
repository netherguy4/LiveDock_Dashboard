// Multi-host support. Hosts are managed client-side (persisted in cookies
// via pinia-plugin-persistedstate). Add/remove update both localExtras and
// items; afterHydrate merges them on page load.
// The /api/hosts endpoint is deprecated — the default host is configured
// through environment variables on the proxy layer.

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
    /** Hosts added locally — merged into `items` via afterHydrate */
    localExtras: [] as LocalHost[],
    addDialogOpen: false,
  }),

  getters: {
    active: (s) => s.items.find((h) => h.id === s.activeId) ?? s.items[0] ?? null,
    hasMany: (s) => s.items.length > 1,
    isEmpty: (s) => s.items.length === 0,
  },

  actions: {
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
