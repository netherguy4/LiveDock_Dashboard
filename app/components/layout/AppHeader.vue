<script setup lang="ts">
// Top header — visual port of new_frontend Root() header. LogoFull on the
// left next to the main nav, host switcher / theme toggle / logout on the
// right. Stays inside the page container (no sticky bar — matches the
// React reference where the header scrolls with the rest).
//
// Layout follows new_frontend exactly: nav stays inline next to the logo
// on every viewport (wraps onto a second line on narrow screens via
// flex-wrap), the right cluster keeps host / theme / logout always
// visible too. No burger menu — the design has none.

import { LogOut } from 'lucide-vue-next'
import Logo from '~/components/common/Logo.vue'
import NavLinks from '~/components/layout/NavLinks.vue'
import HostSwitcher from '~/components/layout/HostSwitcher.vue'
import ThemeToggle from '~/components/layout/ThemeToggle.vue'
import { ROUTES } from '~/configs/routes.config'
import { useAuthStore } from '~/stores/auth.store'

const auth = useAuthStore()
const router = useRouter()
const { isDark } = useTheme()

async function logout() {
  await auth.logout()
  router.push(ROUTES.LOGIN)
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__left">
      <Logo layout="full" size="md" :on-dark="isDark" />
      <NavLinks />
    </div>

    <div class="app-header__right">
      <HostSwitcher v-if="auth.kind === 'user'" />
      <ThemeToggle />
      <button type="button" class="app-header__logout" @click="logout">
        <LogOut :size="14" />
        <span>Log out</span>
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-8);

  @include from($bp-sm) { margin-bottom: var(--space-12); }

  &__left, &__right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
    min-width: 0;
  }
  &__left { gap: var(--space-3); @include from($bp-sm) { gap: var(--space-6); } }

  &__logout {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 40px;
    padding: 0 var(--space-3);
    border-radius: var(--radius-lg);
    border: 0;
    background: var(--color-muted);
    color: var(--color-muted-foreground);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color $transition-fast, color $transition-fast;

    &:hover { background: var(--color-accent); color: var(--color-foreground); }
  }
}
</style>
