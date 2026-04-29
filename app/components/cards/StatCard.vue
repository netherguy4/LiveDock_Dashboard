<script setup lang="ts">
// Top-row stat card — port of new_frontend StatCard (App.tsx).
// Layout: tinted icon + label on top, optional trend badge on the right;
// big number + unit on the next row; sparkline at the bottom.
//
// Tone is derived from `pct` against danger/warn thresholds, OR can be
// set explicitly via `tone`. Each tone has its own icon background + spark
// stroke so volumes feel distinct at a glance.

import type { Component } from 'vue'
import Sparkline from '~/components/common/Sparkline.vue'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import { toneForPct, type Tone } from '~/constants/thresholds'

type Palette = 'cpu' | 'mem' | 'net' | 'disk' | 'auto'

interface Props {
  title: string
  value: string
  unit?: string
  sublabel?: string
  pct?: number
  series?: number[]
  tone?: Tone
  thresholdDanger?: number
  thresholdWarn?: number
  icon?: Component | null
  trend?: number | null
  palette?: Palette
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  sublabel: undefined,
  pct: undefined,
  series: () => [],
  tone: undefined,
  thresholdDanger: 85,
  thresholdWarn: 65,
  icon: null,
  trend: null,
  palette: 'auto',
  loading: false,
})

const computedTone = computed<Tone>(() =>
  props.tone ?? toneForPct(props.pct ?? 0, props.thresholdDanger, props.thresholdWarn),
)

const PALETTES = {
  cpu:  { stroke: 'var(--emerald-500)', bg: 'var(--color-accent-bg)',  fg: 'var(--emerald-500)' },
  mem:  { stroke: 'var(--cyan-500)',   bg: 'var(--color-accent-bg)',   fg: 'var(--cyan-500)' },
  net:  { stroke: '#8b5cf6',           bg: 'oklch(0.55 0.18 290 / 0.10)', fg: '#8b5cf6' },
  disk: { stroke: 'var(--amber-500)',  bg: 'oklch(0.828 0.189 84.429 / 0.10)', fg: 'var(--amber-500)' },
} as const

const TONE_COLORS: Record<Tone, { stroke: string; bg: string; fg: string }> = {
  danger: { stroke: 'var(--color-danger)',  bg: 'oklch(0.637 0.237 25.331 / 0.10)',  fg: 'var(--color-danger)' },
  warn:   { stroke: 'var(--color-warning)', bg: 'oklch(0.828 0.189 84.429 / 0.10)', fg: 'var(--color-warning)' },
  ok:     { stroke: 'var(--color-success)', bg: 'var(--color-accent-bg)',           fg: 'var(--color-success)' },
}

const colors = computed(() => {
  if (props.palette !== 'auto' && PALETTES[props.palette as keyof typeof PALETTES]) {
    return PALETTES[props.palette as keyof typeof PALETTES]
  }
  return TONE_COLORS[computedTone.value]
})

const trendTone = computed<'success' | 'warn'>(() =>
  (props.trend ?? 0) > 0 ? 'warn' : 'success',
)
</script>

<template>
  <article class="stat-card" :class="`stat-card--${computedTone}`" :aria-busy="loading ? true : undefined">
    <template v-if="loading">
      <div aria-hidden="true">
      <div class="stat-card__head">
        <div class="stat-card__skeleton-icon" />
        <div class="stat-card__skeleton-label" />
      </div>
      <div class="stat-card__skeleton-value" />
      <div class="stat-card__skeleton-sub" />
      <div class="stat-card__skeleton-spark" />
      </div>
    </template>
    <template v-else>
      <div class="stat-card__head">
        <div class="stat-card__icon" :style="{ background: colors.bg, color: colors.fg }">
          <component :is="icon" v-if="icon" :size="18" />
        </div>
        <span class="stat-card__label">{{ title }}</span>
        <BaseBadge v-if="trend != null" :tone="trendTone" size="sm" class="stat-card__trend">
          {{ trend > 0 ? '+' : '' }}{{ trend }}%
        </BaseBadge>
      </div>

      <div class="stat-card__main">
        <span class="stat-card__value">{{ value }}</span>
        <span v-if="unit" class="stat-card__unit">{{ unit }}</span>
      </div>

      <div v-if="sublabel" class="stat-card__sub">{{ sublabel }}</div>

      <Sparkline
        v-if="series.length > 1"
        class="stat-card__spark"
        :values="series"
        :color="colors.stroke"
        :height="56"
      />
    </template>
  </article>
</template>

<style lang="scss" scoped>
.stat-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
  transition: box-shadow $transition-base;

  &:hover { box-shadow: var(--shadow-md); }

  &__head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-1);
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  &__label {
    color: var(--color-muted-foreground);
    font-size: 13px;
  }
  &__trend {
    margin-left: auto;
  }

  &__main {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  &__value {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--color-foreground);
    line-height: 1.1;
  }
  &__unit {
    font-size: 14px;
    color: var(--color-subtle-foreground);
  }

  &__sub {
    font-size: 11px;
    color: var(--color-subtle-foreground);
  }

  &__spark {
    margin-top: auto;
    height: 56px;
  }

  // --- Skeleton placeholders ---
  &__skeleton-icon {
    @include skeleton(36px, 36px);
    flex-shrink: 0;
    border-radius: var(--radius-md);
  }
  &__skeleton-label {
    @include skeleton(13px, 64px);
  }
  &__skeleton-value {
    @include skeleton(28px, 120px);
  }
  &__skeleton-sub {
    @include skeleton(12px, 80px);
  }
  &__skeleton-spark {
    margin-top: auto;
    @include skeleton(56px, 100%);
  }
}
</style>
