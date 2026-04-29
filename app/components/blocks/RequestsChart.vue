<script setup lang="ts">
// 12h API requests chart. Visual style ports new_frontend MiniBars:
// 12 fat flex-bars with an emerald→cyan vertical gradient, no axes,
// no labels — just the bar shapes. We aggregate the raw per-minute
// points into 12 hour buckets so the bar count matches the design.

import { Activity } from 'lucide-vue-next'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import { useRequestsStore } from '~/stores/requests.store'

const reqs = useRequestsStore()

const loading = computed(() => !reqs.points.length && reqs.loading)
const error = computed(() => !reqs.points.length && reqs.error)

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
          <div v-else-if="error" class="requests__err">Failed to load request data</div>
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
        <div class="requests__empty">Could not load data</div>
      </template>
      <template v-else-if="buckets.length">
        <div class="requests__bars">
          <div
            v-for="(v, i) in buckets"
            :key="i"
            class="requests__bar"
            :style="{ transform: `scaleY(${heightPct(v) / 100})` }"
            :title="`${v} req`"
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
    background: linear-gradient(to top, var(--emerald-500), var(--cyan-400));
    transform-origin: bottom center;
    transition: transform $transition-base;
    min-width: 0;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-muted-foreground);
    font-size: var(--fs-label);
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
