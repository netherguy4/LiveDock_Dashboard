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

// Bootstrap: load hosts first, then the rest only if a host is reachable.
// `useAsyncData` blocks SSR until data arrives — the dashboard renders with
// real data on the server, no skeleton flash.
await useAsyncData('bootstrap', async () => {
  await hosts.refresh()
  if (hosts.isEmpty) return
  await Promise.allSettled([
    metrics.refreshSnapshot(),
    metrics.refreshHistory(),
    requests.refresh(),
  ])
})

let baseTimer: ReturnType<typeof setInterval> | null = null
let tickN = 0

ui.booted = true

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
  if (tickN % 60 === 0) {
    void hosts.refresh()
  }
}

watch([() => ui.intervalMs, polling], start, { immediate: false })

// When the first host appears, kick off a full data load immediately
// instead of waiting for the next scheduled tick.
watch(() => hosts.isEmpty, (empty) => {
  if (!empty) {
    void metrics.refreshSnapshot()
    void metrics.refreshHistory()
    void requests.refresh()
    tickN = 1
  }
})

onMounted(() => {
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
