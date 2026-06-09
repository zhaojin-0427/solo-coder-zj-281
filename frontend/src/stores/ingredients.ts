import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ingredients as ingredientsApi } from '@/api'
import type { Ingredient, IngredientType } from '@/types'

export interface Filter {
  type?: IngredientType
  safetyRating?: number
  skinType?: string
  keyword?: string
}

export const useIngredientsStore = defineStore('ingredients', () => {
  const list = ref<Ingredient[]>([])
  const loading = ref(false)
  const currentDetail = ref<Ingredient | null>(null)
  const filter = reactive<Filter>({})

  const fetchList = async () => {
    loading.value = true
    try {
      list.value = await ingredientsApi.getList(filter.type)
    } finally {
      loading.value = false
    }
  }

  const fetchDetail = async (id: number) => {
    loading.value = true
    try {
      currentDetail.value = await ingredientsApi.getDetail(id)
    } finally {
      loading.value = false
    }
  }

  const setFilter = (newFilter: Partial<Filter>) => {
    Object.assign(filter, newFilter)
    fetchList()
  }

  return {
    list,
    loading,
    currentDetail,
    filter,
    fetchList,
    fetchDetail,
    setFilter
  }
})
