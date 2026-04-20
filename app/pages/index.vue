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
          :class="{ paused: advanced, busy: advancedAnimating }"
          :disabled="advancedAnimating"
          @click="toggleAdvanced"
          :title="advanced ? 'Switch to basic charts' : 'Show per-core CPU and disk I/O'"
        >
          {{ advanced ? '◉ Advanced' : '○ Advanced' }}
        </button>
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

    <TransitionGroup
      ref="cardsRef"
      tag="section"
      name="card"
      class="cards"
      @enter="onCardEnter"
      @leave="onCardLeave"
    >
      <div
        key="cpu"
        class="card cpu-card"
        :class="{ expanded: cpuExpanded }"
        role="button"
        tabindex="0"
        :title="cpuExpanded ? 'Hide per-core CPU' : 'Show per-core CPU'"
        @click="toggleCpuExpanded"
        @keydown.enter.prevent="toggleCpuExpanded"
        @keydown.space.prevent="toggleCpuExpanded"
      >
        <div class="cpu-head">
          <div class="label">CPU</div>
          <svg viewBox="0 0 12 8" width="12" height="8" class="chev" aria-hidden="true">
            <path d="M1 1 L6 6 L11 1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="value">{{ pct(snapshot?.cpu) }}</div>
        <div class="sub">{{ snapshot?.host?.cpu_cores ?? 0 }} cores</div>
        <div class="bar">
          <div class="bar-fill" :style="cpuBarStyle" />
        </div>
      </div>
      <StatCard
        v-for="(p, i) in cpuExpanded ? (snapshot?.cpu_per_core ?? []) : []"
        :key="`core-${i}`"
        :data-card-idx="i"
        :data-card-total="snapshot?.cpu_per_core?.length ?? 0"
        :label="`Core ${i}`"
        :value="pct(p)"
        :bar="p"
      />
      <StatCard
        key="memory"
        label="Memory"
        :value="pct(snapshot?.mem_point?.mem)"
        :sub="`${humanBytes(snapshot?.mem_point?.mem_used)} / ${humanBytes(snapshot?.mem_point?.mem_total)}`"
        :bar="snapshot?.mem_point?.mem"
      />
      <StatCard
        key="download"
        label="Download"
        :value="humanBps(snapshot?.net_rx_bps)"
        sub="incoming"
      />
      <StatCard
        key="upload"
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
    </TransitionGroup>

    <section ref="chartsRef" class="charts">
      <div data-flip-id="cpu-mem" class="chart-slot">
        <TimeChart
          :labels="series.labels"
          :datasets="[
            { label: 'CPU %', data: series.cpu, color: '#3b82f6' },
            { label: 'Mem %', data: series.mem, color: '#8b5cf6' },
          ]"
          yUnit="%"
          :yMax="100"
        />
      </div>
      <div v-if="advanced" data-flip-id="per-core" class="chart-slot">
        <TimeChart
          :labels="series.labels"
          :datasets="perCoreDatasets"
          yUnit="%"
          :yMax="100"
        />
      </div>
      <div data-flip-id="net" class="chart-slot">
        <TimeChart
          :labels="series.labels"
          :datasets="[
            { label: 'Download MB/s', data: series.rx, color: '#10b981' },
            { label: 'Upload MB/s', data: series.tx, color: '#f59e0b' },
          ]"
          yUnit=" MB/s"
        />
      </div>
      <div v-if="advanced" data-flip-id="disk" class="chart-slot">
        <TimeChart
          :labels="series.labels"
          :datasets="[
            { label: 'Disk read MB/s', data: series.diskRead, color: '#10b981' },
            { label: 'Disk write MB/s', data: series.diskWrite, color: '#f59e0b' },
          ]"
          yUnit=" MB/s"
        />
      </div>
    </section>

    <section>
      <h2>Containers</h2>
      <ContainerList
        :containers="snapshot?.containers ?? []"
        :tunnels="tunnels"
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
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import type { ContainerAction, HistoryPoint, Snapshot } from '~/composables/useApi'

gsap.registerPlugin(Flip)
import { humanBps, humanBytes, humanDuration, pct } from '~/utils/format'

const MB = 1024 * 1024
const STORAGE_KEY = 'monitoring:pollPrefs'
const ADVANCED_KEY = 'monitoring:advancedCharts'
const CPU_EXPANDED_KEY = 'monitoring:cpuExpanded'
const HISTORY_MINUTES = 15

const config = useRuntimeConfig()

const snapshot = ref<Snapshot | null>(null)
const history = ref<HistoryPoint[]>([])
const tunnels = ref<Record<string, string[]>>({})
const now = ref<number>(Date.now())
const lastUpdated = ref<number>(0)
const selectedId = ref<string | null>(null)
const toast = ref<{ text: string; type: 'ok' | 'err' } | null>(null)
const advanced = ref<boolean>(false)
const cpuExpanded = ref<boolean>(false)
const chartsRef = ref<HTMLElement | null>(null)
const advancedAnimating = ref<boolean>(false)

async function toggleAdvanced() {
  if (advancedAnimating.value) return
  const root = chartsRef.value
  if (!root) {
    advanced.value = !advanced.value
    return
  }

  const expanding = !advanced.value
  advancedAnimating.value = true
  const state = Flip.getState(root.querySelectorAll('[data-flip-id]'))
  const fromHeight = root.getBoundingClientRect().height

  advanced.value = expanding
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem(ADVANCED_KEY, advanced.value ? '1' : '0') } catch {}
  }

  await nextTick()
  const toHeight = root.getBoundingClientRect().height
  const dur = 0.6

  // Animate the grid container's height so the page doesn't snap when a new
  // row is added/removed.
  gsap.fromTo(
    root,
    { height: fromHeight },
    {
      height: toHeight,
      duration: dur,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.set(root, { clearProps: 'height' })
        advancedAnimating.value = false
      },
    },
  )

  // Starting offset for entering elements so the swap reads visually.
  const enterOffset = (el: Element) => {
    const id = (el as HTMLElement).dataset.flipId
    if (id === 'per-core') return { yPercent: 60, xPercent: -20 }
    if (id === 'disk') return { yPercent: 40, xPercent: 0 }
    return { yPercent: 20, xPercent: 0 }
  }

  Flip.from(state, {
    targets: root.querySelectorAll('[data-flip-id]'),
    duration: dur,
    ease: 'power2.inOut',
    nested: true,
    onEnter: (els) =>
      els.map((el) => {
        const off = enterOffset(el)
        return gsap.fromTo(
          el,
          { opacity: 0, scale: 0.92, ...off },
          {
            opacity: 1,
            scale: 1,
            yPercent: 0,
            xPercent: 0,
            duration: dur,
            ease: 'power2.out',
            clearProps: 'transform,opacity,scale',
          },
        )
      }),
    onLeave: (els) =>
      gsap.to(els, {
        opacity: 0,
        scale: 0.92,
        yPercent: 30,
        duration: dur * 0.7,
        ease: 'power2.in',
      }),
  })
}

const cardsRef = ref<HTMLElement | null>(null)
const cpuAnimating = ref<boolean>(false)

const CARD_DUR = 0.45

function toggleCpuExpanded() {
  if (cpuAnimating.value) return
  cpuAnimating.value = true
  cpuExpanded.value = !cpuExpanded.value
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem(CPU_EXPANDED_KEY, cpuExpanded.value ? '1' : '0') } catch {}
  }
  setTimeout(() => { cpuAnimating.value = false }, (CARD_DUR + 0.2) * 1000)
}

function onCardEnter(el: Element, done: () => void) {
  const target = el as HTMLElement
  const idx = Number(target.dataset.cardIdx ?? 0)
  const delay = Number.isFinite(idx) ? idx * 0.035 : 0
  gsap.fromTo(
    target,
    { opacity: 0, scale: 0.85, yPercent: -20, filter: 'blur(6px)' },
    {
      opacity: 1,
      scale: 1,
      yPercent: 0,
      filter: 'blur(0px)',
      duration: CARD_DUR,
      delay,
      ease: 'power2.out',
      clearProps: 'transform,opacity,scale,filter',
      onComplete: done,
    },
  )
}

function onCardLeave(el: Element, done: () => void) {
  const target = el as HTMLElement
  const idx = Number(target.dataset.cardIdx ?? 0)
  const total = Number(target.dataset.cardTotal ?? 1)
  const delay = Number.isFinite(idx) && Number.isFinite(total)
    ? Math.max(0, total - 1 - idx) * 0.04
    : 0
  // Fade in place so the grid keeps the cell until done() — then Vue removes
  // the node and `.card-move` slides the remaining siblings.
  gsap.to(target, {
    opacity: 0,
    scale: 0.85,
    yPercent: -15,
    filter: 'blur(6px)',
    duration: CARD_DUR * 0.7,
    delay,
    ease: 'power2.in',
    onComplete: done,
  })
}

const cpuBarStyle = computed(() => {
  const v = snapshot.value?.cpu
  if (v == null || !Number.isFinite(v)) return null
  const p = Math.min(100, Math.max(0, v))
  const background = p > 85 ? '#ef4444' : p > 65 ? '#f59e0b' : '#10b981'
  return { width: `${p}%`, background }
})

async function pollSnapshot() {
  try {
    snapshot.value = await $fetch<Snapshot>('/api/snapshot')
    lastUpdated.value = Date.now()
  } catch {
    /* keep last snapshot */
  }
}

async function pollTunnels() {
  try {
    tunnels.value = await $fetch<Record<string, string[]>>('/api/tunnels')
  } catch {
    /* ignore */
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
    { run: pollTunnels, every: 30, minMs: 60000 },
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
  const diskRead: number[] = []
  const diskWrite: number[] = []
  const perCore: number[][] = []
  for (const p of history.value) {
    labels.push(new Date(p.ts).toLocaleTimeString())
    cpu.push(round(p.cpu))
    mem.push(round(p.mem))
    rx.push(round(p.net_rx_bps / MB, 2))
    tx.push(round(p.net_tx_bps / MB, 2))
    diskRead.push(round((p.disk_read_bps ?? 0) / MB, 2))
    diskWrite.push(round((p.disk_write_bps ?? 0) / MB, 2))
    const cores = p.cpu_per_core ?? []
    for (let i = 0; i < cores.length; i++) {
      if (!perCore[i]) perCore[i] = []
      perCore[i].push(round(cores[i]))
    }
  }
  return { labels, cpu, mem, rx, tx, diskRead, diskWrite, perCore }
})

const CORE_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#a855f7', '#14b8a6', '#eab308',
]

const perCoreDatasets = computed(() =>
  series.value.perCore.map((data, i) => ({
    label: `Core ${i}`,
    data,
    color: CORE_COLORS[i % CORE_COLORS.length],
    fill: false,
  })),
)

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
  if (typeof localStorage !== 'undefined') {
    try {
      advanced.value = localStorage.getItem(ADVANCED_KEY) === '1'
      cpuExpanded.value = localStorage.getItem(CPU_EXPANDED_KEY) === '1'
    } catch {}
  }
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
.pause-btn:disabled { cursor: not-allowed; opacity: 0.6; }
.pause-btn:disabled:hover { background: #1a1f29; color: #c7ccd6; }
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
  position: relative;
}
.card-move {
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}
.card {
  background: #11151c;
  border: 1px solid #222832;
  border-radius: 10px;
  padding: 14px 16px;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cpu-card {
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s, background 0.15s;
}
.cpu-card:hover { border-color: #2a3447; background: #151a23; }
.cpu-card:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
.cpu-head { display: flex; align-items: center; justify-content: space-between; }
.cpu-head .label { font-size: 11px; text-transform: uppercase; color: #7a869a; letter-spacing: 0.05em; }
.cpu-card .chev { color: #5b6578; transition: transform 0.25s cubic-bezier(0.33, 1, 0.68, 1); }
.cpu-card.expanded .chev { transform: rotate(180deg); color: #97a0b3; }
.cpu-card .value { font-size: 22px; font-weight: 600; color: #e7eaf0; }
.cpu-card .sub { font-size: 12px; color: #97a0b3; }
.cpu-card .bar { margin-top: 8px; background: #1a1f29; border-radius: 4px; height: 4px; overflow: hidden; }
.cpu-card .bar-fill { height: 100%; transition: width 0.3s ease; }

.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  position: relative;
  overflow: hidden;
}
.charts > * { min-width: 0; }
.chart-slot { min-width: 0; will-change: transform; }
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
