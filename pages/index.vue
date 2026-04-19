<template>
  <div class="page">
    <header class="top">
      <div>
        <h1>{{ snapshot?.host?.hostname || 'server' }}</h1>
        <div class="sub">
          {{ snapshot?.host?.platform }} {{ snapshot?.host?.platform_version }} ·
          {{ snapshot?.host?.kernel_version }} ·
          uptime {{ humanDuration(snapshot?.host?.uptime_seconds || 0) }}
        </div>
      </div>
      <div class="last-update" :class="{ stale: staleness > 5 }">
        last update {{ staleness.toFixed(0) }}s ago
      </div>
    </header>

    <section class="cards">
      <StatCard
        label="CPU"
        :value="pct(snapshot?.cpu)"
        :sub="`${snapshot?.host?.cpu_cores ?? 0} cores · load ${loadStr}`"
        :bar="snapshot?.cpu"
      />
      <StatCard
        label="Memory"
        :value="pct(snapshot?.mem_point?.mem)"
        :sub="`${humanBytes(snapshot?.mem_point?.mem_used)} / ${humanBytes(snapshot?.mem_point?.mem_total)}`"
        :bar="snapshot?.mem_point?.mem"
      />
      <StatCard
        label="Network ↓"
        :value="humanBps(snapshot?.net_rx_bps)"
        sub="rx"
      />
      <StatCard
        label="Network ↑"
        :value="humanBps(snapshot?.net_tx_bps)"
        sub="tx"
      />
      <StatCard
        v-for="d in (snapshot?.disks ?? []).slice(0, 2)"
        :key="d.path"
        :label="`Disk ${d.path}`"
        :value="pct(d.used_pct)"
        :sub="`${humanBytes(d.used)} / ${humanBytes(d.total)}`"
        :bar="d.used_pct"
      />
    </section>

    <section class="charts">
      <TimeChart
        :labels="chartLabels"
        :datasets="[
          { label: 'CPU %', data: cpuSeries, color: '#3b82f6' },
          { label: 'Mem %', data: memSeries, color: '#8b5cf6' },
        ]"
        yUnit="%"
        :yMax="100"
      />
      <TimeChart
        :labels="chartLabels"
        :datasets="[
          { label: 'RX MB/s', data: netRxSeries, color: '#10b981' },
          { label: 'TX MB/s', data: netTxSeries, color: '#f59e0b' },
        ]"
        yUnit=" MB/s"
      />
    </section>

    <section>
      <h2>Containers</h2>
      <ContainerList
        :containers="snapshot?.containers ?? []"
        :selectedId="selectedId"
        @select="onSelect"
        @action="onAction"
      />
    </section>

    <section v-if="selectedId">
      <LogViewer
        :id="selectedId"
        :name="selectedName"
        @close="selectedId = null"
      />
    </section>

    <div v-if="toast" class="toast" :class="toast.type">{{ toast.text }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { HistoryPoint, Snapshot } from '~/composables/useApi'
import { humanBps, humanBytes, humanDuration, pct } from '~/utils/format'

const config = useRuntimeConfig()
const pollMs = config.public.pollInterval

const snapshot = ref<Snapshot | null>(null)
const history = ref<HistoryPoint[]>([])
const lastUpdated = ref<number>(0)
const now = ref<number>(Date.now())
const selectedId = ref<string | null>(null)
const toast = ref<{ text: string; type: 'ok' | 'err' } | null>(null)

const staleness = computed(() => (now.value - lastUpdated.value) / 1000)
const selectedName = computed(
  () => snapshot.value?.containers.find((c) => c.id === selectedId.value)?.name ?? '',
)
const loadStr = computed(() => {
  const l = snapshot.value?.load
  if (!l) return '—'
  return `${l[0].toFixed(2)} ${l[1].toFixed(2)} ${l[2].toFixed(2)}`
})

const chartLabels = computed(() =>
  history.value.map((p) => new Date(p.ts).toLocaleTimeString()),
)
const cpuSeries = computed(() => history.value.map((p) => round(p.cpu)))
const memSeries = computed(() => history.value.map((p) => round(p.mem)))
const netRxSeries = computed(() =>
  history.value.map((p) => round(p.net_rx_bps / 1024 / 1024, 2)),
)
const netTxSeries = computed(() =>
  history.value.map((p) => round(p.net_tx_bps / 1024 / 1024, 2)),
)

function round(n: number, d = 1) {
  return Number(n.toFixed(d))
}

async function pollSnapshot() {
  try {
    const s = await $fetch<Snapshot>('/api/snapshot')
    snapshot.value = s
    lastUpdated.value = Date.now()
  } catch (e) {
    // keep last snapshot
  }
}

async function pollHistory() {
  try {
    history.value = await $fetch<HistoryPoint[]>('/api/history', { params: { minutes: 15 } })
  } catch (e) {
    // ignore
  }
}

function onSelect(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

async function onAction(p: { id: string; name: string; action: 'start' | 'stop' | 'restart' }) {
  if (p.action === 'stop' && !confirm(`Stop ${p.name}?`)) return
  try {
    await $fetch(`/api/containers/${p.id}/action`, {
      method: 'POST',
      body: { action: p.action },
    })
    showToast(`${p.action} ${p.name}: ok`, 'ok')
    setTimeout(pollSnapshot, 800)
  } catch (e: any) {
    showToast(`${p.action} ${p.name}: ${e?.data?.error || 'failed'}`, 'err')
  }
}

function showToast(text: string, type: 'ok' | 'err') {
  toast.value = { text, type }
  setTimeout(() => {
    toast.value = null
  }, 3000)
}

let snapTimer: any, histTimer: any, nowTimer: any

onMounted(() => {
  pollSnapshot()
  pollHistory()
  snapTimer = setInterval(pollSnapshot, pollMs)
  histTimer = setInterval(pollHistory, 10000)
  nowTimer = setInterval(() => (now.value = Date.now()), 1000)
})

onUnmounted(() => {
  clearInterval(snapTimer)
  clearInterval(histTimer)
  clearInterval(nowTimer)
})
</script>

<style scoped>
.page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.top h1 { margin: 0; color: #e7eaf0; font-size: 24px; font-weight: 600; }
.sub { color: #7a869a; font-size: 13px; margin-top: 4px; }
.last-update { color: #5b6578; font-size: 12px; font-variant-numeric: tabular-nums; }
.last-update.stale { color: #ef4444; }

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 900px) {
  .charts { grid-template-columns: 1fr; }
}
h2 { color: #e7eaf0; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; }

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid;
}
.toast.ok { background: #064e3b; border-color: #10b981; color: #d1fae5; }
.toast.err { background: #7f1d1d; border-color: #ef4444; color: #fee2e2; }
</style>
