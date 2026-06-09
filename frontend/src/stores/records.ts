import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { records as recordsApi } from '@/api'
import type { UsageRecord, UsageRecordCreateInput } from '@/types'

export interface RecordCreate {
  formulaId: number | null
  date: string
  skinCondition: string
  absorption: number
  sensitivity: number
  improvement: number
  notes: string
}

export const useRecordsStore = defineStore('records', () => {
  const list = ref<UsageRecord[]>([])
  const loading = ref(false)

  const fetchList = async () => {
    loading.value = true
    try {
      const data = await recordsApi.getList()
      list.value = data
    } finally {
      loading.value = false
    }
  }

  const create = async (data: RecordCreate) => {
    loading.value = true
    try {
      const input: UsageRecordCreateInput = {
        formulaId: data.formulaId!,
        usageDate: data.date,
        skinCondition: data.skinCondition,
        absorption: data.absorption,
        sensitivity: data.sensitivity,
        improvement: data.improvement,
        notes: data.notes || undefined
      }
      const record = await recordsApi.create(input)
      list.value.unshift(record)
      return record
    } finally {
      loading.value = false
    }
  }

  const filterByFormula = (formulaId: number | null) => {
    if (!formulaId) return list.value
    return list.value.filter(r => r.formulaId === formulaId)
  }

  const stats = computed(() => {
    const records = list.value
    const totalRecords = records.length
    const withAbsorption = records.filter(r => r.absorption !== null && r.absorption !== undefined)
    const withSensitivity = records.filter(r => r.sensitivity !== null && r.sensitivity !== undefined)
    const withImprovement = records.filter(r => r.improvement !== null && r.improvement !== undefined)

    return {
      totalRecords,
      avgAbsorption: withAbsorption.length
        ? withAbsorption.reduce((sum, r) => sum + (r.absorption || 0), 0) / withAbsorption.length
        : 0,
      avgSensitivity: withSensitivity.length
        ? withSensitivity.reduce((sum, r) => sum + (r.sensitivity || 0), 0) / withSensitivity.length
        : 0,
      avgImprovement: withImprovement.length
        ? withImprovement.reduce((sum, r) => sum + (r.improvement || 0), 0) / withImprovement.length
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
