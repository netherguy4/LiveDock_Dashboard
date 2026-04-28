<script setup lang="ts">
// Micro bar-chart used in dashboard summaries (e.g. requests per minute).
// Pure SVG, scales to container.
interface Props {
  values: number[]
  color?: string
  height?: number | string
  /** if true, normalise so max value === full height */
  normalize?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  color: '#10b981',
  height: 48,
  normalize: true,
})

const bars = computed(() => {
  const v = props.values
  if (!v?.length) return [] as { x: number; y: number; w: number; h: number }[]
  const W = 100
  const H = 100
  const gap = 1
  const n = v.length
  const bw = Math.max(0.5, (W - gap * (n - 1)) / n)
  const max = props.normalize ? Math.max(...v, 1) : 100
  return v.map((value, i) => {
    const h = Math.max(1, (value / max) * H)
    return { x: i * (bw + gap), y: H - h, w: bw, h }
  })
})
</script>

<template>
  <div
    class="bars"
    :style="{ height: typeof height === 'number' ? `${height}px` : height }"
  >
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="bars__svg">
      <rect
        v-for="(b, i) in bars"
        :key="i"
        :x="b.x"
        :y="b.y"
        :width="b.w"
        :height="b.h"
        :fill="color"
        rx="0.5"
      />
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.bars {
  width: 100%;
  &__svg {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
