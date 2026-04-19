<template>
  <div class="card">
    <div class="label">{{ label }}</div>
    <div class="value">{{ value }}</div>
    <div v-if="sub" class="sub">{{ sub }}</div>
    <div v-if="barStyle" class="bar">
      <div class="bar-fill" :style="barStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ label: string; value: string; sub?: string; bar?: number }>()

const barStyle = computed(() => {
  if (props.bar == null || !Number.isFinite(props.bar)) return null
  const pct = Math.min(100, Math.max(0, props.bar))
  const background = pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#10b981'
  return { width: `${pct}%`, background }
})
</script>

<style scoped>
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
.label { font-size: 11px; text-transform: uppercase; color: #7a869a; letter-spacing: 0.05em; }
.value { font-size: 22px; font-weight: 600; color: #e7eaf0; }
.sub { font-size: 12px; color: #97a0b3; }
.bar { margin-top: 8px; background: #1a1f29; border-radius: 4px; height: 4px; overflow: hidden; }
.bar-fill { height: 100%; transition: width 0.3s ease; }
</style>
