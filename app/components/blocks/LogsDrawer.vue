<script setup lang="ts">
import { Terminal, X } from 'lucide-vue-next'
import { useSwipe } from '@vueuse/core'
import LogsPanel from '~/components/blocks/LogsPanel.vue'
import { useUiStore } from '~/stores/ui.store'

const ui = useUiStore()
const closeBtnRef = ref<HTMLButtonElement | null>(null)
const drawerRef = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && ui.logsDrawerOpen) ui.closeLogsDrawer()
}

watch(
  () => ui.logsDrawerOpen,
  (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      previousFocus = document.activeElement as HTMLElement
      nextTick(() => closeBtnRef.value?.focus())
    } else {
      previousFocus?.focus()
      previousFocus = null
    }
  },
)

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const { isSwiping, lengthX } = useSwipe(drawerRef, {
  threshold: 20,
  onSwipeEnd() {
    if (lengthX.value > 80) ui.closeLogsDrawer()
  },
})

const swipeOffset = computed(() =>
  isSwiping.value && lengthX.value > 0 ? `${Math.min(lengthX.value, 120)}px` : '0',
)
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-backdrop">
      <div
        v-if="ui.logsDrawerOpen"
        class="logs-drawer__backdrop"
        aria-hidden="true"
        @click="ui.closeLogsDrawer"
      />
    </Transition>
    <Transition name="drawer">
      <aside
        v-if="ui.logsDrawerOpen"
        ref="drawerRef"
        class="logs-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Container logs"
        :style="isSwiping && lengthX > 0 ? { transform: `translateX(${swipeOffset})` } : undefined"
      >
        <header class="logs-drawer__head">
          <div class="logs-drawer__title">
            <div class="logs-drawer__icon">
              <Terminal :size="16" />
            </div>
            <span class="logs-drawer__title-text">Live logs</span>
          </div>
          <button
            ref="closeBtnRef"
            type="button"
            class="logs-drawer__close"
            aria-label="Close logs"
            @click="ui.closeLogsDrawer"
          >
            <X :size="16" />
          </button>
        </header>
        <div class="logs-drawer__body">
          <LogsPanel />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.logs-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100dvh;
  width: min(720px, 100vw);
  background: var(--color-card);
  border-left: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  z-index: $z-modal;
  display: flex;
  flex-direction: column;

  &__backdrop {
    position: fixed;
    inset: 0;
    background: oklch(0.16 0.01 250 / 0.55);
    backdrop-filter: blur(4px);
    z-index: $z-overlay;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-divider);
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__title-text {
    font-size: var(--fs-h3);
    font-weight: var(--fw-bold);
    color: var(--color-foreground);
  }

  &__close {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    color: var(--color-muted-foreground);
    border-radius: var(--radius-md);
    cursor: pointer;

    &:hover {
      background: var(--color-accent);
      color: var(--color-foreground);
    }

    &:focus-visible {
      @include focus-ring;
    }
  }

  &__body {
    flex: 1 1 auto;
    overflow: hidden;
    padding: var(--space-4) var(--space-5);
    background: var(--color-background);
  }
}

.drawer-enter-active {
  transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-leave-active {
  transition: transform 200ms $ease-out;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}

.drawer-backdrop-enter-active {
  transition: opacity 220ms $ease-out;
}

.drawer-backdrop-leave-active {
  transition: opacity 160ms $ease-out;
}

.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}
</style>
