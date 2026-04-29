<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { detectLogLevel } from '~/constants/status'
import { useLogsStore } from '~/stores/logs.store'
import { useContainersStore } from '~/stores/containers.store'
import { useUiStore } from '~/stores/ui.store'
import type { LogLevel } from '~/constants/status'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseLine(line: string): { ts: string | null; body: string } {
  const m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\s*/.exec(line)
  if (!m) return { ts: null, body: line }
  const d = new Date(m[1] + 'Z')
  const mon = MONTHS[d.getUTCMonth()]
  const day = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  const s = String(d.getUTCSeconds()).padStart(2, '0')
  let body = line.slice(m[0].length)
  body = body.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\s*)+/, '')
  return { ts: `${mon} ${day} ${h}:${min}:${s}`, body }
}

interface LogEntry {
  prefix: string
  ts: string | null
  body: string
  level: LogLevel
  containerId: string | null
}

interface Props {
  containerName?: string
}

const props = defineProps<Props>()

const logs = useLogsStore()
const containers = useContainersStore()
const ui = useUiStore()
const scroller = ref<HTMLElement | null>(null)

const filterEnabled = reactive<Record<LogLevel, boolean>>({
  debug: true,
  info: true,
  warn: true,
  error: true,
})

const runningIds = computed(() =>
  containers.items.filter((c) => c.state === 'running').map((c) => c.id),
)

const containersSorted = computed(() =>
  [...containers.items].sort((a, b) => a.name.localeCompare(b.name)),
)

watchEffect(() => {
  if (props.containerName) {
    const container = containers.byName(props.containerName)
    if (container) logs.select(container.id)
  }
})

const rawLines = computed<LogEntry[]>(() => {
  if (props.containerName) {
    const id = containers.byName(props.containerName)?.id
    if (!id) return []
    const data = logs.byContainer[id]
    if (!data) return []
    return data.lines.map((line) => {
      const parsed = parseLine(line)
      return {
        prefix: '',
        ts: parsed.ts,
        body: parsed.body,
        level: detectLogLevel(line),
        containerId: null,
      }
    })
  }

  if (logs.activeId) {
    const data = logs.byContainer[logs.activeId]
    if (!data) return []
    return data.lines.map((line) => {
      const parsed = parseLine(line)
      return {
        prefix: '',
        ts: parsed.ts,
        body: parsed.body,
        level: detectLogLevel(line),
        containerId: null,
      }
    })
  }

  const result: LogEntry[] = []
  for (const id of runningIds.value) {
    const data = logs.byContainer[id]
    if (!data) continue
    const name = containers.items.find((c) => c.id === id)?.name ?? id
    for (const line of data.lines) {
      const parsed = parseLine(line)
      result.push({
        prefix: `[${name}]`,
        ts: parsed.ts,
        body: parsed.body,
        level: detectLogLevel(line),
        containerId: id,
      })
    }
  }
  return result.slice(-1000)
})

const filteredLines = computed(() =>
  rawLines.value.filter((entry) => filterEnabled[entry.level]),
)

const levelCounts = computed(() => {
  const counts: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 }
  for (const entry of rawLines.value) {
    counts[entry.level]++
  }
  return counts
})

const hasSource = computed(
  () =>
    !!props.containerName ||
    !!logs.activeId ||
    runningIds.value.length > 0,
)

const showEmpty = computed(() => !hasSource.value)
const showLoading = computed(() => hasSource.value && filteredLines.value.length === 0 && !logs.error)
const showError = computed(() => !!logs.error)
const showJumpButton = computed(() => filteredLines.value.length > 0 && !ui.logsAutoScroll)

onMounted(() => {
  nextTick(() => {
    jumpToBottom()
  })
})

let scrollTimer: ReturnType<typeof setTimeout> | null = null

watch(filteredLines, () => {
  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }

  const el = scroller.value
  if (!el) return

  const prevHeight = el.scrollHeight
  const prevTop = el.scrollTop
  const wasAtBottom = prevHeight - prevTop - el.clientHeight < 80

  scrollTimer = setTimeout(() => {
    scrollTimer = null
    const s = scroller.value
    if (!s) return

    if (wasAtBottom) {
      s.scrollTop = s.scrollHeight
      if (!ui.logsAutoScroll) ui.logsAutoScroll = true
    } else {
      s.scrollTop = prevTop
    }
  }, 20)
})

function onScroll() {
  const el = scroller.value
  if (!el) return
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  ui.logsAutoScroll = atBottom
}

function jumpToBottom() {
  ui.logsAutoScroll = true
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

function pickContainer(id: string) {
  logs.select(id || null)
  ui.logsAutoScroll = true
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  })
}

function toggleFilter(level: LogLevel) {
  filterEnabled[level] = !filterEnabled[level]
}

const FILTER_CHIPS: { level: LogLevel; label: string; dotClass: string }[] = [
  { level: 'info', label: 'INFO', dotClass: 'logs__filter-dot--info' },
  { level: 'warn', label: 'WARN', dotClass: 'logs__filter-dot--warn' },
  { level: 'error', label: 'ERROR', dotClass: 'logs__filter-dot--error' },
]

const STREAMING = 'streaming'
const IDLE = 'idle'

const statusText = computed(() => {
  if (showError.value) return IDLE
  return STREAMING
})
</script>

<template>
  <div class="logs">
    <div class="logs__bar">
      <select
        v-if="!props.containerName"
        class="logs__picker"
        :value="logs.activeId ?? ''"
        @change="pickContainer(($event.target as HTMLSelectElement).value)"
      >
        <option value="">All running</option>
        <option
          v-for="c in containersSorted"
          :key="c.id"
          :value="c.id"
        >
          {{ c.name }}
        </option>
      </select>

      <div class="logs__filters">
        <button
          v-for="chip in FILTER_CHIPS"
          :key="chip.level"
          type="button"
          class="logs__filter-chip"
          :class="{ 'logs__filter-chip--off': !filterEnabled[chip.level] }"
          @click="toggleFilter(chip.level)"
        >
          <span class="logs__filter-dot" :class="chip.dotClass" />
          {{ chip.label }}
          <span class="logs__filter-count">{{ levelCounts[chip.level] }}</span>
        </button>
      </div>

      <div class="logs__status">
        <span
          class="logs__pulse"
          :class="{
            'logs__pulse--live': statusText === STREAMING && !showError,
          }"
        />
        <span class="logs__status-label">{{ statusText }}</span>
        <span
          v-if="filteredLines.length > 0"
          class="logs__status-linecount"
        >{{ filteredLines.length }} line{{ filteredLines.length !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <div
      ref="scroller"
      class="logs__scroller"
      :class="{ 'logs__scroller--hidden': showEmpty || showLoading || showError }"
      @scroll="onScroll"
    >
      <pre
        v-for="(entry, i) in filteredLines"
        :key="i"
        class="logs__line"
        :class="`logs__line--${entry.level}`"
      ><span
          v-if="entry.containerId"
          class="logs__prefix logs__prefix--link"
          @click.stop="pickContainer(entry.containerId)"
        >{{ entry.prefix }}</span>&#32;<span
          v-if="entry.ts"
          class="logs__ts"
        >{{ entry.ts }}  </span>{{ entry.body }}</pre>
      <div class="logs__cursor">&#x258D;</div>
    </div>

    <div v-if="showLoading" class="logs__placeholder">
      <div class="logs__skeleton-wrapper">
        <div
          v-for="n in 8"
          :key="n"
          class="logs__skeleton-line"
          :class="{ 'logs__skeleton-line--short': n % 2 === 0 }"
        />
      </div>
    </div>

    <div v-else-if="showEmpty" class="logs__placeholder">
      <div class="logs__empty">
        <p class="logs__empty-title">No running containers</p>
        <p class="logs__empty-sub">Start a container to see its logs here.</p>
      </div>
    </div>

    <div v-if="showError" class="logs__error">
      <span class="logs__error-text">{{ logs.error }}</span>
      <button type="button" class="logs__error-retry" @click="logs.activeId ? logs.refreshActive() : logs.refreshAll(runningIds)">Retry</button>
    </div>

    <Transition name="logs-jump">
      <button
        v-if="showJumpButton"
        type="button"
        class="logs__jump"
        @click="jumpToBottom"
      >
        <ChevronDown :size="14" /> Latest
      </button>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.logs {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  gap: var(--space-3);
}

// ── Toolbar ────────────────────────────────────────────────────────────────
.logs__bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  flex-shrink: 0;
}

// ── Select ─────────────────────────────────────────────────────────────────
.logs__picker {
  height: 30px;
  padding: 0 var(--space-2);
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-foreground);
  font-size: var(--fs-label);
  font-family: $font-stack-mono;
  cursor: pointer;
  appearance: auto;
  max-width: 220px;

  &:hover {
    border-color: var(--color-muted-foreground);
  }

  &:focus-visible {
    @include focus-ring;
  }
}

// ── Filter chips ───────────────────────────────────────────────────────────
.logs__filters {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.logs__filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-foreground);
  font-family: $font-stack-mono;
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background $transition-fast, border-color $transition-fast, color $transition-fast;
  user-select: none;

  &:hover {
    background: var(--color-accent-hover);
  }

  &--off {
    background: transparent;
    color: var(--color-muted-foreground);
    border-color: transparent;

    .logs__filter-dot {
      opacity: 0.35;
    }

    &:hover {
      background: var(--color-accent);
      color: var(--color-foreground);
    }
  }
}

.logs__filter-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  &--info {
    background: var(--color-subtle-foreground);
  }

  &--warn {
    background: var(--amber-500);
  }

  &--error {
    background: var(--red-500);
  }
}

.logs__filter-count {
  font-weight: var(--fw-medium);
  opacity: 0.6;
  margin-left: 1px;
}

// ── Status ─────────────────────────────────────────────────────────────────
.logs__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
  flex-shrink: 0;
}

.logs__pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--emerald-500);
  flex-shrink: 0;
  opacity: 0.6;

  &--live {
    opacity: 1;
    animation: logs-pulse 2.2s ease-out infinite;
  }
}

.logs__status-label {
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  color: var(--color-muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.logs__status-linecount {
  font-family: $font-stack-mono;
  font-size: var(--fs-caption);
  color: var(--color-subtle-foreground);
}

// ── Scroller ───────────────────────────────────────────────────────────────
.logs__scroller {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  @include scrollbar(6px);
  font-family: $font-stack-mono;
  font-size: var(--fs-mono);
  line-height: 1.65;
  color: var(--color-foreground);

  &--hidden {
    display: none;
  }
}

.logs__line {
  margin: 0;
  padding: 1px 0;
  white-space: pre-wrap;
  word-break: break-all;
  animation: log-enter 150ms $ease-out both;

  &--debug {
    color: var(--color-subtle-foreground);
  }

  &--info {
    color: var(--color-foreground);
  }

  &--warn {
    color: var(--amber-400);
  }

  &--error {
    color: var(--red-400);
  }
}

.logs__prefix {
  color: var(--teal-400);
  font-weight: var(--fw-semibold);

  &--link {
    cursor: pointer;
    border-radius: 3px;
    padding: 0 1px;
    transition: background $transition-fast;

    &:hover {
      background: oklch(0.792 0.2 185 / 0.18);
    }

    &:focus-visible {
      outline: 2px solid var(--teal-500);
      outline-offset: 1px;
    }
  }
}

.logs__ts {
  color: var(--color-subtle-foreground);
}

.logs__cursor {
  color: var(--emerald-400);
  animation: logs-blink 1.2s steps(2) infinite;
  margin-top: 1px;
}

// ── Skeleton loading ───────────────────────────────────────────────────────
.logs__placeholder {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logs__skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.logs__skeleton-line {
  @include skeleton(12px, 100%);
  border-radius: var(--radius-sm);

  &--short {
    width: 60%;
  }
}

// ── Empty state ────────────────────────────────────────────────────────────
.logs__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  text-align: center;
}

.logs__empty-title {
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--color-muted-foreground);
  margin: 0;
}

.logs__empty-sub {
  font-size: var(--fs-small);
  color: var(--color-subtle-foreground);
  max-width: 32ch;
  margin: 0;
}

// ── Error bar ──────────────────────────────────────────────────────────────
.logs__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: oklch(0.637 0.237 25.331 / 0.08);
  border: 1px solid oklch(0.637 0.237 25.331 / 0.2);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.logs__error-text {
  font-size: var(--fs-small);
  color: var(--red-400);
  font-family: $font-stack-mono;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logs__error-retry {
  padding: 2px var(--space-2);
  background: transparent;
  border: 1px solid oklch(0.637 0.237 25.331 / 0.3);
  border-radius: var(--radius-sm);
  color: var(--red-400);
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: oklch(0.637 0.237 25.331 / 0.12);
  }
}

// ── Jump to latest button ──────────────────────────────────────────────────
.logs__jump {
  position: absolute;
  bottom: var(--space-3);
  right: var(--space-3);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  background: var(--color-card);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: var(--fs-small);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: opacity $transition-base, transform $transition-base;

  &:hover {
    background: var(--color-accent);
  }
}

// ── Animations ─────────────────────────────────────────────────────────────
@keyframes logs-blink {
  50% {
    opacity: 0;
  }
}

@keyframes logs-pulse {
  0%,
  100% {
    opacity: 1;
  }
  55% {
    opacity: 0.25;
  }
}

@keyframes log-enter {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logs-jump-enter-active {
  transition:
    opacity 200ms $ease-out,
    transform 200ms $ease-out;
}

.logs-jump-leave-active {
  transition:
    opacity 120ms $ease-out,
    transform 120ms $ease-out;
}

.logs-jump-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.logs-jump-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
