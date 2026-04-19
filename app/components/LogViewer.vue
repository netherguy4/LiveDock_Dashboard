<template>
  <div class="viewer">
    <div class="header">
      <div class="title">
        <strong>{{ name }}</strong>
        <span class="muted">logs</span>
      </div>
      <div class="controls">
        <label>
          <input type="checkbox" v-model="autoScroll" /> Auto-scroll
        </label>
        <button @click="$emit('close')">✕</button>
      </div>
    </div>
    <pre ref="pre" class="log"><span v-for="(l, i) in lines" :key="i" class="line">{{ l }}</span></pre>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ id: string; name: string }>()
defineEmits(['close'])

const lines = ref<string[]>([])
const autoScroll = ref(true)
const pre = ref<HTMLElement | null>(null)
let timer: ReturnType<typeof setInterval> | null = null
let lastFetched = 0
const MAX_LINES = 500
const POLL_MS = 1000

async function poll() {
  try {
    const res = await $fetch<{ lines: string[]; fetched: number }>(
      `/api/containers/${props.id}/logs`,
      { params: lastFetched ? { since: lastFetched, tail: 0 } : { tail: 200 } },
    )
    if (res.lines?.length) {
      const combined = lines.value.concat(res.lines)
      lines.value = combined.length > MAX_LINES ? combined.slice(-MAX_LINES) : combined
      if (autoScroll.value) {
        await nextTick()
        if (pre.value) pre.value.scrollTop = pre.value.scrollHeight
      }
    }
    lastFetched = res.fetched
  } catch (e) {
    // ignore transient errors
  }
}

function start() {
  lines.value = []
  lastFetched = 0
  poll()
  timer = setInterval(poll, POLL_MS)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(start)
onUnmounted(stop)
watch(() => props.id, () => {
  stop()
  start()
})
</script>

<style scoped>
.viewer {
  background: #0b0d12;
  border: 1px solid #222832;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  height: 420px;
  overflow: hidden;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #222832;
  background: #11151c;
}
.title { display: flex; gap: 8px; align-items: center; color: #e7eaf0; }
.muted { color: #5b6578; font-size: 12px; }
.controls { display: flex; gap: 12px; align-items: center; color: #97a0b3; font-size: 12px; }
.controls button {
  background: transparent; border: none; color: #97a0b3;
  cursor: pointer; font-size: 14px; padding: 2px 6px;
}
.controls button:hover { color: #e7eaf0; }
.log {
  flex: 1;
  overflow-y: auto;
  margin: 0;
  padding: 10px 14px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  color: #c7ccd6;
  white-space: pre-wrap;
  word-break: break-all;
}
.line { display: block; }
</style>
