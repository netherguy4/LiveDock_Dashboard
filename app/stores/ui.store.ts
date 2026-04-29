// UI prefs that don't belong to a specific data store: sidebar state,
// chart toggles, polling interval/paused, theme, etc.
// Persisted via pinia-plugin-persistedstate.

import { defineStore } from 'pinia'
import { POLLING } from '~/configs/polling.config'
import { STORAGE_KEYS } from '~/constants/storage-keys'

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarCollapsed: false,
    advancedCharts: false,
    cpuExpanded: false,
    disksExpanded: false,
    logsAutoScroll: true,
    intervalMs: POLLING.DEFAULT_MS,
    paused: false,
    logsDrawerOpen: false,
    mobileNavOpen: false,
    booted: false,
  }),

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    toggleLogsDrawer() {
      this.logsDrawerOpen = !this.logsDrawerOpen
    },
    openLogsDrawer() {
      this.logsDrawerOpen = true
    },
    closeLogsDrawer() {
      this.logsDrawerOpen = false
    },
    toggleMobileNav() {
      this.mobileNavOpen = !this.mobileNavOpen
    },
    closeMobileNav() {
      this.mobileNavOpen = false
    },
    setInterval(ms: number) {
      this.intervalMs = Math.min(Math.max(ms, POLLING.MIN_MS), POLLING.MAX_MS)
    },
    togglePaused() {
      this.paused = !this.paused
    },
  },

  persist: [
    { key: STORAGE_KEYS.SIDEBAR_COLLAPSED, pick: ['sidebarCollapsed'], storage: piniaPluginPersistedstate.localStorage() },
    { key: STORAGE_KEYS.ADVANCED_CHARTS, pick: ['advancedCharts'], storage: piniaPluginPersistedstate.localStorage() },
    { key: STORAGE_KEYS.CPU_EXPANDED, pick: ['cpuExpanded', 'disksExpanded'], storage: piniaPluginPersistedstate.localStorage() },
    { key: STORAGE_KEYS.POLLING, pick: ['intervalMs', 'paused'], storage: piniaPluginPersistedstate.localStorage() },
  ],
})
