<script setup lang="ts">
// 12h API requests chart. 12 flex-bars with a flat botanical fill, no axes,
// no labels — just the bar shapes. We aggregate the raw per-minute
// points into 12 hour buckets so the bar count matches the design.

import { Activity } from 'lucide-vue-next'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import { useRequestsStore } from '~/stores/requests.store'

const reqs = useRequestsStore()

const loading = computed(() => !reqs.points.length && reqs.loading)
const error = computed(() => !reqs.points.length && reqs.error)

function retry() {
  reqs.refresh()
}

const BUCKETS = 12

const SKELETON_BAR_HEIGHTS = [30, 55, 42, 70, 35, 60, 48, 75, 40, 65, 50, 80]

const buckets = computed<number[]>(() => {
  const pts = reqs.points
  if (!pts.length) return []
  const first = pts[0].ts
  const last = pts[pts.length - 1].ts
  const span = Math.max(1, last - first)
  const bucketSpan = span / BUCKETS
  const sums = new Array<number>(BUCKETS).fill(0)
  for (const p of pts) {
    const idx = Math.min(BUCKETS - 1, Math.floor((p.ts - first) / bucketSpan))
    sums[idx] += p.count
  }
  return sums
})

const maxBucket = computed(() => Math.max(1, ...buckets.value))

function heightPct(v: number): number {
  // floor at 4% so empty buckets are still visible as a thin bar
  return Math.max(4, (v / maxBucket.value) * 100)
}
</script>

<template>
  <section class="requests" :aria-busy="loading ? true : undefined">
    <header class="requests__head">
      <div class="requests__title">
        <Activity :size="18" class="requests__icon" />
        <div>
          <div class="requests__h">API requests</div>
          <div v-if="loading" class="requests__skeleton-sub" aria-hidden="true" />
          <div v-else-if="error" class="requests__err">Could not load data</div>
          <div v-else class="requests__sub">
            Last 12h · avg {{ reqs.perMin.toFixed(1) }}/min · total {{ reqs.total }}
          </div>
        </div>
      </div>
      <BaseBadge v-if="!loading && !error" tone="brand">live</BaseBadge>
    </header>

    <div class="requests__chart">
      <template v-if="loading">
        <div class="requests__skeleton-bars" aria-hidden="true">
          <div
            v-for="i in 12"
            :key="i"
            class="requests__skeleton-bar"
            :style="{ height: `${SKELETON_BAR_HEIGHTS[i - 1]}%` }"
          />
        </div>
      </template>
      <template v-else-if="error">
        <div class="requests__empty">
          <span>Could not load data</span>
          <button type="button" class="requests__retry" @click="retry">Retry</button>
        </div>
      </template>
      <template v-else-if="buckets.length">
        <div class="requests__bars">
          <div
            v-for="(v, i) in buckets"
            :key="i"
            class="requests__bar"
            :style="{
              transform: `scaleY(${heightPct(v) / 100})`,
              transitionDelay: `${i * 40}ms`,
            }"
            :aria-label="`${v} requests`"
            :title="`${v} req`"
            tabindex="0"
            role="img"
          />
        </div>
      </template>
      <div v-else class="requests__empty">No data yet</div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.requests {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  height: 100%;
  display: flex;
  flex-direction: column;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  &__icon { color: var(--emerald-400); }
  &__h {
    font-size: var(--fs-h3);
    font-weight: var(--fw-bold);
    color: var(--color-foreground);
  }
  &__sub {
    font-size: var(--fs-small);
    color: var(--color-subtle-foreground);
  }
  &__err {
    font-size: var(--fs-small);
    color: var(--color-warning);
  }

  &__chart {
    flex: 1 1 auto;
    min-height: 160px;
    overflow: hidden;

    @include from($bp-sm) { min-height: 200px; }
  }

  &__bars {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 100%;
  }

  &__bar {
    flex: 1 1 0;
    height: 100%;
    border-radius: 3px 3px 2px 2px;
    background: var(--emerald-500);
    transform-origin: bottom center;
    transition:
      transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1),
      background-color 150ms $ease-out;
    min-width: 0;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      background: var(--emerald-400);
      outline: none;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    height: 100%;
    color: var(--color-muted-foreground);
    font-size: var(--fs-label);
  }

  &__retry {
    height: 32px;
    padding: 0 var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-foreground);
    font-size: var(--fs-label);
    font-weight: var(--fw-semibold);
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover { background: var(--color-accent); }
    &:focus-visible {
      outline: 2px solid var(--color-ring);
      outline-offset: 2px;
    }
  }

  // Skeleton
  &__skeleton-sub { @include skeleton(12px, 200px); margin-top: 2px; }
  &__skeleton-bars {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 100%;
  }
  &__skeleton-bar {
    flex: 1 1 0;
    border-radius: 3px 3px 2px 2px;
    @include skeleton(100%, 100%);
    min-width: 0;
  }
}
</style>
