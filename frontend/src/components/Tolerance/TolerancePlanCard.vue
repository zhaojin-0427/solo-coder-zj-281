<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Calendar,
  Droplets,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  PlayCircle,
  ChevronRight
} from 'lucide-vue-next'
import type { TolerancePlan } from '@/types'

interface Props {
  plan: TolerancePlan
}

const props = defineProps<Props>()
const router = useRouter()

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

const getStatusConfig = computed(() => {
  const status = props.plan.status
  const configs: Record<string, { text: string; color: string; bg: string; icon: any }> = {
    active: { text: '进行中', color: 'text-blue-600', bg: 'bg-blue-50', icon: PlayCircle },
    paused: { text: '已暂停', color: 'text-amber-600', bg: 'bg-amber-50', icon: PauseCircle },
    completed: { text: '已完成', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
    interrupted: { text: '已中断', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
    failed: { text: '失败', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle }
  }
  return configs[status] || configs.active
})

const getSourceTypeLabel = computed(() => {
  return props.plan.sourceType === 'formula' ? '配方' : '成分'
})

const getSourceTypeColor = computed(() => {
  return props.plan.sourceType === 'formula' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
})

const progressPercent = computed(() => {
  return props.plan.progressPercent || 0
})

const goToDetail = () => {
  router.push(`/tolerance/${props.plan.id}`)
}
</script>

<template>
  <div
    class="bg-bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
    @click="goToDetail"
  >
    <div class="p-5">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div
            :class="[
              'w-12 h-12 rounded-xl flex items-center justify-center',
              plan.sourceType === 'formula' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-purple-400 to-violet-500'
            ]"
          >
            <Droplets :size="24" class="text-white" />
          </div>
          <div>
            <h3 class="font-semibold text-text line-clamp-1">{{ plan.name }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', getSourceTypeColor]">
                {{ getSourceTypeLabel }}
              </span>
              <span class="text-xs text-text-muted">{{ plan.sourceName }}</span>
            </div>
          </div>
        </div>
        <div :class="['flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', getStatusConfig.bg, getStatusConfig.color]">
          <component :is="getStatusConfig.icon" :size="12" />
          <span>{{ getStatusConfig.text }}</span>
        </div>
      </div>

      <div class="mb-4">
        <div class="flex items-center justify-between text-sm mb-1">
          <span class="text-text-soft">进度</span>
          <span class="font-medium text-text">{{ progressPercent }}%</span>
        </div>
        <div class="w-full h-2 bg-bg-soft rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="[
              plan.status === 'completed' ? 'bg-emerald-500' :
              plan.status === 'failed' ? 'bg-red-500' :
              plan.status === 'interrupted' ? 'bg-orange-500' :
              'bg-primary'
            ]"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="flex items-center gap-2 text-sm">
          <Calendar :size="14" class="text-text-muted flex-shrink-0" />
          <span class="text-text-soft truncate">{{ formatDate(plan.startDate) }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <Clock :size="14" class="text-text-muted flex-shrink-0" />
          <span class="text-text-soft truncate">{{ getCycleLabel(plan.cycleType) }} ({{ plan.totalDays }}天)</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <Droplets :size="14" class="text-text-muted flex-shrink-0" />
          <span class="text-text-soft truncate">{{ getFrequencyLabel(plan.initialFrequency) }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <Shield :size="14" class="text-text-muted flex-shrink-0" />
          <span class="text-text-soft truncate">敏感度 {{ plan.skinSensitivityLevel }}</span>
        </div>
      </div>

      <div v-if="plan.totalPhases !== undefined" class="flex items-center justify-between pt-3 border-t border-border">
        <div class="text-sm text-text-soft">
          共 <span class="font-medium text-text">{{ plan.totalPhases }}</span> 个阶段，
          已完成 <span class="font-medium text-text">{{ plan.completedPhases }}</span> 个
        </div>
        <div class="flex items-center text-primary text-sm font-medium">
          <span>查看详情</span>
          <ChevronRight :size="16" />
        </div>
      </div>
    </div>
  </div>
</template>
