import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import type { UsageRecord, UsageRecordCreateInput } from '@/types'

export interface RecordCreate {
  formulaId: number | null
  date: string
  skinCondition: string
  absorptionRating: number
  sensitivityRating: number
  improvementRating: number
  notes: string
}

export const useRecordsStore = defineStore('records', () => {
  const list = ref<UsageRecord[]>([])
  const loading = ref(false)

  const fetchList = async () => {
    loading.value = true
    try {
      const res = await axios.get<UsageRecord[]>('/api/records')
      list.value = res.data
    } finally {
      loading.value = false
    }
  }

  const create = async (data: RecordCreate) => {
    loading.value = true
    try {
      const input: UsageRecordCreateInput = {
        formulaId: data.formulaId,
        date: data.date,
        skinCondition: data.skinCondition,
        absorptionRating: data.absorptionRating,
        sensitivityRating: data.sensitivityRating,
        improvementRating: data.improvementRating,
        notes: data.notes || null
      }
      const res = await axios.post<UsageRecord>('/api/records', input)
      list.value.unshift(res.data)
      return res.data
    } finally {
      loading.value = false
    }
  }

  const filterByFormula = (formulaId: number | null) => {
    if (!formulaId) return list.value
    return list.value.filter(r => r.formula_id === formulaId)
  }

  const stats = computed(() => {
    const records = list.value
    const totalRecords = records.length
    const withAbsorption = records.filter(r => r.absorption_rating !== null)
    const withSensitivity = records.filter(r => r.sensitivity_rating !== null)
    const withImprovement = records.filter(r => r.improvement_rating !== null)

    return {
      totalRecords,
      avgAbsorption: withAbsorption.length
        ? withAbsorption.reduce((sum, r) => sum + (r.absorption_rating || 0), 0) / withAbsorption.length
        : 0,
      avgSensitivity: withSensitivity.length
        ? withSensitivity.reduce((sum, r) => sum + (r.sensitivity_rating || 0), 0) / withSensitivity.length
        : 0,
      avgImprovement: withImprovement.length
        ? withImprovement.reduce((sum, r) => sum + (r.improvement_rating || 0), 0) / withImprovement.length
        : 0
    }
  })

  return {
    list,
    loading,
    stats,
    fetchList,
    create,
    filterByFormula
  }
})
