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
      <div class="controls">
        <button
          class="pause-btn"
          :class="{ paused }"
          @click="togglePause"
          :title="paused ? 'Resume polling' : 'Pause polling'"
        >
          {{ paused ? '▶ Resume' : '❙❙ Pause' }}
        </button>
        <label class="interval">
          <span>every</span>
          <select v-model.number="intervalMs" :disabled="paused">
            <option :value="1000">1s</option>
            <option :value="2000">2s</option>
            <option :value="5000">5s</option>
            <option :value="10000">10s</option>
            <option :value="30000">30s</option>
          </select>
        </label>
        <div class="last-update" :class="{ stale: !paused && lastUpdated > 0 && staleness > 5 }">
          <template v-if="paused">paused</template>
          <template v-else-if="lastUpdated === 0">connecting…</template>
          <template v-else>last update {{ staleness.toFixed(0) }}s ago</template>
        </div>
      </div>
    </header>

    <section class="cards">
      <StatCard
        label="CPU"
        :value="pct(snapshot?.cpu)"
        :sub="`${snapshot?.host?.cpu_cores ?? 0} cores`"
        :bar="snapshot?.cpu"
      />
      <StatCard
        label="Memory"
        :value="pct(snapshot?.mem_point?.mem)"
        :sub="`${humanBytes(snapshot?.mem_point?.mem_used)} / ${humanBytes(snapshot?.mem_point?.mem_total)}`"
        :bar="snapshot?.mem_point?.mem"
      />
      <StatCard
        label="Download"
        :value="humanBps(snapshot?.net_rx_bps)"
        sub="incoming"
      />
      <StatCard
        label="Upload"
        :value="humanBps(snapshot?.net_tx_bps)"
        sub="outgoing"
      />
      <StatCard
        v-for="d in (snapshot?.disks ?? []).slice(0, 2)"
        :key="d.path"
        :label="`Disk ${d.device ? d.device.replace(/^.*\//, '') : d.path}`"
        :value="pct(d.used_pct)"
        :sub="`${humanBytes(d.used)} / ${humanBytes(d.total)}`"
        :bar="d.used_pct"
      />
    </section>

    <section class="charts">
      <TimeChart
        :labels="series.labels"
        :datasets="[
          { label: 'CPU %', data: series.cpu, color: '#3b82f6' },
          { label: 'Mem %', data: series.mem, color: '#8b5cf6' },
        ]"
        yUnit="%"
        :yMax="100"
      />
      <TimeChart
        :labels="series.labels"
        :datasets="[
          { label: 'Download MB/s', data: series.rx, color: '#10b981' },
          { label: 'Upload MB/s', data: series.tx, color: '#f59e0b' },
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
import type { ContainerAction, HistoryPoint, Snapshot } from '~/composables/useApi'
import { humanBps, humanBytes, humanDuration, pct } from '~/utils/format'

const MB = 1024 * 1024
const STORAGE_KEY = 'monitoring:pollPrefs'
const HISTORY_MINUTES = 15

const config = useRuntimeConfig()

const snapshot = ref<Snapshot | null>(null)
const history = ref<HistoryPoint[]>([])
const now = ref<number>(Date.now())
const lastUpdated = ref<number>(0)
const selectedId = ref<string | null>(null)
const toast = ref<{ text: string; type: 'ok' | 'err' } | null>(null)

async function pollSnapshot() {
  try {
    snapshot.value = await $fetch<Snapshot>('/api/snapshot')
    lastUpdated.value = Date.now()
  } catch {
    /* keep last snapshot */
  }
}

async function pollHistory() {
  try {
    history.value = await $fetch<HistoryPoint[]>('/api/history', {
      params: { minutes: HISTORY_MINUTES },
    })
  } catch {
    /* ignore */
  }
}

const { intervalMs, paused, toggle: togglePause } = usePolling(
  [
    pollSnapshot,
    { run: pollHistory, every: 5, minMs: 10000 },
  ],
  { defaultMs: config.public.pollInterval, storageKey: STORAGE_KEY },
)

const staleness = computed(() => Math.max(0, (now.value - lastUpdated.value) / 1000))
const selectedName = computed(
  () => snapshot.value?.containers.find((c) => c.id === selectedId.value)?.name ?? '',
)
const loadStr = computed(() => {
  const l = snapshot.value?.load
  return l ? `${l[0].toFixed(2)} ${l[1].toFixed(2)} ${l[2].toFixed(2)}` : '—'
})

const series = computed(() => {
  const labels: string[] = []
  const cpu: number[] = []
  const mem: number[] = []
  const rx: number[] = []
  const tx: number[] = []
  for (const p of history.value) {
    labels.push(new Date(p.ts).toLocaleTimeString())
    cpu.push(round(p.cpu))
    mem.push(round(p.mem))
    rx.push(round(p.net_rx_bps / MB, 2))
    tx.push(round(p.net_tx_bps / MB, 2))
  }
  return { labels, cpu, mem, rx, tx }
})

function round(n: number, d = 1) {
  return Number(n.toFixed(d))
}

function onSelect(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

async function onAction(p: { id: string; name: string; action: ContainerAction }) {
  if (p.action === 'stop' && !confirm(`Stop ${p.name}?`)) return
  try {
    await $fetch(`/api/containers/${p.id}/action`, { method: 'POST', body: { action: p.action } })
    showToast(`${p.action} ${p.name}: ok`, 'ok')
    setTimeout(pollSnapshot, 800)
  } catch (e: any) {
    showToast(`${p.action} ${p.name}: ${e?.data?.error || 'failed'}`, 'err')
  }
}

function showToast(text: string, type: 'ok' | 'err') {
  toast.value = { text, type }
  setTimeout(() => (toast.value = null), 3000)
}

let nowTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  nowTimer = setInterval(() => (now.value = Date.now()), 1000)
})
onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
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

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.pause-btn {
  background: #1a1f29;
  color: #c7ccd6;
  border: 1px solid #222832;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  min-height: 32px;
}
.pause-btn:hover { background: #222832; color: #e7eaf0; }
.pause-btn.paused { background: #064e3b; border-color: #10b981; color: #d1fae5; }
.interval {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #7a869a;
}
.interval select {
  background: #1a1f29;
  color: #c7ccd6;
  border: 1px solid #222832;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 12px;
  cursor: pointer;
  min-height: 32px;
}
.interval select:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 640px) {
  .top { flex-direction: column; align-items: stretch; gap: 12px; }
  .controls { justify-content: flex-start; }
}

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
.charts > * { min-width: 0; }
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
