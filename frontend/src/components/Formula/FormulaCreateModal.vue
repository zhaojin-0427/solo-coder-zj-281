<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Droplets,
  Sparkles,
  AlertTriangle,
  Check,
  Plus,
  Minus,
  Brain,
  Loader2
} from 'lucide-vue-next'
import { formulas, ingredients } from '@/api'
import type { Ingredient, FormulaIngredientInput, FormulaAnalysis } from '@/types'
import { cn } from '@/lib/utils'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const currentStep = ref(1)
const totalSteps = 4
const creating = ref(false)
const analyzing = ref(false)
const loadingIngredients = ref(false)

const name = ref('')
const description = ref('')
const baseOils = ref<FormulaIngredientInput[]>([])
const essentialOils = ref<FormulaIngredientInput[]>([])
const purpose = ref('')
const mixDate = ref(new Date().toISOString().split('T')[0])

const allBaseOils = ref<Ingredient[]>([])
const allEssentialOils = ref<Ingredient[]>([])
const analysis = ref<FormulaAnalysis | null>(null)

const baseOilSearch = ref('')
const essentialOilSearch = ref('')

const filteredBaseOils = computed(() => {
  if (!baseOilSearch.value) return allBaseOils.value
  const keyword = baseOilSearch.value.toLowerCase()
  return allBaseOils.value.filter(
    o => o.name.toLowerCase().includes(keyword) || o.english_name.toLowerCase().includes(keyword)
  )
})

const filteredEssentialOils = computed(() => {
  if (!essentialOilSearch.value) return allEssentialOils.value
  const keyword = essentialOilSearch.value.toLowerCase()
  return allEssentialOils.value.filter(
    o => o.name.toLowerCase().includes(keyword) || o.english_name.toLowerCase().includes(keyword)
  )
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return name.value.trim().length > 0
    case 2:
      return baseOils.value.length > 0
    case 3:
      return essentialOils.value.length > 0
    case 4:
      return purpose.value.trim().length > 0 && mixDate.value
    default:
      return false
  }
})

const totalDrops = computed(() => {
  return [...baseOils.value, ...essentialOils.value].reduce((sum, i) => sum + i.drops, 0)
})

const getIngredientById = (id: number, type: 'base' | 'essential') => {
  const list = type === 'base' ? allBaseOils.value : allEssentialOils.value
  return list.find(i => i.id === id)
}

const isBaseOilSelected = (id: number) => {
  return baseOils.value.some(o => o.ingredientId === id)
}

const isEssentialOilSelected = (id: number) => {
  return essentialOils.value.some(o => o.ingredientId === id)
}

const toggleBaseOil = (id: number) => {
  const index = baseOils.value.findIndex(o => o.ingredientId === id)
  if (index > -1) {
    baseOils.value.splice(index, 1)
  } else {
    baseOils.value.push({ ingredientId: id, drops: 10 })
  }
}

const toggleEssentialOil = (id: number) => {
  const index = essentialOils.value.findIndex(o => o.ingredientId === id)
  if (index > -1) {
    essentialOils.value.splice(index, 1)
  } else {
    essentialOils.value.push({ ingredientId: id, drops: 3 })
  }
}

const updateDrops = (type: 'base' | 'essential', id: number, delta: number) => {
  const target = type === 'base' ? baseOils : essentialOils
  const item = target.value.find(i => i.ingredientId === id)
  if (item) {
    item.drops = Math.max(1, item.drops + delta)
  }
}

const getDrops = (type: 'base' | 'essential', id: number) => {
  const target = type === 'base' ? baseOils : essentialOils
  const item = target.value.find(i => i.ingredientId === id)
  return item?.drops || 0
}

const analyzeFormula = async () => {
  if (baseOils.value.length === 0 && essentialOils.value.length === 0) return
  
  analyzing.value = true
  try {
    analysis.value = await formulas.analyze(baseOils.value, essentialOils.value)
  } catch (error) {
    console.error('分析配方失败:', error)
  } finally {
    analyzing.value = false
  }
}

watch([baseOils, essentialOils], () => {
  if (baseOils.value.length > 0 || essentialOils.value.length > 0) {
    analyzeFormula()
  }
}, { deep: true })

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const goToStep = (step: number) => {
  if (step < currentStep.value) {
    currentStep.value = step
  }
}

const closeModal = () => {
  emit('update:visible', false)
}

const resetForm = () => {
  currentStep.value = 1
  name.value = ''
  description.value = ''
  baseOils.value = []
  essentialOils.value = []
  purpose.value = ''
  mixDate.value = new Date().toISOString().split('T')[0]
  analysis.value = null
  baseOilSearch.value = ''
  essentialOilSearch.value = ''
}

const createFormula = async () => {
  if (!canProceed.value) return
  
  creating.value = true
  try {
    await formulas.create({
      name: name.value.trim(),
      description: description.value.trim() || null,
      purpose: purpose.value.trim(),
      baseOils: baseOils.value,
      essentialOils: essentialOils.value
    })
    emit('success')
    closeModal()
    resetForm()
  } catch (error) {
    console.error('创建配方失败:', error)
  } finally {
    creating.value = false
  }
}

const loadIngredients = async () => {
  loadingIngredients.value = true
  try {
    const [bases, essentials] = await Promise.all([
      ingredients.getList('base'),
      ingredients.getList('essential')
    ])
    allBaseOils.value = bases
    allEssentialOils.value = essentials
  } catch (error) {
    console.error('加载成分列表失败:', error)
  } finally {
    loadingIngredients.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
    loadIngredients()
  }
})

onMounted(() => {
  if (props.visible) {
    loadIngredients()
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 class="text-xl font-bold text-stone-800">创建新配方</h2>
          <button
            @click="closeModal"
            class="p-2 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X :size="20" class="text-stone-500" />
          </button>
        </div>

        <div class="px-6 py-4 border-b border-stone-100">
          <div class="flex items-center justify-between">
            <div
              v-for="step in totalSteps"
              :key="step"
              class="flex items-center"
            >
              <button
                @click="goToStep(step)"
                :disabled="step > currentStep"
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                  step === currentStep
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : step < currentStep
                      ? 'bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200'
                      : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                ]"
              >
                <Check v-if="step < currentStep" :size="18" />
                <span v-else>{{ step }}</span>
              </button>
              <div
                v-if="step < totalSteps"
                :class="[
                  'w-16 sm:w-24 h-1 mx-2 rounded-full transition-colors',
                  step < currentStep ? 'bg-emerald-500' : 'bg-stone-200'
                ]"
              ></div>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-stone-500 px-1">
            <span>基础信息</span>
            <span>基础油</span>
            <span>单方精油</span>
            <span>完成</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="currentStep === 1" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                配方名称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="name"
                type="text"
                placeholder="例如：舒缓保湿精油"
                class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                配方描述
              </label>
              <textarea
                v-model="description"
                placeholder="描述这个配方的用途和特点..."
                rows="4"
                class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <div v-else-if="currentStep === 2" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-stone-800">选择基础油</h3>
              <span class="text-sm text-stone-500">已选 {{ baseOils.length }} 种</span>
            </div>
            
            <div class="relative">
              <input
                v-model="baseOilSearch"
                type="text"
                placeholder="搜索基础油..."
                class="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
              />
            </div>

            <div v-if="loadingIngredients" class="flex justify-center py-8">
              <div class="animate-spin w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>

            <div v-else class="space-y-2 max-h-80 overflow-y-auto">
              <div
                v-for="oil in filteredBaseOils"
                :key="oil.id"
                @click="toggleBaseOil(oil.id)"
                :class="[
                  'p-4 rounded-xl border-2 cursor-pointer transition-all',
                  isBaseOilSelected(oil.id)
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-stone-100 bg-white hover:border-amber-200 hover:bg-amber-50/50'
                ]"
              >
                <div class="flex items-start gap-3">
                  <div
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      isBaseOilSelected(oil.id) ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                    ]"
                  >
                    <Droplets :size="20" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium text-stone-800">{{ oil.name }}</h4>
                      <span class="text-xs text-stone-400">{{ oil.english_name }}</span>
                    </div>
                    <p class="text-sm text-stone-500 mt-1 line-clamp-1">{{ oil.description }}</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                      <span
                        v-for="eff in oil.effects.slice(0, 3)"
                        :key="eff"
                        class="px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded-md"
                      >
                        {{ eff }}
                      </span>
                    </div>
                  </div>
                  <div
                    v-if="isBaseOilSelected(oil.id)"
                    class="flex items-center gap-1"
                    @click.stop
                  >
                    <button
                      @click="updateDrops('base', oil.id, -1)"
                      class="w-8 h-8 rounded-lg bg-white border border-amber-300 flex items-center justify-center hover:bg-amber-100 transition-colors"
                    >
                      <Minus :size="14" class="text-amber-600" />
                    </button>
                    <span class="w-8 text-center font-bold text-amber-600">{{ getDrops('base', oil.id) }}</span>
                    <button
                      @click="updateDrops('base', oil.id, 1)"
                      class="w-8 h-8 rounded-lg bg-white border border-amber-300 flex items-center justify-center hover:bg-amber-100 transition-colors"
                    >
                      <Plus :size="14" class="text-amber-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="baseOils.length > 0 && (analysis || analyzing)"
              class="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
            >
              <div class="flex items-center gap-2 mb-2">
                <Brain :size="18" class="text-emerald-600" />
                <span class="font-medium text-emerald-800">实时分析</span>
                <Loader2 v-if="analyzing" :size="16" class="animate-spin text-emerald-600" />
              </div>
              <div v-if="analysis" class="space-y-2">
                <div>
                  <span class="text-sm text-emerald-700">预计功效：</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="tag in analysis.effectTags.slice(0, 5)"
                      :key="tag"
                      class="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-md"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div v-if="analysis.contraindications.length > 0">
                  <span class="text-sm text-amber-700">禁忌提示：</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="c in analysis.contraindications.slice(0, 3)"
                      :key="c"
                      class="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-md"
                    >
                      {{ c }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 3" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-stone-800">选择单方精油</h3>
              <span class="text-sm text-stone-500">已选 {{ essentialOils.length }} 种</span>
            </div>
            
            <div class="relative">
              <input
                v-model="essentialOilSearch"
                type="text"
                placeholder="搜索单方精油..."
                class="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
              />
            </div>

            <div v-if="loadingIngredients" class="flex justify-center py-8">
              <div class="animate-spin w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>

            <div v-else class="space-y-2 max-h-80 overflow-y-auto">
              <div
                v-for="oil in filteredEssentialOils"
                :key="oil.id"
                @click="toggleEssentialOil(oil.id)"
                :class="[
                  'p-4 rounded-xl border-2 cursor-pointer transition-all',
                  isEssentialOilSelected(oil.id)
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-stone-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/50'
                ]"
              >
                <div class="flex items-start gap-3">
                  <div
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      isEssentialOilSelected(oil.id) ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
                    ]"
                  >
                    <Sparkles :size="20" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium text-stone-800">{{ oil.name }}</h4>
                      <span class="text-xs text-stone-400">{{ oil.english_name }}</span>
                    </div>
                    <p class="text-sm text-stone-500 mt-1 line-clamp-1">{{ oil.description }}</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                      <span
                        v-for="eff in oil.effects.slice(0, 3)"
                        :key="eff"
                        class="px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded-md"
                      >
                        {{ eff }}
                      </span>
                    </div>
                  </div>
                  <div
                    v-if="isEssentialOilSelected(oil.id)"
                    class="flex items-center gap-1"
                    @click.stop
                  >
                    <button
                      @click="updateDrops('essential', oil.id, -1)"
                      class="w-8 h-8 rounded-lg bg-white border border-emerald-300 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                    >
                      <Minus :size="14" class="text-emerald-600" />
                    </button>
                    <span class="w-8 text-center font-bold text-emerald-600">{{ getDrops('essential', oil.id) }}</span>
                    <button
                      @click="updateDrops('essential', oil.id, 1)"
                      class="w-8 h-8 rounded-lg bg-white border border-emerald-300 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                    >
                      <Plus :size="14" class="text-emerald-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="essentialOils.length > 0 && (analysis || analyzing)"
              class="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
            >
              <div class="flex items-center gap-2 mb-2">
                <Brain :size="18" class="text-emerald-600" />
                <span class="font-medium text-emerald-800">实时分析</span>
                <Loader2 v-if="analyzing" :size="16" class="animate-spin text-emerald-600" />
              </div>
              <div v-if="analysis" class="space-y-2">
                <div>
                  <span class="text-sm text-emerald-700">预计功效：</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="tag in analysis.effectTags.slice(0, 5)"
                      :key="tag"
                      class="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-md"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div v-if="analysis.contraindications.length > 0">
                  <span class="text-sm text-amber-700">禁忌提示：</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="c in analysis.contraindications.slice(0, 3)"
                      :key="c"
                      class="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-md"
                    >
                      {{ c }}
                    </span>
                  </div>
                </div>
                <div>
                  <span class="text-sm text-blue-700">适配肤质：</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="type in analysis.suitableSkinTypes.slice(0, 5)"
                      :key="type"
                      class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-md"
                    >
                      {{ type }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 4" class="space-y-6">
            <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
              <h3 class="text-lg font-semibold text-emerald-800 mb-4">配方预览</h3>
              
              <div class="space-y-4">
                <div>
                  <div class="text-sm text-emerald-600 mb-1">配方名称</div>
                  <div class="font-medium text-stone-800">{{ name }}</div>
                </div>
                <div v-if="description">
                  <div class="text-sm text-emerald-600 mb-1">配方描述</div>
                  <div class="text-stone-600">{{ description }}</div>
                </div>
              </div>
            </div>

            <div class="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <h4 class="font-medium text-amber-800 mb-3 flex items-center gap-2">
                <Droplets :size="18" />
                基础油 ({{ baseOils.length }} 种)
              </h4>
              <div class="space-y-2">
                <div
                  v-for="item in baseOils"
                  :key="item.ingredientId"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="text-stone-700">{{ getIngredientById(item.ingredientId, 'base')?.name }}</span>
                  <span class="font-medium text-amber-600">{{ item.drops }} 滴</span>
                </div>
              </div>
            </div>

            <div class="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <h4 class="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                <Sparkles :size="18" />
                单方精油 ({{ essentialOils.length }} 种)
              </h4>
              <div class="space-y-2">
                <div
                  v-for="item in essentialOils"
                  :key="item.ingredientId"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="text-stone-700">{{ getIngredientById(item.ingredientId, 'essential')?.name }}</span>
                  <span class="font-medium text-emerald-600">{{ item.drops }} 滴</span>
                </div>
              </div>
              <div class="mt-4 pt-4 border-t border-emerald-200 flex justify-between">
                <span class="text-sm text-emerald-700">总滴数</span>
                <span class="font-bold text-emerald-600">{{ totalDrops }} 滴</span>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-stone-700 mb-2">
                  使用部位 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="purpose"
                  type="text"
                  placeholder="例如：面部、身体、头发..."
                  class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-stone-700 mb-2">
                  调配日期 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="mixDate"
                  type="date"
                  class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div
              v-if="analysis"
              class="p-4 bg-stone-50 rounded-xl border border-stone-200"
            >
              <h4 class="font-medium text-stone-700 mb-2">智能分析结果</h4>
              <div class="space-y-2">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in analysis.effectTags"
                    :key="tag"
                    class="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-md"
                  >
                    {{ tag }}
                  </span>
                </div>
                <div v-if="analysis.contraindications.length > 0" class="flex items-start gap-2 text-sm">
                  <AlertTriangle :size="14" class="text-amber-500 mt-0.5 flex-shrink-0" />
                  <span class="text-amber-700">{{ analysis.contraindications.join('、') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50">
          <button
            v-if="currentStep > 1"
            @click="prevStep"
            class="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-stone-100 text-stone-700 rounded-xl border border-stone-200 transition-colors"
          >
            <ChevronLeft :size="18" />
            <span>上一步</span>
          </button>
          <div v-else></div>
          
          <div class="flex items-center gap-3">
            <button
              @click="closeModal"
              class="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              v-if="currentStep < totalSteps"
              @click="nextStep"
              :disabled="!canProceed"
              class="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>下一步</span>
              <ChevronRight :size="18" />
            </button>
            <button
              v-else
              @click="createFormula"
              :disabled="!canProceed || creating"
              class="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="creating" :size="18" class="animate-spin" />
              <span>{{ creating ? '创建中...' : '创建配方' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
