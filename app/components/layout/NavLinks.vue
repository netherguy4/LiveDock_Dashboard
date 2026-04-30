<script setup lang="ts">
import { ROUTES } from '~/configs/routes.config'
import { useAuthStore } from '~/stores/auth.store'
import { useHostsStore } from '~/stores/hosts.store'

const route = useRoute()
const auth = useAuthStore()
const hosts = useHostsStore()

const NAV = computed(() => {
  if (auth.kind === 'admin') return [{ label: 'Users', to: ROUTES.USERS }]

  const items = [{ label: 'Dashboard', to: ROUTES.HOME }]
  if (!hosts.isEmpty) items.push({ label: 'Containers', to: ROUTES.CONTAINERS })
  return items
})

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <nav class="nav-links" aria-label="Main">
    <NuxtLink
      v-for="item in NAV"
      :key="item.to"
      :to="item.to"
      class="nav-links__item"
      :class="{ 'nav-links__item--active': isActive(item.to) }"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<style lang="scss" scoped>
.nav-links {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &__item {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 var(--space-3);
    border-radius: var(--radius-lg);
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
    contain: layout;
    transition: background-color 180ms $ease-out, color 180ms $ease-out, box-shadow 220ms $ease-out;

    &:hover {
      background: var(--slate-100);
      color: var(--slate-900);
    }

    .theme--dark & {
      color: var(--slate-300);
      &:hover { background: var(--slate-800); color: var(--slate-100); }
    }

    &--active {
      color: oklch(0.99 0.005 180) !important;
      background: var(--gradient-brand) !important;
      box-shadow: 0 6px 18px -8px rgba(20, 184, 166, 0.5);
      view-transition-name: active-nav-link;
    }
  }
}
</style>
