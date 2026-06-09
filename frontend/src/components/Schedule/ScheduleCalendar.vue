<template>
  <div class="bg-bg-card rounded-2xl p-6 shadow-sm">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-text">未来30天芳疗安排</h3>
      <div class="flex items-center gap-2">
        <span class="flex items-center gap-1.5 text-xs text-text-soft">
          <span class="w-2 h-2 rounded-full bg-primary"></span>
          有安排
        </span>
        <span class="flex items-center gap-1.5 text-xs text-text-soft">
          <span class="w-2 h-2 rounded-full bg-error"></span>
          今日
        </span>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1 mb-2">
      <div v-for="day in weekDays" :key="day" class="text-center text-xs font-medium text-text-soft py-2">
        {{ day }}
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="(day, index) in paddedDays"
        :key="index"
        :class="[
          'relative p-1 rounded-lg min-h-[72px] transition-all cursor-pointer group',
          day.isToday ? 'bg-error/10 ring-2 ring-error/30' : '',
          day.hasSchedules && !day.isToday ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-bg-soft',
        ]"
        @click="handleDayClick(day)"
      >
        <div class="text-xs font-medium mb-1" :class="day.isToday ? 'text-error' : 'text-text'">
          {{ formatDay(day.date) }}
        </div>
        <div v-if="day.hasSchedules" class="space-y-1">
          <div
            v-for="(schedule, sIndex) in day.schedules.slice(0, 2)"
            :key="sIndex"
            :class="[
              'text-[10px] px-1.5 py-0.5 rounded truncate',
              getScheduleTypeClass(schedule.sourceType)
            ]"
            :title="schedule.title"
          >
            {{ schedule.title }}
          </div>
          <div v-if="day.scheduleCount > 2" class="text-[10px] text-text-muted pl-1">
            +{{ day.scheduleCount - 2 }} 更多
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedDay && selectedDay.hasSchedules" class="mt-6 pt-6 border-t border-border">
      <h4 class="text-sm font-medium text-text mb-3">
        {{ selectedDay.date }} 的安排
      </h4>
      <div class="space-y-2">
        <ScheduleCard
          v-for="schedule in selectedDay.schedules"
          :key="schedule.id"
          :schedule="schedule"
          :show-complete="true"
          @complete="handleComplete"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSchedulesStore } from '@/stores/schedules'
import type { CalendarDay, Schedule, ScheduleSourceType } from '@/types'
import ScheduleCard from './ScheduleCard.vue'

const props = defineProps<{
  sourceType?: ScheduleSourceType
  formulaId?: number
  subscriptionId?: number
}>()

const emit = defineEmits<{
  complete: [schedule: Schedule, completed: boolean]
  edit: [schedule: Schedule]
  delete: [schedule: Schedule]
  dayClick: [day: CalendarDay]
}>()

const schedulesStore = useSchedulesStore()
const selectedDay = ref<CalendarDay | null>(null)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const calendarDays = computed(() => {
  return schedulesStore.calendarData || []
})

const firstDayWeekday = computed(() => {
  if (calendarDays.value.length === 0) return 0
  return new Date(calendarDays.value[0].date).getDay()
})

const paddedDays = computed(() => {
  const padding: CalendarDay[] = []
  for (let i = 0; i < firstDayWeekday.value; i++) {
    padding.push({
      date: '',
      weekday: i,
      isToday: false,
      hasSchedules: false,
      scheduleCount: 0,
      schedules: []
    })
  }
  return [...padding, ...calendarDays.value]
})

const loadCalendar = async () => {
  await schedulesStore.fetchNext30Days({
    sourceType: props.sourceType,
    formulaId: props.formulaId,
    subscriptionId: props.subscriptionId
  })
  if (calendarDays.value.length > 0) {
    selectedDay.value = calendarDays.value.find(d => d.isToday) || calendarDays.value[0]
  }
}

watch(() => [props.sourceType, props.formulaId, props.subscriptionId], () => {
  loadCalendar()
}, { immediate: true })

onMounted(() => {
  loadCalendar()
})

const formatDay = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).getDate()
}

const getScheduleTypeClass = (type: ScheduleSourceType) => {
  switch (type) {
    case 'formula':
      return 'bg-primary/15 text-primary'
    case 'record':
      return 'bg-secondary-sage/15 text-secondary-sage-dark'
    case 'subscription':
      return 'bg-secondary-apricot/15 text-secondary-apricot-dark'
    default:
      return 'bg-bg-soft text-text'
  }
}

const handleDayClick = (day: CalendarDay) => {
  if (day.date) {
    selectedDay.value = day
    emit('dayClick', day)
  }
}

const handleComplete = (schedule: Schedule, completed: boolean) => {
  emit('complete', schedule, completed)
}

const handleEdit = (schedule: Schedule) => {
  emit('edit', schedule)
}

const handleDelete = (schedule: Schedule) => {
  emit('delete', schedule)
}
</script>
