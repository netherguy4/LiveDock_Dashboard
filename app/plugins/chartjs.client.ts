// Register only the Chart.js parts we actually use, to keep the bundle small.

import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js'

export default defineNuxtPlugin(() => {
  ChartJS.register(
    LineElement,
    BarElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Filler,
    Tooltip,
    Legend,
  )
})
