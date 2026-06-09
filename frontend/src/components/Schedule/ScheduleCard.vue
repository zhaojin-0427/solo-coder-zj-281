<template>
  <div
    :class="[
      'relative p-4 rounded-xl transition-all',
      completed
        ? 'bg-bg-soft/50 opacity-70'
        : 'bg-bg border border-border hover:border-primary/30 hover:shadow-sm'
    ]"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-3 flex-1 min-w-0">
        <div
          :class="[
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            getSourceTypeBgClass(schedule.sourceType)
          ]"
        >
          <component
            :is="getSourceTypeIcon(schedule.sourceType)"
            :class="['w-5 h-5', getSourceTypeTextClass(schedule.sourceType)]"
          />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="font-medium text-text truncate" :class="{ 'line-through text-text-muted': completed }">
              {{ schedule.title }}
            </h4>
            <span
              :class="[
                'text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0',
                getSourceTypeTagClass(schedule.sourceType)
              ]"
            >
              {{ getSourceTypeLabel(schedule.sourceType) }}
            </span>
          </div>
          <p v-if="schedule.description" class="text-sm text-text-soft line-clamp-1 mb-2">
            {{ schedule.description }}
          </p>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
            <span v-if="schedule.usagePart" class="flex items-center gap-1">
              <MapPin class="w-3 h-3" />
              {{ schedule.usagePart }}
            </span>
            <span class="flex items-center gap-1">
              <RefreshCw class="w-3 h-3" />
              {{ getFrequencyLabel(schedule) }}
            </span>
            <span v-if="schedule.reminderTime && schedule.reminderEnabled" class="flex items-center gap-1">
              <Clock class="w-3 h-3" />
              {{ schedule.reminderTime }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1 flex-shrink-0">
        <button
          v-if="showComplete"
          @click="handleToggleComplete"
          :disabled="completing"
          :class="[
            'p-2 rounded-lg transition-all',
            completed
              ? 'text-success bg-success/10'
              : 'text-text-muted hover:text-success hover:bg-success/10'
          ]"
          :title="completed ? '取消完成' : '标记完成'"
        >
          <CheckCircle2 v-if="completed" class="w-4 h-4" />
          <Circle v-else class="w-4 h-4" />
        </button>
        <button
          v-if="showActions"
          @click="$emit('edit', schedule)"
          class="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
          title="编辑"
        >
          <Pencil class="w-4 h-4" />
        </button>
        <button
          v-if="showActions"
          @click="$emit('delete', schedule)"
          class="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all"
          title="删除"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="hasRisk" class="mt-3 pt-3 border-t border-border">
      <div class="flex items-start gap-2 p-2 rounded-lg bg-warning/10">
        <AlertTriangle class="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div class="text-xs text-warning-foreground">
          {{ riskWarning?.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Droplets,
  FileText,
  Package,
  MapPin,
  RefreshCw,
  Clock,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  AlertTriangle
} from 'lucide-vue-next'
import { useSchedulesStore } from '@/stores/schedules'
import type { Schedule, ScheduleSourceType } from '@/types'

const props = defineProps<{
  schedule: Schedule
  showComplete?: boolean
  showActions?: boolean
  completed?: boolean
  hasRisk?: boolean
  riskWarning?: { type: string; message: string; level: string }
}>()

const emit = defineEmits<{
  complete: [schedule: Schedule, completed: boolean]
  edit: [schedule: Schedule]
  delete: [schedule: Schedule]
}>()

const schedulesStore = useSchedulesStore()
const completing = ref(false)

const getSourceTypeIcon = (type: ScheduleSourceType) => {
  switch (type) {
    case 'formula': return Droplets
    case 'record': return FileText
    case 'subscription': return Package
    default: return Droplets
  }
}

const getSourceTypeBgClass = (type: ScheduleSourceType) => {
  switch (type) {
    case 'formula': return 'bg-primary/10'
    case 'record': return 'bg-secondary-sage/10'
    case 'subscription': return 'bg-secondary-apricot/10'
    default: return 'bg-bg-soft'
  }
}

const getSourceTypeTextClass = (type: ScheduleSourceType) => {
  switch (type) {
    case 'formula': return 'text-primary'
    case 'record': return 'text-secondary-sage-dark'
    case 'subscription': return 'text-secondary-apricot-dark'
    default: return 'text-text'
  }
}

const getSourceTypeTagClass = (type: ScheduleSourceType) => {
  switch (type) {
    case 'formula': return 'bg-primary/15 text-primary'
    case 'record': return 'bg-secondary-sage/15 text-secondary-sage-dark'
    case 'subscription': return 'bg-secondary-apricot/15 text-secondary-apricot-dark'
    default: return 'bg-bg-soft text-text'
  }
}

const getSourceTypeLabel = (type: ScheduleSourceType) => {
  switch (type) {
    case 'formula': return '配方'
    case 'record': return '记录'
    case 'subscription': return '订阅'
    default: return '其他'
  }
}

const getFrequencyLabel = (schedule: Schedule) => {
  switch (schedule.frequencyType) {
    case 'daily':
      return schedule.frequencyValue > 1 ? `每${schedule.frequencyValue}天` : '每日'
    case 'weekly':
      const weekDays = ['日', '一', '二', '三', '四', '五', '六']
      if (schedule.frequencyDays && schedule.frequencyDays.length > 0) {
        return `每周${schedule.frequencyDays.map(d => weekDays[d]).join('、')}`
      }
      return '每周'
    case 'monthly':
      return '每月'
    case 'custom':
      return `每${schedule.frequencyValue}天`
    default:
      return '自定义'
  }
}

const handleToggleComplete = async () => {
  if (completing.value) return
  completing.value = true
  try {
    if (props.completed) {
      await schedulesStore.cancelComplete(props.schedule.id)
      emit('complete', props.schedule, false)
    } else {
      await schedulesStore.complete(props.schedule.id, {
        scheduledDate: new Date().toISOString().split('T')[0],
        notes: '',
        rating: 5
      })
      emit('complete', props.schedule, true)
    }
  } catch (e) {
    console.error('更新打卡状态失败', e)
  } finally {
    completing.value = false
  }
}
</script>
