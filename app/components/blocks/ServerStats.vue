<script setup lang="ts">
// Top-row metrics: CPU, Memory, Network, Disk. Pulls from useMetricsStore;
// series come from history.
//
// Below the top row, when ui.cpuExpanded / ui.disksExpanded are on, two
// optional cards appear: "Per-core CPU" (a small bar per core) and "All
// volumes" (per-disk usage rows). Matches the layout of the React design.

import { Cpu, MemoryStick, Network, HardDrive } from 'lucide-vue-next'
import StatCard from '~/components/cards/StatCard.vue'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import { humanBytes, pct } from '~/utils/format'
import { THRESHOLDS } from '~/constants/thresholds'
import { useMetricsStore } from '~/stores/metrics.store'
import { useUiStore } from '~/stores/ui.store'

function bpsFormat(n: number | undefined | null): { value: string; unit: string } {
  if (n == null || !Number.isFinite(n) || n < 0) return { value: '—', unit: '' }
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return { value: v.toFixed(1), unit: units[i] }
}

function bpsFactor(unit: string): number {
  const idx = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'].indexOf(unit)
  return idx < 0 ? 1 : 1024 ** idx
}

const metrics = useMetricsStore()
const ui = useUiStore()

const loading = computed(() => !metrics.snapshot && metrics.loading)
const sparklineLoading = computed(() => !metrics.historyReady)
const error = computed(() => metrics.error)

const cpuSeries = computed(() => metrics.history.map((h) => h.cpu))
const memSeries = computed(() => metrics.history.map((h) => h.mem))

const cpuValue = computed(() => Math.round(metrics.cpuPct).toString())
const memValue = computed(() => Math.round(metrics.memPct).toString())
const memUsed = computed(() =>
  metrics.snapshot
    ? `${humanBytes(metrics.snapshot.mem_point.mem_used)} / ${humanBytes(metrics.snapshot.mem_point.mem_total)}`
    : '',
)
const netBps = computed(() => metrics.netBps)
const netFmt = computed(() => bpsFormat(netBps.value))
const netValue = computed(() => netFmt.value.value)
const netUnit = computed(() => netFmt.value.unit)
const netSeries = computed(() => {
  const factor = bpsFactor(netFmt.value.unit)
  return metrics.history.map((h) => (h.net_rx_bps + h.net_tx_bps) / factor)
})

const diskBps = computed(() => metrics.diskBps)
const diskFmt = computed(() => bpsFormat(diskBps.value))
const diskValue = computed(() => diskFmt.value.value)
const diskUnit = computed(() => diskFmt.value.unit)
const diskSeries = computed(() => {
  const factor = bpsFactor(diskFmt.value.unit)
  return metrics.history.map((h) => (h.disk_read_bps + h.disk_write_bps) / factor)
})

const diskUsedPct = computed(() => {
  const ds = metrics.snapshot?.disks ?? []
  if (!ds.length) return 0
  return ds.reduce((m, d) => Math.max(m, d.used_pct), 0)
})

const cores = computed(() => metrics.snapshot?.cpu_per_core ?? [])
const disks = computed(() => metrics.snapshot?.disks ?? [])

function coreClass(load: number) {
  if (load > 80) return 'core-bar__fill--hot'
  if (load > 50) return 'core-bar__fill--mid'
  return 'core-bar__fill--cool'
}

function diskClass(used: number) {
  return used > 75 ? 'disk-row__fill--warn' : 'disk-row__fill--ok'
}
</script>

<template>
  <div class="server-stats" :aria-busy="loading ? true : undefined">
    <!-- Error banner -->
    <div v-if="error && !loading" class="server-stats__error" role="alert">
      Failed to load metrics. Retrying…
    </div>

    <div class="server-stats__grid">
      <StatCard
        title="CPU"
        :icon="Cpu"
        :value="cpuValue"
        unit="%"
        :pct="metrics.cpuPct"
        :series="cpuSeries"
        :threshold-danger="THRESHOLDS.CPU_DANGER"
        :threshold-warn="THRESHOLDS.CPU_WARN"
        palette="cpu"
        :sublabel="cores.length ? `${cores.length} cores` : ''"
        :loading="loading"
        :history-loading="sparklineLoading"
      />
      <StatCard
        title="Memory"
        :icon="MemoryStick"
        :value="memValue"
        unit="%"
        :pct="metrics.memPct"
        :series="memSeries"
        :threshold-danger="THRESHOLDS.MEM_DANGER"
        :threshold-warn="THRESHOLDS.MEM_WARN"
        palette="mem"
        :sublabel="memUsed"
        :loading="loading"
        :history-loading="sparklineLoading"
      />
      <StatCard
        title="Network"
        :icon="Network"
        :value="netValue"
        :unit="netUnit"
        :series="netSeries"
        tone="ok"
        palette="net"
        :loading="loading"
        :history-loading="sparklineLoading"
      />
      <StatCard
        title="Disk I/O"
        :icon="HardDrive"
        :value="diskValue"
        :unit="diskUnit"
        :pct="diskUsedPct"
        :series="diskSeries"
        :threshold-danger="THRESHOLDS.DISK_DANGER"
        :threshold-warn="THRESHOLDS.DISK_WARN"
        palette="disk"
        :sublabel="`max volume ${pct(diskUsedPct, 0)}`"
        :loading="loading"
        :history-loading="sparklineLoading"
      />
    </div>

    <!-- Per-core CPU breakdown -->
    <section v-if="ui.cpuExpanded" class="server-stats__panel">
      <div class="server-stats__panel-head">
        <div class="server-stats__panel-title">
          <Cpu :size="16" class="server-stats__panel-icon" />
          <span>Per-core CPU</span>
          <BaseBadge tone="brand">{{ cores.length }} cores</BaseBadge>
        </div>
      </div>
      <template v-if="loading">
        <div class="server-stats__cores" aria-hidden="true">
          <div v-for="i in 4" :key="i" class="core-bar">
            <div class="core-bar__head">
              <div class="core-bar__skeleton-name" />
              <div class="core-bar__skeleton-pct" />
            </div>
            <div class="core-bar__skeleton-track" />
          </div>
        </div>
      </template>
      <template v-else>
        <div class="server-stats__cores">
          <div v-for="(load, i) in cores" :key="i" class="core-bar">
            <div class="core-bar__head">
              <span class="core-bar__name">core {{ i }}</span>
              <span class="core-bar__pct">{{ Math.round(load) }}%</span>
            </div>
            <div class="core-bar__track">
              <div
                class="core-bar__fill"
                :class="coreClass(load)"
                :style="{ transform: `scaleX(${Math.min(100, load) / 100})` }"
              />
            </div>
          </div>
        </div>
      </template>
    </section>

    <!-- Disks breakdown -->
    <section v-if="ui.disksExpanded" class="server-stats__panel">
      <div class="server-stats__panel-head">
        <div class="server-stats__panel-title">
          <HardDrive :size="16" class="server-stats__panel-icon server-stats__panel-icon--disk" />
          <span>All volumes</span>
          <BaseBadge tone="brand">{{ disks.length }}</BaseBadge>
        </div>
      </div>
      <template v-if="loading || !disks.length">
        <div class="server-stats__disk-scroll" aria-hidden="true">
          <div class="disk-table">
            <div v-for="i in 3" :key="i" class="disk-row skeleton-disk-row">
              <div class="disk-row__skeleton-device" />
              <div class="disk-row__skeleton-mount" />
              <div class="disk-row__skeleton-track" />
              <div class="disk-row__skeleton-pct" />
              <div class="disk-row__skeleton-size" />
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="server-stats__disk-scroll">
          <div class="disk-table">
            <div class="disk-table__head">
              <div>Device</div>
              <div>Mount</div>
              <div>Usage</div>
              <div class="disk-table__num">%</div>
              <div class="disk-table__num">Size</div>
            </div>
            <div v-for="d in disks" :key="d.device + d.path" class="disk-row">
              <div class="disk-row__device">
                <HardDrive :size="14" />
                <span>{{ d.device }}</span>
              </div>
              <div class="disk-row__mount">{{ d.path }}</div>
              <div class="disk-row__usage">
                <div class="disk-row__track">
                  <div
                    class="disk-row__fill"
                    :class="diskClass(d.used_pct)"
                    :style="{ transform: `scaleX(${Math.min(100, d.used_pct) / 100})` }"
                  />
                </div>
              </div>
              <div class="disk-row__pct">{{ Math.round(d.used_pct) }}%</div>
              <div class="disk-row__size">{{ humanBytes(d.total) }}</div>
            </div>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.server-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  &__error {
    padding: var(--space-3) var(--space-4);
    background: var(--color-warning);
    color: #000;
    border-radius: var(--radius-lg);
    font-size: var(--fs-label);
    font-weight: var(--fw-semibold);
    text-align: center;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-5);

    @include from($bp-sm) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @include from($bp-lg) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  &__panel {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
  }
  &__panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }
  &__panel-title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--fs-h3);
    font-weight: var(--fw-bold);
    color: var(--color-foreground);
  }
  &__panel-icon {
    color: var(--emerald-400);
    &--disk { color: var(--sky-400); }
  }

  &__cores {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3) var(--space-5);

    @include from($bp-sm) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    @include from($bp-lg) { grid-template-columns: repeat(8, minmax(0, 1fr)); }
  }
}

.core-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    font-family: $font-stack-mono;
  }
  &__name {
    font-size: var(--fs-caption);
    color: var(--color-muted-foreground);
  }
  &__pct {
    font-size: var(--fs-small);
    font-weight: var(--fw-semibold);
    color: var(--color-foreground);
  }
  &__track {
    height: 6px;
    border-radius: 999px;
    background: var(--color-track);
    overflow: hidden;
  }
  &__fill {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    transform-origin: left center;
    transition: transform $transition-base;

    &--cool { background: linear-gradient(90deg, var(--emerald-500), var(--emerald-400)); }
    &--mid  { background: linear-gradient(90deg, var(--emerald-500), var(--cyan-500)); }
    &--hot  { background: linear-gradient(90deg, var(--amber-500), var(--color-danger)); }
  }

  // Skeleton
  &__skeleton-name  { @include skeleton(11px, 48px); }
  &__skeleton-pct   { @include skeleton(12px, 32px); }
  &__skeleton-track { @include skeleton(6px, 100%); border-radius: 999px; margin-top: var(--space-1); }
}

.server-stats__disk-scroll {
  overflow-x: auto;
  @include scrollbar(6px);
}

.disk-table {
  min-width: 480px;
  font-size: var(--fs-small);
  font-family: $font-stack-mono;
  &__head, .disk-row {
    display: grid;
    grid-template-columns: minmax(120px, 1.5fr) minmax(100px, 2.5fr) minmax(120px, 2.5fr) 50px 80px;
    align-items: center;
    gap: var(--space-3);
  }
  &__head {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted-foreground);
    padding: 0 0 var(--space-2);
    border-bottom: 1px solid var(--color-divider);
    font-size: var(--fs-caption);
  }
  &__num { text-align: right; }
}

.disk-row {
  padding: var(--space-2) 0;

  &__device {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-foreground);
    .lucide { color: var(--color-muted-foreground); }
  }
  &__mount { color: var(--color-muted-foreground); @include truncate; }
  &__usage { min-width: 0; }
  &__track {
    height: 6px;
    border-radius: 999px;
    background: var(--color-track);
    overflow: hidden;
  }
  &__fill {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    transform-origin: left center;
    transition: transform $transition-base;
    &--ok   { background: linear-gradient(90deg, var(--emerald-500), var(--cyan-500)); }
    &--warn { background: var(--amber-500); }
  }
  &__pct, &__size {
    text-align: right;
  }
  &__pct  { color: var(--color-foreground); }
  &__size { color: var(--color-muted-foreground); }

  // Skeleton
  &__skeleton-device { @include skeleton(14px, 90px); }
  &__skeleton-mount  { @include skeleton(14px, 60px); }
  &__skeleton-track  { @include skeleton(6px, 100%); border-radius: 999px; }
  &__skeleton-pct    { @include skeleton(14px, 32px); }
  &__skeleton-size   { @include skeleton(14px, 48px); }
}

.skeleton-disk-row {
  grid-template-columns: minmax(120px, 1.5fr) minmax(100px, 2.5fr) minmax(120px, 2.5fr) 50px 80px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  display: grid;
}
</style>
