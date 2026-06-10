import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tolerance as toleranceApi } from '@/api'
import type {
  TolerancePlan,
  TolerancePlanCreateInput,
  TolerancePlanUpdateInput,
  TolerancePlanConfigPreview,
  ToleranceDailyFeedback,
  ToleranceDailyFeedbackInput,
  ToleranceDailyFeedbackResponse,
  ToleranceInterruption,
  ToleranceInterruptionInput,
  ToleranceResumeInput,
  PhaseEvaluation,
  PhaseProceedInput,
  FinalEvaluationResult,
  ToleranceStatsSummary,
  ToleranceSourceType,
  TolerancePlanStatus,
  TolerancePlanPhase,
} from '@/types'

export const useToleranceStore = defineStore('tolerance', () => {
  const list = ref<TolerancePlan[]>([])
  const currentPlan = ref<TolerancePlan | null>(null)
  const previewConfig = ref<TolerancePlanConfigPreview | null>(null)
  const stats = ref<ToleranceStatsSummary | null>(null)
  const loading = ref(false)

  const fetchList = async (params?: {
    sourceType?: ToleranceSourceType
    sourceId?: number
    status?: TolerancePlanStatus
  }) => {
    loading.value = true
    try {
      const data = await toleranceApi.getList(params)
      list.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const fetchDetail = async (id: number) => {
    loading.value = true
    try {
      const data = await toleranceApi.getDetail(id)
      currentPlan.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const fetchPreview = async (params: {
    sourceType: ToleranceSourceType
    sourceId: number
    cycleType?: string
    customDays?: number
    startDate?: string
    initialFrequency?: string
    initialDrops?: number
    skinSensitivityLevel?: number
  }) => {
    loading.value = true
    try {
      const data = await toleranceApi.getPreview(params)
      previewConfig.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const create = async (data: TolerancePlanCreateInput) => {
    loading.value = true
    try {
      const plan = await toleranceApi.create(data)
      list.value.unshift(plan)
      return plan
    } finally {
      loading.value = false
    }
  }

  const update = async (id: number, data: TolerancePlanUpdateInput) => {
    loading.value = true
    try {
      const plan = await toleranceApi.update(id, data)
      const index = list.value.findIndex(p => p.id === id)
      if (index !== -1) {
        list.value[index] = plan
      }
      if (currentPlan.value?.id === id) {
        currentPlan.value = plan
      }
      return plan
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: number) => {
    loading.value = true
    try {
      await toleranceApi.remove(id)
      list.value = list.value.filter(p => p.id !== id)
      if (currentPlan.value?.id === id) {
        currentPlan.value = null
      }
    } finally {
      loading.value = false
    }
  }

  const submitFeedback = async (planId: number, data: ToleranceDailyFeedbackInput) => {
    loading.value = true
    try {
      const result = await toleranceApi.submitFeedback(planId, data)
      if (currentPlan.value?.id === planId) {
        if (!currentPlan.value.feedbacks) {
          currentPlan.value.feedbacks = []
        }
        const existingIndex = currentPlan.value.feedbacks.findIndex(
          f => f.feedbackDate === data.feedbackDate && f.phaseId === data.phaseId
        )
        if (existingIndex !== -1) {
          currentPlan.value.feedbacks[existingIndex] = result.data
        } else {
          currentPlan.value.feedbacks.unshift(result.data)
        }
        currentPlan.value.progressPercent = result.progressPercent
      }
      return result
    } finally {
      loading.value = false
    }
  }

  const evaluatePhase = async (planId: number, phaseId: number) => {
    loading.value = true
    try {
      return await toleranceApi.evaluatePhase(planId, phaseId)
    } finally {
      loading.value = false
    }
  }

  const proceedPhase = async (planId: number, phaseId: number, data: PhaseProceedInput = {}) => {
    loading.value = true
    try {
      const result = await toleranceApi.proceedPhase(planId, phaseId, data)
      if (currentPlan.value?.id === planId && currentPlan.value.phases) {
        const phaseIndex = currentPlan.value.phases.findIndex(p => p.id === phaseId)
        if (phaseIndex !== -1 && result.phase) {
          currentPlan.value.phases[phaseIndex] = result.phase
        }
        if (result.nextPhase) {
          const nextPhaseIndex = currentPlan.value.phases.findIndex(p => p.id === result.nextPhase?.id)
          if (nextPhaseIndex !== -1) {
            currentPlan.value.phases[nextPhaseIndex] = result.nextPhase
          }
        }
        if (result.completed) {
          currentPlan.value.currentPhase = currentPlan.value.currentPhase + 1
        }
      }
      return result
    } finally {
      loading.value = false
    }
  }

  const interrupt = async (id: number, data: ToleranceInterruptionInput) => {
    loading.value = true
    try {
      const result = await toleranceApi.interrupt(id, data)
      if (currentPlan.value?.id === id) {
        currentPlan.value.status = data.severity === 'severe' ? 'failed' : 'interrupted'
        if (!currentPlan.value.interruptions) {
          currentPlan.value.interruptions = []
        }
        currentPlan.value.interruptions.unshift(result)
      }
      const planIndex = list.value.findIndex(p => p.id === id)
      if (planIndex !== -1) {
        list.value[planIndex].status = data.severity === 'severe' ? 'failed' : 'interrupted'
      }
      return result
    } finally {
      loading.value = false
    }
  }

  const resume = async (id: number, data: ToleranceResumeInput = {}) => {
    loading.value = true
    try {
      const resumeData = {
        resumeDate: new Date().toISOString().split('T')[0],
        ...data
      }
      const result = await toleranceApi.resume(id, resumeData)
      if (currentPlan.value?.id === id) {
        currentPlan.value.status = 'active'
      }
      const planIndex = list.value.findIndex(p => p.id === id)
      if (planIndex !== -1) {
        list.value[planIndex].status = 'active'
      }
      return result
    } finally {
      loading.value = false
    }
  }

  const evaluate = async (id: number) => {
    loading.value = true
    try {
      const result = await toleranceApi.evaluate(id)
      if (currentPlan.value?.id === id) {
        currentPlan.value.adaptationConclusion = result.conclusion
        currentPlan.value.recommendation = result.recommendation
        currentPlan.value.status = 'completed'
      }
      return result
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async () => {
    loading.value = true
    try {
      const data = await toleranceApi.getStats()
      stats.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const getPhaseById = (planId: number, phaseId: number): TolerancePlanPhase | undefined => {
    if (currentPlan.value?.id === planId && currentPlan.value.phases) {
      return currentPlan.value.phases.find(p => p.id === phaseId)
    }
    return undefined
  }

  const getFeedbackForDate = (planId: number, phaseId: number, date: string): ToleranceDailyFeedback | undefined => {
    if (currentPlan.value?.id === planId && currentPlan.value.feedbacks) {
      return currentPlan.value.feedbacks.find(
        f => f.phaseId === phaseId && f.feedbackDate === date
      )
    }
    return undefined
  }

  const activePlans = computed(() => {
    return list.value.filter(p => p.status === 'active')
  })

  const completedPlans = computed(() => {
    return list.value.filter(p => p.status === 'completed')
  })

  const interruptedPlans = computed(() => {
    return list.value.filter(p => p.status === 'interrupted' || p.status === 'failed')
  })

  const plansBySource = computed(() => {
    return {
      formula: list.value.filter(p => p.sourceType === 'formula'),
      ingredient: list.value.filter(p => p.sourceType === 'ingredient'),
    }
  })

  return {
    list,
    plans: list,
    currentPlan,
    previewConfig,
    stats,
    loading,
    activePlans,
    completedPlans,
    interruptedPlans,
    plansBySource,
    fetchList,
    fetchDetail,
    fetchPreview,
    create,
    update,
    remove,
    submitFeedback,
    evaluatePhase,
    proceedPhase,
    interrupt,
    resume,
    evaluate,
    fetchStats,
    getPhaseById,
    getFeedbackForDate,
  }
})
