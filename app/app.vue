<script setup lang="ts">
import { POLLING } from '~/configs/polling.config'
import { useHostsStore } from '~/stores/hosts.store'
import { useMetricsStore } from '~/stores/metrics.store'
import { useRequestsStore } from '~/stores/requests.store'
import { useLogsStore } from '~/stores/logs.store'
import { useUiStore } from '~/stores/ui.store'

const Toaster = defineAsyncComponent(() =>
  import('vue-sonner').then((m) => m.Toaster),
)

const route = useRoute()
const ui = useUiStore()
const metrics = useMetricsStore()
const requests = useRequestsStore()
const hosts = useHostsStore()
const logs = useLogsStore()

const polling = computed(() => route.path !== '/login' && !ui.paused)

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
  if (logs.activeId) void logs.refreshActive()
  if (tickN % POLLING.HISTORY_EVERY === 0) void metrics.refreshHistory()
  if (tickN % POLLING.REQUESTS_EVERY === 0) void requests.refresh()
}

watch([() => ui.intervalMs, polling], start, { immediate: false })

// Load data when hosts exist and we're past the login page.
// /login guard prevents 401s — all API calls would fail during auth.
watch(
  () => [hosts.isEmpty, route.path] as const,
  ([empty, path]) => {
    tickN = 0
    if (empty || path === '/login') return
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
