<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text">提醒中心</h1>
        <p class="text-text-soft mt-1">管理您的芳疗使用计划和智能提醒</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        新建计划
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="bg-bg-card rounded-xl p-4 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar class="w-6 h-6 text-primary" />
        </div>
        <div>
          <div class="text-2xl font-bold text-text">{{ schedulesStore.stats?.total || 0 }}</div>
          <div class="text-sm text-text-soft">活跃计划</div>
        </div>
      </div>
      <div class="bg-bg-card rounded-xl p-4 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
          <CheckCircle2 class="w-6 h-6 text-success" />
        </div>
        <div>
          <div class="text-2xl font-bold text-text">{{ schedulesStore.stats?.completedToday || 0 }}</div>
          <div class="text-sm text-text-soft">今日已完成</div>
        </div>
      </div>
      <div class="bg-bg-card rounded-xl p-4 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
          <Clock class="w-6 h-6 text-warning" />
        </div>
        <div>
          <div class="text-2xl font-bold text-text">{{ schedulesStore.stats?.pendingToday || 0 }}</div>
          <div class="text-sm text-text-soft">今日待完成</div>
        </div>
      </div>
      <div class="bg-bg-card rounded-xl p-4 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
          <AlertTriangle class="w-6 h-6 text-error" />
        </div>
        <div>
          <div class="text-2xl font-bold text-text">{{ schedulesStore.stats?.riskCount || 0 }}</div>
          <div class="text-sm text-text-soft">风险提醒</div>
        </div>
      </div>
      <div
        class="bg-bg-card rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all border-2 border-transparent hover:border-amber-200"
        @click="router.push('/tolerance')"
      >
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Shield class="w-6 h-6 text-white" />
        </div>
        <div class="flex-1">
          <div class="text-2xl font-bold text-text">{{ toleranceStore.stats?.activePlans || 0 }}</div>
          <div class="text-sm text-text-soft">耐受计划</div>
        </div>
        <ChevronRight class="w-5 h-5 text-text-muted" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-bg-card rounded-2xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-text">今日提醒</h3>
            <span class="text-xs text-text-muted">
              {{ todayDate }}
            </span>
          </div>

          <div v-if="loading" class="py-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>

          <div v-else-if="!schedulesStore.todayReminders || schedulesStore.todayReminders.reminders.length === 0" class="py-12">
            <EmptyState
              title="今天没有安排"
              description="点击右上角按钮创建新的使用计划"
              icon="calendar"
            />
          </div>

          <div v-else class="space-y-3">
            <ScheduleCard
              v-for="item in schedulesStore.todayReminders.reminders"
              :key="item.id"
              :schedule="item"
              :show-complete="true"
              :completed="item.isCompleted"
              @complete="handleComplete"
            />
          </div>
        </div>

        <div class="bg-bg-card rounded-2xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-text">风险提醒</h3>
            <span
              v-if="schedulesStore.riskWarnings && schedulesStore.riskWarnings.total > 0"
              class="text-xs px-2 py-0.5 rounded-full bg-error/10 text-error font-medium"
            >
              {{ schedulesStore.riskWarnings.total }} 项
            </span>
          </div>

          <div v-if="loading" class="py-8 flex justify-center">
            <LoadingSpinner />
          </div>

          <div v-else-if="!schedulesStore.riskWarnings || schedulesStore.riskWarnings.risks.length === 0" class="py-8">
            <div class="text-center">
              <div class="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck class="w-6 h-6 text-success" />
              </div>
              <div class="text-sm text-text font-medium">一切正常</div>
              <div class="text-xs text-text-soft mt-1">暂无风险提醒</div>
            </div>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(warning, index) in schedulesStore.riskWarnings.risks"
              :key="index"
              :class="[
                'p-3 rounded-xl flex items-start gap-3',
                warning.level === 'danger' ? 'bg-error/5 border border-error/20' :
                warning.level === 'warning' ? 'bg-warning/5 border border-warning/20' :
                'bg-primary/5 border border-primary/20'
              ]"
            >
              <component
                :is="getRiskIcon(warning.type)"
                :class="[
                  'w-5 h-5 flex-shrink-0 mt-0.5',
                  warning.level === 'danger' ? 'text-error' :
                  warning.level === 'warning' ? 'text-warning' :
                  'text-primary'
                ]"
              />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-text mb-0.5">
                  {{ getRiskTitle(warning.type) }}
                </div>
                <div class="text-xs text-text-soft">
                  {{ warning.message }}
                </div>
                <div v-if="warning.scheduleId" class="mt-2">
                  <button
                    @click="handleRiskAction(warning)"
                    class="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    查看详情 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2">
        <ScheduleCalendar
          @complete="handleComplete"
          @edit="handleEdit"
          @delete="handleDelete"
        />

        <div v-if="schedulesStore.list.length > 0" class="mt-6 bg-bg-card rounded-2xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-text">所有计划</h3>
            <div class="flex items-center gap-2">
              <button
                v-for="tab in tabs"
                :key="tab.value"
                @click="activeTab = tab.value"
                :class="[
                  'px-3 py-1.5 text-sm rounded-lg transition-all',
                  activeTab === tab.value
                    ? 'bg-primary text-white'
                    : 'text-text-soft hover:bg-bg-soft'
                ]"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <ScheduleCard
              v-for="schedule in filteredSchedules"
              :key="schedule.id"
              :schedule="schedule"
              :show-actions="true"
              @edit="handleEdit"
              @delete="handleDelete"
            />
          </div>

          <div v-if="filteredSchedules.length === 0" class="py-8 text-center">
            <p class="text-text-soft text-sm">暂无{{ tabs.find(t => t.value === activeTab)?.label }}计划</p>
          </div>
        </div>
      </div>
    </div>

    <ScheduleCreateModal
      v-model:visible="showCreateModal"
      :edit-schedule="editingSchedule"
      @success="handleScheduleSuccess"
    />

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showDeleteConfirm = false" />
          <div class="relative bg-bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl animate-scale-in">
            <h3 class="text-lg font-semibold text-text mb-2">确认删除</h3>
            <p class="text-text-soft mb-6">确定要删除这个使用计划吗？此操作无法撤销。</p>
            <div class="flex items-center justify-end gap-3">
              <button
                @click="showDeleteConfirm = false"
                class="px-5 py-2 text-text-soft hover:text-text transition-colors"
              >
                取消
              </button>
              <button
                @click="confirmDelete"
                :disabled="deleting"
                class="px-5 py-2 bg-error text-white rounded-xl hover:bg-error/90 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" />
                删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Droplets,
  Package,
  FileText,
  Shield,
  ChevronRight
} from 'lucide-vue-next'
import { useSchedulesStore } from '@/stores/schedules'
import { useToleranceStore } from '@/stores/tolerance'
import type { Schedule, RiskType } from '@/types'
import ScheduleCalendar from '@/components/Schedule/ScheduleCalendar.vue'
import ScheduleCard from '@/components/Schedule/ScheduleCard.vue'
import ScheduleCreateModal from '@/components/Schedule/ScheduleCreateModal.vue'
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue'
import EmptyState from '@/components/Common/EmptyState.vue'

const router = useRouter()
const schedulesStore = useSchedulesStore()
const toleranceStore = useToleranceStore()

const showCreateModal = ref(false)
const editingSchedule = ref<Schedule | null>(null)
const showDeleteConfirm = ref(false)
const scheduleToDelete = ref<Schedule | null>(null)
const deleting = ref(false)
const loading = ref(false)
const activeTab = ref<'all' | 'active' | 'paused' | 'completed'>('active')

const tabs = [
  { label: '进行中', value: 'active' as const },
  { label: '已暂停', value: 'paused' as const },
  { label: '已完成', value: 'completed' as const },
  { label: '全部', value: 'all' as const },
]

const todayDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const filteredSchedules = computed(() => {
  if (activeTab.value === 'all') {
    return schedulesStore.list || []
  }
  return (schedulesStore.list || []).filter(s => s.status === activeTab.value)
})

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      schedulesStore.fetchList(),
      schedulesStore.fetchTodayReminders(),
      schedulesStore.fetchRiskWarnings(),
      schedulesStore.fetchNext30Days(),
      toleranceStore.fetchStats()
    ])
  } catch (e) {
    console.error('加载提醒中心数据失败', e)
  } finally {
    loading.value = false
  }
}

const getRiskIcon = (type: RiskType) => {
  switch (type) {
    case 'high_sensitivity': return Droplets
    case 'subscription_review': return Package
    case 'long_no_feedback': return FileText
    case 'formula_conflict': return AlertTriangle
    default: return AlertTriangle
  }
}

const getRiskTitle = (type: RiskType) => {
  switch (type) {
    case 'high_sensitivity': return '高敏配方风险'
    case 'subscription_review': return '订阅复盘提醒'
    case 'long_no_feedback': return '长期无反馈提醒'
    case 'formula_conflict': return '配方使用冲突'
    default: return '注意事项'
  }
}

const handleComplete = (schedule: Schedule, completed: boolean) => {
  schedulesStore.fetchTodayReminders()
}

const handleEdit = (schedule: Schedule) => {
  editingSchedule.value = schedule
  showCreateModal.value = true
}

const handleDelete = (schedule: Schedule) => {
  scheduleToDelete.value = schedule
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!scheduleToDelete.value) return
  deleting.value = true
  try {
    await schedulesStore.remove(scheduleToDelete.value.id)
    showDeleteConfirm.value = false
    scheduleToDelete.value = null
    loadData()
  } catch (e) {
    console.error('删除计划失败', e)
  } finally {
    deleting.value = false
  }
}

const handleScheduleSuccess = () => {
  editingSchedule.value = null
  loadData()
}

const handleRiskAction = (warning: { scheduleId?: number }) => {
  if (warning.scheduleId) {
    const schedule = schedulesStore.list?.find(s => s.id === warning.scheduleId)
    if (schedule) {
      handleEdit(schedule)
    }
  }
}
</script>

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
