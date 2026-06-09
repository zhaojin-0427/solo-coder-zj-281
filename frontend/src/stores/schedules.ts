import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { schedules as schedulesApi } from '@/api'
import type {
  Schedule,
  ScheduleCreateInput,
  ScheduleUpdateInput,
  ScheduleCompletion,
  ScheduleCompletionInput,
  TodayReminders,
  RiskWarningsResponse,
  CalendarDay,
  ScheduleSourceType,
} from '@/types'

export const useSchedulesStore = defineStore('schedules', () => {
  const list = ref<Schedule[]>([])
  const todayReminders = ref<TodayReminders | null>(null)
  const riskWarnings = ref<RiskWarningsResponse | null>(null)
  const calendarData = ref<CalendarDay[]>([])
  const loading = ref(false)

  const fetchList = async (params?: {
    sourceType?: ScheduleSourceType
    formulaId?: number
    subscriptionId?: number
    status?: string
  }) => {
    loading.value = true
    try {
      const data = await schedulesApi.getList(params)
      list.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const fetchDetail = async (id: number) => {
    loading.value = true
    try {
      return await schedulesApi.getDetail(id)
    } finally {
      loading.value = false
    }
  }

  const create = async (data: ScheduleCreateInput) => {
    loading.value = true
    try {
      const schedule = await schedulesApi.create(data)
      list.value.unshift(schedule)
      return schedule
    } finally {
      loading.value = false
    }
  }

  const update = async (id: number, data: ScheduleUpdateInput) => {
    loading.value = true
    try {
      const schedule = await schedulesApi.update(id, data)
      const index = list.value.findIndex(s => s.id === id)
      if (index !== -1) {
        list.value[index] = schedule
      }
      return schedule
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: number) => {
    loading.value = true
    try {
      await schedulesApi.remove(id)
      list.value = list.value.filter(s => s.id !== id)
    } finally {
      loading.value = false
    }
  }

  const fetchTodayReminders = async () => {
    loading.value = true
    try {
      const data = await schedulesApi.getTodayReminders()
      todayReminders.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const fetchRiskWarnings = async () => {
    loading.value = true
    try {
      const data = await schedulesApi.getRiskWarnings()
      riskWarnings.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const fetchCalendar = async (params?: {
    startDate?: string
    endDate?: string
    sourceType?: ScheduleSourceType
    formulaId?: number
    subscriptionId?: number
  }) => {
    loading.value = true
    try {
      const data = await schedulesApi.getCalendar(params)
      calendarData.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const fetchNext30Days = async (params?: {
    sourceType?: ScheduleSourceType
    formulaId?: number
    subscriptionId?: number
  }) => {
    loading.value = true
    try {
      const data = await schedulesApi.getNext30Days(params)
      calendarData.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const complete = async (id: number, data: ScheduleCompletionInput) => {
    loading.value = true
    try {
      const result = await schedulesApi.complete(id, data)
      if (todayReminders.value) {
        const reminder = todayReminders.value.reminders.find(r => r.id === id)
        if (reminder) {
          reminder.isCompleted = true
          reminder.completion = result
          todayReminders.value.completed++
          todayReminders.value.pending--
        }
      }
      return result
    } finally {
      loading.value = false
    }
  }

  const cancelComplete = async (id: number, scheduledDate?: string) => {
    loading.value = true
    try {
      await schedulesApi.cancelComplete(id, scheduledDate)
      if (todayReminders.value) {
        const reminder = todayReminders.value.reminders.find(r => r.id === id)
        if (reminder) {
          reminder.isCompleted = false
          reminder.completion = undefined
          todayReminders.value.completed--
          todayReminders.value.pending++
        }
      }
    } finally {
      loading.value = false
    }
  }

  const filterByFormula = (formulaId: number | null) => {
    if (!formulaId) return list.value
    return list.value.filter(s => s.formulaId === formulaId)
  }

  const filterBySubscription = (subscriptionId: number | null) => {
    if (!subscriptionId) return list.value
    return list.value.filter(s => s.subscriptionId === subscriptionId)
  }

  const activeSchedules = computed(() => {
    return list.value.filter(s => s.status === 'active')
  })

  const stats = computed(() => {
    const schedules = list.value
    const todayPending = todayReminders.value?.pending || 0
    const todayCompleted = todayReminders.value?.completed || 0
    const riskCount = riskWarnings.value?.total || 0
    return {
      total: schedules.length,
      active: schedules.filter(s => s.status === 'active').length,
      paused: schedules.filter(s => s.status === 'paused').length,
      completed: schedules.filter(s => s.status === 'completed').length,
      totalPending: todayPending,
      pendingToday: todayPending,
      completedToday: todayCompleted,
      riskCount: riskCount,
      bySource: {
        formula: schedules.filter(s => s.sourceType === 'formula').length,
        record: schedules.filter(s => s.sourceType === 'record').length,
        subscription: schedules.filter(s => s.sourceType === 'subscription').length,
      }
    }
  })

  return {
    list,
    todayReminders,
    riskWarnings,
    calendarData,
    loading,
    activeSchedules,
    stats,
    fetchList,
    fetchDetail,
    create,
    update,
    remove,
    fetchTodayReminders,
    fetchRiskWarnings,
    fetchCalendar,
    fetchNext30Days,
    complete,
    cancelComplete,
    filterByFormula,
    filterBySubscription,
  }
})
