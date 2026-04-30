import { defineStore } from 'pinia'
import type { Host, HostInput } from '~/composables/useApi'
import { STORAGE_KEYS } from '~/constants/storage-keys'

export type LocalHost = Host & {
  status?: 'online' | 'offline' | 'degraded'
}

export const useHostsStore = defineStore('hosts', {
  state: () => ({
    items: [] as LocalHost[],
    activeId: '' as string,
    loading: false,
    loaded: false,
    saving: false,
    error: null as string | null,
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
    reset() {
      this.items = []
      this.activeId = ''
      this.loading = false
      this.loaded = false
      this.saving = false
      this.error = null
    },
    async load() {
      this.loading = true
      try {
        this.items = await useApi().hosts()
        if (!this.activeId || !this.items.find((h) => h.id === this.activeId)) {
          this.activeId = this.items[0]?.id ?? ''
        }
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
        throw e
      } finally {
        this.loaded = true
        this.loading = false
      }
    },
    async add(h: HostInput) {
      this.saving = true
      try {
        const host = await useApi().createHost(h)
        this.items.push(host)
        this.activeId = host.id
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
        throw e
      } finally {
        this.saving = false
      }
    },
    async remove(id: string) {
      this.saving = true
      try {
        await useApi().deleteHost(id)
        this.items = this.items.filter((h) => h.id !== id)
        if (this.activeId === id) {
          this.activeId = this.items[0]?.id ?? ''
        }
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
        throw e
      } finally {
        this.saving = false
      }
    },
    removeLocal(id: string) {
      this.items = this.items.filter((h) => h.id !== id)
      if (this.activeId === id) {
        this.activeId = this.items[0]?.id ?? ''
      }
    },
    setAddDialogOpen(v: boolean) {
      this.addDialogOpen = v
    },
    async update(id: string, h: HostInput) {
      this.saving = true
      try {
        const host = await useApi().updateHost(id, h)
        const index = this.items.findIndex((item) => item.id === id)
        if (index !== -1) {
          this.items[index] = host
        }
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
        throw e
      } finally {
        this.saving = false
      }
    },
  },

  persist: [
    {
      key: STORAGE_KEYS.HOSTS_ACTIVE,
      pick: ['activeId'],
    },
  ],
})
