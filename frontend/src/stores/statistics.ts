import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RepurchaseRate, IngredientFitnessRank, SkinCurveData, OilTrendData } from '@/types'
import { statistics as statisticsApi } from '@/api'

export const useStatisticsStore = defineStore('statistics', () => {
  const repurchaseData = ref<RepurchaseRate[]>([])
  const fitnessRankData = ref<IngredientFitnessRank[]>([])
  const skinCurveData = ref<SkinCurveData | null>(null)
  const oilTrendData = ref<OilTrendData | null>(null)
  const loading = ref(false)
  const timeRange = ref<'7d' | '30d' | '90d'>('30d')

  const fetchRepurchase = async () => {
    loading.value = true
    try {
      const data = await statisticsApi.getRepurchase()
      repurchaseData.value = data
    } catch {
      repurchaseData.value = getMockRepurchaseData()
    } finally {
      loading.value = false
    }
  }

  const fetchFitnessRank = async () => {
    loading.value = true
    try {
      const data = await statisticsApi.getFitness()
      fitnessRankData.value = data
    } catch {
      fitnessRankData.value = getMockFitnessRankData()
    } finally {
      loading.value = false
    }
  }

  const fetchSkinCurve = async (range: '7d' | '30d' | '90d' = timeRange.value) => {
    loading.value = true
    try {
      const data = await statisticsApi.getSkinCurve()
      skinCurveData.value = data
    } catch {
      skinCurveData.value = getMockSkinCurveData(range)
    } finally {
      loading.value = false
    }
  }

  const fetchOilTrend = async () => {
    loading.value = true
    try {
      const data = await statisticsApi.getTrend()
      oilTrendData.value = data
    } catch {
      oilTrendData.value = getMockOilTrendData()
    } finally {
      loading.value = false
    }
  }

  const fetchAll = async (range: '7d' | '30d' | '90d' = timeRange.value) => {
    timeRange.value = range
    loading.value = true
    try {
      await Promise.all([
        fetchRepurchase(),
        fetchFitnessRank(),
        fetchSkinCurve(range),
        fetchOilTrend()
      ])
    } finally {
      loading.value = false
    }
  }

  const setTimeRange = (range: '7d' | '30d' | '90d') => {
    timeRange.value = range
    fetchSkinCurve(range)
  }

  return {
    repurchaseData,
    fitnessRankData,
    skinCurveData,
    oilTrendData,
    loading,
    timeRange,
    fetchAll,
    fetchRepurchase,
    fetchFitnessRank,
    fetchSkinCurve,
    fetchOilTrend,
    setTimeRange
  }
})

function getMockRepurchaseData(): RepurchaseRate[] {
  return [
    { id: 1, name: '舒缓放松配方', description: '缓解压力，帮助睡眠', useCount: 45, avgRating: 4.8, repurchaseRate: '高' },
    { id: 2, name: '保湿滋养配方', description: '深层保湿，改善干燥', useCount: 38, avgRating: 4.6, repurchaseRate: '高' },
    { id: 3, name: '控油清透配方', description: '调节油脂，收缩毛孔', useCount: 32, avgRating: 4.5, repurchaseRate: '中' },
    { id: 4, name: '抗皱紧致配方', description: '淡化细纹，提升弹性', useCount: 28, avgRating: 4.7, repurchaseRate: '高' },
    { id: 5, name: '美白亮肤配方', description: '提亮肤色，淡化色斑', useCount: 25, avgRating: 4.4, repurchaseRate: '中' },
    { id: 6, name: '祛痘修护配方', description: '抗炎祛痘，修护肌肤', useCount: 22, avgRating: 4.3, repurchaseRate: '中' },
    { id: 7, name: '舒缓敏感配方', description: '舒缓泛红，增强屏障', useCount: 18, avgRating: 4.5, repurchaseRate: '低' },
    { id: 8, name: '提神醒脑配方', description: '提升注意力，缓解疲劳', useCount: 15, avgRating: 4.2, repurchaseRate: '低' }
  ]
}

function getMockFitnessRankData(): IngredientFitnessRank[] {
  return [
    { id: 1, name: '荷荷巴油', englishName: 'Jojoba Oil', type: 'base', useCount: 120, avgRating: 4.9, fitnessScore: 95 },
    { id: 2, name: '甜杏仁油', englishName: 'Sweet Almond Oil', type: 'base', useCount: 98, avgRating: 4.8, fitnessScore: 92 },
    { id: 3, name: '薰衣草精油', englishName: 'Lavender', type: 'essential', useCount: 156, avgRating: 4.9, fitnessScore: 98 },
    { id: 4, name: '玫瑰精油', englishName: 'Rose Otto', type: 'essential', useCount: 87, avgRating: 4.7, fitnessScore: 90 },
    { id: 5, name: '茶树精油', englishName: 'Tea Tree', type: 'essential', useCount: 112, avgRating: 4.6, fitnessScore: 88 },
    { id: 6, name: '葡萄籽油', englishName: 'Grapeseed Oil', type: 'base', useCount: 76, avgRating: 4.5, fitnessScore: 85 },
    { id: 7, name: '迷迭香精油', englishName: 'Rosemary', type: 'essential', useCount: 65, avgRating: 4.4, fitnessScore: 82 },
    { id: 8, name: '柠檬精油', englishName: 'Lemon', type: 'essential', useCount: 58, avgRating: 4.3, fitnessScore: 80 },
    { id: 9, name: '椰子油', englishName: 'Coconut Oil', type: 'base', useCount: 72, avgRating: 4.6, fitnessScore: 87 },
    { id: 10, name: '乳香精油', englishName: 'Frankincense', type: 'essential', useCount: 54, avgRating: 4.8, fitnessScore: 91 }
  ]
}

function getMockSkinCurveData(range: '7d' | '30d' | '90d'): SkinCurveData {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const curveData = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    curveData.push({
      date: dateStr,
      recordCount: Math.floor(Math.random() * 10) + 1,
      avgRating: 3.5 + Math.random() * 1.5
    })
  }

  return {
    totalRecords: curveData.reduce((sum, d) => sum + d.recordCount, 0),
    avgOverallRating: curveData.reduce((sum, d) => sum + d.avgRating, 0) / curveData.length,
    curveData
  }
}

function getMockOilTrendData(): OilTrendData {
  const weeks = 8
  const weeklyData = []
  const today = new Date()
  const topOils = [
    { id: 1, name: '薰衣草精油', englishName: 'Lavender' },
    { id: 2, name: '茶树精油', englishName: 'Tea Tree' },
    { id: 3, name: '玫瑰精油', englishName: 'Rose Otto' },
    { id: 4, name: '乳香精油', englishName: 'Frankincense' },
    { id: 5, name: '柠檬精油', englishName: 'Lemon' }
  ]

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    weeklyData.push({
      weekNumber: weeks - i,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      totalUses: Math.floor(Math.random() * 50) + 30,
      topOils: topOils.map(oil => ({
        ...oil,
        count: Math.floor(Math.random() * 20) + 5
      }))
    })
  }

  return {
    period: '8周',
    startDate: weeklyData[0].startDate,
    endDate: weeklyData[weeklyData.length - 1].endDate,
    totalRecords: weeklyData.reduce((sum, w) => sum + w.totalUses, 0),
    weeklyData,
    overallTopOils: topOils.map(oil => ({
      ...oil,
      count: weeklyData.reduce((sum, w) => {
        const weekOil = w.topOils.find(o => o.id === oil.id)
        return sum + (weekOil?.count || 0)
      }, 0)
    })).sort((a, b) => b.count - a.count)
  }
}
