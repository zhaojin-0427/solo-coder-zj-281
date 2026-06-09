<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Gift,
  User,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  Package,
  Flame,
  Pause,
  Play,
  XCircle,
  RefreshCw,
  Check,
  History,
  Settings,
  Clock,
  Sparkles,
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue'
import DeliveryPlanCard from '@/components/Subscription/DeliveryPlanCard.vue'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import type { DeliveryInfo } from '@/types'

const route = useRoute()
const router = useRouter()
const subscriptionsStore = useSubscriptionsStore()

const activeTab = ref<'plan' | 'history'>('plan')
const generatingPlan = ref(false)
const confirmingDelivery = ref(false)

const subscriptionId = computed(() => Number(route.params.id))

const subscription = computed(() => subscriptionsStore.currentSubscription)
const deliveryPlan = computed(() => subscriptionsStore.currentDeliveryPlan)
const loading = computed(() => subscriptionsStore.loading)

const statusConfig: Record<string, { label: string; class: string }> = {
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

const deliveryStatusLabels: Record<string, { label: string; class: string }> = {
  pending: { label: '待生成', class: 'bg-stone-100 text-stone-600' },
  generated: { label: '已生成', class: 'bg-blue-100 text-blue-700' },
  shipped: { label: '已发货', class: 'bg-amber-100 text-amber-700' },
  delivered: { label: '已送达', class: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: '已取消', class: 'bg-red-100 text-red-700' },
}

const goBack = () => {
  router.push('/subscriptions')
}

const handlePause = async () => {
  if (!subscription.value) return
  try {
    await subscriptionsStore.pause(subscription.value.id)
  } catch (error) {
    console.error('暂停订阅失败:', error)
  }
}

const handleResume = async () => {
  if (!subscription.value) return
  try {
    await subscriptionsStore.resume(subscription.value.id)
  } catch (error) {
    console.error('恢复订阅失败:', error)
  }
}

const handleCancel = async () => {
  if (!subscription.value) return
  if (!confirm('确定要取消这个订阅计划吗？取消后无法恢复。')) return
  try {
    await subscriptionsStore.cancel(subscription.value.id)
  } catch (error) {
    console.error('取消订阅失败:', error)
  }
}

const generatePlan = async () => {
  if (!subscription.value) return
  generatingPlan.value = true
  try {
    await subscriptionsStore.generatePlan(subscription.value.id)
  } catch (error) {
    console.error('生成配送方案失败:', error)
  } finally {
    generatingPlan.value = false
  }
}

const confirmDelivery = async () => {
  if (!subscription.value || !deliveryPlan.value) return
  if (!confirm('确认要执行本期配送吗？确认后将扣减库存。')) return
  
  confirmingDelivery.value = true
  try {
    await subscriptionsStore.confirmDelivery(subscription.value.id)
    subscriptionsStore.currentDeliveryPlan = null
  } catch (error) {
    console.error('确认配送失败:', error)
  } finally {
    confirmingDelivery.value = false
  }
}

const handleRefreshPlan = () => {
  generatePlan()
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

onMounted(() => {
  if (subscriptionId.value) {
    subscriptionsStore.fetchDetail(subscriptionId.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-stone-50">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <button
        @click="goBack"
        class="flex items-center gap-2 text-stone-600 hover:text-stone-800 mb-6 transition-colors"
      >
        <ArrowLeft :size="20" />
        <span>返回订阅列表</span>
      </button>

      <div v-if="loading" class="flex justify-center py-16">
        <LoadingSpinner />
      </div>

      <div v-else-if="!subscription" class="text-center py-16">
        <p class="text-stone-500">订阅计划不存在</p>
      </div>

      <div v-else class="space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div class="px-6 py-5 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-4">
                <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Gift :size="32" class="text-white" />
                </div>
                <div>
                  <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-bold text-stone-800">{{ subscription.plan_name }}</h1>
                    <span
                      :class="['px-3 py-1 text-sm font-medium rounded-full', statusConfig[subscription.status].class]"
                    >
                      {{ statusConfig[subscription.status].label }}
                    </span>
                  </div>
                  <p class="text-stone-500 mt-2">
                    创建于 {{ formatDate(subscription.created_at) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="subscription.status === 'active'"
                  @click="handlePause"
                  class="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors"
                >
                  <Pause :size="18" />
                  <span>暂停</span>
                </button>
                <button
                  v-if="subscription.status === 'paused'"
                  @click="handleResume"
                  class="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors"
                >
                  <Play :size="18" />
                  <span>恢复</span>
                </button>
                <button
                  v-if="subscription.status === 'active' || subscription.status === 'paused'"
                  @click="handleCancel"
                  class="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors"
                >
                  <XCircle :size="18" />
                  <span>取消</span>
                </button>
              </div>
            </div>
          </div>

          <div class="p-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="flex items-center gap-2 text-sm text-stone-500 mb-1">
                  <User :size="14" />
                  <span>收件人</span>
                </div>
                <div class="font-medium text-stone-800">{{ subscription.recipient_name }}</div>
              </div>
              <div>
                <div class="flex items-center gap-2 text-sm text-stone-500 mb-1">
                  <Phone :size="14" />
                  <span>联系电话</span>
                </div>
                <div class="font-medium text-stone-800">{{ subscription.recipient_phone || '-' }}</div>
              </div>
              <div>
                <div class="flex items-center gap-2 text-sm text-stone-500 mb-1">
                  <MapPin :size="14" />
                  <span>收货地址</span>
                </div>
                <div class="font-medium text-stone-800 text-sm">{{ subscription.recipient_address }}</div>
              </div>
              <div>
                <div class="flex items-center gap-2 text-sm text-stone-500 mb-1">
                  <Calendar :size="14" />
                  <span>开始日期</span>
                </div>
                <div class="font-medium text-stone-800">{{ formatDate(subscription.start_date) }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-6 mt-6 pt-6 border-t border-stone-100">
              <div>
                <div class="text-sm text-stone-500 mb-1">配送周期</div>
                <div class="font-medium text-stone-800">{{ cycleLabels[subscription.delivery_cycle] }}</div>
              </div>
              <div>
                <div class="flex items-center gap-2 text-sm text-stone-500 mb-1">
                  <DollarSign :size="14" />
                  <span>每期预算</span>
                </div>
                <div class="font-bold text-violet-600 text-lg">¥{{ subscription.budget_limit }}</div>
              </div>
              <div>
                <div class="flex items-center gap-2 text-sm text-stone-500 mb-1">
                  <Flame :size="14" />
                  <span>每期数量</span>
                </div>
                <div class="font-medium text-stone-800">{{ subscription.candles_per_delivery }} 支</div>
              </div>
              <div>
                <div class="text-sm text-stone-500 mb-1">使用场景</div>
                <div class="font-medium text-stone-800">{{ sceneLabels[subscription.delivery_scene] }}</div>
              </div>
              <div>
                <div class="flex items-center gap-2 text-sm text-stone-500 mb-1">
                  <Package :size="14" />
                  <span>累计配送</span>
                </div>
                <div class="font-medium text-stone-800">{{ subscription.total_deliveries }} 次</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-stone-100">
              <div>
                <div class="flex items-center gap-2 text-sm text-stone-500 mb-2">
                  <Sparkles :size="14" />
                  <span>偏好香调</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="aroma in subscription.preferred_aromas"
                    :key="aroma"
                    class="px-2.5 py-1 text-xs bg-violet-100 text-violet-700 rounded-full"
                  >
                    {{ aroma }}
                  </span>
                  <span v-if="subscription.preferred_aromas.length === 0" class="text-sm text-stone-400">
                    未设置
                  </span>
                </div>
              </div>
              <div>
                <div class="flex items-center gap-2 text-sm text-red-500 mb-2">
                  <XCircle :size="14" />
                  <span>排斥香味</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="aroma in subscription.excluded_scents"
                    :key="aroma"
                    class="px-2.5 py-1 text-xs bg-red-100 text-red-700 rounded-full"
                  >
                    {{ aroma }}
                  </span>
                  <span v-if="subscription.excluded_scents.length === 0" class="text-sm text-stone-400">
                    无
                  </span>
                </div>
              </div>
            </div>

            <div v-if="subscription.special_dates && subscription.special_dates.length > 0" class="mt-6 pt-6 border-t border-stone-100">
              <div class="text-sm text-stone-500 mb-2">特殊日期提醒</div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  v-for="date in subscription.special_dates"
                  :key="date.date"
                  class="bg-rose-50 rounded-xl p-4 border border-rose-100"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ date.type === 'birthday' ? '🎂' : date.type === 'festival' ? '🎉' : '💝' }}</span>
                    <span class="font-medium text-rose-800">{{ date.date }}</span>
                  </div>
                  <p class="text-sm text-rose-600 mt-1">{{ date.note || (date.type === 'birthday' ? '生日' : date.type === 'festival' ? '节日' : '纪念日') }}</p>
                </div>
              </div>
            </div>

            <div v-if="subscription.user_notes" class="mt-6 pt-6 border-t border-stone-100">
              <div class="text-sm text-stone-500 mb-2">备注信息</div>
              <p class="text-stone-700">{{ subscription.user_notes }}</p>
            </div>
          </div>
        </div>

        <div class="flex border-b border-stone-200">
          <button
            @click="activeTab = 'plan'"
            :class="[
              'flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 -mb-px transition-colors',
              activeTab === 'plan'
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            ]"
          >
            <Gift :size="18" />
            配送方案
          </button>
          <button
            @click="activeTab = 'history'"
            :class="[
              'flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 -mb-px transition-colors',
              activeTab === 'history'
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            ]"
          >
            <History :size="18" />
            配送历史
          </button>
        </div>

        <div v-if="activeTab === 'plan'">
          <div v-if="subscription.status !== 'active'" class="bg-amber-50 rounded-xl p-6 border border-amber-200 text-center">
            <p class="text-amber-700">
              订阅当前为{{ statusConfig[subscription.status].label }}状态，无法生成配送方案。
            </p>
            <button
              v-if="subscription.status === 'paused'"
              @click="handleResume"
              class="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
            >
              恢复订阅
            </button>
          </div>

          <div v-else-if="deliveryPlan">
            <DeliveryPlanCard
              :plan="deliveryPlan"
              :show-actions="true"
              @confirm="confirmDelivery"
              @refresh="handleRefreshPlan"
            />
          </div>

          <div v-else class="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 text-center">
            <div class="w-20 h-20 mx-auto rounded-full bg-violet-100 flex items-center justify-center mb-4">
              <Gift :size="40" class="text-violet-500" />
            </div>
            <h3 class="text-lg font-medium text-stone-800 mb-2">暂无配送方案</h3>
            <p class="text-stone-500 mb-6">点击下方按钮智能生成下一期配送方案</p>
            <button
              @click="generatePlan"
              :disabled="generatingPlan"
              class="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw v-if="generatingPlan" :size="20" class="animate-spin" />
              <Sparkles v-else :size="20" />
              <span>{{ generatingPlan ? '生成中...' : '生成配送方案' }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="activeTab === 'history'">
          <div v-if="!subscription.deliveries || subscription.deliveries.length === 0" class="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 text-center">
            <div class="w-20 h-20 mx-auto rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <History :size="40" class="text-stone-400" />
            </div>
            <h3 class="text-lg font-medium text-stone-800 mb-2">暂无配送记录</h3>
            <p class="text-stone-500">完成第一期配送后，记录将显示在这里</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="delivery in subscription.deliveries"
              :key="delivery.id"
              class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
            >
              <div class="px-6 py-4 bg-stone-50 border-b border-stone-100">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Package :size="20" class="text-violet-600" />
                    </div>
                    <div>
                      <div class="font-medium text-stone-800">第 {{ delivery.delivery_number }} 期配送</div>
                      <div class="text-sm text-stone-500">{{ formatDate(delivery.scheduled_date) }}</div>
                    </div>
                  </div>
                  <span
                    :class="['px-3 py-1 text-sm font-medium rounded-full', deliveryStatusLabels[delivery.status].class]"
                  >
                    {{ deliveryStatusLabels[delivery.status].label }}
                  </span>
                </div>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div class="text-xs text-stone-500 mb-1">蜡烛数量</div>
                    <div class="font-medium text-stone-800">{{ delivery.candle_count }} 支</div>
                  </div>
                  <div>
                    <div class="text-xs text-stone-500 mb-1">礼盒总价</div>
                    <div class="font-medium text-violet-600">¥{{ delivery.total_price.toFixed(2) }}</div>
                  </div>
                  <div>
                    <div class="flex items-center gap-1 text-xs text-stone-500 mb-1">
                      <Clock :size="12" />
                      预计使用
                    </div>
                    <div class="font-medium text-stone-800">{{ delivery.estimated_burn_days }} 天</div>
                  </div>
                </div>
                <div>
                  <div class="text-xs text-stone-500 mb-2">礼盒内容</div>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="candle in delivery.candle_list"
                      :key="candle"
                      class="px-2.5 py-1 text-xs bg-stone-100 text-stone-700 rounded-full"
                    >
                      {{ candle }}
                    </span>
                  </div>
                </div>
                <div v-if="delivery.conflict_warnings && delivery.conflict_warnings.length > 0" class="mt-4">
                  <div class="text-xs text-amber-500 mb-2">香调冲突提醒</div>
                  <div class="space-y-2">
                    <div
                      v-for="(warning, index) in delivery.conflict_warnings"
                      :key="index"
                      class="text-xs text-amber-700 bg-amber-50 rounded-lg p-3"
                    >
                      {{ warning.message }}
                    </div>
                  </div>
                </div>
                <div v-if="delivery.out_of_stock_notes" class="mt-4">
                  <div class="text-xs text-blue-500 mb-2">缺货替代说明</div>
                  <p class="text-xs text-blue-700 bg-blue-50 rounded-lg p-3">{{ delivery.out_of_stock_notes }}</p>
                </div>
                <div v-if="delivery.delivery_notes" class="mt-4">
                  <div class="text-xs text-stone-500 mb-2">配送备注</div>
                  <p class="text-sm text-stone-700">{{ delivery.delivery_notes }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
