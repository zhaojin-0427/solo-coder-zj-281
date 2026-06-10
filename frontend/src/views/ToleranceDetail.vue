<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Droplets,
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  XCircle,
  Edit3,
  Trash2,
  Plus,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  AlertOctagon,
  FileText,
  TrendingUp,
  Target,
  Zap
} from 'lucide-vue-next'
import { useToleranceStore } from '@/stores/tolerance'
import ToleranceDailyFeedbackModal from '@/components/Tolerance/ToleranceDailyFeedbackModal.vue'
import type {
  TolerancePlan,
  TolerancePlanPhase,
  ToleranceDailyFeedback,
  ToleranceInterruption,
  AdaptationLevel
} from '@/types'

const route = useRoute()
const router = useRouter()
const toleranceStore = useToleranceStore()

const loading = ref(true)
const showFeedbackModal = ref(false)
const selectedPhase = ref<TolerancePlanPhase | null>(null)
const showDeleteConfirm = ref(false)
const showInterruptConfirm = ref(false)
const showResumeConfirm = ref(false)
const interruptReason = ref('')
const interruptSeverity = ref<'mild' | 'moderate' | 'severe'>('mild')

const plan = computed(() => toleranceStore.currentPlan)
const phases = computed(() => toleranceStore.currentPlan?.phases || [])
const feedbacks = computed(() => toleranceStore.currentPlan?.feedbacks || [])
const interruptions = computed(() => toleranceStore.currentPlan?.interruptions || [])
const finalResult = computed(() => toleranceStore.currentPlan?.finalResult)

const activePhase = computed(() => phases.value.find(p => p.status === 'in_progress'))
const completedPhases = computed(() => phases.value.filter(p => p.status === 'completed' || p.status === 'extended'))

const frequencyOptions = [
  { value: 'every_two_days', label: '每2日1次' },
  { value: 'every_other_day', label: '隔日1次' },
  { value: 'daily', label: '每日1次' },
  { value: 'twice_daily', label: '每日2次' }
]

const cycleOptions = [
  { value: '7days', label: '7天' },
  { value: '14days', label: '14天' },
  { value: 'custom', label: '自定义' }
]

const getFrequencyLabel = (value: string) => {
  return frequencyOptions.find(f => f.value === value)?.label || value
}

const getCycleLabel = (value: string) => {
  return cycleOptions.find(c => c.value === value)?.label || value
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { text: string; color: string; bg: string; icon: any }> = {
    active: { text: '进行中', color: 'text-blue-600', bg: 'bg-blue-50', icon: PlayCircle },
    paused: { text: '已暂停', color: 'text-amber-600', bg: 'bg-amber-50', icon: PauseCircle },
    completed: { text: '已完成', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
    interrupted: { text: '已中断', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
    failed: { text: '失败', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle }
  }
  return configs[status] || configs.active
}

const getPhaseStatusConfig = (status: string) => {
  const configs: Record<string, { text: string; color: string; dotColor: string }> = {
    pending: { text: '待开始', color: 'text-text-muted', dotColor: 'bg-gray-300' },
    in_progress: { text: '进行中', color: 'text-blue-600', dotColor: 'bg-blue-500' },
    completed: { text: '已完成', color: 'text-emerald-600', dotColor: 'bg-emerald-500' },
    extended: { text: '已延长', color: 'text-purple-600', dotColor: 'bg-purple-500' },
    interrupted: { text: '已中断', color: 'text-orange-600', dotColor: 'bg-orange-500' }
  }
  return configs[status] || configs.pending
}

const getAdaptationLevelConfig = (level: AdaptationLevel | undefined) => {
  if (!level) return { text: '未评估', color: 'text-text-muted', icon: AlertTriangle }
  const configs: Record<AdaptationLevel, { text: string; color: string; icon: any }> = {
    not_adapted: { text: '未耐受', color: 'text-red-600', icon: ThumbsDown },
    poorly_adapted: { text: '耐受性差', color: 'text-orange-600', icon: ThumbsDown },
    needs_more_data: { text: '需更多数据', color: 'text-amber-600', icon: AlertTriangle },
    moderately_adapted: { text: '中度耐受', color: 'text-blue-600', icon: ThumbsUp },
    well_adapted: { text: '完全耐受', color: 'text-emerald-600', icon: ThumbsUp }
  }
  return configs[level]
}

const getInterruptionSeverityConfig = (severity: string) => {
  const configs: Record<string, { text: string; color: string; bg: string }> = {
    mild: { text: '轻度', color: 'text-amber-700', bg: 'bg-amber-100' },
    moderate: { text: '中度', color: 'text-orange-700', bg: 'bg-orange-100' },
    severe: { text: '重度', color: 'text-red-700', bg: 'bg-red-100' }
  }
  return configs[severity] || configs.mild
}

const fetchDetail = async () => {
  const id = route.params.id as string
  if (!id) return
  
  loading.value = true
  try {
    await toleranceStore.fetchDetail(Number(id))
  } catch (error) {
    console.error('获取计划详情失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDetail()
})

const openFeedback = (phase: TolerancePlanPhase) => {
  selectedPhase.value = phase
  showFeedbackModal.value = true
}

const handleFeedbackSuccess = () => {
  fetchDetail()
}

const handleInterrupt = async () => {
  if (!plan.value?.id || !interruptReason.value.trim()) return
  
  try {
    await toleranceStore.interrupt(plan.value.id, {
      reason: interruptReason.value,
      severity: interruptSeverity.value,
      interruptionDate: new Date().toISOString().split('T')[0],
      actions: ['暂停使用', '观察皮肤状态']
    })
    showInterruptConfirm.value = false
    interruptReason.value = ''
    interruptSeverity.value = 'mild'
    fetchDetail()
  } catch (error) {
    console.error('中断计划失败:', error)
  }
}

const handleResume = async () => {
  if (!plan.value?.id) return
  
  try {
    await toleranceStore.resume(plan.value.id)
    showResumeConfirm.value = false
    fetchDetail()
  } catch (error) {
    console.error('恢复计划失败:', error)
  }
}

const handleDelete = async () => {
  if (!plan.value?.id) return
  
  try {
    await toleranceStore.remove(plan.value.id)
    router.push('/tolerance')
  } catch (error) {
    console.error('删除计划失败:', error)
  }
}

const handleProceedPhase = async (phase: TolerancePlanPhase) => {
  if (!plan.value?.id) return
  
  try {
    await toleranceStore.proceedPhase(plan.value.id, phase.id!)
    fetchDetail()
  } catch (error) {
    console.error('推进阶段失败:', error)
  }
}

const handleEvaluatePhase = async (phase: TolerancePlanPhase) => {
  if (!plan.value?.id) return
  
  try {
    await toleranceStore.evaluatePhase(plan.value.id, phase.id!)
    fetchDetail()
  } catch (error) {
    console.error('评估阶段失败:', error)
  }
}

const handleFinalEvaluate = async () => {
  if (!plan.value?.id) return
  
  try {
    await toleranceStore.evaluate(plan.value.id)
    fetchDetail()
  } catch (error) {
    console.error('最终评估失败:', error)
  }
}

const goBack = () => {
  router.push('/tolerance')
}

const getFeedbackForPhase = (phaseId: number | undefined) => {
  if (!phaseId) return []
  return feedbacks.value.filter(f => f.phaseId === phaseId)
}
</script>

<template>
  <div class="min-h-screen bg-bg">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <Loader2 :size="32" class="animate-spin text-primary" />
    </div>

    <template v-else-if="plan">
      <div class="sticky top-0 z-40 bg-bg/80 backdrop-blur-lg border-b border-border">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <button
              @click="goBack"
              class="flex items-center gap-2 text-text-soft hover:text-text transition-colors"
            >
              <ArrowLeft :size="18" />
              <span>返回列表</span>
            </button>
            <div class="flex items-center gap-2">
              <button
                v-if="plan.status === 'active'"
                @click="showInterruptConfirm = true"
                class="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
              >
                <Pause :size="18" />
              </button>
              <button
                v-if="plan.status === 'paused' || plan.status === 'interrupted'"
                @click="showResumeConfirm = true"
                class="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600"
              >
                <Play :size="18" />
              </button>
              <button
                @click="showDeleteConfirm = true"
                class="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-bg-card rounded-2xl border border-border p-6 mb-6">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div class="flex items-start gap-4">
              <div
                :class="[
                  'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0',
                  plan.sourceType === 'formula' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-purple-400 to-violet-500'
                ]"
              >
                <Droplets :size="32" class="text-white" />
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      plan.sourceType === 'formula' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                    ]"
                  >
                    {{ plan.sourceType === 'formula' ? '配方' : '成分' }}
                  </span>
                  <span class="text-text-muted text-sm">{{ plan.sourceName }}</span>
                </div>
                <h1 class="text-2xl font-bold text-text mb-1">{{ plan.name }}</h1>
                <div class="flex items-center gap-3">
                  <div :class="['flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', getStatusConfig(plan.status).bg, getStatusConfig(plan.status).color]">
                    <component :is="getStatusConfig(plan.status).icon" :size="12" />
                    <span>{{ getStatusConfig(plan.status).text }}</span>
                  </div>
                  <span class="text-text-muted text-sm">{{ getCycleLabel(plan.cycleType) }} · {{ plan.totalDays }}天</span>
                </div>
              </div>
            </div>

            <div class="text-right">
              <p class="text-text-soft text-sm mb-1">总体进度</p>
              <p class="text-3xl font-bold text-text">{{ plan.progressPercent || 0 }}%</p>
            </div>
          </div>

          <div class="w-full h-3 bg-bg-soft rounded-full overflow-hidden mb-6">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="[
                plan.status === 'completed' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                plan.status === 'failed' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                plan.status === 'interrupted' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                'bg-gradient-to-r from-primary to-violet-500'
              ]"
              :style="{ width: `${plan.progressPercent || 0}%` }"
            ></div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-bg-soft rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <Calendar :size="16" class="text-text-muted" />
                <span class="text-text-soft text-sm">开始日期</span>
              </div>
              <p class="font-medium text-text">{{ formatDate(plan.startDate) }}</p>
            </div>
            <div class="bg-bg-soft rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <Clock :size="16" class="text-text-muted" />
                <span class="text-text-soft text-sm">使用频率</span>
              </div>
              <p class="font-medium text-text">{{ getFrequencyLabel(plan.initialFrequency) }}</p>
            </div>
            <div class="bg-bg-soft rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <Droplets :size="16" class="text-text-muted" />
                <span class="text-text-soft text-sm">初始滴数</span>
              </div>
              <p class="font-medium text-text">{{ plan.initialDrops }} 滴</p>
            </div>
            <div class="bg-bg-soft rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <Shield :size="16" class="text-text-muted" />
                <span class="text-text-soft text-sm">皮肤敏感度</span>
              </div>
              <p class="font-medium text-text">等级 {{ plan.skinSensitivityLevel }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-bg-card rounded-2xl border border-border p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-text flex items-center gap-2">
                  <Target :size="20" class="text-primary" />
                  分阶段计划
                </h2>
                <span class="text-sm text-text-muted">
                  共 {{ phases.length }} 个阶段
                </span>
              </div>

              <div class="relative">
                <div class="absolute left-[21px] top-8 bottom-4 w-0.5 bg-border" />
                
                <div v-for="(phase, index) in phases" :key="phase.id" class="relative pl-14 pb-6 last:pb-0">
                  <div
                    :class="[
                      'absolute left-0 w-11 h-11 rounded-full flex items-center justify-center border-4 border-bg-card z-10',
                      phase.status === 'completed' || phase.status === 'extended' ? 'bg-emerald-500' :
                      phase.status === 'in_progress' ? 'bg-primary' :
                      phase.status === 'interrupted' ? 'bg-orange-500' :
                      'bg-gray-300'
                    ]"
                  >
                    <span class="text-white font-bold text-sm">{{ index + 1 }}</span>
                  </div>

                  <div
                    :class="[
                      'rounded-xl border p-4 transition-all',
                      phase.status === 'in_progress' ? 'border-primary/50 bg-primary/5' : 'border-border bg-bg'
                    ]"
                  >
                    <div class="flex items-start justify-between mb-3">
                      <div>
                        <h3 class="font-semibold text-text flex items-center gap-2">
                          {{ phase.name }}
                          <span
                            :class="[
                              'w-2 h-2 rounded-full',
                              getPhaseStatusConfig(phase.status).dotColor
                            ]"
                          ></span>
                          <span :class="['text-xs font-medium', getPhaseStatusConfig(phase.status).color]">
                            {{ getPhaseStatusConfig(phase.status).text }}
                          </span>
                          <span v-if="phase.extendedDays" class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            已延长 {{ phase.extendedDays }} 天
                          </span>
                        </h3>
                        <p class="text-sm text-text-muted mt-1">
                          {{ phase.durationDays }} 天 · {{ formatDate(phase.startDate) }} - {{ formatDate(phase.endDate) }}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-lg font-bold text-text">{{ phase.drops }} <span class="text-sm font-normal text-text-muted">滴</span></p>
                        <p class="text-xs text-text-muted">{{ getFrequencyLabel(phase.frequency) }}</p>
                      </div>
                    </div>

                    <div v-if="phase.description" class="text-sm text-text-soft mb-3">
                      {{ phase.description }}
                    </div>

                    <div v-if="phase.phaseGoal" class="bg-bg-soft rounded-lg p-3 mb-3">
                      <p class="text-xs font-medium text-text-soft mb-1">阶段目标</p>
                      <p class="text-sm text-text">{{ phase.phaseGoal }}</p>
                    </div>

                    <div v-if="phase.pauseConditions && phase.pauseConditions.length > 0" class="mb-3">
                      <p class="text-xs font-medium text-text-soft mb-1">暂停条件</p>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="(condition, idx) in phase.pauseConditions"
                          :key="idx"
                          class="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full"
                        >
                          {{ condition }}
                        </span>
                      </div>
                    </div>

                    <div v-if="phase.completionCriteria" class="bg-emerald-50 rounded-lg p-3 mb-3">
                      <p class="text-xs font-medium text-emerald-700 mb-1">完成条件</p>
                      <p class="text-sm text-emerald-900">{{ phase.completionCriteria }}</p>
                    </div>

                    <div v-if="phase.status === 'completed' && phase.evaluationResult" class="bg-blue-50 rounded-lg p-3 mb-3">
                      <p class="text-xs font-medium text-blue-700 mb-1">阶段评估</p>
                      <p class="text-sm text-blue-900">{{ phase.evaluationResult }}</p>
                    </div>

                    <div class="flex items-center justify-between pt-3 border-t border-border">
                      <div class="text-sm text-text-muted">
                        已反馈 {{ getFeedbackForPhase(phase.id).length }} 天
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          v-if="phase.status === 'in_progress'"
                          @click="openFeedback(phase)"
                          class="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                        >
                          <Plus :size="14" />
                          <span>今日反馈</span>
                        </button>
                        <button
                          v-if="phase.status === 'completed' && !phase.evaluationResult"
                          @click="handleEvaluatePhase(phase)"
                          class="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          评估阶段
                        </button>
                        <button
                          v-if="phase.status === 'completed' && phase.evaluationResult && index < phases.length - 1 && phases[index + 1].status === 'pending'"
                          @click="handleProceedPhase(phase)"
                          class="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
                        >
                          <ChevronRight :size="14" />
                          <span>进入下一阶段</span>
                        </button>
                      </div>
                    </div>

                    <div v-if="getFeedbackForPhase(phase.id).length > 0" class="mt-3 pt-3 border-t border-border">
                      <p class="text-xs font-medium text-text-soft mb-2">最近反馈</p>
                      <div class="space-y-2">
                        <div
                          v-for="fb in getFeedbackForPhase(phase.id).slice(-3).reverse()"
                          :key="fb.id"
                          class="bg-bg rounded-lg p-3"
                        >
                          <div class="flex items-center justify-between mb-1">
                            <span class="text-xs text-text-muted">{{ fb.feedbackDate }}</span>
                            <span v-if="fb.used" class="text-xs text-emerald-600 font-medium">已使用 {{ fb.actualDrops }} 滴</span>
                            <span v-else class="text-xs text-amber-600 font-medium">未使用</span>
                          </div>
                          <div v-if="fb.reactions && fb.reactions.length > 0" class="flex flex-wrap gap-1 mb-1">
                            <span
                              v-for="(r, idx) in fb.reactions"
                              :key="idx"
                              :class="[
                                'px-1.5 py-0.5 text-xs rounded',
                                (typeof r === 'string' ? r === '无不适' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600' : 'bg-red-50 text-red-600')
                              ]"
                            >
                              {{ typeof r === 'string' ? r : r.type }}
                            </span>
                          </div>
                          <p v-if="fb.skinCondition" class="text-sm text-text-soft">{{ fb.skinCondition }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="plan.status === 'active' && phases.every(p => p.status === 'completed')" class="mt-4 pt-4 border-t border-border">
                <button
                  @click="handleFinalEvaluate"
                  class="w-full py-3 bg-gradient-to-r from-primary to-violet-500 text-white rounded-xl hover:from-primary/90 hover:to-violet-500/90 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <Zap :size="18" />
                  <span>生成最终评估报告</span>
                </button>
              </div>
            </div>

            <div v-if="interruptions.length > 0" class="bg-bg-card rounded-2xl border border-border p-6">
              <h2 class="text-lg font-semibold text-text flex items-center gap-2 mb-4">
                <AlertOctagon :size="20" class="text-amber-500" />
                中断记录
              </h2>
              <div class="space-y-3">
                <div
                  v-for="interruption in interruptions"
                  :key="interruption.id"
                  class="bg-bg-soft rounded-xl p-4"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <span
                        :class="[
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          getInterruptionSeverityConfig(interruption.severity).bg,
                          getInterruptionSeverityConfig(interruption.severity).color
                        ]"
                      >
                        {{ getInterruptionSeverityConfig(interruption.severity).text }}
                      </span>
                      <span class="text-xs text-text-muted ml-2">
                        {{ formatDate(interruption.startDate || interruption.interruptionDate) }}
                        <template v-if="interruption.endDate || interruption.resumedAt">
                          - {{ formatDate(interruption.endDate || interruption.resumedAt) }}
                        </template>
                      </span>
                    </div>
                    <span
                      v-if="interruption.endDate || interruption.resumedAt"
                      class="text-xs text-emerald-600 font-medium"
                    >
                      已恢复
                    </span>
                    <span v-else class="text-xs text-amber-600 font-medium">
                      中断中
                    </span>
                  </div>
                  <p class="text-sm text-text mb-2">{{ interruption.reason }}</p>
                  <div v-if="interruption.actions && interruption.actions.length > 0">
                    <p class="text-xs text-text-muted mb-1">处理措施:</p>
                    <ul class="text-sm text-text-soft">
                      <li v-for="(action, idx) in interruption.actions" :key="idx" class="flex items-center gap-1">
                        <span class="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                        {{ action }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div v-if="finalResult" class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
              <h2 class="text-lg font-semibold text-emerald-900 flex items-center gap-2 mb-4">
                <CheckCircle2 :size="20" class="text-emerald-600" />
                最终评估结果
              </h2>
              
              <div class="mb-4">
                <p class="text-sm text-emerald-800 mb-2">适应等级</p>
                <div class="flex items-center gap-2">
                  <component
                    :is="getAdaptationLevelConfig(finalResult.adaptationLevel).icon"
                    :size="24"
                    :class="getAdaptationLevelConfig(finalResult.adaptationLevel).color"
                  />
                  <span
                    :class="[
                      'text-xl font-bold',
                      getAdaptationLevelConfig(finalResult.adaptationLevel).color
                    ]"
                  >
                    {{ getAdaptationLevelConfig(finalResult.adaptationLevel).text }}
                  </span>
                </div>
              </div>

              <div class="mb-4">
                <p class="text-sm text-emerald-800 mb-2">最大耐受剂量</p>
                <p class="text-2xl font-bold text-emerald-900">{{ finalResult.maxToleratedDrops }} 滴</p>
              </div>

              <div v-if="finalResult.recommendedFrequency" class="mb-4">
                <p class="text-sm text-emerald-800 mb-2">推荐使用频率</p>
                <p class="text-lg font-semibold text-emerald-900">{{ getFrequencyLabel(finalResult.recommendedFrequency) }}</p>
              </div>

              <div v-if="finalResult.summary" class="mb-4">
                <p class="text-sm text-emerald-800 mb-2">评估总结</p>
                <p class="text-sm text-emerald-700">{{ finalResult.summary }}</p>
              </div>

              <div v-if="finalResult.suggestions && finalResult.suggestions.length > 0">
                <p class="text-sm text-emerald-800 mb-2">后续建议</p>
                <ul class="space-y-1">
                  <li
                    v-for="(suggestion, idx) in finalResult.suggestions"
                    :key="idx"
                    class="flex items-start gap-2 text-sm text-emerald-700"
                  >
                    <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0" />
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="bg-bg-card rounded-2xl border border-border p-6">
              <h2 class="text-lg font-semibold text-text flex items-center gap-2 mb-4">
                <TrendingUp :size="20" class="text-primary" />
                计划统计
              </h2>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-text-soft">计划总天数</span>
                  <span class="font-semibold text-text">{{ plan.totalDays }} 天</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-text-soft">已执行天数</span>
                  <span class="font-semibold text-text">{{ plan.currentDay || 0 }} 天</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-text-soft">阶段数</span>
                  <span class="font-semibold text-text">{{ plan.totalPhases }} / {{ plan.completedPhases }} 完成</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-text-soft">反馈次数</span>
                  <span class="font-semibold text-text">{{ feedbacks.length }} 次</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-text-soft">中断次数</span>
                  <span class="font-semibold text-text">{{ interruptions.length }} 次</span>
                </div>
              </div>
            </div>

            <div v-if="plan.observationMetrics && plan.observationMetrics.length > 0" class="bg-bg-card rounded-2xl border border-border p-6">
              <h2 class="text-lg font-semibold text-text flex items-center gap-2 mb-4">
                <FileText :size="20" class="text-primary" />
                观察指标
              </h2>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="metric in plan.observationMetrics"
                  :key="metric"
                  class="px-3 py-1.5 bg-bg-soft text-text-soft text-sm rounded-lg"
                >
                  {{ metric }}
                </span>
              </div>
            </div>

            <div v-if="plan.notes" class="bg-bg-card rounded-2xl border border-border p-6">
              <h2 class="text-lg font-semibold text-text flex items-center gap-2 mb-3">
                <Edit3 :size="20" class="text-primary" />
                备注
              </h2>
              <p class="text-text-soft text-sm">{{ plan.notes }}</p>
            </div>

            <div v-if="plan.riskWarnings && plan.riskWarnings.length > 0" class="bg-red-50 rounded-2xl border border-red-200 p-6">
              <h2 class="text-lg font-semibold text-red-900 flex items-center gap-2 mb-3">
                <AlertTriangle :size="20" class="text-red-600" />
                风险提示
              </h2>
              <ul class="space-y-2">
                <li
                  v-for="(warning, idx) in plan.riskWarnings"
                  :key="idx"
                  class="flex items-start gap-2 text-sm text-red-700"
                >
                  <span class="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                  {{ warning }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ToleranceDailyFeedbackModal
        v-model:visible="showFeedbackModal"
        :plan="plan"
        :phase="selectedPhase"
        @success="handleFeedbackSuccess"
      />

      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showDeleteConfirm = false" />
            <div class="relative bg-bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 :size="32" class="text-red-600" />
              </div>
              <h3 class="text-xl font-bold text-text text-center mb-2">确认删除</h3>
              <p class="text-text-soft text-center mb-6">
                删除后将无法恢复该耐受计划及其所有数据，确定要删除吗？
              </p>
              <div class="flex gap-3">
                <button
                  @click="showDeleteConfirm = false"
                  class="flex-1 py-2.5 border border-border rounded-xl text-text-soft hover:bg-bg-soft transition-colors"
                >
                  取消
                </button>
                <button
                  @click="handleDelete"
                  class="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  删除计划
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showInterruptConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showInterruptConfirm = false" />
            <div class="relative bg-bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
              <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pause :size="32" class="text-amber-600" />
              </div>
              <h3 class="text-xl font-bold text-text text-center mb-2">中断计划</h3>
              <p class="text-text-soft text-center mb-4">
                请说明中断原因，以便记录和后续恢复
              </p>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-text mb-2">中断原因</label>
                <textarea
                  v-model="interruptReason"
                  rows="3"
                  placeholder="请描述中断原因，如皮肤出现严重刺激、身体不适等..."
                  class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                ></textarea>
              </div>

              <div class="mb-6">
                <label class="block text-sm font-medium text-text mb-2">严重程度</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    @click="interruptSeverity = 'mild'"
                    :class="[
                      'py-2 rounded-lg text-sm font-medium transition-all',
                      interruptSeverity === 'mild'
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-400'
                        : 'bg-bg border border-border text-text-soft'
                    ]"
                  >
                    轻度
                  </button>
                  <button
                    @click="interruptSeverity = 'moderate'"
                    :class="[
                      'py-2 rounded-lg text-sm font-medium transition-all',
                      interruptSeverity === 'moderate'
                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-400'
                        : 'bg-bg border border-border text-text-soft'
                    ]"
                  >
                    中度
                  </button>
                  <button
                    @click="interruptSeverity = 'severe'"
                    :class="[
                      'py-2 rounded-lg text-sm font-medium transition-all',
                      interruptSeverity === 'severe'
                        ? 'bg-red-100 text-red-700 border-2 border-red-400'
                        : 'bg-bg border border-border text-text-soft'
                    ]"
                  >
                    重度
                  </button>
                </div>
              </div>

              <div class="flex gap-3">
                <button
                  @click="showInterruptConfirm = false"
                  class="flex-1 py-2.5 border border-border rounded-xl text-text-soft hover:bg-bg-soft transition-colors"
                >
                  取消
                </button>
                <button
                  @click="handleInterrupt"
                  :disabled="!interruptReason.trim()"
                  class="flex-1 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  确认中断
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showResumeConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showResumeConfirm = false" />
            <div class="relative bg-bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
              <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw :size="32" class="text-emerald-600" />
              </div>
              <h3 class="text-xl font-bold text-text text-center mb-2">恢复计划</h3>
              <p class="text-text-soft text-center mb-6">
                恢复后将从中断的位置继续执行计划，请确保皮肤状态已稳定
              </p>
              <div class="flex gap-3">
                <button
                  @click="showResumeConfirm = false"
                  class="flex-1 py-2.5 border border-border rounded-xl text-text-soft hover:bg-bg-soft transition-colors"
                >
                  取消
                </button>
                <button
                  @click="handleResume"
                  class="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  确认恢复
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
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
