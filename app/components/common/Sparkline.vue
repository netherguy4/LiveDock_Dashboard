<script setup lang="ts">
// SVG sparkline with Catmull-Rom smoothing, draw-in animation, and
// hover inspection. No chart.js — inline SVG keeps the bundle small.

const uid = useId()

interface Props {
  values: number[]
  color?: string
  unit?: string
  height?: number | string
  width?: number | string
}
const props = withDefaults(defineProps<Props>(), {
  color: 'var(--emerald-500)',
  unit: '',
  height: 64,
  width: '100%',
})

const W = 200
const H = 60

// Catmull-Rom → cubic Bezier smoothing. Tension 0.38 provides a
// relaxed curve that smooths angular transitions while keeping
// overshoot small enough for a compact viewBox.
function smoothPath(points: Array<[number, number]>): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    const [a, b] = points
    return `M${a[0]},${a[1]} L${b[0]},${b[1]}`
  }
  const t = 0.38
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
// five times for stronger smoothing.
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
  return smoothOnce(smoothOnce(smoothOnce(smoothOnce(smoothOnce(values)))))
}

// Downsample to ~TARGET buckets via averaging.
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

// Separate smoothed (visual curve) from raw-downsampled (inspection).
// The moving-average smoothing is for eye comfort — the tooltip must
// show the actual data, not the blurred version.
const smoothedData = computed(() => smooth(downsample(props.values)))
const rawDownsampled = computed(() => downsample(props.values))

const smoothedPoints = computed<Array<[number, number]>>(() => {
  const v = smoothedData.value
  if (!v?.length) return []
  const max = Math.max(...v)
  const min = Math.min(...v)
  const span = max - min || 1
  const last = v.length - 1
  const PAD_TOP = 18
  const PAD_BOTTOM = 4
  const usableH = H - PAD_TOP - PAD_BOTTOM
  return v.map((value, i) => {
    const x = last === 0 ? W / 2 : (i / last) * W
    const y = (H - PAD_BOTTOM) - ((value - min) / span) * usableH
    return [x, y]
  })
})

const path = computed(() => {
  const pts = smoothedPoints.value
  if (!pts.length) return { line: '', area: '' }
  const line = smoothPath(pts)
  const area = line ? `${line} L${W},${H} L0,${H} Z` : ''
  return { line, area }
})

// Stable per-instance gradient ID.
const gradId = computed(() => `spark-grad-${uid}`)

const ariaLabel = computed(() => {
  const v = props.values
  if (!v?.length) return 'No data'
  const max = Math.max(...v)
  const min = Math.min(...v)
  const last = v[v.length - 1]
  const first = v[0]
  const trend = last > first ? 'rising' : last < first ? 'falling' : 'stable'
  return `Trend: ${trend}, ranging from ${min.toFixed(1)} to ${max.toFixed(1)}`
})

// Draw-in animation via stroke-dashoffset.
const lineRef = ref<SVGPathElement | null>(null)

watch(
  () => path.value.line,
  async (next) => {
    if (!next) return
    await nextTick()
    const el = lineRef.value
    if (!el) return
    const len = el.getTotalLength()
    el.style.transition = 'none'
    el.style.strokeDasharray = String(len)
    el.style.strokeDashoffset = String(len)
    el.getBoundingClientRect()
    el.style.transition = ''
    el.style.strokeDashoffset = '0'
  },
)

// Hover inspection — snap cursor to nearest data point.
const containerRef = ref<HTMLElement | null>(null)
const hoverIdx = ref(-1)

const hoverPoint = computed(() => {
  if (hoverIdx.value < 0 || !smoothedPoints.value.length) return null
  return smoothedPoints.value[hoverIdx.value]
})

const hoverValue = computed(() => {
  if (hoverIdx.value < 0) return null
  const d = rawDownsampled.value
  return hoverIdx.value < d.length ? d[hoverIdx.value] : null
})

function formatValue(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1000) return Math.round(v).toString()
  if (abs >= 10) return v.toFixed(1)
  if (abs >= 1) return v.toFixed(2)
  if (abs === 0) return '0'
  return v.toFixed(3)
}

const tooltipX = computed(() => {
  if (!hoverPoint.value) return 0
  const x = hoverPoint.value[0]
  const HALF = 32
  return Math.max(HALF, Math.min(W - HALF, x))
})

function findNearest(clientX: number) {
  const el = containerRef.value
  if (!el || !smoothedPoints.value.length) return
  const rect = el.getBoundingClientRect()
  const vx = ((clientX - rect.left) / rect.width) * W
  const pts = smoothedPoints.value
  let nearest = 0
  let nearestDist = Math.abs(pts[0][0] - vx)
  for (let i = 1; i < pts.length; i++) {
    const dist = Math.abs(pts[i][0] - vx)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = i
    }
  }
  hoverIdx.value = nearest
}

function onMouseMove(e: MouseEvent) { findNearest(e.clientX) }
function onTouchMove(e: TouchEvent) { findNearest(e.touches[0].clientX) }
function onMouseLeave() { hoverIdx.value = -1 }
function onTouchEnd() { hoverIdx.value = -1 }
</script>

<template>
  <div
    ref="containerRef"
    class="spark"
    :style="{
      height: typeof height === 'number' ? `${height}px` : height,
      width: typeof width === 'number' ? `${width}px` : width,
    }"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @touchmove.prevent="onTouchMove"
    @touchend="onTouchEnd"
  >
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="spark__svg" role="img" :aria-label="ariaLabel">
      <template v-if="path.line">
        <defs>
          <linearGradient :id="gradId" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" :stop-color="color" stop-opacity="0.35" />
            <stop offset="100%" :stop-color="color" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path v-if="path.area" :d="path.area" :fill="`url(#${gradId})`" class="spark__area" />
        <path
          ref="lineRef"
          :d="path.line"
          fill="none"
          :stroke="color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="spark__line"
        />
        <!-- Hover indicator -->
        <line
          v-if="hoverPoint"
          :x1="hoverPoint[0]"
          y1="0"
          :x2="hoverPoint[0]"
          :y2="H"
          class="spark__cursor"
        />
        <circle
          v-if="hoverPoint"
          :cx="hoverPoint[0]"
          :cy="hoverPoint[1]"
          r="3.5"
          :stroke="color"
          class="spark__dot"
        />
        <rect
          v-if="hoverPoint"
          :x="tooltipX - 32"
          y="1"
          width="64"
          height="18"
          rx="4"
          class="spark__tip-bg"
        />
        <text
          v-if="hoverValue !== null"
          :x="tooltipX"
          y="14"
          text-anchor="middle"
          class="spark__tip-text"
        >
          {{ formatValue(hoverValue)
          }}<tspan v-if="unit" class="spark__tip-unit"> {{ unit }}</tspan>
        </text>
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
  cursor: crosshair;

  &__svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__line {
    transition: stroke-dashoffset 500ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  &__area {
    transition: opacity 400ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  &__cursor {
    stroke: var(--color-border);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    pointer-events: none;
  }

  &__dot {
    fill: var(--color-card);
    stroke-width: 1.5;
    pointer-events: none;
  }

  &__tip-bg {
    fill: var(--color-popover);
    stroke: var(--color-border);
    stroke-width: 1;
    pointer-events: none;
  }

  &__tip-text {
    fill: var(--color-foreground);
    font-size: 11px;
    font-weight: var(--fw-semibold);
    font-family: $font-stack-mono;
    pointer-events: none;
  }

  &__tip-unit {
    fill: var(--color-subtle-foreground);
    font-weight: var(--fw-medium);
  }
}
</style>
