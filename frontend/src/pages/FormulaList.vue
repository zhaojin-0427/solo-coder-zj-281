<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Filter, Droplets, Calendar, MapPin, X } from 'lucide-vue-next'
import { formulas } from '@/api'
import type { Formula } from '@/types'
import FormulaCreateModal from '@/components/Formula/FormulaCreateModal.vue'
import { cn } from '@/lib/utils'

const router = useRouter()
const loading = ref(false)
const formulaList = ref<Formula[]>([])
const searchQuery = ref('')
const showFilter = ref(false)
const showCreateModal = ref(false)
const selectedTags = ref<string[]>([])
const selectedSkinTypes = ref<string[]>([])

const allEffectTags = computed(() => {
  const tags = new Set<string>()
  formulaList.value.forEach(f => f.effect_tags.forEach(t => tags.add(t)))
  return Array.from(tags)
})

const allSkinTypes = computed(() => {
  const types = new Set<string>()
  formulaList.value.forEach(f => f.suitable_skin_types.forEach(t => types.add(t)))
  return Array.from(types)
})

const filteredFormulas = computed(() => {
  return formulaList.value.filter(formula => {
    const matchesSearch = searchQuery.value === '' || 
      formula.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      formula.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesTags = selectedTags.value.length === 0 ||
      selectedTags.value.some(tag => formula.effect_tags.includes(tag))
    
    const matchesSkinTypes = selectedSkinTypes.value.length === 0 ||
      selectedSkinTypes.value.some(type => formula.suitable_skin_types.includes(type))
    
    return matchesSearch && matchesTags && matchesSkinTypes
  })
})

const fetchFormulas = async () => {
  loading.value = true
  try {
    formulaList.value = await formulas.getList()
  } catch (error) {
    console.error('获取配方列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCardClick = (id: number) => {
  router.push(`/formulas/${id}`)
}

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const toggleSkinType = (type: string) => {
  const index = selectedSkinTypes.value.indexOf(type)
  if (index > -1) {
    selectedSkinTypes.value.splice(index, 1)
  } else {
    selectedSkinTypes.value.push(type)
  }
}

const clearFilters = () => {
  selectedTags.value = []
  selectedSkinTypes.value = []
  searchQuery.value = ''
}

const handleCreateSuccess = () => {
  showCreateModal.value = false
  fetchFormulas()
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(() => {
  fetchFormulas()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-stone-800">配方库</h1>
          <p class="text-stone-500 text-sm mt-1">共 {{ filteredFormulas.length }} 个配方</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus :size="18" />
          <span>创建配方</span>
        </button>
      </div>

      <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-100 p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" :size="18" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索配方名称或描述..."
              class="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>
          <button
            @click="showFilter = !showFilter"
            :class="[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all',
              showFilter || selectedTags.length > 0 || selectedSkinTypes.length > 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
            ]"
          >
            <Filter :size="18" />
            <span>筛选</span>
            <span
              v-if="selectedTags.length + selectedSkinTypes.length > 0"
              class="ml-1 w-5 h-5 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center"
            >
              {{ selectedTags.length + selectedSkinTypes.length }}
            </span>
          </button>
        </div>

        <div
          v-if="showFilter"
          class="mt-4 pt-4 border-t border-stone-100 space-y-4"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-stone-700">功效标签</h3>
              <button
                v-if="selectedTags.length > 0"
                @click="selectedTags = []"
                class="text-xs text-emerald-600 hover:text-emerald-700"
              >
                清除
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in allEffectTags"
                :key="tag"
                @click="toggleTag(tag)"
                :class="[
                  'px-3 py-1.5 text-sm rounded-lg transition-all',
                  selectedTags.includes(tag)
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                ]"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-stone-700">适配肤质</h3>
              <button
                v-if="selectedSkinTypes.length > 0"
                @click="selectedSkinTypes = []"
                class="text-xs text-emerald-600 hover:text-emerald-700"
              >
                清除
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="type in allSkinTypes"
                :key="type"
                @click="toggleSkinType(type)"
                :class="[
                  'px-3 py-1.5 text-sm rounded-lg transition-all',
                  selectedSkinTypes.includes(type)
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                ]"
              >
                {{ type }}
              </button>
            </div>
          </div>

          <div
            v-if="selectedTags.length > 0 || selectedSkinTypes.length > 0"
            class="flex justify-end"
          >
            <button
              @click="clearFilters"
              class="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <X :size="14" />
              <span>清除所有筛选</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="filteredFormulas.length === 0" class="text-center py-12">
        <Droplets :size="48" class="mx-auto text-stone-300 mb-4" />
        <p class="text-stone-500">暂无配方</p>
        <button
          @click="showCreateModal = true"
          class="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
        >
          创建第一个配方
        </button>
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="formula in filteredFormulas"
          :key="formula.id"
          @click="handleCardClick(formula.id)"
          class="group bg-white rounded-2xl shadow-sm border border-stone-100 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1"
        >
          <div class="flex items-start justify-between mb-3">
          <h3 class="text-lg font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {{ formula.name }}
          </h3>
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200">
            <Droplets :size="18" />
          </div>
        </div>

          <p v-if="formula.description" class="text-sm text-stone-500 mb-4 line-clamp-2">
            {{ formula.description }}
          </p>

          <div class="flex flex-wrap gap-1.5 mb-4">
            <span
              v-for="tag in formula.effect_tags.slice(0, 3)"
              :key="tag"
              class="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 rounded-md"
            >
              {{ tag }}
            </span>
            <span
              v-if="formula.effect_tags.length > 3"
              class="px-2 py-0.5 text-xs bg-stone-100 text-stone-500 rounded-md"
            >
              +{{ formula.effect_tags.length - 3 }}
            </span>
          </div>

          <div class="pt-3 border-t border-stone-100 space-y-2">
            <div class="flex items-center gap-2 text-xs text-stone-500">
              <MapPin :size="14" />
              <span class="truncate">{{ formula.purpose || '未设置使用部位' }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-stone-400">
              <Calendar :size="14" />
              <span>{{ formatDate(formula.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FormulaCreateModal
      v-model:visible="showCreateModal"
      @success="handleCreateSuccess"
    />
  </div>
</template>
