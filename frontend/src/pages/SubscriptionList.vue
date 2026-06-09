<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Gift,
  Calendar,
  User,
  MapPin,
  Filter,
  ChevronDown,
  Pause,
  Play,
  XCircle,
  ChevronRight,
  Package,
  Flame,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import SubscriptionCreateModal from '@/components/Subscription/SubscriptionCreateModal.vue'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import type { SubscriptionPlan, SubscriptionStatus } from '@/types'
import { cn } from '@/lib/utils'

const router = useRouter()
const subscriptionsStore = useSubscriptionsStore()

const showCreateModal = ref(false)
const showFilterDropdown = ref(false)
const currentFilter = ref<SubscriptionStatus | 'all'>('all')

const statusFilters: Array<{ value: SubscriptionStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部订阅' },
  { value: 'active', label: '进行中' },
  { value: 'paused', label: '已暂停' },
  { value: 'cancelled', label: '已取消' },
  { value: 'completed', label: '已完成' },
]

const filteredSubscriptions = computed(() => {
  if (currentFilter.value === 'all') {
    return subscriptionsStore.list
  }
  return subscriptionsStore.list.filter(s => s.status === currentFilter.value)
})

const statusConfig: Record<SubscriptionStatus, { label: string; class: string }> = {
  active: { label: '进行中', class: 'bg-emerald-100 text-emerald-700' },
  paused: { label: '已暂停', class: 'bg-amber-100 text-amber-700' },
  cancelled: { label: '已取消', class: 'bg-red-100 text-red-700' },
  completed: { label: '已完成', class: 'bg-stone-100 text-stone-700' },
}

const cycleLabels: Record<string, string> = {
  weekly: '每周',
  biweekly: '每两周',
  monthly: '每月',
}

const sceneLabels: Record<string, string> = {
  home: '🏠 居家自用',
  office: '💼 办公空间',
  gift: '🎁 送礼佳品',
  spa: '💆 SPA疗愈',
  hotel: '🏨 酒店民宿',
  yoga: '🧘 瑜伽冥想',
}

const currentFilterLabel = computed(() => {
  return statusFilters.find(f => f.value === currentFilter.value)?.label || '全部订阅'
})

const selectFilter = (value: SubscriptionStatus | 'all') => {
  currentFilter.value = value
  showFilterDropdown.value = false
}

const viewDetail = (id: number) => {
  router.push(`/subscriptions/${id}`)
}

const handlePause = async (e: Event, id: number) => {
  e.stopPropagation()
  try {
    await subscriptionsStore.pause(id)
  } catch (error) {
    console.error('暂停订阅失败:', error)
  }
}

const handleResume = async (e: Event, id: number) => {
  e.stopPropagation()
  try {
    await subscriptionsStore.resume(id)
  } catch (error) {
    console.error('恢复订阅失败:', error)
  }
}

const handleCancel = async (e: Event, id: number) => {
  e.stopPropagation()
  if (!confirm('确定要取消这个订阅计划吗？')) return
  try {
    await subscriptionsStore.cancel(id)
  } catch (error) {
    console.error('取消订阅失败:', error)
  }
}

const handleCreateSuccess = () => {
  subscriptionsStore.fetchList()
}

onMounted(() => {
  subscriptionsStore.fetchList()
})
</script>

<template>
  <div class="min-h-screen bg-stone-50">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-stone-800 flex items-center gap-3">
            <Gift class="text-violet-500" :size="28" />
            订阅管理
          </h1>
          <p class="text-stone-500 mt-1">管理您的香薰蜡烛订阅计划</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-200"
        >
          <Plus :size="20" />
          新建订阅
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div class="text-3xl font-bold text-violet-600">{{ subscriptionsStore.stats.total }}</div>
          <div class="text-sm text-stone-500 mt-1">全部订阅</div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div class="text-3xl font-bold text-emerald-600">{{ subscriptionsStore.stats.active }}</div>
          <div class="text-sm text-stone-500 mt-1">进行中</div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div class="text-3xl font-bold text-amber-600">{{ subscriptionsStore.stats.totalDeliveries }}</div>
          <div class="text-sm text-stone-500 mt-1">累计配送</div>
        </div>
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div class="text-3xl font-bold text-rose-600">¥{{ subscriptionsStore.stats.totalBudget.toFixed(0) }}</div>
          <div class="text-sm text-stone-500 mt-1">在途预算</div>
        </div>
      </div>

      <div class="flex items-center justify-between mb-6">
        <div class="relative">
          <button
            @click="showFilterDropdown = !showFilterDropdown"
            class="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
          >
            <Filter :size="16" class="text-stone-500" />
            <span class="text-sm text-stone-700">{{ currentFilterLabel }}</span>
            <ChevronDown :size="16" class="text-stone-400" />
          </button>
          <div
            v-if="showFilterDropdown"
            class="absolute top-full left-0 mt-2 w-40 bg-white border border-stone-200 rounded-xl shadow-lg z-10 overflow-hidden"
          >
            <button
              v-for="filter in statusFilters"
              :key="filter.value"
              @click="selectFilter(filter.value)"
              :class="[
                'w-full px-4 py-2.5 text-left text-sm transition-colors',
                currentFilter === filter.value
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-stone-700 hover:bg-stone-50'
              ]"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
        <div class="text-sm text-stone-500">
          共 {{ filteredSubscriptions.length }} 条订阅
        </div>
      </div>

      <div v-if="subscriptionsStore.loading" class="flex justify-center py-16">
        <LoadingSpinner />
      </div>

      <div v-else-if="filteredSubscriptions.length === 0" class="py-16">
        <EmptyState
          title="暂无订阅计划"
          description="点击右上角按钮创建您的第一个香薰蜡烛订阅计划"
          icon="Gift"
        />
      </div>

      <div v-else class="grid gap-4">
        <div
          v-for="subscription in filteredSubscriptions"
          :key="subscription.id"
          @click="viewDetail(subscription.id)"
          class="bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        >
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <Gift :size="28" class="text-violet-500" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-semibold text-stone-800">{{ subscription.plan_name }}</h3>
                    <span
                      :class="['px-2.5 py-0.5 text-xs font-medium rounded-full', statusConfig[subscription.status].class]"
                    >
                      {{ statusConfig[subscription.status].label }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 mt-2 text-sm text-stone-500">
                    <span class="flex items-center gap-1">
                      <User :size="14" />
                      {{ subscription.recipient_name }}
                    </span>
                    <span class="flex items-center gap-1">
                      <MapPin :size="14" />
                      {{ subscription.recipient_address.slice(0, 20) }}...
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="subscription.status === 'active'"
                  @click="(e) => handlePause(e, subscription.id)"
                  class="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                  title="暂停订阅"
                >
                  <Pause :size="18" class="text-amber-500" />
                </button>
                <button
                  v-if="subscription.status === 'paused'"
                  @click="(e) => handleResume(e, subscription.id)"
                  class="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="恢复订阅"
                >
                  <Play :size="18" class="text-emerald-500" />
                </button>
                <button
                  v-if="subscription.status === 'active' || subscription.status === 'paused'"
                  @click="(e) => handleCancel(e, subscription.id)"
                  class="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="取消订阅"
                >
                  <XCircle :size="18" class="text-red-500" />
                </button>
                <ChevronRight :size="20" class="text-stone-300" />
              </div>
            </div>

            <div class="grid grid-cols-4 gap-4 pt-4 border-t border-stone-100">
              <div>
                <div class="text-xs text-stone-500 mb-1">配送周期</div>
                <div class="font-medium text-stone-700">{{ cycleLabels[subscription.delivery_cycle] || subscription.delivery_cycle }}</div>
              </div>
              <div>
                <div class="text-xs text-stone-500 mb-1">每期预算</div>
                <div class="font-medium text-violet-600">¥{{ subscription.budget_limit }}</div>
              </div>
              <div>
                <div class="text-xs text-stone-500 mb-1">使用场景</div>
                <div class="font-medium text-stone-700">{{ sceneLabels[subscription.delivery_scene] || subscription.delivery_scene }}</div>
              </div>
              <div>
                <div class="text-xs text-stone-500 mb-1">累计配送</div>
                <div class="font-medium text-stone-700 flex items-center gap-1">
                  <Package :size="14" />
                  {{ subscription.total_deliveries }} 次
                </div>
              </div>
            </div>

            <div v-if="subscription.next_delivery_date && subscription.status === 'active'" class="mt-4 pt-4 border-t border-stone-100">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-stone-600">
                  <Calendar :size="16" class="text-violet-500" />
                  下期配送：{{ subscription.next_delivery_date }}
                </div>
                <div class="flex items-center gap-1 text-sm text-stone-500">
                  <Flame :size="14" />
                  每次 {{ subscription.candles_per_delivery }} 支
                </div>
              </div>
            </div>

            <div v-if="subscription.preferred_aromas && subscription.preferred_aromas.length > 0" class="mt-4">
              <div class="text-xs text-stone-500 mb-2">偏好香调</div>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="aroma in subscription.preferred_aromas.slice(0, 5)"
                  :key="aroma"
                  class="px-2.5 py-1 text-xs bg-violet-50 text-violet-700 rounded-full"
                >
                  {{ aroma }}
                </span>
                <span
                  v-if="subscription.preferred_aromas.length > 5"
                  class="px-2.5 py-1 text-xs bg-stone-100 text-stone-600 rounded-full"
                >
                  +{{ subscription.preferred_aromas.length - 5 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SubscriptionCreateModal
      v-model:visible="showCreateModal"
      @success="handleCreateSuccess"
    />
  </div>
</template>
