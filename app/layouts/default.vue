<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import AppFooter from '~/components/layout/AppFooter.vue'
import LogsDrawer from '~/components/blocks/LogsDrawer.vue'
</script>

<template>
  <div class="layout">
    <div class="layout__shell">
      <AppHeader />
      <main class="layout__main">
        <slot />
      </main>
      <AppFooter />
    </div>
    <LogsDrawer />
  </div>
</template>

<style lang="scss" scoped>
.layout {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-background);
  color: var(--color-foreground);

  &__shell {
    max-width: var(--layout-max);
    margin: 0 auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    min-height: inherit;

    @include from($bp-sm) { padding: var(--space-6); }
    @include from($bp-lg) { padding: var(--space-10); }
  }

  &__main {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__shell > :deep(footer) {
    margin-top: var(--space-6);
  }
}
</style>
