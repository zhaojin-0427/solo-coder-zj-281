<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  X,
  Calendar,
  Droplets,
  Clock,
  Shield,
  Target,
  Eye,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Info,
  Loader2,
  CheckCircle2
} from 'lucide-vue-next'
import { useToleranceStore } from '@/stores/tolerance'
import type {
  ToleranceSourceType,
  ToleranceCycleType,
  ToleranceFrequencyType,
  TolerancePlanConfigPreview,
  TolerancePlanPhase
} from '@/types'

interface PrefillData {
  sourceType?: ToleranceSourceType
  sourceId?: number
  sourceName?: string
  name?: string
  cycleType?: ToleranceCycleType
  initialFrequency?: ToleranceFrequencyType
  initialDrops?: number
  skinSensitivityLevel?: number
  riskWarnings?: string[]
}

interface Props {
  visible: boolean
  sourceType?: ToleranceSourceType
  sourceId?: number
  sourceName?: string
  prefillData?: PrefillData
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  sourceType: undefined,
  sourceId: undefined,
  sourceName: '',
  prefillData: () => ({})
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success', plan: any): void
}>()

const toleranceStore = useToleranceStore()

const step = ref<'config' | 'preview'>('config')
const creating = ref(false)
const loadingPreview = ref(false)

const cycleType = ref<ToleranceCycleType>('7days')
const customDays = ref(21)
const startDate = ref(new Date().toISOString().split('T')[0])
const initialFrequency = ref<ToleranceFrequencyType>('every_other_day')
const initialDrops = ref(3)
const skinSensitivityLevel = ref(1)
const notes = ref('')

const observationIndicators = ref<string[]>([])
const newIndicator = ref('')

const availableIndicators = [
  '皮肤发红情况',
  '是否有刺痛感',
  '是否有瘙痒感',
  '皮肤干燥程度',
  '是否有灼热感',
  '是否出现红疹',
  '皮肤紧绷感',
  '油脂分泌情况'
]

const frequencyOptions = [
  { value: 'every_two_days', label: '每2日1次', desc: '适合高敏感肌' },
  { value: 'every_other_day', label: '隔日1次', desc: '适合敏感肌' },
  { value: 'daily', label: '每日1次', desc: '适合正常肌肤' },
  { value: 'twice_daily', label: '每日2次', desc: '适合耐受肌' }
]

const cycleOptions = [
  { value: '7days', label: '7天', desc: '快速建立耐受' },
  { value: '14days', label: '14天', desc: '标准耐受周期' },
  { value: 'custom', label: '自定义', desc: '7-60天' }
]

const getFrequencyLabel = (value: string) => {
  return frequencyOptions.find(f => f.value === value)?.label || value
}

const getCycleLabel = (value: string) => {
  return cycleOptions.find(c => c.value === value)?.label || value
}

const finalSourceType = computed<ToleranceSourceType | undefined>(() => {
  return props.prefillData?.sourceType || props.sourceType
})

const finalSourceId = computed<number | undefined>(() => {
  return props.prefillData?.sourceId || props.sourceId
})

const finalSourceName = computed<string>(() => {
  return props.prefillData?.sourceName || props.sourceName || ''
})

const riskWarnings = computed<string[]>(() => {
  return props.prefillData?.riskWarnings || []
})

const initializeFromPrefillData = () => {
  if (props.prefillData) {
    if (props.prefillData.cycleType) {
      cycleType.value = props.prefillData.cycleType
    }
    if (props.prefillData.initialFrequency) {
      initialFrequency.value = props.prefillData.initialFrequency
    }
    if (props.prefillData.initialDrops !== undefined) {
      initialDrops.value = props.prefillData.initialDrops
    }
    if (props.prefillData.skinSensitivityLevel !== undefined) {
      skinSensitivityLevel.value = props.prefillData.skinSensitivityLevel
    }
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    step.value = 'config'
    initializeFromPrefillData()
  }
})

const toggleIndicator = (indicator: string) => {
  const index = observationIndicators.value.indexOf(indicator)
  if (index === -1) {
    observationIndicators.value.push(indicator)
  } else {
    observationIndicators.value.splice(index, 1)
  }
}

const addCustomIndicator = () => {
  if (newIndicator.value.trim() && !observationIndicators.value.includes(newIndicator.value.trim())) {
    observationIndicators.value.push(newIndicator.value.trim())
    newIndicator.value = ''
  }
}

const removeIndicator = (indicator: string) => {
  const index = observationIndicators.value.indexOf(indicator)
  if (index !== -1) {
    observationIndicators.value.splice(index, 1)
  }
}

const previewConfig = computed<TolerancePlanConfigPreview | null>(() => {
  return toleranceStore.previewConfig
})

const canProceed = computed(() => {
  if (!finalSourceType.value || !finalSourceId.value) return false
  if (!startDate.value || !initialFrequency.value || !initialDrops.value) return false
  if (cycleType.value === 'custom' && (!customDays.value || customDays.value < 7 || customDays.value > 60)) return false
  return true
})

const loadPreview = async () => {
  if (!canProceed.value || !finalSourceType.value || !finalSourceId.value) return
  
  loadingPreview.value = true
  try {
    await toleranceStore.fetchPreview({
      sourceType: finalSourceType.value,
      sourceId: finalSourceId.value,
      cycleType: cycleType.value,
      customDays: cycleType.value === 'custom' ? customDays.value : undefined,
      startDate: startDate.value,
      initialFrequency: initialFrequency.value,
      initialDrops: initialDrops.value,
      skinSensitivityLevel: skinSensitivityLevel.value
    })
    step.value = 'preview'
  } catch (error) {
    console.error('加载预览失败:', error)
  } finally {
    loadingPreview.value = false
  }
}

const goBack = () => {
  step.value = 'config'
}

const createPlan = async () => {
  if (!previewConfig.value || !finalSourceType.value || !finalSourceId.value) return
  
  creating.value = true
  try {
    const plan = await toleranceStore.create({
      sourceType: finalSourceType.value,
      sourceId: finalSourceId.value,
      cycleType: cycleType.value,
      customDays: cycleType.value === 'custom' ? customDays.value : undefined,
      startDate: startDate.value,
      initialFrequency: initialFrequency.value,
      initialDrops: initialDrops.value,
      observationIndicators: observationIndicators.value,
      skinSensitivityLevel: skinSensitivityLevel.value,
      notes: notes.value || undefined
    })
    
    emit('success', plan)
    close()
  } catch (error) {
    console.error('创建耐受计划失败:', error)
  } finally {
    creating.value = false
  }
}

const close = () => {
  emit('update:visible', false)
  step.value = 'config'
  observationIndicators.value = []
  notes.value = ''
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getPhaseStatusColor = (phase: TolerancePlanPhase) => {
  if (phase.status === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (phase.status === 'in_progress') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (phase.status === 'extended') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (phase.status === 'interrupted') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-stone-100 text-stone-600 border-stone-200'
}

const getPhaseStatusText = (phase: TolerancePlanPhase) => {
  const statusMap: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    extended: '已延长',
    interrupted: '已中断'
  }
  return statusMap[phase.status] || phase.status
}

const getRiskLevelColor = (level: string) => {
  if (level === 'high') return 'text-red-600 bg-red-50'
  if (level === 'medium') return 'text-amber-600 bg-amber-50'
  return 'text-emerald-600 bg-emerald-50'
}

const getRiskLevelText = (level: string) => {
  if (level === 'high') return '高风险'
  if (level === 'medium') return '中风险'
  return '低风险'
}


</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />
        <div class="relative bg-bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
          <div class="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 class="text-xl font-bold text-text">
                {{ step === 'config' ? '创建耐受建立计划' : '计划预览' }}
              </h2>
              <p class="text-sm text-text-soft mt-1">
                为「{{ finalSourceName }}」建立科学的皮肤耐受计划
              </p>
            </div>
            <button
              @click="close"
              class="p-2 hover:bg-bg-soft rounded-xl transition-colors"
            >
              <X :size="20" class="text-text-muted" />
            </button>
          </div>

          <div v-if="step === 'config'" class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="space-y-6">
                <div class="bg-bg-soft rounded-xl p-5">
                  <h3 class="font-semibold text-text mb-4 flex items-center gap-2">
                    <Calendar :size="18" class="text-primary" />
                    周期设置
                  </h3>
                  
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-text mb-2">选择周期</label>
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        v-for="option in cycleOptions"
                        :key="option.value"
                        @click="cycleType = option.value as ToleranceCycleType"
                        :class="[
                          'p-3 rounded-xl border-2 transition-all text-left',
                          cycleType === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        ]"
                      >
                        <div class="font-medium text-text">{{ option.label }}</div>
                        <div class="text-xs text-text-muted mt-0.5">{{ option.desc }}</div>
                      </button>
                    </div>
                  </div>

                  <div v-if="cycleType === 'custom'" class="mb-4">
                    <label class="block text-sm font-medium text-text mb-2">自定义天数</label>
                    <input
                      v-model.number="customDays"
                      type="number"
                      min="7"
                      max="60"
                      class="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text"
                      placeholder="7-60天"
                    />
                    <p class="text-xs text-text-muted mt-1">建议7-60天</p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text mb-2">开始日期</label>
                    <input
                      v-model="startDate"
                      type="date"
                      class="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-text"
                    />
                  </div>
                </div>

                <div class="bg-bg-soft rounded-xl p-5">
                  <h3 class="font-semibold text-text mb-4 flex items-center gap-2">
                    <Droplets :size="18" class="text-amber-500" />
                    初始使用设置
                  </h3>
                  
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-text mb-2">初始使用频率</label>
                    <div class="space-y-2">
                      <button
                        v-for="option in frequencyOptions"
                        :key="option.value"
                        @click="initialFrequency = option.value as ToleranceFrequencyType"
                        :class="[
                          'w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between',
                          initialFrequency === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        ]"
                      >
                        <div class="flex items-center gap-3">
                          <Clock :size="16" class="text-text-muted" />
                          <div class="text-left">
                            <div class="font-medium text-text">{{ option.label }}</div>
                            <div class="text-xs text-text-muted">{{ option.desc }}</div>
                          </div>
                        </div>
                        <CheckCircle2
                          v-if="initialFrequency === option.value"
                          :size="18"
                          class="text-primary"
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text mb-2">
                      初始滴数: <span class="text-primary font-bold">{{ initialDrops }}</span> 滴
                    </label>
                    <input
                      v-model.number="initialDrops"
                      type="range"
                      min="1"
                      max="10"
                      class="w-full h-2 bg-bg rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div class="flex justify-between text-xs text-text-muted mt-1">
                      <span>1滴</span>
                      <span>10滴</span>
                    </div>
                  </div>
                </div>

                <div class="bg-bg-soft rounded-xl p-5">
                  <h3 class="font-semibold text-text mb-4 flex items-center gap-2">
                    <Shield :size="18" class="text-blue-500" />
                    皮肤敏感度
                  </h3>
                  
                  <div class="mb-2">
                    <label class="block text-sm font-medium text-text mb-2">
                      敏感度等级: <span class="text-blue-600 font-bold">{{ skinSensitivityLevel }}</span>
                    </label>
                    <input
                      v-model.number="skinSensitivityLevel"
                      type="range"
                      min="1"
                      max="3"
                      class="w-full h-2 bg-bg rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <div class="flex justify-between text-xs text-text-muted">
                    <span>1 - 耐受肌</span>
                    <span>2 - 敏感肌</span>
                    <span>3 - 高敏肌</span>
                  </div>
                </div>
              </div>

              <div class="space-y-6">
                <div class="bg-bg-soft rounded-xl p-5">
                  <h3 class="font-semibold text-text mb-4 flex items-center gap-2">
                    <Eye :size="18" class="text-purple-500" />
                    观察指标
                  </h3>
                  
                  <div class="mb-4">
                    <p class="text-sm text-text-soft mb-3">选择需要重点观察的皮肤反应</p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="indicator in availableIndicators"
                        :key="indicator"
                        @click="toggleIndicator(indicator)"
                        :class="[
                          'px-3 py-1.5 rounded-lg text-sm transition-all',
                          observationIndicators.includes(indicator)
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-bg border border-border text-text-soft hover:border-purple-300'
                        ]"
                      >
                        {{ indicator }}
                      </button>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <input
                      v-model="newIndicator"
                      type="text"
                      placeholder="自定义观察指标"
                      class="flex-1 px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-text"
                      @keyup.enter="addCustomIndicator"
                    />
                    <button
                      @click="addCustomIndicator"
                      class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
                    >
                      添加
                    </button>
                  </div>

                  <div v-if="observationIndicators.length > 0" class="mt-4">
                    <p class="text-xs text-text-muted mb-2">已选择的指标:</p>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="indicator in observationIndicators"
                        :key="indicator"
                        class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm"
                      >
                        {{ indicator }}
                        <button
                          @click="removeIndicator(indicator)"
                          class="ml-1 hover:text-purple-900"
                        >
                          <X :size="14" />
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="bg-bg-soft rounded-xl p-5">
                  <h3 class="font-semibold text-text mb-4 flex items-center gap-2">
                    <Target :size="18" class="text-emerald-500" />
                    备注信息
                  </h3>
                  <textarea
                    v-model="notes"
                    rows="4"
                    placeholder="添加备注信息，如特殊注意事项、过敏史等..."
                    class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="step === 'preview' && previewConfig" class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div v-if="previewConfig.riskWarnings && previewConfig.riskWarnings.length > 0" class="mb-6">
              <div
                v-for="(warning, idx) in previewConfig.riskWarnings"
                :key="idx"
                :class="[
                  'p-4 rounded-xl mb-2 flex items-start gap-3',
                  warning.level === 'danger' ? 'bg-red-50 border border-red-200' :
                  warning.level === 'warning' ? 'bg-amber-50 border border-amber-200' :
                  'bg-blue-50 border border-blue-200'
                ]"
              >
                <AlertTriangle
                  :size="20"
                  :class="[
                    'flex-shrink-0 mt-0.5',
                    warning.level === 'danger' ? 'text-red-500' :
                    warning.level === 'warning' ? 'text-amber-500' :
                    'text-blue-500'
                  ]"
                />
                <div>
                  <div
                    :class="[
                      'text-sm font-medium',
                      warning.level === 'danger' ? 'text-red-800' :
                      warning.level === 'warning' ? 'text-amber-800' :
                      'text-blue-800'
                    ]"
                  >
                    {{ warning.message }}
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div class="bg-bg-soft rounded-xl p-5">
                <h3 class="font-semibold text-text mb-3">计划概览</h3>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-text-soft">计划名称</span>
                    <span class="font-medium text-text">{{ previewConfig.name }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-text-soft">周期</span>
                    <span class="font-medium text-text">{{ getCycleLabel(previewConfig.cycleType) }} ({{ previewConfig.totalDays }}天)</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-text-soft">开始日期</span>
                    <span class="font-medium text-text">{{ formatDate(previewConfig.startDate) }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-text-soft">结束日期</span>
                    <span class="font-medium text-text">{{ formatDate(previewConfig.endDate) }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-text-soft">初始频率</span>
                    <span class="font-medium text-text">{{ getFrequencyLabel(previewConfig.initialFrequency) }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-text-soft">初始剂量</span>
                    <span class="font-medium text-text">{{ previewConfig.initialDrops }} 滴</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-text-soft">风险等级</span>
                    <span
                      :class="[
                        'px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getRiskLevelColor(previewConfig.insights?.riskLevel || 'low')
                      ]"
                    >
                      {{ getRiskLevelText(previewConfig.insights?.riskLevel || 'low') }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="bg-bg-soft rounded-xl p-5">
                <h3 class="font-semibold text-text mb-3">智能建议</h3>
                <div class="space-y-2">
                  <div
                    v-for="(rec, idx) in previewConfig.insights?.recommendations"
                    :key="idx"
                    class="flex items-start gap-2 text-sm text-text-soft"
                  >
                    <Sparkles :size="14" class="text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{{ rec }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-bg-soft rounded-xl p-5">
              <h3 class="font-semibold text-text mb-4">分阶段安排</h3>
              <div class="space-y-3">
                <div
                  v-for="phase in previewConfig.phases"
                  :key="phase.phaseNumber"
                  :class="[
                    'p-4 rounded-xl border-2',
                    getPhaseStatusColor(phase)
                  ]"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center font-bold">
                        {{ phase.phaseNumber }}
                      </div>
                      <div>
                        <div class="font-semibold">{{ phase.name }}</div>
                        <div class="text-xs opacity-80">{{ phase.description }}</div>
                      </div>
                    </div>
                    <span class="text-xs px-2 py-1 rounded-full bg-white/50">
                      {{ getPhaseStatusText(phase) }}
                    </span>
                  </div>
                  <div class="text-sm space-y-1">
                    <div class="flex items-center gap-4">
                      <span class="flex items-center gap-1">
                        <Calendar :size="12" />
                        {{ formatDate(phase.startDate) }} - {{ formatDate(phase.endDate) }}
                      </span>
                      <span class="flex items-center gap-1">
                        <Clock :size="12" />
                        {{ getFrequencyLabel(phase.frequency) }}
                      </span>
                      <span class="flex items-center gap-1">
                        <Droplets :size="12" />
                        {{ phase.drops }} 滴
                      </span>
                    </div>
                    <div class="mt-2">
                      <div class="text-xs font-medium mb-1">阶段目标:</div>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="(goal, gIdx) in phase.goals.slice(0, 4)"
                          :key="gIdx"
                          class="text-xs px-2 py-0.5 bg-white/50 rounded"
                        >
                          {{ goal }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between p-6 border-t border-border bg-bg-card">
            <div v-if="step === 'preview'">
              <button
                @click="goBack"
                class="px-5 py-2.5 text-text-soft hover:text-text transition-colors"
              >
                ← 返回修改
              </button>
            </div>
            <div v-else class="flex-1"></div>
            
            <div class="flex items-center gap-3">
              <button
                @click="close"
                class="px-5 py-2.5 text-text-soft hover:text-text transition-colors"
              >
                取消
              </button>
              <button
                v-if="step === 'config'"
                @click="loadPreview"
                :disabled="!canProceed || loadingPreview"
                class="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <Loader2 v-if="loadingPreview" :size="16" class="animate-spin" />
                <span>{{ loadingPreview ? '生成中...' : '生成计划' }}</span>
                <ChevronRight :size="16" />
              </button>
              <button
                v-else
                @click="createPlan"
                :disabled="creating"
                class="px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <Loader2 v-if="creating" :size="16" class="animate-spin" />
                <span>{{ creating ? '创建中...' : '确认创建' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
