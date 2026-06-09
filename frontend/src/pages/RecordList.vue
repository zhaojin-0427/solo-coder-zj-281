<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Calendar, Droplets, Zap, Heart, FileText, User, Filter, ChevronDown, Smile } from 'lucide-vue-next'
import StarRating from '@/components/Common/StarRating.vue'
import TagBadge from '@/components/Common/TagBadge.vue'
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import RecordCreateModal from '@/components/Record/RecordCreateModal.vue'
import FormulaReviewCard from '@/components/Common/FormulaReviewCard.vue'
import { useRecordsStore } from '@/stores/records'
import { useFormulasStore } from '@/stores/formulas'
import { formulas } from '@/api'
import type { FormulaReviewSummary } from '@/types'
import { cn } from '@/lib/utils'

const recordsStore = useRecordsStore()
const formulasStore = useFormulasStore()

const showCreateModal = ref(false)
const selectedFormulaId = ref<number | null>(null)
const showFilterDropdown = ref(false)
const formulaReview = ref<FormulaReviewSummary | null>(null)
const reviewLoading = ref(false)

const skinConditionColors: Record<string, string> = {
  '正常': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '干燥': 'bg-blue-100 text-blue-700 border-blue-200',
  '油腻': 'bg-amber-100 text-amber-700 border-amber-200',
  '敏感': 'bg-rose-100 text-rose-700 border-rose-200',
  '痘痘': 'bg-red-100 text-red-700 border-red-200'
}

const filteredRecords = computed(() => {
  if (!selectedFormulaId.value) {
    return recordsStore.list
  }
  return recordsStore.list.filter(r => r.formula_id === selectedFormulaId.value)
})

const groupedRecords = computed(() => {
  const groups: Record<string, typeof recordsStore.list> = {}
  filteredRecords.value.forEach(record => {
    const date = record.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(record)
  })
  return Object.entries(groups)
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
})

const selectedFormulaName = computed(() => {
  if (!selectedFormulaId.value) return '全部配方'
  const formula = formulasStore.list.find(f => f.id === selectedFormulaId.value)
  return formula?.name || '全部配方'
})

const toggleFilter = () => {
  showFilterDropdown.value = !showFilterDropdown.value
}

const selectFormula = (formulaId: number | null) => {
  selectedFormulaId.value = formulaId
  showFilterDropdown.value = false
}

const fetchFormulaReview = async (formulaId: number) => {
  reviewLoading.value = true
  try {
    formulaReview.value = await formulas.getReview(formulaId)
  } catch (error) {
    console.error('获取配方复盘失败:', error)
  } finally {
    reviewLoading.value = false
  }
}

watch(selectedFormulaId, (newId) => {
  if (newId) {
    fetchFormulaReview(newId)
  } else {
    formulaReview.value = null
  }
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return {
    year,
    month,
    day,
    weekday,
    full: `${year}年${month}月${day}日 ${weekday}`
  }
}

const handleCreateSuccess = () => {
  recordsStore.fetchList()
}

const initDefaultSelection = () => {
  if (formulasStore.list.length > 0 && !selectedFormulaId.value) {
    const formulasWithRecords = formulasStore.list.filter(f =>
      recordsStore.list.some(r => r.formula_id === f.id)
    )
    if (formulasWithRecords.length > 0) {
      selectFormula(formulasWithRecords[0].id)
    }
  }
}

onMounted(async () => {
  await Promise.all([
    recordsStore.fetchList(),
    formulasStore.fetchList()
  ])
  initDefaultSelection()
})
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-stone-800">使用记录</h1>
        <p class="text-sm text-stone-500 mt-1">共 {{ recordsStore.list.length }} 条记录</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-200"
      >
        <Plus :size="18" />
        <span class="font-medium">新增记录</span>
      </button>
    </div>

    <div class="flex items-center gap-3 mb-6">
      <div class="relative">
        <button
          @click="toggleFilter"
          class="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl border border-stone-200 transition-all shadow-sm"
        >
          <Filter :size="16" />
          <span>{{ selectedFormulaName }}</span>
          <ChevronDown :size="16" :class="{ 'rotate-180': showFilterDropdown }" class="transition-transform" />
        </button>
        <div
          v-if="showFilterDropdown"
          class="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-10"
        >
          <button
            @click="selectFormula(null)"
            :class="[
              'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between',
              selectedFormulaId === null
                ? 'bg-emerald-50 text-emerald-700'
                : 'hover:bg-stone-50 text-stone-700'
            ]"
          >
            <span>全部配方</span>
            <span v-if="selectedFormulaId === null" class="text-emerald-600">✓</span>
          </button>
          <div class="border-t border-stone-100 my-1"></div>
          <button
            v-for="formula in formulasStore.list"
            :key="formula.id"
            @click="selectFormula(formula.id)"
            :class="[
              'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between',
              selectedFormulaId === formula.id
                ? 'bg-emerald-50 text-emerald-700'
                : 'hover:bg-stone-50 text-stone-700'
            ]"
          >
            <span>{{ formula.name }}</span>
            <span v-if="selectedFormulaId === formula.id" class="text-emerald-600">✓</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="!selectedFormulaId && !recordsStore.loading && formulasStore.list.length > 0" class="mb-6 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl p-5 border border-sky-100">
      <div class="flex items-start gap-4">
        <div class="p-3 bg-white rounded-xl shadow-sm">
          <Zap :size="24" class="text-sky-600" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-sky-900 mb-1">💡 查看配方历史表现</h3>
          <p class="text-sm text-sky-700 leading-relaxed">
            点击上方「全部配方」筛选按钮，选择一个具体配方即可查看该配方的历史使用表现汇总、皮肤反应分析和个性化调配建议。
          </p>
        </div>
      </div>
    </div>

    <FormulaReviewCard
      v-if="selectedFormulaId && !recordsStore.loading"
      :review="formulaReview"
      :loading="reviewLoading"
      class="mb-6"
    />

    <div v-if="recordsStore.loading" class="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else-if="groupedRecords.length === 0" class="py-16">
      <EmptyState
        title="暂无使用记录"
        description="点击上方按钮记录你的使用感受"
        icon-type="record"
      />
    </div>

    <div v-else class="relative">
      <div class="absolute left-8 top-4 bottom-4 w-0.5 bg-stone-200"></div>

      <div class="space-y-8">
        <div v-for="[date, records] in groupedRecords" :key="date" class="relative">
          <div class="flex items-start gap-4">
            <div class="w-16 flex-shrink-0 flex flex-col items-center">
              <div class="w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-md z-10"></div>
              <div class="mt-2 text-center">
                <div class="text-lg font-bold text-stone-800">{{ formatDate(date).day }}</div>
                <div class="text-xs text-stone-500">{{ formatDate(date).month }}月</div>
                <div class="text-xs text-stone-400">{{ formatDate(date).weekday }}</div>
              </div>
            </div>

            <div class="flex-1 space-y-4">
              <div
                v-for="record in records"
                :key="record.id"
                class="bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all overflow-hidden"
              >
                <div class="p-5">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <h3 class="text-lg font-semibold text-stone-800">
                        {{ record.formula?.name || '未命名配方' }}
                      </h3>
                      <div class="flex items-center gap-2 mt-1">
                        <Calendar :size="14" class="text-stone-400" />
                        <span class="text-sm text-stone-500">{{ formatDate(record.date).full }}</span>
                      </div>
                    </div>
                    <TagBadge
                      v-if="record.skin_condition"
                      :label="record.skin_condition"
                      type="skinType"
                    />
                  </div>

                  <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="bg-emerald-50/50 rounded-xl p-3">
                      <div class="flex items-center gap-2 mb-2">
                        <Droplets :size="16" class="text-emerald-600" />
                        <span class="text-sm font-medium text-emerald-800">吸收度</span>
                      </div>
                      <StarRating
                        :model-value="record.absorption_rating || 0"
                        readonly
                        color="primary"
                        show-value
                      />
                    </div>
                    <div class="bg-rose-50/50 rounded-xl p-3">
                      <div class="flex items-center gap-2 mb-2">
                        <Zap :size="16" class="text-rose-600" />
                        <span class="text-sm font-medium text-rose-800">敏感度</span>
                      </div>
                      <StarRating
                        :model-value="record.sensitivity_rating || 0"
                        readonly
                        color="warning"
                        show-value
                      />
                    </div>
                    <div class="bg-amber-50/50 rounded-xl p-3">
                      <div class="flex items-center gap-2 mb-2">
                        <Heart :size="16" class="text-amber-600" />
                        <span class="text-sm font-medium text-amber-800">改善效果</span>
                      </div>
                      <StarRating
                        :model-value="record.improvement_rating || 0"
                        readonly
                        color="warning"
                        show-value
                      />
                    </div>
                  </div>

                  <div v-if="record.notes" class="bg-stone-50 rounded-xl p-4">
                    <div class="flex items-start gap-2">
                      <FileText :size="16" class="text-stone-400 mt-0.5 flex-shrink-0" />
                      <p class="text-sm text-stone-600 leading-relaxed">{{ record.notes }}</p>
                    </div>
                  </div>

                  <div v-if="record.skin_condition" class="mt-4 flex items-center gap-2">
                    <Smile :size="16" class="text-stone-400" />
                    <span class="text-sm text-stone-600">皮肤状况：</span>
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        skinConditionColors[record.skin_condition] || 'bg-stone-100 text-stone-600 border-stone-200'
                      ]"
                    >
                      {{ record.skin_condition }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RecordCreateModal
      v-model:visible="showCreateModal"
      @success="handleCreateSuccess"
    />
  </div>
</template>
