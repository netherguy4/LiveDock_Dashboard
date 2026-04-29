<script setup lang="ts">
// Containers panel — port of new_frontend ContainersPanel (App.tsx).
// Search input + filter chips + sort header + per-row card.
//
// Source: useContainersStore (driven by snapshot.containers).

import {
  Box, Search, X, Filter, ArrowUp, ArrowDown, ArrowUpDown, ScrollText,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import StatusDot from '~/components/common/StatusDot.vue'
import ContainerRow from '~/components/cards/ContainerRow.vue'
import EmptyState from '~/components/common/EmptyState.vue'
import { CONTAINER_STATUS } from '~/constants/status'
import { useContainersStore } from '~/stores/containers.store'
import { useLogsStore } from '~/stores/logs.store'
import { useMetricsStore } from '~/stores/metrics.store'
import { useUiStore } from '~/stores/ui.store'
import type { ContainerAction } from '~/composables/useApi'

const containers = useContainersStore()
const logs = useLogsStore()
const metrics = useMetricsStore()
const ui = useUiStore()

type SortKey = 'name' | 'status' | 'cpu' | 'mem'

const FILTERS = [
  { id: 'all',                          label: 'All',      withDot: false },
  { id: CONTAINER_STATUS.RUNNING,       label: 'Running',  withDot: 'running' as const },
  { id: CONTAINER_STATUS.DEGRADED,      label: 'Degraded', withDot: 'degraded' as const },
  { id: CONTAINER_STATUS.STOPPED,       label: 'Stopped',  withDot: 'stopped' as const },
] as const

const loading = computed(() => !containers.items.length && containers.loading)

const counts = computed(() => {
  const c = containers.counts
  return { all: c.total, running: c.running, degraded: c.degraded, stopped: c.stopped }
})

function toggleSort(k: SortKey) { containers.setSort(k) }

async function onAction(id: string, action: ContainerAction) {
  try {
    await containers.runAction(id, action)
    toast.success(`Container ${action}ed`)
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Action failed')
  }
}

watch(
  () => metrics.snapshot?.containers,
  (next) => { if (next) containers.syncFromSnapshot(next) },
  { immediate: true },
)

// Prefetch logs for running containers so the LogsPanel renders instantly when
// the user opens it. Re-runs whenever the running set changes (id list).
const runningIds = computed(() =>
  containers.items.filter((c) => c.state === 'running').map((c) => c.id),
)
watch(
  runningIds,
  (ids) => {
    if (import.meta.client && ids.length) {
      logs.prefetch(ids).catch(() => {})
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="containers-panel" :aria-busy="loading ? true : undefined">
    <header class="containers-panel__head">
      <div class="containers-panel__title">
        <Box :size="20" />
        <span>Containers</span>
        <BaseBadge>{{ containers.filtered.length }} of {{ containers.counts.total }}</BaseBadge>
      </div>
      <button
        type="button"
        class="containers-panel__logs-btn"
        @click="ui.openLogsDrawer"
      >
        <ScrollText :size="14" />
        <span>Logs</span>
      </button>
    </header>

    <div class="containers-panel__filters">
      <div class="containers-panel__search">
        <Search :size="16" class="containers-panel__search-icon" />
        <input
          v-model="containers.search"
          placeholder="Search by name or image…"
          class="containers-panel__search-input"
        >
        <button
          v-if="containers.search"
          type="button"
          class="containers-panel__search-clear"
          aria-label="Clear search"
          @click="containers.search = ''"
        >
          <X :size="14" />
        </button>
      </div>

      <div class="containers-panel__chips">
        <Filter :size="14" class="containers-panel__chip-icon" />
        <button
          v-for="f in FILTERS"
          :key="f.id"
          type="button"
          class="containers-panel__chip"
          :class="{ 'containers-panel__chip--active': containers.statusFilter === f.id }"
          @click="containers.statusFilter = f.id as 'all'"
        >
          <StatusDot v-if="f.withDot" :status="f.withDot" :pulse="false" :size="8" />
          <span>{{ f.label }}</span>
          <span class="containers-panel__chip-count">
            {{ counts[f.id as keyof typeof counts] }}
          </span>
        </button>
      </div>
    </div>

    <div class="containers-panel__scroll">
      <div class="containers-panel__inner">
        <div class="containers-panel__head-row" role="row">
          <button
            class="containers-panel__sort containers-panel__sort--name"
            :aria-sort="containers.sortKey === 'name' ? (containers.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'"
            @click="toggleSort('name')"
          >
            Name
            <component
              :is="containers.sortKey === 'name' ? (containers.sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown"
              :size="12"
              :class="containers.sortKey === 'name' ? '' : 'containers-panel__sort-idle'"
            />
          </button>
          <button
            class="containers-panel__sort"
            :aria-sort="containers.sortKey === 'status' ? (containers.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'"
            @click="toggleSort('status')"
          >
            Status
            <component
              :is="containers.sortKey === 'status' ? (containers.sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown"
              :size="12"
              :class="containers.sortKey === 'status' ? '' : 'containers-panel__sort-idle'"
            />
          </button>
          <button
            class="containers-panel__sort"
            :aria-sort="containers.sortKey === 'cpu' ? (containers.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'"
            @click="toggleSort('cpu')"
          >
            CPU
            <component
              :is="containers.sortKey === 'cpu' ? (containers.sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown"
              :size="12"
              :class="containers.sortKey === 'cpu' ? '' : 'containers-panel__sort-idle'"
            />
          </button>
          <button
            class="containers-panel__sort"
            :aria-sort="containers.sortKey === 'mem' ? (containers.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'"
            @click="toggleSort('mem')"
          >
            Memory
            <component
              :is="containers.sortKey === 'mem' ? (containers.sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown"
              :size="12"
              :class="containers.sortKey === 'mem' ? '' : 'containers-panel__sort-idle'"
            />
          </button>
          <div class="containers-panel__sort containers-panel__sort--port">Port</div>
          <div class="containers-panel__sort containers-panel__sort--actions">Actions</div>
        </div>

        <template v-if="loading">
          <div v-for="i in 5" :key="i" class="containers-panel__skeleton-row" aria-hidden="true">
            <div class="containers-panel__sk-name">
              <div class="containers-panel__sk-dot" />
              <div class="containers-panel__sk-name-stack">
                <div class="containers-panel__sk-name-bar" />
                <div class="containers-panel__sk-image-bar" />
              </div>
            </div>
            <div class="containers-panel__sk-pill" />
            <div class="containers-panel__sk-num" />
            <div class="containers-panel__sk-num" />
            <div class="containers-panel__sk-port" />
            <div class="containers-panel__sk-actions">
              <div class="containers-panel__sk-btn" />
              <div class="containers-panel__sk-btn" />
            </div>
          </div>
        </template>
        <EmptyState
          v-else-if="!containers.filtered.length && !containers.items.length"
          title="No containers"
          description="No container data available yet. Data will appear once the backend reports container activity."
        />
        <EmptyState
          v-else-if="!containers.filtered.length"
          title="No matches"
          description="No containers match your current search or filters."
        />
        <div v-else class="containers-panel__rows">
          <ContainerRow
            v-for="c in containers.filtered"
            :key="c.id"
            :container="c"
            :pending-action="containers.pending[c.id] ?? null"
            @action="onAction"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.containers-panel {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;

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
    font-size: 16px;
    font-weight: 700;
    color: var(--color-foreground);

    .lucide { color: var(--color-muted-foreground); }
  }
  &__logs-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    height: 32px;
    padding: 0 var(--space-3);
    border-radius: var(--radius-md);
    background: var(--color-accent);
    border: 0;
    color: var(--color-foreground);
    font-size: var(--fs-small);
    font-weight: var(--fw-semibold);
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover { background: var(--color-muted); }
    &:focus-visible { @include focus-ring; }
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-5);
    background: var(--color-card-subtle);
    border-bottom: 1px solid var(--color-divider);
  }

  &__search {
    position: relative;
    flex: 1 1 220px;
    min-width: 220px;
  }
  &__search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-subtle-foreground);
  }
  &__search-input {
    width: 100%;
    height: 36px;
    padding: 0 32px 0 32px;
    border-radius: var(--radius-md);
    background: var(--color-input-background);
    border: 1px solid var(--color-input-border);
    color: var(--color-foreground);
    font-size: var(--fs-label);

    &::placeholder { color: var(--color-subtle-foreground); }
    &:focus { outline: none; border-color: var(--emerald-500); box-shadow: 0 0 0 3px var(--color-accent-bg); }
  }
  &__search-clear {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    color: var(--color-subtle-foreground);
    border-radius: var(--radius-sm);
    cursor: pointer;
    &:hover { background: var(--color-accent); color: var(--color-foreground); }
  }

  &__chips {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  &__chip-icon { color: var(--color-muted-foreground); }
  &__chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    height: 32px;
    padding: 0 var(--space-2);
    border-radius: 999px;
    background: var(--color-accent);
    color: var(--color-muted-foreground);
    font-size: var(--fs-small);
    font-weight: var(--fw-semibold);
    border: 1px solid transparent;
    cursor: pointer;
    transition: background-color $transition-fast, color $transition-fast, border-color $transition-fast;

    &:hover { color: var(--color-foreground); }
    &:focus-visible {
      @include focus-ring;
      outline-offset: 1px;
    }
    &--active {
      background: var(--color-accent-bg);
      color: var(--emerald-500);
      border-color: var(--color-accent-border);
      .theme--dark & { color: var(--emerald-300); }
    }
  }
  &__chip-count { opacity: 0.7; }

  // React reference uses the same trick: enable horizontal scroll on the
  // table region with a min-width so the columns never collapse into each
  // other on narrow viewports.
  &__scroll {
    overflow-x: auto;
    @include scrollbar(6px);
  }
  &__inner {
    min-width: 640px;
  }

  &__head-row {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2fr) 80px 100px;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    background: var(--color-row-header);
    border-bottom: 1px solid var(--color-divider);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted-foreground);
  }
  &__sort {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    text-align: left;
    text-transform: inherit;
    letter-spacing: inherit;
    font: inherit;

    &:hover { color: var(--color-foreground); }
    &--port, &--actions { cursor: default; }
    &--actions { text-align: right; justify-content: flex-end; }
  }
  &__sort-idle { opacity: 0.4; }

  &__rows > * + * { border-top: 1px solid var(--color-divider); }

  // Skeleton rows
  &__skeleton-row {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2fr) 80px 100px;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    align-items: center;
    border-top: 1px solid var(--color-divider);
  }

  // Name column: circle + two-line stack
  &__sk-name {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }
  &__sk-dot {
    @include skeleton(10px, 10px);
    border-radius: 50%;
    flex-shrink: 0;
  }
  &__sk-name-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }
  &__sk-name-bar {
    @include skeleton(13px, 120px);
  }
  &__sk-image-bar {
    @include skeleton(12px, 90px);
  }

  // Status: pill shape
  &__sk-pill {
    @include skeleton(20px, 64px);
    border-radius: var(--radius-md);
  }

  // CPU / Memory: narrow mono hint
  &__sk-num {
    @include skeleton(13px, 48px);
  }

  // Port
  &__sk-port {
    @include skeleton(13px, 32px);
  }

  // Actions: small squares
  &__sk-actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-1);
  }
  &__sk-btn {
    @include skeleton(32px, 32px);
    border-radius: var(--radius-sm);
  }

  &__empty {
    padding: var(--space-12) var(--space-5);
    text-align: center;
    color: var(--color-muted-foreground);
    font-size: 13px;
  }
}
</style>
