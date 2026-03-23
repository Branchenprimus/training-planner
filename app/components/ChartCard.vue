<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  type TooltipItem,
  Tooltip
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { chartMetricAxisLabel, formatChartMetricValue, type ChartMetric } from '~/shared/format'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps<{
  title: string
  subtitle: string
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    yAxisID?: string
  }>
  primaryMetric: Exclude<ChartMetric, 'heartRate'>
  secondaryMetric?: Extract<ChartMetric, 'heartRate'>
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((dataset) => ({
    ...dataset,
    tension: 0.25,
    fill: false,
    pointRadius: 3
  }))
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  plugins: {
    legend: {
      position: 'bottom' as const
    },
    tooltip: {
      callbacks: {
        label: (context: TooltipItem<'line'>) => {
          const metric = context.dataset.yAxisID === 'y1' && props.secondaryMetric ? props.secondaryMetric : props.primaryMetric
          const prefix = context.dataset.label ? `${context.dataset.label}: ` : ''
          const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0
          return `${prefix}${formatChartMetricValue(metric, value)}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      reverse: props.primaryMetric === 'runningPace' || props.primaryMetric === 'swimmingPace',
      title: {
        display: true,
        text: chartMetricAxisLabel(props.primaryMetric)
      },
      ticks: {
        callback: (value: string | number) => formatChartMetricValue(props.primaryMetric, Number(value))
      }
    },
    y1: {
      display: Boolean(props.secondaryMetric),
      beginAtZero: false,
      position: 'right' as const,
      title: props.secondaryMetric
        ? {
            display: true,
            text: chartMetricAxisLabel(props.secondaryMetric)
          }
        : undefined,
      ticks: props.secondaryMetric
        ? {
            callback: (value: string | number) => formatChartMetricValue(props.secondaryMetric!, Number(value))
          }
        : undefined,
      grid: {
        drawOnChartArea: false
      }
    }
  }
}))
</script>

<template>
  <section class="section-card card chart-card">
    <h3 class="section-title">{{ title }}</h3>
    <p class="section-subtitle">{{ subtitle }}</p>
    <div class="chart-frame">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>

<style scoped>
.chart-card {
  min-height: 360px;
}

.chart-frame {
  position: relative;
  height: 280px;
  margin-top: 1rem;
}
</style>
