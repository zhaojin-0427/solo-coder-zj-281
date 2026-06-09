import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import axios from 'axios'

export interface Ingredient {
  id: number
  name: string
  category: string
  description: string
  effects: string[]
  safetyRating: number
  suitableSkinTypes: string[]
  createdAt: string
}

export interface Filter {
  category?: string
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
      const params = { ...filter }
      const res = await axios.get<Ingredient[]>('/api/ingredients', { params })
      list.value = res.data
    } finally {
      loading.value = false
    }
  }

  const fetchDetail = async (id: number) => {
    loading.value = true
    try {
      const res = await axios.get<Ingredient>(`/api/ingredients/${id}`)
      currentDetail.value = res.data
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
