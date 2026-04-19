import { onMounted, onUnmounted, ref, watch } from 'vue'

type Timer = ReturnType<typeof setInterval>
type PollTask = (() => void | Promise<void>) | {
  run: () => void | Promise<void>
  /** Multiplier of the base interval. e.g. 5 means "poll 5× less often". */
  every?: number
  /** Minimum interval for this task in ms, regardless of multiplier. */
  minMs?: number
}

export interface PollingOptions {
  defaultMs: number
  storageKey?: string
  minMs?: number
}

export function usePolling(tasks: PollTask[], opts: PollingOptions) {
  const { defaultMs, storageKey, minMs = 500 } = opts

  const intervalMs = ref<number>(defaultMs)
  const paused = ref<boolean>(false)
  const lastRunAt = ref<number>(0)
  const timers: Timer[] = []

  function stop() {
    while (timers.length) clearInterval(timers.pop()!)
  }

  function start() {
    stop()
    if (paused.value) return
    lastRunAt.value = Date.now()
    for (const task of tasks) {
      const fn = typeof task === 'function' ? task : task.run
      const multiplier = typeof task === 'function' ? 1 : (task.every ?? 1)
      const taskMin = typeof task === 'function' ? 0 : (task.minMs ?? 0)
      const period = Math.max(intervalMs.value * multiplier, taskMin)
      const tick = () => {
        lastRunAt.value = Date.now()
        try { void fn() } catch {}
      }
      tick()
      timers.push(setInterval(tick, period))
    }
  }

  function toggle() {
    paused.value = !paused.value
  }

  function loadPrefs() {
    if (!storageKey || typeof localStorage === 'undefined') return
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const p = JSON.parse(raw)
      if (typeof p.intervalMs === 'number' && p.intervalMs >= minMs) intervalMs.value = p.intervalMs
      if (typeof p.paused === 'boolean') paused.value = p.paused
    } catch {}
  }

  function savePrefs() {
    if (!storageKey || typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        intervalMs: intervalMs.value,
        paused: paused.value,
      }))
    } catch {}
  }

  watch([intervalMs, paused], () => {
    savePrefs()
    start()
  })

  onMounted(() => {
    loadPrefs()
    start()
  })

  onUnmounted(stop)

  return { intervalMs, paused, lastRunAt, toggle, restart: start }
}
