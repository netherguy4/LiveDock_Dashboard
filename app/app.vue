<script setup lang="ts">
import { POLLING } from '~/configs/polling.config'
import { useHostsStore } from '~/stores/hosts.store'
import { useMetricsStore } from '~/stores/metrics.store'
import { useRequestsStore } from '~/stores/requests.store'
import { useLogsStore } from '~/stores/logs.store'
import { useContainersStore } from '~/stores/containers.store'
import { useUiStore } from '~/stores/ui.store'
import { useAuthStore } from '~/stores/auth.store'

const Toaster = defineAsyncComponent(() =>
  import('vue-sonner').then((m) => m.Toaster),
)

const route = useRoute()
const ui = useUiStore()
const metrics = useMetricsStore()
const requests = useRequestsStore()
const hosts = useHostsStore()
const auth = useAuthStore()
const containers = useContainersStore()
const logs = useLogsStore()

const polling = computed(() => route.path !== '/login' && auth.kind === 'user' && !ui.paused)

// Client is the single source of truth for hosts — localStorage supplies
// localExtras, afterHydrate merges them into items, and the watcher below
// kicks off data loading once hosts are available.
let baseTimer: ReturnType<typeof setInterval> | null = null
let tickN = 0

function stop() {
  if (baseTimer) {
    clearInterval(baseTimer)
    baseTimer = null
  }
}

function start() {
  stop()
  if (!polling.value) return
  tickN = 0
  void runTick()
  baseTimer = setInterval(() => void runTick(), ui.intervalMs)
}

function runTick() {
  if (hosts.isEmpty) return
  tickN++
  void metrics.refreshSnapshot()
  if (logs.activeId) {
    void logs.refreshActive()
  } else {
    const running = containers.items.filter(c => c.state === 'running').map(c => c.id)
    if (running.length) void logs.refreshAll(running)
  }
  if (tickN % POLLING.HISTORY_EVERY === 0) void metrics.refreshHistory()
  if (tickN % POLLING.REQUESTS_EVERY === 0) void requests.refresh()
}

watch([() => ui.intervalMs, polling], start, { immediate: false })

// Keep the containers store in sync with each snapshot globally — pages that
// don't mount ContainersPanel (e.g. /containers/[name]) still need fresh stats.
watch(
  () => metrics.snapshot?.containers,
  (next) => { if (next) containers.syncFromSnapshot(next) },
  { immediate: true },
)

// Load data when hosts exist and we're past the login page.
// /login guard prevents 401s — all API calls would fail during auth.
watch(
  () => [auth.kind, auth.isAuthed, route.path] as const,
  ([kind, authed, path]) => {
    if (!authed || path === '/login') return
    if (kind === 'user') void hosts.load()
    if (kind === 'admin') hosts.reset()
  },
  { immediate: true },
)

watch(
  () => [hosts.isEmpty, route.path, hosts.activeId, auth.kind] as const,
  ([empty, path, _activeId, kind]) => {
    tickN = 0
    if (empty || path === '/login' || kind !== 'user') return
    void metrics.refreshSnapshot()
    void metrics.refreshHistory()
    void requests.refresh()
  },
  { immediate: true },
)

onMounted(() => {
  ui.booted = true
  tickN = 0
  start()
})
onUnmounted(stop)
</script>

<template>
  <div class="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <Toaster position="bottom-right" rich-colors />
    </ClientOnly>
  </div>
</template>

<style lang="scss" scoped>
.app { isolation: isolate; }
</style>
