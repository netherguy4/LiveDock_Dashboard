<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const { isDark, toggle } = useTheme()

const prefersReducedMotion = () => (
  import.meta.client
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

const onClick = (event: MouseEvent) => {
  if (!import.meta.client || prefersReducedMotion() || !('startViewTransition' in document)) {
    toggle()
    return
  }

  const root = document.documentElement
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = Math.round(rect.left + rect.width / 2)
  const y = Math.round(rect.top + rect.height / 2)
  const maxX = Math.max(x, window.innerWidth - x)
  const maxY = Math.max(y, window.innerHeight - y)
  const radius = Math.ceil(Math.hypot(maxX, maxY))
  const transitionDocument = document as Document & {
    startViewTransition: (callback: () => void) => {
      finished: Promise<void>
    }
  }

  root.style.setProperty('--theme-wave-x', `${x}px`)
  root.style.setProperty('--theme-wave-y', `${y}px`)
  root.style.setProperty('--theme-wave-radius', `${radius}px`)
  root.classList.add('theme-wave-transition')

  const transition = transitionDocument.startViewTransition(() => {
    toggle()
  })

  transition.finished.finally(() => {
    root.classList.remove('theme-wave-transition')
  })
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? 'Light theme' : 'Dark theme'"
    @click="onClick"
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
  transition: opacity 180ms $ease-out, transform 220ms $ease-out;
}
.icon-swap-leave-active {
  transition: opacity 120ms $ease-out, transform 160ms $ease-out;
}
.icon-swap-enter-from {
  opacity: 0;
  transform: translateY(3px) rotate(-42deg) scale(0.72);
}
.icon-swap-enter-to,
.icon-swap-leave-from {
  opacity: 1;
  transform: translateY(0) rotate(0deg) scale(1);
}
.icon-swap-leave-to {
  opacity: 0;
  transform: translateY(-3px) rotate(42deg) scale(0.72);
}
</style>
