<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Save,
  X,
  Droplets,
  Sparkles,
  AlertTriangle,
  Calendar,
  MapPin,
  Plus,
  Minus,
  FileText,
  Brain,
  Loader2
} from 'lucide-vue-next'
import { formulas, ingredients, records } from '@/api'
import type { Formula, FormulaIngredient, FormulaIngredientInput, Ingredient } from '@/types'
import { cn } from '@/lib/utils'

const route = useRoute()
const router = useRouter()
const formulaId = computed(() => Number(route.params.id))

const loading = ref(false)
const saving = ref(false)
const analyzing = ref(false)
const formula = ref<Formula | null>(null)
const isEditMode = ref(false)
const showDeleteConfirm = ref(false)
const showRecordModal = ref(false)

const editName = ref('')
const editDescription = ref<string | null>('')
const editPurpose = ref<string | null>('')
const editNotes = ref<string | null>('')
const editBaseOils = ref<FormulaIngredientInput[]>([])
const editEssentialOils = ref<FormulaIngredientInput[]>([])
const editMixDate = ref('')

const allBaseOils = ref<Ingredient[]>([])
const allEssentialOils = ref<Ingredient[]>([])

const baseOilList = computed(() => {
  return formula?.value?.ingredients.filter(i => i.type === 'base') || []
})

const essentialOilList = computed(() => {
  return formula?.value?.ingredients.filter(i => i.type === 'essential') || []
})

const totalDrops = computed(() => {
  return formula?.value?.ingredients.reduce((sum, i) => sum + i.drops, 0) || 0
})

const analysisResult = computed(() => {
  if (!formula.value) return null
  return {
    effectTags: formula.value.effect_tags,
    contraindications: formula.value.contraindications,
    suitableSkinTypes: formula.value.suitable_skin_types
  }
})

const loadIngredients = async () => {
  try {
    const [bases, essentials] = await Promise.all([
      ingredients.getList('base'),
      ingredients.getList('essential')
    ])
    allBaseOils.value = bases
    allEssentialOils.value = essentials
  } catch (error) {
    console.error('加载成分列表失败:', error)
  }
}

const fetchFormula = async () => {
  loading.value = true
  try {
    formula.value = await formulas.getDetail(formulaId.value)
  } catch (error) {
    console.error('获取配方详情失败:', error)
  } finally {
    loading.value = false
  }
}

const enterEditMode = () => {
  if (!formula.value) return
  
  editName.value = formula.value.name
  editDescription.value = formula.value.description
  editPurpose.value = formula.value.purpose
  editNotes.value = formula.value.notes
  editMixDate.value = formula.value.created_at.split('T')[0]
  
  editBaseOils.value = baseOilList.value.map(i => ({
    ingredientId: i.ingredient_id,
    drops: i.drops
  }))
  
  editEssentialOils.value = essentialOilList.value.map(i => ({
    ingredientId: i.ingredient_id,
    drops: i.drops
  }))
  
  isEditMode.value = true
  loadIngredients()
}

const cancelEdit = () => {
  isEditMode.value = false
}

const analyzeFormula = async () => {
  analyzing.value = true
  try {
    const result = await formulas.analyze(editBaseOils.value, editEssentialOils.value)
    if (formula.value) {
      formula.value.effect_tags = result.effectTags
      formula.value.contraindications = result.contraindications
      formula.value.suitable_skin_types = result.suitableSkinTypes
    }
  } catch (error) {
    console.error('分析配方失败:', error)
  } finally {
    analyzing.value = false
  }
}

const saveFormula = async () => {
  if (!formula.value || !editName.value.trim()) return
  
  saving.value = true
  try {
    const updated = await formulas.update(formulaId.value, {
      name: editName.value.trim(),
      description: editDescription.value,
      purpose: editPurpose.value,
      notes: editNotes.value,
      baseOils: editBaseOils.value,
      essentialOils: editEssentialOils.value
    })
    formula.value = updated
    isEditMode.value = false
  } catch (error) {
    console.error('保存配方失败:', error)
  } finally {
    saving.value = false
  }
}

const deleteFormula = async () => {
  if (!formula.value) return
  
  try {
    await formulas.remove(formulaId.value)
    router.push('/formulas')
  } catch (error) {
    console.error('删除配方失败:', error)
  } finally {
    showDeleteConfirm.value = false
  }
}

const addIngredient = (type: 'base' | 'essential', ingredientId: number) => {
  const target = type === 'base' ? editBaseOils : editEssentialOils
  const existing = target.value.find(i => i.ingredientId === ingredientId)
  if (!existing) {
    target.value.push({ ingredientId, drops: 1 })
  }
}

const removeIngredient = (type: 'base' | 'essential', ingredientId: number) => {
  const target = type === 'base' ? editBaseOils : editEssentialOils
  const index = target.value.findIndex(i => i.ingredientId === ingredientId)
  if (index > -1) {
    target.value.splice(index, 1)
  }
}

const updateDrops = (type: 'base' | 'essential', ingredientId: number, delta: number) => {
  const target = type === 'base' ? editBaseOils : editEssentialOils
  const item = target.value.find(i => i.ingredientId === ingredientId)
  if (item) {
    item.drops = Math.max(1, item.drops + delta)
  }
}

const getIngredientById = (id: number, type: 'base' | 'essential') => {
  const list = type === 'base' ? allBaseOils.value : allEssentialOils.value
  return list.find(i => i.id === id)
}

const getIngredientName = (ingredient: FormulaIngredientInput, type: 'base' | 'essential') => {
  const ing = getIngredientById(ingredient.ingredientId, type)
  return ing?.name || '未知成分'
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const goBack = () => {
  router.back()
}

const addUsageRecord = async () => {
  if (!formula.value) return
  
  try {
    await records.create({
      formulaId: formula.value.id,
      date: new Date().toISOString().split('T')[0],
      notes: null
    })
    showRecordModal.value = false
  } catch (error) {
    console.error('添加使用记录失败:', error)
  }
}

onMounted(() => {
  fetchFormula()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
    <div class="max-w-4xl mx-auto px-4 py-6">
      <div class="flex items-center gap-4 mb-6">
        <button
          @click="goBack"
          class="p-2 hover:bg-white rounded-xl transition-colors"
        >
          <ArrowLeft :size="20" class="text-stone-600" />
        </button>
        <div class="flex-1">
          <h1 v-if="!isEditMode" class="text-2xl font-bold text-stone-800">
            {{ formula?.name || '加载中...' }}
          </h1>
          <input
            v-else
            v-model="editName"
            type="text"
            placeholder="配方名称"
            class="text-2xl font-bold text-stone-800 w-full bg-transparent border-b-2 border-emerald-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="!isEditMode"
            @click="enterEditMode"
            class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 rounded-xl border border-stone-200 transition-colors"
          >
            <Edit3 :size="16" />
            <span>编辑</span>
          </button>
          <button
            v-if="isEditMode"
            @click="analyzeFormula"
            :disabled="analyzing"
            class="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 transition-colors disabled:opacity-50"
          >
            <Brain v-if="!analyzing" :size="16" />
            <Loader2 v-else :size="16" class="animate-spin" />
            <span>{{ analyzing ? '分析中...' : '智能分析' }}</span>
          </button>
          <button
            v-if="isEditMode"
            @click="cancelEdit"
            class="p-2 hover:bg-stone-100 text-stone-600 rounded-xl transition-colors"
          >
            <X :size="20" />
          </button>
          <button
            v-if="isEditMode"
            @click="saveFormula"
            :disabled="saving || !editName.trim()"
            class="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            <Save v-if="!saving" :size="16" />
            <Loader2 v-else :size="16" class="animate-spin" />
            <span>{{ saving ? '保存中...' : '保存' }}</span>
          </button>
          <button
            v-if="!isEditMode"
            @click="showDeleteConfirm = true"
            class="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
          >
            <Trash2 :size="20" />
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="!formula" class="text-center py-12">
        <Droplets :size="48" class="mx-auto text-stone-300 mb-4" />
        <p class="text-stone-500">配方不存在</p>
      </div>

      <div v-else class="space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md">
                <Droplets :size="24" />
              </div>
              <div>
                <div class="flex items-center gap-2 text-sm text-stone-500">
                  <MapPin :size="14" />
                  <span v-if="!isEditMode">{{ formula.purpose || '未设置使用部位' }}</span>
                  <input
                    v-else
                    v-model="editPurpose"
                    type="text"
                    placeholder="使用部位"
                    class="bg-stone-50 border border-stone-200 rounded-lg px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div class="flex items-center gap-2 text-sm text-stone-400 mt-1">
                  <Calendar :size="14" />
                  <span v-if="!isEditMode">{{ formatDate(formula.created_at) }}</span>
                  <input
                    v-else
                    v-model="editMixDate"
                    type="date"
                    class="bg-stone-50 border border-stone-200 rounded-lg px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-emerald-600">{{ totalDrops }}</div>
              <div class="text-xs text-stone-400">总滴数</div>
            </div>
          </div>

          <div v-if="!isEditMode && formula.description" class="text-stone-600 mb-4">
            {{ formula.description }}
          </div>
          <textarea
            v-else-if="isEditMode"
            v-model="editDescription"
            placeholder="配方描述..."
            rows="3"
            class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none mb-4"
          ></textarea>

          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in formula.effect_tags"
              :key="tag"
              class="px-3 py-1 text-sm bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-1"
            >
              <Sparkles :size="12" />
              {{ tag }}
            </span>
          </div>

          <div
            v-if="formula.contraindications.length > 0"
            class="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200"
          >
            <div class="flex items-start gap-2">
              <AlertTriangle :size="18" class="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 class="text-sm font-medium text-amber-800 mb-1">禁忌提示</h4>
                <ul class="text-sm text-amber-700 space-y-1">
                  <li v-for="item in formula.contraindications" :key="item">• {{ item }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-stone-100">
            <h4 class="text-sm font-medium text-stone-700 mb-2">适配肤质</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="type in formula.suitable_skin_types"
                :key="type"
                class="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg"
              >
                {{ type }}
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <h3 class="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <Droplets :size="20" class="text-amber-500" />
            成分列表
          </h3>

          <div v-if="baseOilList.length > 0 || (isEditMode && editBaseOils.length > 0)" class="mb-6">
            <h4 class="text-sm font-medium text-stone-600 mb-3">基础油</h4>
            <div class="space-y-2">
              <template v-if="!isEditMode">
                <div
                  v-for="item in baseOilList"
                  :key="item.id"
                  class="flex items-center justify-between p-3 bg-amber-50 rounded-xl"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                      <Droplets :size="16" class="text-amber-700" />
                    </div>
                    <div>
                      <div class="font-medium text-stone-800">{{ item.name }}</div>
                      <div class="text-xs text-stone-400">{{ item.english_name }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-lg font-bold text-amber-600">{{ item.drops }}</span>
                    <span class="text-sm text-stone-400 ml-1">滴</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <div
                  v-for="item in editBaseOils"
                  :key="item.ingredientId"
                  class="flex items-center justify-between p-3 bg-amber-50 rounded-xl"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                      <Droplets :size="16" class="text-amber-700" />
                    </div>
                    <div>
                      <div class="font-medium text-stone-800">{{ getIngredientName(item, 'base') }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      @click="updateDrops('base', item.ingredientId, -1)"
                      class="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                    >
                      <Minus :size="14" class="text-amber-600" />
                    </button>
                    <span class="w-8 text-center text-lg font-bold text-amber-600">{{ item.drops }}</span>
                    <button
                      @click="updateDrops('base', item.ingredientId, 1)"
                      class="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                    >
                      <Plus :size="14" class="text-amber-600" />
                    </button>
                    <button
                      @click="removeIngredient('base', item.ingredientId)"
                      class="ml-2 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <X :size="14" class="text-red-500" />
                    </button>
                  </div>
                </div>
                <div class="mt-2">
                  <select
                    @change="(e) => { addIngredient('base', Number((e.target as HTMLSelectElement).value)); (e.target as HTMLSelectElement).value = '' }"
                    class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">+ 添加基础油</option>
                    <option
                      v-for="oil in allBaseOils.filter(b => !editBaseOils.find(e => e.ingredientId === b.id))"
                      :key="oil.id"
                      :value="oil.id"
                    >
                      {{ oil.name }}
                    </option>
                  </select>
                </div>
              </template>
            </div>
          </div>

          <div v-if="essentialOilList.length > 0 || (isEditMode && editEssentialOils.length > 0)">
            <h4 class="text-sm font-medium text-stone-600 mb-3">单方精油</h4>
            <div class="space-y-2">
              <template v-if="!isEditMode">
                <div
                  v-for="item in essentialOilList"
                  :key="item.id"
                  class="flex items-center justify-between p-3 bg-emerald-50 rounded-xl"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                      <Sparkles :size="16" class="text-emerald-700" />
                    </div>
                    <div>
                      <div class="font-medium text-stone-800">{{ item.name }}</div>
                      <div class="text-xs text-stone-400">{{ item.english_name }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-lg font-bold text-emerald-600">{{ item.drops }}</span>
                    <span class="text-sm text-stone-400 ml-1">滴</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <div
                  v-for="item in editEssentialOils"
                  :key="item.ingredientId"
                  class="flex items-center justify-between p-3 bg-emerald-50 rounded-xl"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                      <Sparkles :size="16" class="text-emerald-700" />
                    </div>
                    <div>
                      <div class="font-medium text-stone-800">{{ getIngredientName(item, 'essential') }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      @click="updateDrops('essential', item.ingredientId, -1)"
                      class="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                    >
                      <Minus :size="14" class="text-emerald-600" />
                    </button>
                    <span class="w-8 text-center text-lg font-bold text-emerald-600">{{ item.drops }}</span>
                    <button
                      @click="updateDrops('essential', item.ingredientId, 1)"
                      class="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                    >
                      <Plus :size="14" class="text-emerald-600" />
                    </button>
                    <button
                      @click="removeIngredient('essential', item.ingredientId)"
                      class="ml-2 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <X :size="14" class="text-red-500" />
                    </button>
                  </div>
                </div>
                <div class="mt-2">
                  <select
                    @change="(e) => { addIngredient('essential', Number((e.target as HTMLSelectElement).value)); (e.target as HTMLSelectElement).value = '' }"
                    class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">+ 添加单方精油</option>
                    <option
                      v-for="oil in allEssentialOils.filter(b => !editEssentialOils.find(e => e.ingredientId === b.id))"
                      :key="oil.id"
                      :value="oil.id"
                    >
                      {{ oil.name }}
                    </option>
                  </select>
                </div>
              </template>
            </div>
          </div>

          <div v-if="!isEditMode && formula.notes" class="mt-6 pt-4 border-t border-stone-100">
            <h4 class="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
              <FileText :size="16" />
              备注
            </h4>
            <p class="text-sm text-stone-600">{{ formula.notes }}</p>
          </div>
          <div v-else-if="isEditMode" class="mt-4">
            <h4 class="text-sm font-medium text-stone-700 mb-2">备注</h4>
            <textarea
              v-model="editNotes"
              placeholder="添加备注..."
              rows="2"
              class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            ></textarea>
          </div>
        </div>

        <div v-if="!isEditMode" class="flex gap-3">
          <button
            @click="showRecordModal = true"
            class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-200 transition-all hover:shadow-xl"
          >
            <Plus :size="18" />
            <span>新增使用记录</span>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showDeleteConfirm = false"
    >
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle :size="24" class="text-red-500" />
        </div>
        <h3 class="text-lg font-semibold text-stone-800 text-center mb-2">确认删除</h3>
        <p class="text-stone-500 text-center mb-6">
          确定要删除配方「{{ formula?.name }}」吗？此操作不可撤销。
        </p>
        <div class="flex gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="flex-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            @click="deleteFormula"
            class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showRecordModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showRecordModal = false"
    >
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 class="text-lg font-semibold text-stone-800 text-center mb-4">新增使用记录</h3>
        <p class="text-stone-500 text-center mb-6">
          为配方「{{ formula?.name }}」添加今天的使用记录？
        </p>
        <div class="flex gap-3">
          <button
            @click="showRecordModal = false"
            class="flex-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            @click="addUsageRecord"
            class="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
          >
            确认添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
