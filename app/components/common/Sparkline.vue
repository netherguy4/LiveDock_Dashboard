<script setup lang="ts">
// Lightweight SVG sparkline — matches the visual style of the new design
// (thin polyline + soft area gradient). No chart.js dependency for this
// inline use case; small enough to live in scoped <style>.

const uid = useId()

interface Props {
  values: number[]
  color?: string
  height?: number | string
  width?: number | string
}
const props = withDefaults(defineProps<Props>(), {
  color: 'var(--emerald-500)',
  height: 64,
  width: '100%',
})

const W = 200
const H = 60

// Catmull-Rom → cubic Bezier smoothing. Tension 0.35 ≈ chart.js default
// feel — soft curves without overshoot at peaks.
function smoothPath(points: Array<[number, number]>): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    const [a, b] = points
    return `M${a[0]},${a[1]} L${b[0]},${b[1]}`
  }
  const t = 0.35
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) * t
    const c1y = p1[1] + (p2[1] - p0[1]) * t
    const c2x = p2[0] - (p3[0] - p1[0]) * t
    const c2y = p2[1] - (p3[1] - p1[1]) * t
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`
  }
  return d
}

// Moving average — knocks down high-frequency jitter from raw 2s
// polling samples while keeping the overall shape intact. Applied
// three times for stronger smoothing (≈ Gaussian kernel with σ ≈ 3.5
// samples on the final pass).
function smoothOnce(values: number[]): number[] {
  if (values.length < 3) return values
  const out = new Array<number>(values.length)
  out[0] = values[0]
  out[values.length - 1] = values[values.length - 1]
  for (let i = 1; i < values.length - 1; i++) {
    out[i] = (values[i - 1] + values[i] + values[i + 1]) / 3
  }
  return out
}
function smooth(values: number[]): number[] {
  return smoothOnce(smoothOnce(smoothOnce(values)))
}

// Downsample to ~TARGET buckets via averaging — matters when raw history
// has 200+ samples and each segment ends up ~1px wide, which makes
// smoothing visually invisible. Averaging instead of dropping samples
// preserves shape.
const TARGET = 40
function downsample(values: number[]): number[] {
  if (values.length <= TARGET) return values
  const out = new Array<number>(TARGET)
  const step = values.length / TARGET
  for (let i = 0; i < TARGET; i++) {
    const start = Math.floor(i * step)
    const end = Math.floor((i + 1) * step)
    let sum = 0
    let n = 0
    for (let j = start; j < end; j++) {
      sum += values[j]
      n++
    }
    out[i] = n ? sum / n : values[start]
  }
  return out
}

const path = computed(() => {
  const v = smooth(downsample(props.values))
  if (!v?.length) return { line: '', area: '' }
  const max = Math.max(...v)
  const min = Math.min(...v)
  const span = max - min || 1
  const last = v.length - 1
  // Reserve vertical padding so peaks have breathing room and Catmull-Rom
  // overshoot stays inside the viewBox.
  const PAD_TOP = 14
  const PAD_BOTTOM = 4
  const usableH = H - PAD_TOP - PAD_BOTTOM
  const pts: Array<[number, number]> = v.map((value, i) => {
    const x = last === 0 ? W / 2 : (i / last) * W
    const y = (H - PAD_BOTTOM) - ((value - min) / span) * usableH
    return [x, y]
  })
  const line = smoothPath(pts)
  const area = line ? `${line} L${W},${H} L0,${H} Z` : ''
  return { line, area }
})

// Stable per-instance gradient ID — not derived from the color string,
// which can contain CSS var references like `var(--emerald-500)`
// and break the `url(#...)` parser.
const gradId = computed(() => `spark-grad-${uid}`)
</script>

<template>
  <div
    class="spark"
    :style="{
      height: typeof height === 'number' ? `${height}px` : height,
      width: typeof width === 'number' ? `${width}px` : width,
    }"
  >
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="spark__svg">
      <template v-if="path.line">
        <defs>
          <linearGradient :id="gradId" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" :stop-color="color" stop-opacity="0.35" />
            <stop offset="100%" :stop-color="color" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path v-if="path.area" :d="path.area" :fill="`url(#${gradId})`" />
        <path
          :d="path.line"
          fill="none"
          :stroke="color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </template>
      <!-- Empty state: subtle baseline so the card doesn't have a void -->
      <line
        v-else
        x1="0" :y1="H - 4"
        :x2="W" :y2="H - 4"
        stroke="var(--color-track)"
        stroke-width="1"
      />
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.spark {
  position: relative;
  min-width: 60px;
  overflow: hidden;

  &__svg {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
