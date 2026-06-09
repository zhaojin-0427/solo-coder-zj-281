import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { subscriptions as subscriptionsApi, candles as candlesApi } from '@/api'
import type {
  SubscriptionPlan,
  SubscriptionPlanCreateInput,
  SubscriptionPlanUpdateInput,
  SubscriptionWithDeliveries,
  DeliveryPlan,
  Candle,
  SubscriptionStatus,
  DeliveryInfo,
} from '@/types'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const list = ref<SubscriptionPlan[]>([])
  const candles = ref<Candle[]>([])
  const currentSubscription = ref<SubscriptionWithDeliveries | null>(null)
  const currentDeliveryPlan = ref<DeliveryPlan | null>(null)
  const loading = ref(false)
  const candlesLoading = ref(false)

  const fetchList = async (status?: SubscriptionStatus) => {
    loading.value = true
    try {
      const data = await subscriptionsApi.getList(status)
      list.value = data
    } finally {
      loading.value = false
    }
  }

  const fetchCandles = async () => {
    candlesLoading.value = true
    try {
      const data = await candlesApi.getList()
      candles.value = data
    } finally {
      candlesLoading.value = false
    }
  }

  const fetchDetail = async (id: number) => {
    loading.value = true
    try {
      const data = await subscriptionsApi.getDetail(id)
      currentSubscription.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const create = async (data: SubscriptionPlanCreateInput) => {
    loading.value = true
    try {
      const subscription = await subscriptionsApi.create(data)
      list.value.unshift(subscription)
      return subscription
    } finally {
      loading.value = false
    }
  }

  const update = async (id: number, data: SubscriptionPlanUpdateInput) => {
    loading.value = true
    try {
      const subscription = await subscriptionsApi.update(id, data)
      const index = list.value.findIndex(s => s.id === id)
      if (index !== -1) {
        list.value[index] = subscription
      }
      if (currentSubscription.value?.id === id) {
        currentSubscription.value = { ...currentSubscription.value, ...subscription }
      }
      return subscription
    } finally {
      loading.value = false
    }
  }

  const pause = async (id: number) => {
    loading.value = true
    try {
      const subscription = await subscriptionsApi.pause(id)
      const index = list.value.findIndex(s => s.id === id)
      if (index !== -1) {
        list.value[index] = subscription
      }
      if (currentSubscription.value?.id === id) {
        currentSubscription.value = { ...currentSubscription.value, ...subscription }
      }
      return subscription
    } finally {
      loading.value = false
    }
  }

  const resume = async (id: number) => {
    loading.value = true
    try {
      const subscription = await subscriptionsApi.resume(id)
      const index = list.value.findIndex(s => s.id === id)
      if (index !== -1) {
        list.value[index] = subscription
      }
      if (currentSubscription.value?.id === id) {
        currentSubscription.value = { ...currentSubscription.value, ...subscription }
      }
      return subscription
    } finally {
      loading.value = false
    }
  }

  const cancel = async (id: number) => {
    loading.value = true
    try {
      const subscription = await subscriptionsApi.cancel(id)
      const index = list.value.findIndex(s => s.id === id)
      if (index !== -1) {
        list.value[index] = subscription
      }
      if (currentSubscription.value?.id === id) {
        currentSubscription.value = { ...currentSubscription.value, ...subscription }
      }
      return subscription
    } finally {
      loading.value = false
    }
  }

  const generatePlan = async (id: number) => {
    loading.value = true
    try {
      const plan = await subscriptionsApi.generatePlan(id)
      currentDeliveryPlan.value = plan
      return plan
    } finally {
      loading.value = false
    }
  }

  const confirmDelivery = async (id: number) => {
    loading.value = true
    try {
      const delivery = await subscriptionsApi.confirmDelivery(id)
      if (currentSubscription.value?.id === id) {
        const updated = await subscriptionsApi.getDetail(id)
        currentSubscription.value = updated
      }
      return delivery
    } finally {
      loading.value = false
    }
  }

  const getHistory = async (id: number) => {
    loading.value = true
    try {
      const history = await subscriptionsApi.getHistory(id)
      return history
    } finally {
      loading.value = false
    }
  }

  const stats = computed(() => {
    const active = list.value.filter(s => s.status === 'active')
    const paused = list.value.filter(s => s.status === 'paused')
    const cancelled = list.value.filter(s => s.status === 'cancelled')
    const totalDeliveries = list.value.reduce((sum, s) => sum + s.totalDeliveries || 0, 0)
    const totalBudget = active.reduce((sum, s) => sum + s.budgetLimit || 0, 0)

    return {
      total: list.value.length,
      active: active.length,
      paused: paused.length,
      cancelled: cancelled.length,
      totalDeliveries,
      totalBudget,
    }
  })

  const activeSubscriptions = computed(() =>
    list.value.filter(s => s.status === 'active')
  )

  return {
    list,
    candles,
    currentSubscription,
    currentDeliveryPlan,
    loading,
    candlesLoading,
    stats,
    activeSubscriptions,
    fetchList,
    fetchCandles,
    fetchDetail,
    create,
    update,
    pause,
    resume,
    cancel,
    generatePlan,
    confirmDelivery,
    getHistory,
  }
})
