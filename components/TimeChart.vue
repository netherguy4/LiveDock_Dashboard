<template>
  <div class="chart-wrap">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend, TimeScale,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { computed } from 'vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, TimeScale)

const props = defineProps<{
  labels: string[]
  datasets: { label: string; data: number[]; color: string; fill?: boolean }[]
  yUnit?: string
  yMax?: number
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((d) => ({
    label: d.label,
    data: d.data,
    borderColor: d.color,
    backgroundColor: d.color + '33',
    fill: d.fill ?? true,
    tension: 0.25,
    pointRadius: 0,
    borderWidth: 2,
  })),
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  animation: false as const,
  plugins: {
    legend: { labels: { color: '#97a0b3' }, position: 'top' as const, align: 'end' as const },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    x: { ticks: { color: '#5b6578', maxTicksLimit: 6 }, grid: { color: '#1a1f29' } },
    y: {
      ticks: {
        color: '#5b6578',
        callback: (v: any) => `${v}${props.yUnit ?? ''}`,
      },
      grid: { color: '#1a1f29' },
      beginAtZero: true,
      max: props.yMax,
    },
  },
}))
</script>

<style scoped>
.chart-wrap {
  background: #11151c;
  border: 1px solid #222832;
  border-radius: 10px;
  padding: 14px;
  height: 220px;
}
</style>
