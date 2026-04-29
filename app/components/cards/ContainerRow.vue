<script setup lang="ts">
// One row of the containers panel — port of new_frontend ContainerRow
// (App.tsx). Click navigates to the container detail page; action buttons
// stop propagation. Layout matches the parent panel's grid header.

import { Play, Square, RotateCw } from 'lucide-vue-next'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import StatusDot from '~/components/common/StatusDot.vue'
import { ROUTES } from '~/configs/routes.config'
import { CONTAINER_STATUS, normalizeContainerState } from '~/constants/status'
import { humanBytes, pct } from '~/utils/format'
import type { ContainerRow as ContainerRowType, ContainerAction } from '~/composables/useApi'

interface Props {
  container: ContainerRowType
  pendingAction?: ContainerAction | null
}
const props = withDefaults(defineProps<Props>(), {
  pendingAction: null,
})
const emit = defineEmits<{ action: [id: string, action: ContainerAction] }>()

const isPending = computed(() => !!props.pendingAction)

const status = computed(() => normalizeContainerState(props.container.state))
const tone = computed<'success' | 'warn' | 'neutral'>(() => {
  if (isPending.value) return 'warn'
  switch (status.value) {
    case CONTAINER_STATUS.RUNNING: return 'success'
    case CONTAINER_STATUS.DEGRADED: return 'warn'
    default: return 'neutral'
  }
})
const isRunning = computed(() => status.value === CONTAINER_STATUS.RUNNING)
const isStopped = computed(() => status.value === CONTAINER_STATUS.STOPPED)

const pendingLabel = computed(() => {
  switch (props.pendingAction) {
    case 'start': return 'Starting\u2026'
    case 'stop': return 'Stopping\u2026'
    case 'restart': return 'Restarting\u2026'
    default: return ''
  }
})

const cpuStr = computed(() => pct(props.container.stat?.cpu ?? 0, 0))
const memStr = computed(() =>
  props.container.stat ? humanBytes(props.container.stat.mem_used, 0) : '—',
)
const portStr = computed(() => {
  const ps = props.container.ports ?? []
  if (!ps.length) return '—'
  // Take the first numeric port we can find (e.g. "8080/tcp" → "8080").
  for (const p of ps) {
    const m = /(\d+)/.exec(p)
    if (m) return m[1]
  }
  return ps[0]!
})

function trigger(e: Event, action: ContainerAction) {
  e.preventDefault()
  e.stopPropagation()
  emit('action', props.container.id, action)
}
</script>

<template>
  <NuxtLink
    :to="ROUTES.CONTAINER(container.name)"
    class="cont-row"
    :class="{ 'cont-row--pending': isPending }"
  >
    <div class="cont-row__name">
      <StatusDot :status="isPending ? 'warn' : status" :pulse="isPending || isRunning" />
      <div class="cont-row__name-meta">
        <span class="cont-row__title">{{ container.name }}</span>
        <span class="cont-row__image">{{ container.image }}</span>
      </div>
    </div>

    <div class="cont-row__cell">
      <BaseBadge :tone="tone" size="sm">{{
        isPending ? pendingLabel : container.state
      }}</BaseBadge>
    </div>

    <div class="cont-row__cell cont-row__cell--mono">{{ cpuStr }}</div>
    <div class="cont-row__cell cont-row__cell--mono">{{ memStr }}</div>
    <div class="cont-row__cell cont-row__cell--port">{{ portStr }}</div>

    <div v-if="isPending" class="cont-row__actions cont-row__actions--pending">
      <span class="cont-row__spinner" aria-hidden="true" />
      <span class="cont-row__pending-label">{{ pendingLabel }}</span>
    </div>
    <div v-else class="cont-row__actions" @click.prevent.stop>
      <button
        type="button"
        class="cont-row__btn"
        :disabled="!!pendingAction"
        title="Restart"
        @click="trigger($event, 'restart')"
      >
        <RotateCw :size="14" />
      </button>
      <button
        v-if="isStopped"
        type="button"
        class="cont-row__btn cont-row__btn--start"
        :disabled="!!pendingAction"
        title="Start"
        @click="trigger($event, 'start')"
      >
        <Play :size="14" />
      </button>
      <button
        v-else
        type="button"
        class="cont-row__btn cont-row__btn--stop"
        :disabled="!!pendingAction"
        title="Stop"
        @click="trigger($event, 'stop')"
      >
        <Square :size="14" />
      </button>
    </div>
  </NuxtLink>
</template>

<style lang="scss" scoped>
.cont-row {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2fr) 80px 100px;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  align-items: center;
  cursor: pointer;
  color: var(--color-foreground);
  transition: background-color $transition-fast;

  &:hover { background: var(--color-accent); }

  &--pending {
    background: oklch(0.75 0.05 75 / 0.06);
    &:hover { background: oklch(0.75 0.05 75 / 0.10); }
    .theme--dark & {
      background: oklch(0.35 0.05 75 / 0.12);
      &:hover { background: oklch(0.35 0.05 75 / 0.20); }
    }
  }

  &__name {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }
  &__name-meta {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    min-width: 0;
  }
  &__title {
    font-weight: 600;
    font-size: 13px;
    @include truncate;
  }
  &__image {
    font-family: $font-stack-mono;
    font-size: 12px;
    color: var(--color-subtle-foreground);
    @include truncate;
  }

  &__cell {
    font-size: 13px;
    color: var(--color-foreground);
    &--mono { font-family: $font-stack-mono; }
    &--port { color: var(--color-muted-foreground); font-family: $font-stack-mono; }
  }

  &__actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;

    &--pending {
      gap: 6px;
    }
  }

  &__pending-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--amber-500);
    white-space: nowrap;
  }

  &__spinner {
    width: 12px;
    height: 12px;
    border: 2px solid var(--color-border);
    border-top-color: var(--amber-500);
    border-radius: 50%;
    animation: cont-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  &__btn {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-muted-foreground);
    cursor: pointer;
    transition: background-color $transition-fast, color $transition-fast;

    &:hover { background: var(--color-muted); color: var(--color-foreground); }
    &:disabled { opacity: 0.4; cursor: not-allowed; }

    &--start {
      color: var(--emerald-500);
      &:hover { background: var(--color-accent-bg); }
    }
    &--stop {
      color: var(--red-400);
      &:hover { background: oklch(0.637 0.237 25.331 / 0.12); }
    }
  }
}

@keyframes cont-spin {
  to { transform: rotate(360deg); }
}
</style>
