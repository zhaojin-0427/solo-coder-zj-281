import { defineStore } from 'pinia'
import { ref } from 'vue'
import { formulas as formulasApi } from '@/api'
import type { Formula, FormulaCreateInput, FormulaUpdateInput, FormulaAnalysis, FormulaIngredientInput } from '@/types'

export const useFormulasStore = defineStore('formulas', () => {
  const list = ref<Formula[]>([])
  const loading = ref(false)
  const currentDetail = ref<Formula | null>(null)
  const analysisResult = ref<FormulaAnalysis | null>(null)

  const fetchList = async () => {
    loading.value = true
    try {
      list.value = await formulasApi.getList()
    } finally {
      loading.value = false
    }
  }

  const fetchDetail = async (id: number) => {
    loading.value = true
    try {
      currentDetail.value = await formulasApi.getDetail(id)
    } finally {
      loading.value = false
    }
  }

  const create = async (data: FormulaCreateInput) => {
    loading.value = true
    try {
      const newFormula = await formulasApi.create(data)
      list.value.unshift(newFormula)
      return newFormula
    } finally {
      loading.value = false
    }
  }

  const update = async (id: number, data: FormulaUpdateInput) => {
    loading.value = true
    try {
      const updatedFormula = await formulasApi.update(id, data)
      const index = list.value.findIndex(item => item.id === id)
      if (index !== -1) {
        list.value[index] = updatedFormula
      }
      currentDetail.value = updatedFormula
      return updatedFormula
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: number) => {
    loading.value = true
    try {
      await formulasApi.remove(id)
      list.value = list.value.filter(item => item.id !== id)
      if (currentDetail.value?.id === id) {
        currentDetail.value = null
      }
    } finally {
      loading.value = false
    }
  }

  const analyze = async (baseOils: FormulaIngredientInput[] = [], essentialOils: FormulaIngredientInput[] = []) => {
    loading.value = true
    try {
      const result = await formulasApi.analyze(baseOils, essentialOils)
      analysisResult.value = result
      return result
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
