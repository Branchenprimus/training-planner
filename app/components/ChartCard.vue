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
const { t } = useI18n()

const props = defineProps<{
  title: string
  subtitle: string
  infoText?: string
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    yAxisID?: string
  }>
  primaryMetric: Exclude<ChartMetric, 'heartRate'>
  secondaryMetric?: ChartMetric
  invertPrimaryAxis?: boolean
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
      reverse: Boolean(props.invertPrimaryAxis),
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
    <div class="chart-header">
      <h3 class="section-title">{{ title }}</h3>
      <div v-if="infoText" class="info-trigger" tabindex="0" :aria-label="t('chart.howCalculated', { title })">
        <span class="info-icon">i</span>
        <div class="info-popover">
          {{ infoText }}
        </div>
      </div>
    </div>
    <p class="section-subtitle">{{ subtitle }}</p>
    <div class="chart-frame">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>

<style scoped>
.chart-card {
  min-height: 385px;
  display: grid;
  grid-template-rows: auto minmax(4.8rem, 4.8rem) 1fr;
  align-items: start;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.info-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: #efe5d0;
  color: #5f4a2c;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: help;
  outline: none;
}

.info-popover {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  z-index: 10;
  width: min(20rem, 80vw);
  padding: 0.8rem 0.9rem;
  border-radius: 0.9rem;
  background: #fffaf0;
  border: 1px solid #dfcda9;
  box-shadow: 0 14px 28px rgba(77, 59, 24, 0.14);
  color: #4b3e2a;
  font-size: 0.9rem;
  line-height: 1.4;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition: opacity 120ms ease, transform 120ms ease;
}

.info-trigger:hover .info-popover,
.info-trigger:focus .info-popover,
.info-trigger:focus-within .info-popover {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.section-subtitle {
  display: -webkit-box;
  min-height: 4.8rem;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.chart-frame {
  position: relative;
  height: 280px;
  margin-top: 1rem;
}

@media (max-width: 640px) {
  .chart-card {
    min-height: 380px;
    grid-template-rows: auto minmax(4.8rem, 4.8rem) 1fr;
  }

  .section-subtitle {
    min-height: 4.8rem;
    -webkit-line-clamp: 3;
  }
}
</style>
