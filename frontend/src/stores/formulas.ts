import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface FormulaIngredient {
  id: number
  name: string
  percentage: number
}

export interface Formula {
  id: number
  name: string
  description: string
  ingredients: FormulaIngredient[]
  suitableSkinTypes: string[]
  efficacy: string[]
  createdAt: string
  updatedAt: string
}

export interface FormulaCreate {
  name: string
  description: string
  ingredients: { id: number; percentage: number }[]
  suitableSkinTypes: string[]
  efficacy: string[]
}

export interface AnalysisResult {
  overallScore: number
  safetyScore: number
  efficacyScore: number
  stabilityScore: number
  recommendations: string[]
  warnings: string[]
}

export const useFormulasStore = defineStore('formulas', () => {
  const list = ref<Formula[]>([])
  const loading = ref(false)
  const currentDetail = ref<Formula | null>(null)
  const analysisResult = ref<AnalysisResult | null>(null)

  const fetchList = async () => {
    loading.value = true
    try {
      const res = await axios.get<Formula[]>('/api/formulas')
      list.value = res.data
    } finally {
      loading.value = false
    }
  }

  const fetchDetail = async (id: number) => {
    loading.value = true
    try {
      const res = await axios.get<Formula>(`/api/formulas/${id}`)
      currentDetail.value = res.data
    } finally {
      loading.value = false
    }
  }

  const create = async (data: FormulaCreate) => {
    loading.value = true
    try {
      const res = await axios.post<Formula>('/api/formulas', data)
      list.value.unshift(res.data)
      return res.data
    } finally {
      loading.value = false
    }
  }

  const update = async (id: number, data: Partial<FormulaCreate>) => {
    loading.value = true
    try {
      const res = await axios.put<Formula>(`/api/formulas/${id}`, data)
      const index = list.value.findIndex(item => item.id === id)
      if (index !== -1) {
        list.value[index] = res.data
      }
      currentDetail.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: number) => {
    loading.value = true
    try {
      await axios.delete(`/api/formulas/${id}`)
      list.value = list.value.filter(item => item.id !== id)
      if (currentDetail.value?.id === id) {
        currentDetail.value = null
      }
    } finally {
      loading.value = false
    }
  }

  const analyze = async (id: number) => {
    loading.value = true
    try {
      const res = await axios.post<AnalysisResult>(`/api/formulas/${id}/analyze`)
      analysisResult.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  return {
    list,
    loading,
    currentDetail,
    analysisResult,
    fetchList,
    fetchDetail,
    create,
    update,
    remove,
    analyze
  }
})
