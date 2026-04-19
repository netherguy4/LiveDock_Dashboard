<template>
  <div class="card">
    <div class="label">{{ label }}</div>
    <div class="value">{{ value }}</div>
    <div v-if="sub" class="sub">{{ sub }}</div>
    <div v-if="bar != null" class="bar">
      <div class="bar-fill" :style="{ width: Math.min(100, Math.max(0, bar)) + '%', background: barColor(bar) }" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string; sub?: string; bar?: number }>()
function barColor(p: number) {
  if (p > 85) return '#ef4444'
  if (p > 65) return '#f59e0b'
  return '#10b981'
}
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
