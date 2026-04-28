<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const { isDark, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? 'Светлая тема' : 'Тёмная тема'"
    @click="toggle"
  >
    <Transition name="icon-swap" mode="out-in">
      <Sun v-if="isDark" key="sun" :size="16" />
      <Moon v-else key="moon" :size="16" />
    </Transition>
  </button>
</template>

<style lang="scss" scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-foreground);
  cursor: pointer;
  transition: background-color $transition-fast, border-color $transition-fast, color $transition-fast;

  &:hover { background: var(--color-accent); }
}

.icon-swap-enter-active {
  transition: all 150ms $ease-out;
}
.icon-swap-leave-active {
  transition: all 100ms $ease-out;
}
.icon-swap-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}
.icon-swap-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}
</style>
