<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Droplets, Sparkles, ChevronRight } from 'lucide-vue-next'
import { ingredients } from '@/api'
import type { Ingredient, IngredientType } from '@/types'
import { cn } from '@/lib/utils'

const router = useRouter()
const loading = ref(false)
const ingredientList = ref<Ingredient[]>([])
const activeTab = ref<IngredientType>('base')
const searchQuery = ref('')

const tabs = [
  { key: 'base' as IngredientType, label: '基础油', icon: Droplets },
  { key: 'essential' as IngredientType, label: '单方精油', icon: Sparkles }
]

const filteredIngredients = computed(() => {
  const list = ingredientList.value.filter(i => i.type === activeTab.value)
  
  if (!searchQuery.value) return list
  
  const keyword = searchQuery.value.toLowerCase()
  return list.filter(i => 
    i.name.toLowerCase().includes(keyword) ||
    i.english_name.toLowerCase().includes(keyword) ||
    i.effects.some(e => e.toLowerCase().includes(keyword))
  )
})

const fetchIngredients = async () => {
  loading.value = true
  try {
    ingredientList.value = await ingredients.getList()
  } catch (error) {
    console.error('获取成分列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCardClick = (id: number) => {
  router.push(`/ingredients/${id}`)
}

const getSafetyColor = (level: number) => {
  if (level <= 2) return 'bg-green-100 text-green-700'
  if (level <= 3) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

const getSafetyText = (level: number) => {
  if (level <= 2) return '安全'
  if (level <= 3) return '注意'
  return '警告'
}

watch(activeTab, () => {
  searchQuery.value = ''
})

onMounted(() => {
  fetchIngredients()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-stone-800">成分百科</h1>
        <p class="text-stone-500 text-sm mt-1">了解每种精油的特性与功效</p>
      </div>

      <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-100 p-2 mb-6">
        <div class="flex gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all',
              activeTab === tab.key
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                : 'text-stone-600 hover:bg-stone-100'
            ]"
          >
            <component :is="tab.icon" :size="18" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <div class="relative mb-6">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" :size="20" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="`搜索${activeTab === 'base' ? '基础油' : '单方精油'}名称、英文名或功效...`"
          class="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-base shadow-sm"
        />
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="filteredIngredients.length === 0" class="text-center py-12">
        <component :is="activeTab === 'base' ? Droplets : Sparkles" :size="48" class="mx-auto text-stone-300 mb-4" />
        <p class="text-stone-500">
          {{ searchQuery ? '未找到匹配的成分' : `暂无${activeTab === 'base' ? '基础油' : '单方精油'}` }}
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="ingredient in filteredIngredients"
          :key="ingredient.id"
          @click="handleCardClick(ingredient.id)"
          :class="[
            'group bg-white rounded-2xl shadow-sm border p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
            activeTab === 'base' ? 'border-amber-100 hover:border-amber-300' : 'border-emerald-100 hover:border-emerald-300'
          ]"
        >
          <div class="flex items-start gap-4">
            <div
              :class="[
                'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md',
                activeTab === 'base' 
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200' 
                  : 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200'
              ]"
            >
              <component 
                :is="activeTab === 'base' ? Droplets : Sparkles" 
                :size="26" 
                class="text-white" 
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <h3 class="font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {{ ingredient.name }}
                  </h3>
                  <p class="text-sm text-stone-400 italic">{{ ingredient.english_name }}</p>
                </div>
                <span
                  :class="[
                    'px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0',
                    getSafetyColor(ingredient.safety_level)
                  ]"
                >
                  {{ getSafetyText(ingredient.safety_level) }}
                </span>
              </div>

              <div class="flex flex-wrap gap-1.5 mt-3">
                <span
                  v-for="eff in ingredient.effects.slice(0, 3)"
                  :key="eff"
                  :class="[
                    'px-2 py-0.5 text-xs rounded-md',
                    activeTab === 'base' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  ]"
                >
                  {{ eff }}
                </span>
                <span
                  v-if="ingredient.effects.length > 3"
                  class="px-2 py-0.5 text-xs bg-stone-100 text-stone-500 rounded-md"
                >
                  +{{ ingredient.effects.length - 3 }}
                </span>
              </div>

              <div class="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                <div class="text-xs text-stone-400">
                  {{ ingredient.origin || '产地未知' }}
                </div>
                <div class="flex items-center gap-1 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="text-sm">查看详情</span>
                  <ChevronRight :size="16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
