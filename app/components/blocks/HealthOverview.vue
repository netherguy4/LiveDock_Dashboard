<script setup lang="ts">
// Sidebar of the dashboard's "throughput" row — port of the Health overview
// card from new_frontend HomePage. Shows healthy / degraded / stopped split
// of the current container set.

import { ShieldCheck } from 'lucide-vue-next'
import { useContainersStore } from '~/stores/containers.store'

const containers = useContainersStore()

const loading = computed(() => !containers.items.length && containers.loading)

const rows = computed(() => {
  const c = containers.counts
  return [
    { label: 'Healthy',  value: c.running,  cls: 'health__bar--ok'    },
    { label: 'Degraded', value: c.degraded, cls: 'health__bar--warn'  },
    { label: 'Stopped',  value: c.stopped,  cls: 'health__bar--stop'  },
  ]
})

const total = computed(() => Math.max(1, containers.counts.total))
const totalCt = computed(() => containers.counts.total)
</script>

<template>
  <section class="health" aria-labelledby="health-heading" :aria-busy="loading ? true : undefined">
    <header class="health__head">
      <h2 id="health-heading" class="health__title">
        <ShieldCheck :size="18" class="health__title-icon" />
        Health overview
      </h2>
      <div class="health__sub">
        <template v-if="loading">{{ totalCt }} containers</template>
        <template v-else>{{ totalCt }} containers</template>
      </div>
    </header>

    <template v-if="loading">
      <div class="health__rows" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="health__row">
          <div class="health__row-head">
            <div class="health__skeleton-label" />
            <div class="health__skeleton-value" />
          </div>
          <div class="health__skeleton-track" />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="health__rows">
        <div v-for="r in rows" :key="r.label" class="health__row">
          <div class="health__row-head">
            <span class="health__row-label">{{ r.label }}</span>
            <span class="health__row-value">{{ r.value }}</span>
          </div>
          <div class="health__track">
            <div
              class="health__bar"
              :class="r.cls"
              :style="{ transform: `scaleX(${r.value / total})` }"
            />
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style lang="scss" scoped>
.health {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  height: 100%;
  display: flex;
  flex-direction: column;

  &__head { margin-bottom: var(--space-4); flex-shrink: 0; }
  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--fs-h3);
    font-weight: var(--fw-bold);
    color: var(--color-foreground);
  }
  &__title-icon { color: var(--emerald-400); flex-shrink: 0; }
  &__sub {
    margin-top: var(--space-1);
    font-size: var(--fs-small);
    color: var(--color-subtle-foreground);
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1 1 auto;
    justify-content: center;
  }
  &__row { display: flex; flex-direction: column; gap: var(--space-1); }
  &__row-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  &__row-label {
    font-size: var(--fs-label);
    color: var(--color-foreground);
  }
  &__row-value {
    font-family: $font-stack-mono;
    font-size: var(--fs-small);
    color: var(--color-muted-foreground);
  }

  &__track {
    height: 8px;
    border-radius: 999px;
    background: var(--color-track);
    overflow: hidden;
  }
  &__bar {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    transform-origin: left center;
    transition: transform $transition-base;
    &--ok   { background: var(--emerald-500); }
    &--warn { background: var(--amber-500); }
    &--stop { background: var(--color-stopped); }
  }

  // Skeleton
  &__skeleton-label { @include skeleton(13px, 72px); }
  &__skeleton-value { @include skeleton(12px, 24px); }
  &__skeleton-track { @include skeleton(8px, 100%); border-radius: 999px; }
}
</style>
