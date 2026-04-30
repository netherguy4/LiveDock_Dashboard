import { defineStore } from 'pinia'
import type { ManagedUser, UserInput } from '~/composables/useApi'

export const useUsersStore = defineStore('users', {
  state: () => ({
    items: [] as ManagedUser[],
    loading: false,
    saving: false,
    error: null as string | null,
  }),

  actions: {
    async load() {
      this.loading = true
      try {
        this.items = await useApi().adminUsers()
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async create(input: Required<UserInput>) {
      this.saving = true
      try {
        const user = await useApi().createUser(input)
        this.items.push(user)
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
        throw e
      } finally {
        this.saving = false
      }
    },

    async update(id: string, input: UserInput) {
      this.saving = true
      try {
        const user = await useApi().updateUser(id, input)
        const index = this.items.findIndex((item) => item.id === id)
        if (index !== -1) this.items[index] = user
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
        await useApi().deleteUser(id)
        this.items = this.items.filter((item) => item.id !== id)
        this.error = null
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : String(e)
        throw e
      } finally {
        this.saving = false
      }
    },
  },
})
