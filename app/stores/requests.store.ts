// API requests/min — drives the 12h bar chart. Polled separately because
// the data only changes once per minute.

import { defineStore } from 'pinia'
import type { RequestsPoint } from '~/composables/useApi'

export const useRequestsStore = defineStore('requests', {
  state: () => ({
    points: [] as RequestsPoint[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    total: (s) => s.points.reduce((sum, p) => sum + p.count, 0),
    perMin: (s) => {
      if (!s.points.length) return 0
      // Average over the last 60 minutes for the headline number.
      const tail = s.points.slice(-60)
      return tail.reduce((sum, p) => sum + p.count, 0) / tail.length
    },
  },

  actions: {
    async refresh(hours = 12) {
      this.loading = true
      try {
        this.points = await useApi().requests(hours)
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
      } finally {
        this.loading = false
      }
    },
  },
})
