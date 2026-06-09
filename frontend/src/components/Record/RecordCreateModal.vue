<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, Calendar, Droplets, Zap, Heart, FileText, User } from 'lucide-vue-next'
import StarRating from '@/components/Common/StarRating.vue'
import { useFormulasStore } from '@/stores/formulas'
import { useRecordsStore } from '@/stores/records'
import { cn } from '@/lib/utils'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const formulasStore = useFormulasStore()
const recordsStore = useRecordsStore()

const skinConditions = [
  { value: '正常', label: '正常', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: '干燥', label: '干燥', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: '油腻', label: '油腻', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: '敏感', label: '敏感', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: '痘痘', label: '痘痘', color: 'bg-red-100 text-red-700 border-red-200' }
]

const creating = ref(false)
const loadingFormulas = ref(false)

const formulaId = ref<number | null>(null)
const date = ref(new Date().toISOString().split('T')[0])
const absorption = ref(0)
const sensitivity = ref(0)
const improvement = ref(0)
const skinCondition = ref('')
const notes = ref('')

const canSubmit = computed(() => {
  return (
    formulaId.value !== null &&
    date.value &&
    absorption.value > 0 &&
    sensitivity.value > 0 &&
    improvement.value > 0 &&
    skinCondition.value
  )
})

const closeModal = () => {
  emit('update:visible', false)
}

const resetForm = () => {
  formulaId.value = null
  date.value = new Date().toISOString().split('T')[0]
  absorption.value = 0
  sensitivity.value = 0
  improvement.value = 0
  skinCondition.value = ''
  notes.value = ''
}

const loadFormulas = async () => {
  if (formulasStore.list.length === 0) {
    loadingFormulas.value = true
    try {
      await formulasStore.fetchList()
    } catch (error) {
      console.error('加载配方列表失败:', error)
    } finally {
      loadingFormulas.value = false
    }
  }
}

const createRecord = async () => {
  if (!canSubmit.value || !formulaId.value) return

  creating.value = true
  try {
    await recordsStore.create({
      formulaId: formulaId.value,
      date: date.value,
      skinCondition: skinCondition.value,
      absorption: absorption.value,
      sensitivity: sensitivity.value,
      improvement: improvement.value,
      notes: notes.value
    })
    emit('success')
    closeModal()
    resetForm()
  } catch (error) {
    console.error('创建记录失败:', error)
  } finally {
    creating.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
    loadFormulas()
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
      <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 class="text-xl font-bold text-stone-800">新增使用记录</h2>
          <button
            @click="closeModal"
            class="p-2 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X :size="20" class="text-stone-500" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-2">
              选择配方 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formulaId"
              class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            >
              <option :value="null" disabled>请选择配方</option>
              <option v-for="formula in formulasStore.list" :key="formula.id" :value="formula.id">
                {{ formula.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-stone-700 mb-2">
              使用日期 <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="date"
                type="date"
                class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all pr-10"
              />
              <Calendar :size="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-stone-700 mb-2">
              皮肤状况 <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="condition in skinConditions"
                :key="condition.value"
                type="button"
                @click="skinCondition = condition.value"
                :class="[
                  'flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 transition-all',
                  skinCondition === condition.value
                    ? condition.color + ' border-current'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                ]"
              >
                <User :size="18" />
                <span class="text-xs font-medium">{{ condition.label }}</span>
              </button>
            </div>
          </div>

          <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <div class="flex items-center gap-2 mb-3">
              <Droplets :size="18" class="text-emerald-600" />
              <span class="font-medium text-emerald-800">吸收度</span>
              <span class="text-red-500">*</span>
            </div>
            <StarRating v-model="absorption" color="primary" />
          </div>

          <div class="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100">
            <div class="flex items-center gap-2 mb-3">
              <Zap :size="18" class="text-rose-600" />
              <span class="font-medium text-rose-800">敏感度</span>
              <span class="text-red-500">*</span>
            </div>
            <StarRating v-model="sensitivity" color="warning" />
          </div>

          <div class="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
            <div class="flex items-center gap-2 mb-3">
              <Heart :size="18" class="text-amber-600" />
              <span class="font-medium text-amber-800">改善效果</span>
              <span class="text-red-500">*</span>
            </div>
            <StarRating v-model="improvement" color="warning" />
          </div>

          <div>
            <label class="block text-sm font-medium text-stone-700 mb-2">
              备注
            </label>
            <div class="relative">
              <textarea
                v-model="notes"
                placeholder="记录使用感受、效果变化等..."
                rows="4"
                class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
              ></textarea>
              <FileText :size="18" class="absolute right-3 top-3 text-stone-400" />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100 bg-stone-50">
          <button
            @click="closeModal"
            class="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            @click="createRecord"
            :disabled="!canSubmit || creating"
            :class="[
              'flex items-center gap-2 px-6 py-2.5 rounded-xl transition-colors font-medium',
              canSubmit && !creating
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            ]"
          >
            <div v-if="creating" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>{{ creating ? '保存中...' : '保存记录' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
