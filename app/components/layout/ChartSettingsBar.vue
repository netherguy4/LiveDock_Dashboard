<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { Pause, Play, Clock, ChevronDown } from 'lucide-vue-next'
import { POLLING } from '~/configs/polling.config'
import { useUiStore } from '~/stores/ui.store'

const ui = useUiStore()

const REFRESH_OPTIONS = POLLING.CHOICES_MS.map((ms) => {
  const labels: Record<number, string> = {
    1000: '1 sec', 2000: '2 sec', 5000: '5 sec',
    10_000: '10 sec', 30_000: '30 sec', 60_000: '1 min', 300_000: '5 min',
  }
  return { ms, label: labels[ms] ?? `${ms}ms` }
})

const currentLabel = computed(() =>
  REFRESH_OPTIONS.find((o) => o.ms === ui.intervalMs)?.label ?? `${ui.intervalMs}ms`,
)

const refreshOpen = ref(false)
const refreshRoot = ref<HTMLElement | null>(null)
onClickOutside(refreshRoot, () => { refreshOpen.value = false })

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && refreshOpen.value) refreshOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function pick(ms: number) {
  ui.setInterval(ms)
  refreshOpen.value = false
}
</script>

<template>
  <div class="chart-bar">
    <div ref="refreshRoot" class="chart-bar__group chart-bar__group--refresh">
      <Clock :size="14" class="chart-bar__icon" />
      <span class="chart-bar__cap">Refresh</span>
      <div class="chart-bar__picker" :class="{ 'chart-bar__picker--open': refreshOpen }">
        <button
          type="button"
          class="chart-bar__picker-trigger"
          :aria-expanded="String(refreshOpen)"
          :disabled="ui.paused"
          @click="refreshOpen = !refreshOpen"
        >
          {{ currentLabel }}
          <ChevronDown :size="12" class="chart-bar__picker-caret" />
        </button>
        <div v-if="refreshOpen" class="chart-bar__picker-panel">
          <button
            v-for="o in REFRESH_OPTIONS"
            :key="o.ms"
            type="button"
            class="chart-bar__picker-option"
            :class="{ 'chart-bar__picker-option--active': o.ms === ui.intervalMs }"
            @click="pick(o.ms)"
          >
            {{ o.label }}
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="chart-bar__pause"
      :class="ui.paused ? 'chart-bar__pause--paused' : 'chart-bar__pause--live'"
      @click="ui.togglePaused"
    >
      <Play v-if="ui.paused" :size="14" />
      <Pause v-else :size="14" />
      <span>{{ ui.paused ? 'Resume updates' : 'Pause updates' }}</span>
    </button>

    <div v-if="!ui.paused" class="chart-bar__live">
      <span class="chart-bar__pulse" aria-hidden="true">
        <span class="chart-bar__pulse-ping" />
        <span class="chart-bar__pulse-dot" />
      </span>
      <span class="chart-bar__live-text">live · every {{ currentLabel }}</span>
    </div>

    <div class="chart-bar__toggles">
      <label class="chart-bar__toggle">
        <input v-model="ui.cpuExpanded" type="checkbox" class="chart-bar__toggle-input" role="switch" :aria-checked="String(ui.cpuExpanded)">
        <span class="chart-bar__toggle-track" />
        <span class="chart-bar__toggle-label">Show all CPU cores</span>
      </label>
      <label class="chart-bar__toggle">
        <input v-model="ui.disksExpanded" type="checkbox" class="chart-bar__toggle-input" role="switch" :aria-checked="String(ui.disksExpanded)">
        <span class="chart-bar__toggle-track" />
        <span class="chart-bar__toggle-label">Show all disks</span>
      </label>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chart-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-6);
  padding: var(--space-4);
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);

  &__group {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  &__icon { color: var(--color-muted-foreground); }
  &__cap {
    color: var(--color-muted-foreground);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__picker {
    position: relative;
  }
  &__picker-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 var(--space-3);
    background: var(--color-input-background);
    border: 1px solid var(--color-input-border);
    border-radius: var(--radius-md);
    color: var(--color-foreground);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color $transition-fast, box-shadow $transition-fast;
    white-space: nowrap;

    &:hover:not(:disabled) { border-color: var(--color-ring); }
    &:focus-visible { outline: none; border-color: var(--emerald-500); box-shadow: 0 0 0 3px var(--color-accent-bg); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
  &__picker--open &__picker-trigger {
    border-color: var(--emerald-500);
    box-shadow: 0 0 0 3px var(--color-accent-bg);
  }
  &__picker-caret {
    color: var(--color-subtle-foreground);
    flex-shrink: 0;
    transition: transform $transition-fast;
  }
  &__picker--open &__picker-caret {
    transform: rotate(180deg);
  }
  &__picker-panel {
    position: absolute;
    left: 0;
    top: calc(100% + 6px);
    min-width: 100%;
    background: var(--color-popover);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    z-index: $z-dropdown;
    overflow: hidden;
    padding: var(--space-1);
  }
  &__picker-option {
    display: block;
    width: 100%;
    padding: 6px var(--space-3);
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-foreground);
    cursor: pointer;
    white-space: nowrap;
    transition: background-color $transition-fast;

    &:hover { background: var(--color-accent); }
    &--active {
      color: var(--emerald-500);
      font-weight: var(--fw-semibold);
      background: var(--color-accent-subtle);
      .theme--dark & { color: var(--emerald-300); }
    }
  }

  &__pause {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    height: 36px;
    padding: 0 var(--space-3);
    border: 1px solid transparent;
    border-radius: var(--radius-lg);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color $transition-fast, color $transition-fast;

    &:hover {
      background: var(--color-accent-hover);
    }

    &--live {
      background: var(--color-accent-bg);
      color: var(--emerald-500);
      border-color: var(--color-accent-border);
      .theme--dark & { color: var(--emerald-300); }
    }
    &--paused {
      background: oklch(0.828 0.189 84.429 / 0.12);
      color: var(--amber-500);
      border-color: oklch(0.828 0.189 84.429 / 0.30);
      .theme--dark & { color: var(--amber-300); }
    }
  }

  &__live {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-muted-foreground);
    font-size: 12px;
  }
  &__pulse {
    position: relative;
    display: inline-flex;
    width: 8px;
    height: 8px;
  }
  &__pulse-ping {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: var(--emerald-400);
    opacity: 0.6;
    animation: live-ping 1.5s cubic-bezier(0.22, 0.61, 0.36, 1) infinite;
  }
  &__pulse-dot {
    position: relative;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--emerald-500);
    animation: live-breathe 1.5s cubic-bezier(0.22, 0.61, 0.36, 1) infinite;
  }

  &__toggles {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-5);
    margin-left: auto;
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    user-select: none;
  }
  &__toggle-input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  &__toggle-input:focus-visible + &__toggle-track {
    outline: 2px solid var(--emerald-500);
    outline-offset: 2px;
  }
  &__toggle-track {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 18px;
    border-radius: 999px;
    background: var(--color-track);
    transition: background-color $transition-fast;

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-primary-foreground);
      box-shadow: var(--shadow-sm);
      transition: transform $transition-fast;
    }
  }
  &__toggle-input:checked + &__toggle-track {
    background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
    &::after { transform: translateX(14px); }
  }

  &__toggle-label {
    color: var(--color-muted-foreground);
    font-size: 13px;
  }
}

@keyframes live-ping {
  0%   { transform: scale(0.85); opacity: 0; }
  8%   { opacity: 0.65; }
  60%  { transform: scale(2.1); opacity: 0.12; }
  75%  { transform: scale(2.3); opacity: 0; }
  100% { transform: scale(2.3); opacity: 0; }
}

@keyframes live-breathe {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.12); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .chart-bar__pulse-ping,
  .chart-bar__pulse-dot { animation: none; }
}
</style>
