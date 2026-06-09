<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  User,
  Droplets,
  Zap,
  Heart,
  FileText,
  TrendingUp,
  Clock,
  Star,
  Activity,
  Target
} from 'lucide-vue-next'
import TagBadge from '@/components/Common/TagBadge.vue'
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue'
import { useECharts } from '@/composables/useECharts'
import { useRecordsStore } from '@/stores/records'
import { useStatisticsStore } from '@/stores/statistics'
import { useFormulasStore } from '@/stores/formulas'
import type { EChartsOption } from 'echarts'
import { cn } from '@/lib/utils'
import type { IngredientFitness } from '@/types'

const recordsStore = useRecordsStore()
const statisticsStore = useStatisticsStore()
const formulasStore = useFormulasStore()

const radarChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)

const skinTypeInfo = computed(() => ({
  type: '混合性肌肤',
  confidence: 85,
  concerns: ['保湿', '抗衰', '舒缓']
}))

const mockIngredientFitness = computed<IngredientFitness[]>(() => [
  {
    id: 1,
    name: '荷荷巴油',
    englishName: 'Jojoba Oil',
    type: 'base',
    useCount: 15,
    avgImprovement: 4.5,
    fitnessScore: 92
  },
  {
    id: 2,
    name: '玫瑰精油',
    englishName: 'Rose Oil',
    type: 'essential',
    useCount: 12,
    avgImprovement: 4.3,
    fitnessScore: 88
  },
  {
    id: 3,
    name: '甜杏仁油',
    englishName: 'Sweet Almond Oil',
    type: 'base',
    useCount: 10,
    avgImprovement: 4.0,
    fitnessScore: 85
  },
  {
    id: 4,
    name: '薰衣草精油',
    englishName: 'Lavender Oil',
    type: 'essential',
    useCount: 8,
    avgImprovement: 4.2,
    fitnessScore: 82
  },
  {
    id: 5,
    name: '茶树精油',
    englishName: 'Tea Tree Oil',
    type: 'essential',
    useCount: 6,
    avgImprovement: 3.8,
    fitnessScore: 78
  }
])

const sortedIngredients = computed(() => {
  return [...mockIngredientFitness.value].sort((a, b) => b.fitnessScore - a.fitnessScore)
})

const mockTrendData = computed(() => {
  const data = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    data.push({
      date: dateStr,
      absorption: 3.5 + Math.random() * 1.5,
      sensitivity: 2.5 + Math.random() * 1.5,
      improvement: 3.0 + Math.random() * 1.5
    })
  }
  return data
})

const getRadarOption = (): EChartsOption => {
  const top5 = mockIngredientFitness.value.slice(0, 5)
  return {
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: top5.map(item => ({
        name: item.name,
        max: 100
      })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#57534e',
        fontSize: 12,
        fontWeight: 500
      },
      splitLine: {
        lineStyle: {
          color: '#e7e5e4'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['#fafaf9', '#f5f5f4', '#e7e5e4', '#d6d3d1', '#a8a29e'],
          opacity: 0.3
        }
      },
      axisLine: {
        lineStyle: {
          color: '#d6d3d1'
        }
      }
    },
    series: [
      {
        name: '成分适配度',
        type: 'radar',
        data: [
          {
            value: top5.map(item => item.fitnessScore),
            name: '适配度评分',
            areaStyle: {
              color: {
                type: 'radial',
                x: 0.5,
                y: 0.5,
                r: 0.5,
                colorStops: [
                  { offset: 0, color: 'rgba(16, 185, 129, 0.5)' },
                  { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
                ]
              }
            },
            lineStyle: {
              color: '#10b981',
              width: 2
            },
            itemStyle: {
              color: '#10b981'
            }
          }
        ]
      }
    ]
  }
}

const getTrendOption = (): EChartsOption => {
  const dates = mockTrendData.value.map(d => {
    const date = new Date(d.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e7e5e4',
      borderWidth: 1,
      textStyle: {
        color: '#44403c'
      }
    },
    legend: {
      data: ['吸收度', '敏感度', '改善度'],
      bottom: 0,
      textStyle: {
        color: '#57534e'
      }
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
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#d6d3d1'
        }
      },
      axisLabel: {
        color: '#78716c',
        fontSize: 11,
        interval: 4
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 5,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#78716c',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#f5f5f4',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '吸收度',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: mockTrendData.value.map(d => d.absorption.toFixed(1)),
        lineStyle: {
          color: '#10b981',
          width: 3
        },
        itemStyle: {
          color: '#10b981'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
            ]
          }
        }
      },
      {
        name: '敏感度',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: mockTrendData.value.map(d => d.sensitivity.toFixed(1)),
        lineStyle: {
          color: '#f43f5e',
          width: 3
        },
        itemStyle: {
          color: '#f43f5e'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(244, 63, 94, 0.25)' },
              { offset: 1, color: 'rgba(244, 63, 94, 0.02)' }
            ]
          }
        }
      },
      {
        name: '改善度',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: mockTrendData.value.map(d => d.improvement.toFixed(1)),
        lineStyle: {
          color: '#f59e0b',
          width: 3
        },
        itemStyle: {
          color: '#f59e0b'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.25)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.02)' }
            ]
          }
        }
      }
    ]
  }
}

const { updateChart: updateRadarChart } = useECharts(radarChartRef, getRadarOption)
const { updateChart: updateTrendChart } = useECharts(trendChartRef, getTrendOption)

watch([mockIngredientFitness, mockTrendData], () => {
  updateRadarChart()
  updateTrendChart()
}, { deep: true })

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-emerald-600'
  if (score >= 70) return 'text-amber-600'
  return 'text-rose-600'
}

const getScoreBgColor = (score: number) => {
  if (score >= 85) return 'bg-emerald-100 text-emerald-700'
  if (score >= 70) return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

onMounted(async () => {
  await Promise.all([
    recordsStore.fetchList(),
    formulasStore.fetchList(),
    statisticsStore.fetchAll()
  ])
  updateRadarChart()
  updateTrendChart()
})
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-stone-800">肤质分析</h1>
      <p class="text-sm text-stone-500 mt-1">基于你的使用记录，智能分析肤质状态</p>
    </div>

    <div v-if="recordsStore.loading || statisticsStore.loading" class="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else class="space-y-6">
      <div class="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <User :size="36" class="text-white" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-stone-800">我的肤质档案</h2>
              <div class="flex items-center gap-2 mt-1">
                <TagBadge :label="skinTypeInfo.type" type="skinType" />
                <span class="text-xs text-stone-500">匹配度 {{ skinTypeInfo.confidence }}%</span>
              </div>
            </div>
          </div>

          <div class="flex-1">
            <div class="text-sm font-medium text-stone-700 mb-2">皮肤关注点</div>
            <div class="flex flex-wrap gap-2 mb-4">
              <TagBadge
                v-for="concern in skinTypeInfo.concerns"
                :key="concern"
                :label="concern"
                type="efficacy"
                size="sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <div class="flex items-center gap-2 mb-1">
                <Clock :size="16" class="text-emerald-600" />
                <span class="text-xs text-stone-500">总记录</span>
              </div>
              <div class="text-2xl font-bold text-stone-800">{{ recordsStore.stats.totalRecords }}</div>
            </div>
            <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <div class="flex items-center gap-2 mb-1">
                <Droplets :size="16" class="text-blue-600" />
                <span class="text-xs text-stone-500">平均吸收</span>
              </div>
              <div class="text-2xl font-bold text-stone-800">{{ recordsStore.stats.avgAbsorption.toFixed(1) }}</div>
            </div>
            <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <div class="flex items-center gap-2 mb-1">
                <Heart :size="16" class="text-amber-600" />
                <span class="text-xs text-stone-500">平均改善</span>
              </div>
              <div class="text-2xl font-bold text-stone-800">{{ recordsStore.stats.avgImprovement.toFixed(1) }}</div>
            </div>
            <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <div class="flex items-center gap-2 mb-1">
                <Zap :size="16" class="text-rose-600" />
                <span class="text-xs text-stone-500">平均敏感</span>
              </div>
              <div class="text-2xl font-bold text-stone-800">{{ recordsStore.stats.avgSensitivity.toFixed(1) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div class="flex items-center gap-2 mb-4">
            <Target :size="20" class="text-emerald-600" />
            <h3 class="text-lg font-semibold text-stone-800">成分适配度雷达图</h3>
          </div>
          <p class="text-sm text-stone-500 mb-4">展示使用频率最高的5种成分适配度评分</p>
          <div ref="radarChartRef" class="w-full h-80"></div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div class="flex items-center gap-2 mb-4">
            <TrendingUp :size="20" class="text-blue-600" />
            <h3 class="text-lg font-semibold text-stone-800">肤质趋势图</h3>
          </div>
          <p class="text-sm text-stone-500 mb-4">最近30天的改善度、敏感度、吸收度趋势</p>
          <div ref="trendChartRef" class="w-full h-80"></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <div class="flex items-center gap-2 mb-4">
          <Activity :size="20" class="text-amber-600" />
          <h3 class="text-lg font-semibold text-stone-800">成分适配度列表</h3>
        </div>
        <p class="text-sm text-stone-500 mb-6">按适配度评分排序，帮你找到最适合的成分</p>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-stone-100">
                <th class="text-left py-3 px-4 text-sm font-medium text-stone-600">成分名称</th>
                <th class="text-center py-3 px-4 text-sm font-medium text-stone-600">类型</th>
                <th class="text-center py-3 px-4 text-sm font-medium text-stone-600">使用次数</th>
                <th class="text-center py-3 px-4 text-sm font-medium text-stone-600">平均改善度</th>
                <th class="text-right py-3 px-4 text-sm font-medium text-stone-600">适配度评分</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in sortedIngredients"
                :key="item.id"
                class="border-b border-stone-50 hover:bg-stone-50/50 transition-colors"
              >
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <div
                      :class="[
                        'w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold',
                        item.type === 'base' ? 'bg-amber-500' : 'bg-emerald-500'
                      ]"
                    >
                      {{ index + 1 }}
                    </div>
                    <div>
                      <div class="font-medium text-stone-800">{{ item.name }}</div>
                      <div class="text-xs text-stone-400">{{ item.englishName }}</div>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4 text-center">
                  <TagBadge
                    :label="item.type === 'base' ? '基础油' : '单方精油'"
                    :type="item.type === 'base' ? 'default' : 'efficacy'"
                    size="sm"
                  />
                </td>
                <td class="py-4 px-4 text-center">
                  <span class="font-medium text-stone-700">{{ item.useCount }}</span>
                  <span class="text-xs text-stone-400 ml-1">次</span>
                </td>
                <td class="py-4 px-4 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <Star :size="14" class="text-amber-500 fill-amber-500" />
                    <span class="font-medium text-stone-700">{{ item.avgImprovement.toFixed(1) }}</span>
                  </div>
                </td>
                <td class="py-4 px-4 text-right">
                  <span
                    :class="[
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-bold',
                      getScoreBgColor(item.fitnessScore)
                    ]"
                  >
                    {{ item.fitnessScore }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
