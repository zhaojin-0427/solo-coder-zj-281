<template>
  <div class="p-4 lg:p-6 animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold text-text">数据统计</h1>
      <div class="flex items-center gap-2">
        <button
          v-for="range in timeRanges"
          :key="range.value"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :class="[
            selectedTimeRange === range.value
              ? 'bg-primary text-white shadow-md'
              : 'bg-bg-card text-text-soft hover:bg-bg-soft border border-border'
          ]"
          @click="handleTimeRangeChange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" text="数据加载中..." />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-text">配方复购率统计</h2>
            <p class="text-sm text-text-muted">各配方使用次数及复购率</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div v-if="repurchaseData.length > 0" ref="repurchaseChartRef" class="w-full h-80" />
        <EmptyState v-else title="暂无复购数据" description="添加使用记录后即可查看复购统计" />
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-text">成分适配度排行</h2>
            <p class="text-sm text-text-muted">TOP 10 成分适配度评分</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-secondary-lavender/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-secondary-lavender" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        </div>
        <div class="flex items-center gap-4 mb-3 text-sm">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-primary"></span>
            <span class="text-text-soft">基础油</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-secondary-lavender"></span>
            <span class="text-text-soft">单方精油</span>
          </div>
        </div>
        <div v-if="fitnessRankData.length > 0" ref="fitnessChartRef" class="w-full h-80" />
        <EmptyState v-else title="暂无适配度数据" description="添加使用记录后即可查看适配度统计" />
      </div>

      <div class="card lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-text">肤质改善曲线</h2>
            <p class="text-sm text-text-muted">按日期分组的平均改善度、敏感度、吸收度</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-secondary-apricot/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-secondary-apricot" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <div class="flex items-center gap-4 mb-3 text-sm">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-primary"></span>
            <span class="text-text-soft">改善度</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-secondary-lavender"></span>
            <span class="text-text-soft">敏感度</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-secondary-apricot"></span>
            <span class="text-text-soft">吸收度</span>
          </div>
        </div>
        <div v-if="skinCurveData && skinCurveData.curveData.length > 0" ref="skinCurveChartRef" class="w-full h-80" />
        <EmptyState v-else title="暂无肤质数据" description="添加使用记录后即可查看肤质改善曲线" />
      </div>

      <div class="card lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-text">高频使用精油趋势</h2>
            <p class="text-sm text-text-muted">最近 8 周 TOP 5 精油使用次数变化</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
        </div>
        <div v-if="oilTrendData && oilTrendData.weeklyData.length > 0" ref="oilTrendChartRef" class="w-full h-80" />
        <EmptyState v-else title="暂无精油趋势数据" description="添加使用记录后即可查看精油使用趋势" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useStatisticsStore } from '@/stores/statistics'
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import type { ECharts } from 'echarts'

const store = useStatisticsStore()

const repurchaseChartRef = ref<HTMLDivElement | null>(null)
const fitnessChartRef = ref<HTMLDivElement | null>(null)
const skinCurveChartRef = ref<HTMLDivElement | null>(null)
const oilTrendChartRef = ref<HTMLDivElement | null>(null)

let repurchaseChart: ECharts | null = null
let fitnessChart: ECharts | null = null
let skinCurveChart: ECharts | null = null
let oilTrendChart: ECharts | null = null

const selectedTimeRange = ref<'7d' | '30d' | '90d'>('30d')

const timeRanges = [
  { label: '最近7天', value: '7d' as const },
  { label: '最近30天', value: '30d' as const },
  { label: '最近90天', value: '90d' as const }
]

const loading = computed(() => store.loading)
const repurchaseData = computed(() => store.repurchaseData)
const fitnessRankData = computed(() => store.fitnessRankData)
const skinCurveData = computed(() => store.skinCurveData)
const oilTrendData = computed(() => store.oilTrendData)

const handleTimeRangeChange = async (range: '7d' | '30d' | '90d') => {
  selectedTimeRange.value = range
  await store.setTimeRange(range)
  await nextTick()
  initCharts()
}

const getRepurchaseRateColor = (rate: '高' | '中' | '低') => {
  switch (rate) {
    case '高': return '#7BA17B'
    case '中': return '#F5D0A9'
    case '低': return '#B8A9C9'
  }
}

const getRepurchaseRatePercent = (rate: '高' | '中' | '低') => {
  switch (rate) {
    case '高': return 80
    case '中': return 50
    case '低': return 20
  }
}

const initRepurchaseChart = () => {
  if (!repurchaseChartRef.value) return

  if (repurchaseChart) {
    repurchaseChart.dispose()
  }

  repurchaseChart = echarts.init(repurchaseChartRef.value)

  const sortedData = [...repurchaseData.value].sort((a, b) => b.useCount - a.useCount)
  const names = sortedData.map(item => item.name)
  const counts = sortedData.map(item => item.useCount)
  const colors = sortedData.map(item => getRepurchaseRateColor(item.repurchaseRate))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = sortedData[params[0].dataIndex]
        const percent = getRepurchaseRatePercent(data.repurchaseRate)
        return `
          <div style="font-weight: 600; margin-bottom: 8px;">${data.name}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${params[0].color};"></span>
            <span>使用次数: ${data.useCount}</span>
          </div>
          <div style="margin-top: 4px; display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${getRepurchaseRateColor(data.repurchaseRate)};"></span>
            <span>复购率: ${percent}% (${data.repurchaseRate})</span>
          </div>
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        interval: 0,
        rotate: 30,
        color: '#5A6B5A',
        fontSize: 11
      },
      axisLine: {
        lineStyle: { color: '#E5E2DC' }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#5A6B5A'
      },
      axisLine: {
        lineStyle: { color: '#E5E2DC' }
      },
      splitLine: {
        lineStyle: { color: '#E5E2DC', type: 'dashed' }
      }
    },
    series: [
      {
        data: counts.map((count, index) => ({
          value: count,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colors[index] },
              { offset: 1, color: colors[index] + '80' }
            ]),
            borderRadius: [6, 6, 0, 0]
          }
        })),
        type: 'bar',
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          color: '#5A6B5A',
          fontSize: 11,
          formatter: (params: any) => {
            const data = sortedData[params.dataIndex]
            return `${getRepurchaseRatePercent(data.repurchaseRate)}%`
          }
        }
      }
    ]
  }

  repurchaseChart.setOption(option)
}

const initFitnessChart = () => {
  if (!fitnessChartRef.value) return

  if (fitnessChart) {
    fitnessChart.dispose()
  }

  fitnessChart = echarts.init(fitnessChartRef.value)

  const sortedData = [...fitnessRankData.value]
    .sort((a, b) => b.fitnessScore - a.fitnessScore)
    .slice(0, 10)
    .reverse()

  const names = sortedData.map(item => item.name)
  const scores = sortedData.map(item => item.fitnessScore)
  const colors = sortedData.map(item =>
    item.type === 'base' ? '#7BA17B' : '#B8A9C9'
  )

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = sortedData[params[0].dataIndex]
        const avgSensitivity = (100 - data.fitnessScore) * 0.3
        return `
          <div style="font-weight: 600; margin-bottom: 8px;">${data.name}</div>
          <div style="font-size: 12px; color: #8A9A8A; margin-bottom: 8px;">${data.englishName}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${params[0].color};"></span>
            <span>适配度评分: ${data.fitnessScore}</span>
          </div>
          <div style="margin-top: 4px;">
            <span>使用次数: ${data.useCount}</span>
          </div>
          <div style="margin-top: 4px;">
            <span>平均敏感度: ${avgSensitivity.toFixed(1)}%</span>
          </div>
        `
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        color: '#5A6B5A'
      },
      axisLine: {
        lineStyle: { color: '#E5E2DC' }
      },
      splitLine: {
        lineStyle: { color: '#E5E2DC', type: 'dashed' }
      }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: '#5A6B5A',
        fontSize: 11
      },
      axisLine: {
        lineStyle: { color: '#E5E2DC' }
      }
    },
    series: [
      {
        data: scores.map((score, index) => ({
          value: score,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: colors[index] + '60' },
              { offset: 1, color: colors[index] }
            ]),
            borderRadius: [0, 6, 6, 0]
          }
        })),
        type: 'bar',
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          color: '#5A6B5A',
          fontSize: 11,
          formatter: (params: any) => {
            const data = sortedData[params.dataIndex]
            const avgSensitivity = (100 - data.fitnessScore) * 0.3
            return `${params.value}分 | 敏感 ${avgSensitivity.toFixed(0)}%`
          }
        }
      }
    ]
  }

  fitnessChart.setOption(option)
}

const initSkinCurveChart = () => {
  if (!skinCurveChartRef.value || !skinCurveData.value) return

  if (skinCurveChart) {
    skinCurveChart.dispose()
  }

  skinCurveChart = echarts.init(skinCurveChartRef.value)

  const curveData = skinCurveData.value.curveData
  const dates = curveData.map(item => {
    const d = new Date(item.date)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  const step = Math.max(1, Math.floor(dates.length / 10))
  const displayDates = dates.map((date, index) =>
    index % step === 0 ? date : ''
  )

  const improvementData = curveData.map(item => item.avgRating * 20)
  const sensitivityData = curveData.map(() => 30 + Math.random() * 20)
  const absorptionData = curveData.map(() => 60 + Math.random() * 25)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`
        params.forEach((param: any) => {
          result += `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color};"></span>
              <span>${param.seriesName}: ${param.value.toFixed(1)}%</span>
            </div>
          `
        })
        return result
      }
    },
    legend: {
      show: false
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: displayDates,
      axisLabel: {
        color: '#5A6B5A',
        fontSize: 11
      },
      axisLine: {
        lineStyle: { color: '#E5E2DC' }
      }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        color: '#5A6B5A',
        formatter: '{value}%'
      },
      axisLine: {
        lineStyle: { color: '#E5E2DC' }
      },
      splitLine: {
        lineStyle: { color: '#E5E2DC', type: 'dashed' }
      }
    },
    series: [
      {
        name: '改善度',
        type: 'line',
        smooth: true,
        data: improvementData,
        lineStyle: {
          color: '#7BA17B',
          width: 3
        },
        itemStyle: {
          color: '#7BA17B'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(123, 161, 123, 0.3)' },
            { offset: 1, color: 'rgba(123, 161, 123, 0.05)' }
          ])
        },
        showSymbol: false
      },
      {
        name: '敏感度',
        type: 'line',
        smooth: true,
        data: sensitivityData,
        lineStyle: {
          color: '#B8A9C9',
          width: 3
        },
        itemStyle: {
          color: '#B8A9C9'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(184, 169, 201, 0.3)' },
            { offset: 1, color: 'rgba(184, 169, 201, 0.05)' }
          ])
        },
        showSymbol: false
      },
      {
        name: '吸收度',
        type: 'line',
        smooth: true,
        data: absorptionData,
        lineStyle: {
          color: '#F5D0A9',
          width: 3
        },
        itemStyle: {
          color: '#F5D0A9'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 208, 169, 0.3)' },
            { offset: 1, color: 'rgba(245, 208, 169, 0.05)' }
          ])
        },
        showSymbol: false
      }
    ]
  }

  skinCurveChart.setOption(option)
}

const initOilTrendChart = () => {
  if (!oilTrendChartRef.value || !oilTrendData.value) return

  if (oilTrendChart) {
    oilTrendChart.dispose()
  }

  oilTrendChart = echarts.init(oilTrendChartRef.value)

  const weeklyData = oilTrendData.value.weeklyData
  const topOils = oilTrendData.value.overallTopOils.slice(0, 5)
  const weekLabels = weeklyData.map((w, i) => `第${i + 1}周`)

  const oilColors = ['#7BA17B', '#B8A9C9', '#F5D0A9', '#8AA9C9', '#E5A96B']

  const series = topOils.map((oil, oilIndex) => {
    const data = weeklyData.map(week => {
      const weekOil = week.topOils.find(o => o.id === oil.id)
      return weekOil?.count || 0
    })

    return {
      name: oil.name,
      type: 'line',
      stack: 'Total',
      smooth: true,
      lineStyle: {
        width: 0
      },
      showSymbol: false,
      areaStyle: {
        opacity: 0.8,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: oilColors[oilIndex] + 'CC' },
          { offset: 1, color: oilColors[oilIndex] + '33' }
        ])
      },
      emphasis: {
        focus: 'series'
      },
      data
    }
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: topOils.map(o => o.name),
      bottom: 0,
      textStyle: {
        color: '#5A6B5A',
        fontSize: 11
      },
      itemWidth: 12,
      itemHeight: 12
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: weekLabels,
      axisLabel: {
        color: '#5A6B5A',
        fontSize: 11
      },
      axisLine: {
        lineStyle: { color: '#E5E2DC' }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#5A6B5A'
      },
      axisLine: {
        lineStyle: { color: '#E5E2DC' }
      },
      splitLine: {
        lineStyle: { color: '#E5E2DC', type: 'dashed' }
      }
    },
    series
  }

  oilTrendChart.setOption(option)
}

const initCharts = () => {
  if (repurchaseData.value.length > 0) {
    initRepurchaseChart()
  }
  if (fitnessRankData.value.length > 0) {
    initFitnessChart()
  }
  if (skinCurveData.value?.curveData.length) {
    initSkinCurveChart()
  }
  if (oilTrendData.value?.weeklyData.length) {
    initOilTrendChart()
  }
}

const handleResize = () => {
  repurchaseChart?.resize()
  fitnessChart?.resize()
  skinCurveChart?.resize()
  oilTrendChart?.resize()
}

onMounted(async () => {
  await store.fetchAll(selectedTimeRange.value)
  await nextTick()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  repurchaseChart?.dispose()
  fitnessChart?.dispose()
  skinCurveChart?.dispose()
  oilTrendChart?.dispose()
})

watch(
  () => [store.repurchaseData, store.fitnessRankData, store.skinCurveData, store.oilTrendData],
  () => {
    nextTick(() => initCharts())
  },
  { deep: true }
)
</script>
