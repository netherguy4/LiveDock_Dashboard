<script setup lang="ts">
// Single-container detail header + metric cards. Logs panel is rendered
// separately by the page.

import {
  ArrowLeft, Box, Play, Square, RotateCw, Cpu, MemoryStick, Network, HardDrive,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import StatCard from '~/components/cards/StatCard.vue'
import { CONTAINER_STATUS, normalizeContainerState } from '~/constants/status'
import { ROUTES } from '~/configs/routes.config'
import { useContainersStore } from '~/stores/containers.store'
import { humanBytes } from '~/utils/format'
import type { ContainerAction } from '~/composables/useApi'

const props = defineProps<{ name: string }>()
const containers = useContainersStore()

const c = computed(() => containers.byName(props.name))
const status = computed(() => (c.value ? normalizeContainerState(c.value.state) : 'stopped'))
const tone = computed<'success' | 'warn' | 'neutral'>(() => {
  switch (status.value) {
    case CONTAINER_STATUS.RUNNING: return 'success'
    case CONTAINER_STATUS.DEGRADED: return 'warn'
    default: return 'neutral'
  }
})
const isStopped = computed(() => status.value === CONTAINER_STATUS.STOPPED)

const tunnels = computed(() => (c.value ? containers.tunnelsFor(c.value.name) : []))

const portStr = computed(() => {
  const ps = c.value?.ports ?? []
  if (!ps.length) return '—'
  for (const p of ps) {
    const m = /(\d+)/.exec(p)
    if (m) return m[1]
  }
  return ps[0]!
})

async function action(a: ContainerAction) {
  if (!c.value) return
  try {
    await containers.runAction(c.value.id, a)
    toast.success(`${a} requested`)
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Action failed')
  }
}

// Synthesize a per-container series from current values; replace with
// real per-container history when the backend exposes it.
function spark(val: number, salt: string): number[] {
  const seed = [...salt].reduce((s, ch) => s + ch.charCodeAt(0), 0)
  const out: number[] = []
  let s = seed
  for (let i = 0; i < 13; i++) {
    s = (s * 9301 + 49297) % 233280
    const r = s / 233280
    out.push(Math.max(0, val + (r - 0.5) * Math.max(20, val * 0.4)))
  }
  return out
}
</script>

<template>
  <div v-if="c" class="cont-detail">
    <header class="cont-detail__head">
      <div class="cont-detail__title">
        <NuxtLink :to="ROUTES.HOME" class="cont-detail__back" title="Back">
          <ArrowLeft :size="16" />
        </NuxtLink>
        <div class="cont-detail__icon">
          <Box :size="20" />
        </div>
        <div class="cont-detail__title-meta">
          <div class="cont-detail__title-row">
            <span class="cont-detail__name">{{ c.name }}</span>
            <BaseBadge :tone="tone">{{ c.state }}</BaseBadge>
          </div>
          <div class="cont-detail__sub">
            {{ c.image }}
            <template v-if="portStr !== '—'"> · port {{ portStr }}</template>
          </div>
        </div>
      </div>

      <div class="cont-detail__actions">
        <button
          type="button"
          class="cont-detail__btn cont-detail__btn--ghost"
          :disabled="!!containers.pending[c.id]"
          @click="action('restart')"
        >
          <RotateCw :size="14" /> Restart
        </button>
        <button
          v-if="isStopped"
          type="button"
          class="cont-detail__btn cont-detail__btn--primary"
          :disabled="!!containers.pending[c.id]"
          @click="action('start')"
        >
          <Play :size="14" /> Start
        </button>
        <button
          v-else
          type="button"
          class="cont-detail__btn cont-detail__btn--danger"
          :disabled="!!containers.pending[c.id]"
          @click="action('stop')"
        >
          <Square :size="14" /> Stop
        </button>
      </div>
    </header>

    <div class="cont-detail__stats">
      <StatCard
        title="CPU"
        :icon="Cpu"
        :value="Math.round(c.stat?.cpu ?? 0).toString()"
        unit="%"
        :pct="c.stat?.cpu ?? 0"
        :series="spark(c.stat?.cpu ?? 5, c.name)"
        palette="cpu"
      />
      <StatCard
        title="Memory"
        :icon="MemoryStick"
        :value="c.stat ? humanBytes(c.stat.mem_used, 0).split(' ')[0] : '—'"
        :unit="c.stat ? humanBytes(c.stat.mem_used, 0).split(' ')[1] : ''"
        :pct="c.stat?.mem ?? 0"
        :series="spark(c.stat?.mem ?? 10, `m-${c.name}`)"
        :sublabel="c.stat ? `of ${humanBytes(c.stat.mem_limit)}` : ''"
        palette="mem"
      />
      <StatCard
        title="Net RX"
        :icon="Network"
        :value="(((c.stat?.net_rx_bps ?? 0) / 1024 / 1024)).toFixed(1)"
        unit="MB/s"
        :series="spark((c.stat?.net_rx_bps ?? 0) / 1024 / 1024, `n-${c.name}`)"
        tone="ok"
        palette="net"
      />
      <StatCard
        title="Net TX"
        :icon="HardDrive"
        :value="(((c.stat?.net_tx_bps ?? 0) / 1024 / 1024)).toFixed(1)"
        unit="MB/s"
        :series="spark((c.stat?.net_tx_bps ?? 0) / 1024 / 1024, `t-${c.name}`)"
        tone="ok"
        palette="disk"
      />
    </div>

    <div v-if="tunnels.length" class="cont-detail__tunnels">
      <span class="cont-detail__tunnels-label">Tunnels</span>
      <a
        v-for="t in tunnels"
        :key="t"
        :href="`https://${t}`"
        target="_blank"
        rel="noopener"
        class="cont-detail__tunnel"
      >{{ t }}</a>
    </div>
  </div>

  <div v-else class="cont-detail__empty">
    <div class="cont-detail__empty-title">Container not found</div>
    <div class="cont-detail__empty-sub">"{{ name }}" is not present in the latest snapshot</div>
    <NuxtLink :to="ROUTES.HOME" class="cont-detail__empty-link">
      <ArrowLeft :size="14" /> Back to dashboard
    </NuxtLink>
  </div>
</template>

<style lang="scss" scoped>
.cont-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }
  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }
  &__back {
    width: 40px; height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    background: var(--color-card-subtle);
    color: var(--color-foreground);
    border-radius: var(--radius-lg);
    transition: background-color $transition-fast;
    &:hover { background: var(--color-accent); }
  }
  &__icon {
    width: 40px; height: 40px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, var(--emerald-500), var(--cyan-600));
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  &__title-meta { min-width: 0; }
  &__title-row {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  &__name {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.3px;
    color: var(--color-foreground);
    @include truncate;
  }
  &__sub {
    font-family: $font-stack-mono;
    font-size: 12px;
    color: var(--color-subtle-foreground);
    @include truncate;
  }

  &__actions {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border: 0;
    border-radius: var(--radius-md);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: filter $transition-fast, background-color $transition-fast;

    &:disabled { opacity: 0.5; cursor: not-allowed; }

    &--ghost {
      background: transparent;
      color: var(--color-foreground);
      border: 1px solid var(--color-border);
      &:hover:not(:disabled) { background: var(--color-accent); }
    }
    &--primary {
      background: var(--gradient-brand);
      color: #ffffff;
      box-shadow: 0 6px 16px -8px var(--color-brand-glow);
      &:hover:not(:disabled) { filter: brightness(1.05); }
    }
    &--danger {
      background: var(--red-500);
      color: #ffffff;
      &:hover:not(:disabled) { background: #dc2626; }
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-4);

    @include from($bp-sm) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @include from($bp-lg) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  &__tunnels {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }
  &__tunnels-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted-foreground);
  }
  &__tunnel {
    color: var(--emerald-500);
    font-family: $font-stack-mono;
    font-size: 12px;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  &__empty {
    text-align: center;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-12) var(--space-5);

    &-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-foreground);
    }
    &-sub {
      margin-top: var(--space-1);
      color: var(--color-muted-foreground);
      font-size: 13px;
    }
    &-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: var(--space-4);
      height: 36px;
      padding: 0 var(--space-4);
      border-radius: var(--radius-md);
      background: var(--gradient-brand);
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    }
  }
}
</style>
