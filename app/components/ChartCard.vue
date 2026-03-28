<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type Chart,
  type ChartOptions,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  type TooltipItem,
  Tooltip
} from 'chart.js'
import katex from 'katex'
import { Bar, Line } from 'vue-chartjs'
import { chartMetricAxisLabel, formatChartMetricValue, type ChartMetric } from '~/shared/format'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)
const { t } = useI18n()
const rootRef = ref<HTMLElement | null>(null)
const lineRef = shallowRef<{ chart?: Chart<'line' | 'bar'> | null } | null>(null)
const infoOpen = ref(false)
const MOBILE_TOOLTIP_LINE_LIMIT = 26

const props = defineProps<{
  title: string
  subtitle: string
  infoText?: string
  labels: string[]
  pointTitles?: string[]
  tooltipDetailLines?: string[][]
  tooltipTitleMode?: 'default' | 'point-title-only'
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    borderWidth?: number
    yAxisID?: string
  }>
  primaryMetric: Exclude<ChartMetric, 'heartRate'>
  secondaryMetric?: ChartMetric
  invertPrimaryAxis?: boolean
  stacked?: boolean
  variant?: 'line' | 'bar'
}>()

const chartVariant = computed(() => props.variant ?? 'line')
const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((dataset) => ({
    ...dataset,
    tension: chartVariant.value === 'line' ? 0.25 : 0,
    fill: false,
    pointRadius: chartVariant.value === 'line' ? 3 : 0,
    borderWidth: dataset.borderWidth ?? (chartVariant.value === 'bar' ? 1 : 2),
    borderRadius: chartVariant.value === 'bar' ? 8 : 0,
    barPercentage: chartVariant.value === 'bar' ? 0.72 : undefined,
    categoryPercentage: chartVariant.value === 'bar' ? 0.72 : undefined
  }))
}))

function wrapTooltipText(value: string, maxLineLength = MOBILE_TOOLTIP_LINE_LIMIT): string[] {
  const text = value.trim()
  if (!text) {
    return []
  }

  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (nextLine.length <= maxLineLength) {
      currentLine = nextLine
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    currentLine = word
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderInfoTextToHtml(value: string) {
  const inlinePattern = /\$([^$\n]+?)\$/g

  return value
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim().length > 0)
    .map((paragraph) => {
      const trimmed = paragraph.trim()
      const blockMatch = trimmed.match(/^\$\$[\s\S]+\$\$$/)
      if (blockMatch) {
        const expression = trimmed.slice(2, -2).trim()
        return katex.renderToString(expression, {
          displayMode: true,
          throwOnError: false
        })
      }

      const withInlineMath = escapeHtml(trimmed).replace(inlinePattern, (_fullMatch, expression: string) =>
        katex.renderToString(expression.trim(), {
          displayMode: false,
          throwOnError: false
        })
      )

      return `<p>${withInlineMath.replaceAll('\n', '<br>')}</p>`
    })
    .join('')
}

const renderedInfoText = computed(() => (props.infoText ? renderInfoTextToHtml(props.infoText) : ''))

const baseChartOptions = computed(() => ({
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
        title: (items: TooltipItem<'line' | 'bar'>[]) => {
          const firstItem = items[0]
          if (!firstItem) {
            return ''
          }

          const pointTitle = props.pointTitles?.[firstItem.dataIndex]
          const dateLabel = props.labels[firstItem.dataIndex] ?? ''
          if (!pointTitle) {
            return dateLabel
          }

          if (props.tooltipTitleMode === 'point-title-only') {
            return wrapTooltipText(pointTitle)
          }

          return [...wrapTooltipText(pointTitle), dateLabel]
        },
        label: (context: TooltipItem<'line' | 'bar'>) => {
          const metric = context.dataset.yAxisID === 'y1' && props.secondaryMetric ? props.secondaryMetric : props.primaryMetric
          const prefix = context.dataset.label ? `${context.dataset.label}: ` : ''
          const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0
          return `${prefix}${formatChartMetricValue(metric, value)}`
        },
        afterBody: (items: TooltipItem<'line' | 'bar'>[]) => {
          const firstItem = items[0]
          if (!firstItem) {
            return []
          }

          return props.tooltipDetailLines?.[firstItem.dataIndex] ?? []
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: chartVariant.value === 'bar',
      stacked: chartVariant.value === 'bar' && Boolean(props.stacked),
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
      stacked: chartVariant.value === 'bar' && Boolean(props.stacked),
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
    },
    x: {
      stacked: chartVariant.value === 'bar' && Boolean(props.stacked)
    }
  }
}))

const lineChartOptions = computed(() => baseChartOptions.value as ChartOptions<'line'>)
const barChartOptions = computed(() => baseChartOptions.value as ChartOptions<'bar'>)

function hideChartTooltip() {
  const chart = lineRef.value?.chart
  if (!chart) {
    return
  }

  chart.setActiveElements([])
  chart.tooltip?.setActiveElements([], { x: 0, y: 0 })
  chart.update('none')
}

function toggleInfo() {
  infoOpen.value = !infoOpen.value
}

function dismissInteractiveOverlays(event: PointerEvent) {
  if (rootRef.value?.contains(event.target as Node)) {
    return
  }

  infoOpen.value = false
  hideChartTooltip()
}

onMounted(() => {
  document.addEventListener('pointerdown', dismissInteractiveOverlays)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', dismissInteractiveOverlays)
})
</script>

<template>
  <section ref="rootRef" class="section-card card chart-card">
    <div class="chart-header">
      <h3 class="section-title">{{ title }}</h3>
      <button
        v-if="infoText"
        class="info-trigger"
        type="button"
        :aria-label="t('chart.howCalculated', { title })"
        :aria-expanded="infoOpen"
        @click="toggleInfo"
      >
        <span class="info-icon">i</span>
        <div class="info-popover" :class="{ 'info-popover-open': infoOpen }">
          <div v-html="renderedInfoText" />
        </div>
      </button>
    </div>
    <p class="section-subtitle">{{ subtitle }}</p>
    <div class="chart-frame">
      <Bar v-if="chartVariant === 'bar'" ref="lineRef" :data="chartData" :options="barChartOptions" />
      <Line v-else ref="lineRef" :data="chartData" :options="lineChartOptions" />
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
  border: 0;
  padding: 0;
}

.info-popover {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  z-index: 20;
  width: min(21rem, calc(100vw - 2rem));
  padding: 0.9rem 1rem;
  border-radius: 0.95rem;
  background: rgba(29, 25, 18, 0.96);
  color: #fffaf2;
  box-shadow: 0 22px 44px rgba(15, 13, 9, 0.28);
  text-align: left;
  line-height: 1.45;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-0.2rem);
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.info-popover-open {
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

  .info-popover {
    left: 50%;
    right: auto;
    width: min(18rem, calc(100vw - 1rem));
    transform: translate(-50%, -4px);
  }

  .info-popover-open {
    transform: translate(-50%, 0);
  }
}

:deep(.info-popover p) {
  margin: 0;
}

:deep(.info-popover p + p) {
  margin-top: 0.55rem;
}

:deep(.info-popover .katex-display) {
  margin: 0.55rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
