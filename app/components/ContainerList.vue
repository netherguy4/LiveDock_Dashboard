<template>
  <div class="list-wrap">
    <button
      type="button"
      class="filters-toggle"
      :class="{ open: filtersOpen }"
      :aria-expanded="filtersOpen"
      @click="filtersOpen = !filtersOpen"
    >
      <span>Filters & sort</span>
      <span class="filter-summary">{{ filterSummary }}</span>
      <svg viewBox="0 0 12 8" width="12" height="8" class="chev" aria-hidden="true">
        <path d="M1 1 L6 6 L11 1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <Collapse :when="filtersOpen" class="filters-collapse">
      <div class="filters">
        <label class="field">
          <span>Search</span>
          <input v-model="searchQuery" type="search" placeholder="name or image" @input="savePrefs" />
        </label>
        <label class="field">
          <span>State</span>
          <select v-model="stateFilter" @change="savePrefs">
            <option value="all">All</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
          </select>
        </label>
        <label class="field">
          <span>Sort by</span>
          <select v-model="sortKey" @change="savePrefs">
            <option v-for="col in columns" :key="col.key" :value="col.key">{{ col.label }}</option>
          </select>
        </label>
        <label class="field">
          <span>Direction</span>
          <select v-model="sortDir" @change="savePrefs">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
      </div>
    </Collapse>
  <div class="list">
    <div class="list-header" role="row">
      <button
        v-for="col in columns"
        :key="col.key"
        type="button"
        class="th"
        :class="[col.class, { sorted: sortKey === col.key }]"
        :aria-sort="sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'"
        @click="onSort(col.key)"
      >
        <span>{{ col.label }}</span>
        <svg
          class="sort-arrow"
          :class="arrowClass(col.key)"
          viewBox="0 0 10 14"
          width="8"
          height="12"
          aria-hidden="true"
        >
          <path class="up"   d="M5 0 L9 5 L1 5 Z" />
          <path class="down" d="M5 14 L1 9 L9 9 Z" />
        </svg>
      </button>
      <div class="th actions" aria-hidden="true">Actions</div>
    </div>
    <div
      v-for="c in sorted"
      :key="c.id"
      class="row"
      :class="{ active: selectedId === c.id }"
      @click="$emit('select', c.id)"
    >
      <div class="name">
        <div class="dot" :class="stateClass(c.state)" />
        <div class="name-col">
          <div class="primary">
            <span class="name-text">{{ c.name }}</span>
            <a
              v-for="url in tunnelUrls(c.name)"
              :key="url"
              class="tunnel-link"
              :href="url"
              target="_blank"
              rel="noopener noreferrer"
              :title="url"
              @click.stop
            >
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6.5 9.5 L9.5 6.5 M7 4.5 L9 2.5 A2.5 2.5 0 0 1 13.5 6 L11.5 8 M9 11.5 L7 13.5 A2.5 2.5 0 0 1 2.5 10 L4.5 8"
                />
              </svg>
            </a>
          </div>
          <div class="secondary">{{ c.image }}</div>
        </div>
      </div>
      <div class="state">{{ c.status }}</div>
      <div class="metric num" data-label="CPU">{{ c.stat ? pct(c.stat.cpu) : '—' }}</div>
      <div class="metric num" data-label="Mem">{{ c.stat ? humanBytes(c.stat.mem_used) : '—' }}</div>
      <div class="metric num" data-label="Download">{{ c.stat ? humanBps(c.stat.net_rx_bps) : '—' }}</div>
      <div class="metric num" data-label="Upload">{{ c.stat ? humanBps(c.stat.net_tx_bps) : '—' }}</div>
      <div class="actions" @click.stop>
        <button v-if="c.state !== 'running'" @click="act(c, 'start')" title="Start">▶</button>
        <button v-if="c.state === 'running'" @click="act(c, 'restart')" title="Restart">⟳</button>
        <button v-if="c.state === 'running'" @click="act(c, 'stop')" title="Stop" class="danger">■</button>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Collapse } from 'vue-collapsed'
import type { ContainerAction, ContainerRow } from '~/composables/useApi'
import { humanBps, humanBytes, pct } from '~/utils/format'

type SortKey = 'name' | 'state' | 'cpu' | 'mem' | 'rx' | 'tx'
type SortDir = 'asc' | 'desc'
type StateFilter = 'all' | 'running' | 'stopped'

const props = defineProps<{
  containers: ContainerRow[]
  selectedId?: string | null
  tunnels?: Record<string, string[]>
}>()
const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'action', payload: { id: string; name: string; action: ContainerAction }): void
}>()

const columns: { key: SortKey; label: string; class: string; defaultDir: SortDir }[] = [
  { key: 'name',  label: 'Container', class: 'name',      defaultDir: 'asc' },
  { key: 'state', label: 'State',     class: '',          defaultDir: 'asc' },
  { key: 'cpu',   label: 'CPU',       class: 'num',       defaultDir: 'desc' },
  { key: 'mem',   label: 'Memory',    class: 'num',       defaultDir: 'desc' },
  { key: 'rx',    label: 'Download',  class: 'num',       defaultDir: 'desc' },
  { key: 'tx',    label: 'Upload',    class: 'num',       defaultDir: 'desc' },
]
const SORT_KEYS = new Set(columns.map((c) => c.key))
const STORAGE_KEY = 'monitoring:containerSort'

const sortKey = ref<SortKey>('name')
const sortDir = ref<SortDir>('asc')
const searchQuery = ref<string>('')
const stateFilter = ref<StateFilter>('all')
const mobileFiltersOpen = ref<boolean>(false)
const isMobile = ref<boolean>(false)
const filtersOpen = computed({
  get: () => (isMobile.value ? mobileFiltersOpen.value : true),
  set: (v) => { if (isMobile.value) mobileFiltersOpen.value = v },
})

if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(max-width: 720px)')
  isMobile.value = mq.matches
  mq.addEventListener('change', (e) => (isMobile.value = e.matches))
}

// "Healthier" (running) first when ascending
const STATE_ORDER: Record<string, number> = {
  running: 0,
  restarting: 1,
  created: 2,
  paused: 3,
  exited: 4,
  dead: 5,
  removing: 6,
}
const stateRank = (s: string) => STATE_ORDER[s] ?? 99

const UPTIME_UNITS: Record<string, number> = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2592000,
  year: 31536000,
}
const UPTIME_RE = /^up\s+(?:about\s+)?(?:(\d+)|an?)\s+(second|minute|hour|day|week|month|year)s?/i

/** Parse docker status like "Up 52 minutes (healthy)" to approximate seconds. */
function parseUptimeSeconds(status: string | undefined): number {
  if (!status) return 0
  const m = UPTIME_RE.exec(status)
  if (!m) return 0
  const qty = m[1] ? parseInt(m[1], 10) : 1
  return qty * (UPTIME_UNITS[m[2].toLowerCase()] ?? 0)
}

const sortValue = (c: ContainerRow, key: SortKey): string | number => {
  switch (key) {
    case 'name':  return c.name.toLowerCase()
    case 'state': return stateRank(c.state)
    case 'cpu':   return c.stat?.cpu ?? -1
    case 'mem':   return c.stat?.mem_used ?? -1
    case 'rx':    return c.stat?.net_rx_bps ?? -1
    case 'tx':    return c.stat?.net_tx_bps ?? -1
  }
}

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const state = stateFilter.value
  return props.containers.filter((c) => {
    if (state === 'running' && c.state !== 'running') return false
    if (state === 'stopped' && c.state === 'running') return false
    if (q && !c.name.toLowerCase().includes(q) && !c.image.toLowerCase().includes(q)) return false
    return true
  })
})

const sorted = computed(() => {
  const list = filtered.value.slice()
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  list.sort((a, b) => {
    const av = sortValue(a, key)
    const bv = sortValue(b, key)
    if (av < bv) return -1 * dir
    if (av > bv) return 1 * dir
    // Tie-breakers: within same state, sort by state_ts (when state started).
    // asc → oldest state first, desc → newest state first.
    if (key === 'state' && a.state_ts && b.state_ts && a.state_ts !== b.state_ts) {
      return (a.state_ts - b.state_ts) * dir
    }
    return a.name.localeCompare(b.name)
  })
  return list
})

const filterSummary = computed(() => {
  const parts: string[] = []
  if (stateFilter.value !== 'all') parts.push(stateFilter.value)
  if (searchQuery.value.trim()) parts.push(`"${searchQuery.value.trim()}"`)
  parts.push(`${sortKey.value} ${sortDir.value === 'asc' ? '↑' : '↓'}`)
  return parts.join(' · ')
})

function onSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = columns.find((c) => c.key === key)!.defaultDir
  }
  savePrefs()
}

function loadPrefs() {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const p = JSON.parse(raw)
    if (SORT_KEYS.has(p.sortKey)) sortKey.value = p.sortKey
    if (p.sortDir === 'asc' || p.sortDir === 'desc') sortDir.value = p.sortDir
    if (typeof p.searchQuery === 'string') searchQuery.value = p.searchQuery
    if (p.stateFilter === 'all' || p.stateFilter === 'running' || p.stateFilter === 'stopped') {
      stateFilter.value = p.stateFilter
    }
  } catch {}
}

function savePrefs() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sortKey: sortKey.value,
        sortDir: sortDir.value,
        searchQuery: searchQuery.value,
        stateFilter: stateFilter.value,
      }),
    )
  } catch {}
}

onMounted(loadPrefs)

function arrowClass(key: SortKey) {
  if (sortKey.value !== key) return 'idle'
  return sortDir.value === 'asc' ? 'asc' : 'desc'
}

function stateClass(s: string) {
  if (s === 'running') return 'ok'
  if (s === 'restarting' || s === 'created') return 'warn'
  return 'down'
}

function tunnelUrls(name: string): string[] {
  return props.tunnels?.[name] ?? []
}

function act(c: ContainerRow, action: ContainerAction) {
  emit('action', { id: c.id, name: c.name, action })
}
</script>

<style scoped>
.list-wrap { display: flex; flex-direction: column; gap: 12px; }
.filters-toggle {
  display: none;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #11151c;
  border: 1px solid #222832;
  border-radius: 10px;
  color: #c7ccd6;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}
.filters-toggle .filter-summary {
  flex: 1;
  color: #7a869a;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.filters-toggle .chev { color: #7a869a; transition: transform 0.2s; flex-shrink: 0; }
.filters-toggle.open .chev { transform: rotate(180deg); }
.filters-collapse { transition: height 240ms cubic-bezier(0.33, 1, 0.68, 1); }
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  padding: 12px 14px;
  background: #11151c;
  border: 1px solid #222832;
  border-radius: 10px;
}
.field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.field > span { color: #7a869a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
.field input,
.field select {
  background: #1a1f29;
  color: #c7ccd6;
  border: 1px solid #222832;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  min-width: 0;
  min-height: 36px;
}
.field input:focus,
.field select:focus { outline: none; border-color: #3b82f6; }

.list { background: #11151c; border: 1px solid #222832; border-radius: 10px; overflow: hidden; }
.list-header, .row {
  display: grid;
  grid-template-columns: 2.5fr 1.5fr 0.8fr 1fr 0.9fr 0.9fr 1.1fr;
  align-items: center;
  padding: 10px 14px;
  gap: 12px;
}
.list-header { border-bottom: 1px solid #222832; font-size: 11px; color: #7a869a; text-transform: uppercase; letter-spacing: 0.05em; }
.list-header .th {
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  user-select: none;
  transition: color 0.15s;
}
.list-header .th:hover { color: #c7ccd6; }
.list-header .th.sorted { color: #e7eaf0; }
.list-header .th.num { justify-content: flex-end; }
.list-header .th.actions { cursor: default; justify-content: flex-end; color: #7a869a; }
.sort-arrow {
  flex-shrink: 0;
  overflow: visible;
  transition: opacity 0.15s;
}
.sort-arrow .up,
.sort-arrow .down { fill: #5b6578; transition: fill 0.15s; }
.list-header .th:hover .sort-arrow .up,
.list-header .th:hover .sort-arrow .down { fill: #7a869a; }
.sort-arrow.asc .up   { fill: #3b82f6; }
.sort-arrow.asc .down { fill: #2a3447; }
.sort-arrow.desc .down { fill: #3b82f6; }
.sort-arrow.desc .up   { fill: #2a3447; }
.row { border-bottom: 1px solid #1a1f29; cursor: pointer; transition: background 0.15s; }
.row:last-child { border-bottom: none; }
.row:hover { background: #151a23; }
.row.active { background: #1a2332; }
.name { display: flex; align-items: center; gap: 10px; min-width: 0; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot.ok { background: #10b981; box-shadow: 0 0 6px #10b98160; }
.dot.warn { background: #f59e0b; }
.dot.down { background: #ef4444; }
.name-col { min-width: 0; }
.primary { color: #e7eaf0; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 6px; min-width: 0; }
.primary .name-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.tunnel-link {
  display: inline-flex;
  align-items: center;
  color: #5b6578;
  flex-shrink: 0;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
.tunnel-link:hover { color: #3b82f6; background: #1a2332; }
.secondary { color: #5b6578; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.state { color: #97a0b3; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.num { text-align: right; color: #c7ccd6; font-variant-numeric: tabular-nums; font-size: 13px; }
.th.num { text-align: right; }
.actions { display: flex; gap: 4px; justify-content: flex-end; }
.actions button {
  background: #1a1f29; color: #c7ccd6; border: 1px solid #222832;
  border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 13px;
  min-width: 36px; min-height: 32px;
}
.actions button:hover { background: #222832; color: #e7eaf0; }
.actions button.danger:hover { background: #7f1d1d; border-color: #ef4444; }

@media (max-width: 720px) {
  .filters-toggle { display: flex; }
  .list { background: transparent; border: none; display: grid; gap: 10px; overflow: visible; }
  .list-header { display: none; }
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "name    state"
      "m1      m2"
      "m3      m4"
      "actions actions";
    row-gap: 10px;
    column-gap: 12px;
    padding: 14px;
    background: #11151c;
    border: 1px solid #222832;
    border-radius: 10px;
  }
  .row.active { background: #1a2332; border-color: #2a3447; }
  .row:hover { background: #11151c; }
  .row.active:hover { background: #1a2332; }
  .name { grid-area: name; min-width: 0; }
  .primary { font-size: 15px; white-space: normal; word-break: break-word; }
  .secondary { font-size: 12px; white-space: normal; word-break: break-all; }
  .state {
    grid-area: state;
    justify-self: end;
    align-self: start;
    text-align: right;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 999px;
    background: #1a1f29;
    border: 1px solid #222832;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60%;
  }
  .metric {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    gap: 2px;
    font-size: 14px;
  }
  .metric::before {
    content: attr(data-label);
    color: #5b6578;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .row > .metric:nth-of-type(1) { grid-area: m1; }
  .row > .metric:nth-of-type(2) { grid-area: m2; }
  .row > .metric:nth-of-type(3) { grid-area: m3; }
  .row > .metric:nth-of-type(4) { grid-area: m4; }
  .actions {
    grid-area: actions;
    justify-content: stretch;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid #1a1f29;
  }
  .actions button {
    flex: 1;
    padding: 10px 12px;
    font-size: 14px;
    min-height: 40px;
  }
}
</style>
