// Helper that builds a minimal Chart.js config for inline sparklines.
// No axes, no legend — just the line + a faint fill.
//
// Usage: pass an array of numbers and a CSS color (or token reference).

import type { ChartData, ChartOptions } from 'chart.js'

export const useSparkline = () => {
  const toFill = (c: string): string => {
    // Hex: append alpha
    if (/^#[0-9a-f]{6}$/i.test(c)) return `${c}33`
    // For anything else (oklch/rgb/hsl/var), wrap with color-mix
    return `color-mix(in srgb, ${c} 20%, transparent)`
  }

  const buildData = (values: number[], color: string): ChartData<'line'> => ({
    labels: values.map((_, i) => String(i)),
    datasets: [
      {
        data: values,
        borderColor: color,
        backgroundColor: toFill(color),
        borderWidth: 1.75,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  })

  const buildOptions = (): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      point: { radius: 0 },
    },
  })

  return { buildData, buildOptions }
}
