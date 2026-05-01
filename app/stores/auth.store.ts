// Auth state — backed by an httpOnly session cookie set by /api/login.
// We never see the cookie value in JS; the store just tracks whether the
// session is valid (verified via GET /api/me on first load).
//
// During SSR, $fetch does NOT forward the incoming user's cookies by
// default — we have to grab them via useRequestHeaders() and pass them
// through, otherwise /api/me always reports unauthenticated on the server
// and the global auth middleware redirects to /login for a split second
// before the client re-checks with real cookies.

import { defineStore } from 'pinia'

function authedFetch<T>(url: string, opts?: Parameters<typeof $fetch>[1]): Promise<T> {
  // useRequestHeaders is server-side only; on client it returns {} and
  // $fetch defaults to credentials: 'same-origin' (browser sends cookies).
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  return $fetch<T>(url, { ...opts, headers: { ...(opts?.headers as object), ...headers } })
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthed: false,
    user: '' as string,
    kind: null as 'admin' | 'user' | null,
    userId: null as string | null,
    demo: false,
    checking: false,
    error: null as string | null,
  }),

  actions: {
    async check() {
      this.checking = true
      try {
        const res = await authedFetch<{
          authed: boolean
          user: string
          kind: 'admin' | 'user' | null
          userId: string | null
          demo: boolean
        }>('/api/me')
        this.isAuthed = res.authed
        this.user = res.user
        this.kind = res.kind
        this.userId = res.userId
        this.demo = res.demo
        this.error = null
      } catch {
        this.isAuthed = false
        this.user = ''
        this.kind = null
        this.userId = null
        this.demo = false
      } finally {
        this.checking = false
      }
    },

    async login(login: string, password: string) {
      try {
        await $fetch('/api/login', { method: 'POST', body: { login, password } })
        await this.check()
        if (!this.isAuthed) throw new Error('Invalid credentials')
        this.error = null
      } catch (e: unknown) {
        this.isAuthed = false
        this.user = ''
        this.kind = null
        this.userId = null
        this.demo = false
        this.error = e instanceof Error ? e.message : String(e)
        throw e
      }
    },

    async logout() {
      try {
        await $fetch('/api/logout', { method: 'POST' })
      } finally {
        this.isAuthed = false
        this.user = ''
        this.kind = null
        this.userId = null
        this.demo = false
      }
    },
  },
})
