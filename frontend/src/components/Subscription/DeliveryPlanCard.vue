<script setup lang="ts">
import {
  Calendar,
  Package,
  Clock,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  Gift,
  Flame,
  ChevronRight,
} from 'lucide-vue-next'
import type { DeliveryPlan, ConflictWarning, ReplacementInfo, RestockPredictionItem } from '@/types'

const props = defineProps<{
  plan: DeliveryPlan
  showActions?: boolean
}>()

const emit = defineEmits<{
  'confirm': []
  'refresh': []
}>()

const getAromaFamilyColor = (family: string) => {
  const colors: Record<string, string> = {
    floral: 'bg-pink-100 text-pink-700',
    citrus: 'bg-yellow-100 text-yellow-700',
    woody: 'bg-amber-100 text-amber-700',
    herbal: 'bg-green-100 text-green-700',
    fresh: 'bg-cyan-100 text-cyan-700',
    gourmand: 'bg-orange-100 text-orange-700',
    oriental: 'bg-purple-100 text-purple-700',
    spicy: 'bg-red-100 text-red-700',
  }
  return colors[family] || 'bg-stone-100 text-stone-700'
}

const getAromaFamilyLabel = (family: string) => {
  const labels: Record<string, string> = {
    floral: '花香调',
    citrus: '柑橘调',
    woody: '木质调',
    herbal: '草本调',
    fresh: '清新调',
    gourmand: '美食调',
    oriental: '东方调',
    spicy: '辛辣调',
  }
  return labels[family] || family
}

const getMatchScoreColor = (score: number) => {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-stone-500'
}

const getMatchScoreLabel = (score: number) => {
  if (score >= 70) return '高度匹配'
  if (score >= 40) return '中度匹配'
  return '一般匹配'
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-violet-500 text-white flex items-center justify-center">
            <Gift :size="24" />
          </div>
          <div>
            <h3 class="font-bold text-stone-800">{{ plan.planName }}</h3>
            <p class="text-sm text-stone-500">第 {{ plan.deliveryNumber }} 期配送方案</p>
          </div>
        </div>
        <button
          v-if="showActions"
          @click="emit('refresh')"
          class="p-2 hover:bg-violet-100 rounded-xl transition-colors"
          title="重新生成方案"
        >
          <RefreshCw :size="20" class="text-violet-600" />
        </button>
      </div>
    </div>

    <div class="p-6 space-y-6">
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-stone-50 rounded-xl p-4 text-center">
          <Calendar :size="20" class="mx-auto text-violet-500 mb-2" />
          <div class="text-xs text-stone-500 mb-1">预计配送</div>
          <div class="font-semibold text-stone-800">{{ plan.scheduledDate }}</div>
        </div>
        <div class="bg-stone-50 rounded-xl p-4 text-center">
          <Package :size="20" class="mx-auto text-violet-500 mb-2" />
          <div class="text-xs text-stone-500 mb-1">蜡烛数量</div>
          <div class="font-semibold text-stone-800">{{ plan.candleCount }} 个</div>
        </div>
        <div class="bg-stone-50 rounded-xl p-4 text-center">
          <Flame :size="20" class="mx-auto text-violet-500 mb-2" />
          <div class="text-xs text-stone-500 mb-1">预计使用</div>
          <div class="font-semibold text-stone-800">{{ plan.estimatedBurnDays }} 天</div>
        </div>
      </div>

      <div
        v-if="plan.specialDate"
        class="bg-rose-50 rounded-xl p-4 border border-rose-200"
      >
        <div class="flex items-start gap-3">
          <Gift :size="20" class="text-rose-500 mt-0.5 flex-shrink-0" />
          <div>
            <div class="font-medium text-rose-800">
              {{ plan.specialDate.type === 'birthday' ? '生日提醒' : plan.specialDate.type === 'festival' ? '节日提醒' : '纪念日提醒' }}
              - {{ plan.specialDate.date }}
            </div>
            <p class="text-sm text-rose-600 mt-1">{{ plan.specialDate.note || '请注意礼品包装和祝福卡' }}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 class="font-medium text-stone-800 mb-3">本期礼盒内容</h4>
        <div class="space-y-3">
          <div
            v-for="candle in plan.candles"
            :key="candle.id"
            class="bg-gradient-to-r from-stone-50 to-white rounded-xl p-4 border border-stone-100"
          >
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                <Flame :size="24" class="text-violet-500" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h5 class="font-medium text-stone-800">{{ candle.name }}</h5>
                  <span
                    v-if="candle.isReplacement"
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full"
                  >
                    <RefreshCw :size="12" />
                    替代款
                  </span>
                </div>
                <p class="text-xs text-stone-500 mt-0.5">{{ candle.englishName }}</p>
                <p class="text-sm text-stone-600 mt-1 line-clamp-1">{{ candle.description }}</p>
                <div class="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    :class="['px-2 py-0.5 text-xs rounded-full', getAromaFamilyColor(candle.aromaFamily)]"
                  >
                    {{ getAromaFamilyLabel(candle.aromaFamily) }}
                  </span>
                  <span
                    v-for="note in candle.scentNotes.slice(0, 3)"
                    :key="note"
                    class="px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded-full"
                  >
                    {{ note }}
                  </span>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-lg font-bold text-violet-600">¥{{ candle.price.toFixed(0) }}</div>
                <div class="flex items-center justify-end gap-1 mt-1">
                  <span :class="['text-xs font-medium', getMatchScoreColor(candle.matchScore)]">
                    {{ getMatchScoreLabel(candle.matchScore) }}
                  </span>
                  <ChevronRight :size="14" class="text-stone-300" />
                </div>
                <div class="text-xs text-stone-400 mt-0.5">
                  <Clock :size="12" class="inline mr-1" />
                  {{ candle.burnTimeHours }}h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between bg-violet-50 rounded-xl p-4">
        <span class="text-stone-700">礼盒总价</span>
        <span class="text-2xl font-bold text-violet-600">¥{{ plan.totalPrice.toFixed(2) }}</span>
      </div>

      <div v-if="plan.conflictWarnings.length > 0">
        <h4 class="font-medium text-stone-800 mb-3 flex items-center gap-2">
          <AlertTriangle :size="18" class="text-amber-500" />
          香调冲突提醒
        </h4>
        <div class="space-y-2">
          <div
            v-for="(warning, index) in plan.conflictWarnings"
            :key="index"
            class="bg-amber-50 rounded-xl p-4 border border-amber-200"
          >
            <p class="text-sm text-amber-700">{{ warning.message }}</p>
          </div>
        </div>
      </div>

      <div v-if="plan.replacements.length > 0">
        <h4 class="font-medium text-stone-800 mb-3 flex items-center gap-2">
          <RefreshCw :size="18" class="text-blue-500" />
          缺货替代说明
        </h4>
        <div class="space-y-2">
          <div
            v-for="(replacement, index) in plan.replacements"
            :key="index"
            class="bg-blue-50 rounded-xl p-4 border border-blue-200"
          >
            <p class="text-sm text-blue-700">
              <span class="font-medium">{{ replacement.original.name }}</span>
              <span class="mx-2">→</span>
              <span class="font-medium">{{ replacement.replacement.name }}</span>
              <span class="text-blue-600 ml-2">({{ replacement.reason }})</span>
            </p>
          </div>
        </div>
      </div>

      <div v-if="plan.restockPredictions.some(r => r.prediction.needsRestock)">
        <h4 class="font-medium text-stone-800 mb-3 flex items-center gap-2">
          <TrendingDown :size="18" class="text-orange-500" />
          补货预警
        </h4>
        <div class="space-y-2">
          <div
            v-for="(item, index) in plan.restockPredictions.filter(r => r.prediction.needsRestock)"
            :key="index"
            class="bg-orange-50 rounded-xl p-4 border border-orange-200"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm text-orange-700">
                <span class="font-medium">{{ item.candle }}</span> 库存紧张
              </p>
              <span class="text-xs text-orange-600">
                预计 {{ item.prediction.daysUntilEmpty }} 天后售罄
              </span>
            </div>
            <p class="text-xs text-orange-600 mt-1">
              建议补货数量：{{ item.prediction.recommendedOrderQuantity }} 个
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="plan.deliveryNotes"
        class="bg-stone-50 rounded-xl p-4 border border-stone-200"
      >
        <p class="text-sm text-stone-600">{{ plan.deliveryNotes }}</p>
      </div>

      <div v-if="showActions" class="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
        <div class="text-sm text-stone-500">
          下期预计配送：{{ plan.nextPredictedDelivery }}
        </div>
        <button
          @click="emit('confirm')"
          class="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
        >
          确认配送
        </button>
      </div>
    </div>
  </div>
</template>
