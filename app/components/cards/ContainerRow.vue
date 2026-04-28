<script setup lang="ts">
// One row of the containers panel — port of new_frontend ContainerRow
// (App.tsx). Click navigates to the container detail page; action buttons
// stop propagation. Layout matches the parent panel's grid header.

import { Play, Square, RotateCw, ExternalLink } from 'lucide-vue-next'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import StatusDot from '~/components/common/StatusDot.vue'
import { ROUTES } from '~/configs/routes.config'
import { CONTAINER_STATUS, normalizeContainerState } from '~/constants/status'
import { humanBytes, pct } from '~/utils/format'
import type { ContainerRow as ContainerRowType, ContainerAction } from '~/composables/useApi'

interface Props {
  container: ContainerRowType
  tunnels?: string[]
  pendingAction?: ContainerAction | null
}
const props = withDefaults(defineProps<Props>(), {
  tunnels: () => [],
  pendingAction: null,
})
const emit = defineEmits<{ action: [id: string, action: ContainerAction] }>()

const status = computed(() => normalizeContainerState(props.container.state))
const tone = computed<'success' | 'warn' | 'neutral'>(() => {
  switch (status.value) {
    case CONTAINER_STATUS.RUNNING: return 'success'
    case CONTAINER_STATUS.DEGRADED: return 'warn'
    default: return 'neutral'
  }
})
const isRunning = computed(() => status.value === CONTAINER_STATUS.RUNNING)
const isStopped = computed(() => status.value === CONTAINER_STATUS.STOPPED)

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
  e.stopPropagation()
  emit('action', props.container.id, action)
}
</script>

<template>
  <NuxtLink :to="ROUTES.CONTAINER(container.name)" class="cont-row">
    <div class="cont-row__name">
      <StatusDot :status="status" :pulse="isRunning" />
      <div class="cont-row__name-meta">
        <span class="cont-row__title">{{ container.name }}</span>
        <span class="cont-row__image">{{ container.image }}</span>
      </div>
      <a
        v-for="t in tunnels"
        :key="t"
        :href="`https://${t}`"
        target="_blank"
        rel="noopener"
        class="cont-row__tunnel"
        :title="`Open ${t}`"
        @click.stop
      >
        <ExternalLink :size="12" />
      </a>
    </div>

    <div class="cont-row__cell">
      <BaseBadge :tone="tone" size="sm">{{ container.state }}</BaseBadge>
    </div>

    <div class="cont-row__cell cont-row__cell--mono">{{ cpuStr }}</div>
    <div class="cont-row__cell cont-row__cell--mono">{{ memStr }}</div>
    <div class="cont-row__cell cont-row__cell--port">{{ portStr }}</div>

    <div class="cont-row__actions" @click.stop>
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
  &__tunnel {
    display: inline-flex;
    align-items: center;
    color: var(--color-muted-foreground);
    &:hover { color: var(--emerald-500); }
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
</style>
