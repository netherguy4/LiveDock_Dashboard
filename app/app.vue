<script setup lang="ts">
// App shell. Wires the global polling driver, renders <NuxtPage>, and
// mounts the toast container. All persistent state lives in Pinia stores;
// this file just orchestrates lifecycle.

import { POLLING } from '~/configs/polling.config'
import { useContainersStore } from '~/stores/containers.store'
import { useHostsStore } from '~/stores/hosts.store'
import { useMetricsStore } from '~/stores/metrics.store'
import { useRequestsStore } from '~/stores/requests.store'
import { useLogsStore } from '~/stores/logs.store'
import { useUiStore } from '~/stores/ui.store'

// vue-sonner Toaster — client-only via lazy import to avoid SSR side-effects.
const Toaster = defineAsyncComponent(() =>
  import('vue-sonner').then((m) => m.Toaster),
)

const route = useRoute()
const ui = useUiStore()
const metrics = useMetricsStore()
const containers = useContainersStore()
const requests = useRequestsStore()
const hosts = useHostsStore()
const logs = useLogsStore()

// Auth-aware: only poll when we're on a real page (not /login). The auth
// middleware already gates pages, so any route here is authenticated.
const polling = computed(() => route.path !== '/login' && !ui.paused)

// Counters track multiplier ticks without scheduling separate timers.
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
  // Run once immediately, then tick.
  void runTick(true)
  baseTimer = setInterval(() => void runTick(false), ui.intervalMs)
}

async function runTick(initial: boolean) {
  tickN++
  // snapshot every tick — drives the dashboard
  void metrics.refreshSnapshot()
  // logs follow snapshot when an active container is selected
  if (logs.activeId) void logs.refreshActive()
  // history every N ticks (or on first run)
  if (initial || tickN % POLLING.HISTORY_EVERY === 0) {
    void metrics.refreshHistory()
  }
  // requests every N ticks (1/min by default)
  if (initial || tickN % POLLING.REQUESTS_EVERY === 0) {
    void requests.refresh()
  }
  // tunnels & hosts — slow-moving metadata, refresh occasionally
  if (initial || tickN % 60 === 0) {
    void containers.refreshTunnels()
    void hosts.refresh()
  }
}

watch([() => ui.intervalMs, polling], start, { immediate: false })
onMounted(start)
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
