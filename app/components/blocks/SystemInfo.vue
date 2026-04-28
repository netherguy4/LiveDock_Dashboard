<script setup lang="ts">
// SystemInfo card — port of new_frontend SystemInfoInner.
// Source data: useMetricsStore.snapshot.host (real Go API).
//
// "uptime" is presented as a live counter — base value comes from the API
// (uptime_seconds), then we tick locally each second so the display feels
// alive between snapshots.

import {
  Server, Globe, MonitorCog, GitBranch, Container, Layers, Cpu, MemoryStick, Activity,
} from 'lucide-vue-next'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import { humanBytes, formatUptime } from '~/utils/format'
import { useMetricsStore } from '~/stores/metrics.store'
import { useHostsStore } from '~/stores/hosts.store'
import { useUiStore } from '~/stores/ui.store'

const metrics = useMetricsStore()
const hosts = useHostsStore()
const ui = useUiStore()

const host = computed(() => metrics.snapshot?.host ?? null)
const loading = computed(() => !metrics.snapshot && metrics.loading)
const error = computed(() => metrics.error)

// Live uptime — base from API, plus a local tick so the seconds field moves
// between snapshots. Pause the local clock when ui.paused is set.
const tick = ref(0)
const baseAt = ref({ at: 0, seconds: 0 })
let timer: ReturnType<typeof setInterval> | null = null

watch(() => host.value?.uptime_seconds, (v) => {
  if (v == null) return
  baseAt.value = { at: Date.now(), seconds: v }
}, { immediate: true })

onMounted(() => {
  timer = setInterval(() => {
    if (!ui.paused) tick.value++
  }, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const liveUptime = computed(() => {
  if (!host.value) return '—'
  // tick.value used purely to keep this computed reactive
  void tick.value
  const elapsed = (Date.now() - baseAt.value.at) / 1000
  return formatUptime(baseAt.value.seconds + elapsed)
})

const bootDate = computed(() => {
  if (!host.value?.uptime_seconds) return ''
  return new Date(Date.now() - host.value.uptime_seconds * 1000)
    .toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
})

const totalMem = computed(() =>
  metrics.snapshot ? humanBytes(metrics.snapshot.mem_point.mem_total, 1) : '—',
)

const items = computed(() => [
  { icon: Server,      label: 'Host',         value: hosts.active?.name ?? host.value?.hostname ?? '—' },
  { icon: Globe,       label: 'API URL',      value: hosts.active?.url ?? '—', mono: true },
  { icon: MonitorCog,  label: 'OS',           value: host.value ? `${host.value.platform} ${host.value.platform_version}` : '—' },
  { icon: GitBranch,   label: 'Kernel',       value: host.value?.kernel_version ?? '—', mono: true },
  { icon: Container,   label: 'Containers',   value: String(metrics.snapshot?.containers?.length ?? 0), mono: true },
  { icon: Layers,      label: 'OS family',    value: host.value?.os ?? '—', mono: true },
  { icon: Cpu,         label: 'Total CPU',    value: host.value ? `${host.value.cpu_cores} cores` : '—' },
  { icon: MemoryStick, label: 'Total memory', value: totalMem.value },
])
</script>

<template>
  <section class="system-info">
    <header class="system-info__head">
      <div class="system-info__brand">
        <div class="system-info__icon" :class="{ 'system-info__icon--loading': loading }">
          <Server :size="20" />
        </div>
        <div class="system-info__titles">
          <template v-if="loading">
            <div class="system-info__skeleton-title" />
            <div class="system-info__skeleton-sub" />
          </template>
          <template v-else>
            <div class="system-info__title">
              System info · {{ hosts.active?.name ?? host?.hostname ?? '—' }}
            </div>
            <div class="system-info__sub">
              {{ host?.hostname ?? '—' }}<template v-if="bootDate"> · since {{ bootDate }}</template>
            </div>
          </template>
        </div>
      </div>

      <div class="system-info__status">
        <div class="system-info__uptime">
          <template v-if="loading">
            <div class="system-info__skeleton-uptime-label" />
            <div class="system-info__skeleton-uptime-value" />
          </template>
          <template v-else>
            <div class="system-info__uptime-label">Uptime</div>
            <div class="system-info__uptime-value">{{ liveUptime }}</div>
          </template>
        </div>
        <BaseBadge v-if="!loading" tone="success">
          <Activity :size="12" /> healthy
        </BaseBadge>
        <div v-else class="system-info__skeleton-badge" />
      </div>
    </header>

    <template v-if="error && !loading">
      <div class="system-info__error" role="alert">
        Failed to load system information. Retrying…
      </div>
    </template>
    <template v-else>
      <div class="system-info__grid">
        <template v-if="loading">
          <div v-for="i in 8" :key="i" class="system-info__item">
            <div class="system-info__skeleton-chip" />
            <div class="system-info__meta">
              <div class="system-info__skeleton-meta-label" />
              <div class="system-info__skeleton-meta-value" />
            </div>
          </div>
        </template>
        <template v-else>
          <div v-for="it in items" :key="it.label" class="system-info__item">
            <div class="system-info__chip">
              <component :is="it.icon" :size="16" />
            </div>
            <div class="system-info__meta">
              <div class="system-info__meta-label">{{ it.label }}</div>
              <div class="system-info__meta-value" :class="{ 'system-info__meta-value--mono': it.mono }">
                {{ it.value }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </section>
</template>

<style lang="scss" scoped>
.system-info {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5) var(--space-6);

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-5);
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }
  &__icon {
    width: 40px; height: 40px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, var(--brand-from), var(--brand-to));
    color: var(--color-primary-foreground);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px -8px var(--color-brand-glow);
    flex-shrink: 0;

    &--loading {
      background: var(--color-accent-bg);
      box-shadow: none;
      color: var(--color-accent-bg);
    }
  }
  &__titles { min-width: 0; }
  &__title {
    font-size: var(--fs-h3);
    font-weight: var(--fw-bold);
    color: var(--color-foreground);
    @include truncate;
  }
  &__sub {
    font-size: 12px;
    color: var(--color-subtle-foreground);
    @include truncate;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  &__uptime { text-align: right; }
  &__uptime-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted-foreground);
  }
  &__uptime-value {
    font-family: $font-stack-mono;
    font-size: 18px;
    font-weight: var(--fw-bold);
    letter-spacing: 0.5px;
    color: var(--color-foreground);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3) var(--space-6);
    padding-top: var(--space-5);
    border-top: 1px solid var(--color-divider);

    @include from($bp-sm) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    @include from($bp-lg) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    min-width: 0;
  }
  &__chip {
    width: 32px; height: 32px;
    border-radius: var(--radius-md);
    background: var(--color-muted);
    color: var(--color-muted-foreground);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  &__meta { min-width: 0; }
  &__meta-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted-foreground);
  }
  &__meta-value {
    font-size: var(--fs-label);
    font-weight: var(--fw-semibold);
    color: var(--color-foreground);
    @include truncate;
    &--mono { font-family: $font-stack-mono; }
  }

  // Error
  &__error {
    padding: var(--space-3) var(--space-4);
    background: var(--color-warning);
    color: #000;
    border-radius: var(--radius-lg);
    font-size: var(--fs-label);
    font-weight: var(--fw-semibold);
    text-align: center;
  }

  // Skeleton placeholders
  &__skeleton-title {
    @include skeleton(16px, 220px);
  }
  &__skeleton-sub {
    @include skeleton(12px, 140px);
    margin-top: 4px;
  }
  &__skeleton-uptime-label {
    @include skeleton(10px, 48px);
    margin-left: auto;
  }
  &__skeleton-uptime-value {
    @include skeleton(18px, 88px);
    margin-left: auto;
    margin-top: 4px;
  }
  &__skeleton-badge {
    @include skeleton(22px, 64px);
    border-radius: var(--radius-md);
  }
  &__skeleton-chip {
    @include skeleton(32px, 32px);
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }
  &__skeleton-meta-label {
    @include skeleton(10px, 56px);
  }
  &__skeleton-meta-value {
    @include skeleton(13px, 80px);
    margin-top: 4px;
  }
}
</style>
