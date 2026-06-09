<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
        <div class="relative w-full max-w-lg bg-bg-card rounded-2xl shadow-xl max-h-[90vh] overflow-hidden animate-scale-in">
          <div class="flex items-center justify-between p-6 border-b border-border">
            <h3 class="text-lg font-semibold text-text">
              {{ editSchedule ? '编辑使用计划' : '新建使用计划' }}
            </h3>
            <button @click="handleClose" class="p-2 -mr-2 rounded-lg hover:bg-bg-soft transition-colors">
              <X class="w-5 h-5 text-text-soft" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-text mb-2">计划名称 *</label>
                <input
                  v-model="form.title"
                  type="text"
                  class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="例如：晚间舒缓修护"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-text mb-2">计划描述</label>
                <textarea
                  v-model="form.description"
                  class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  rows="2"
                  placeholder="描述这个使用计划的目的..."
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text mb-2">来源类型 *</label>
                  <select
                    v-model="form.sourceType"
                    class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="formula">配方使用</option>
                    <option value="record">使用记录</option>
                    <option value="subscription">订阅礼盒</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-text mb-2">使用部位</label>
                  <input
                    v-model="form.usagePart"
                    type="text"
                    class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="例如：面部"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text mb-2">使用频率 *</label>
                  <select
                    v-model="form.frequencyType"
                    class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    <option value="daily">每日</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                    <option value="custom">自定义间隔</option>
                  </select>
                </div>

                <div v-if="form.frequencyType === 'custom'">
                  <label class="block text-sm font-medium text-text mb-2">间隔天数</label>
                  <input
                    v-model.number="form.frequencyValue"
                    type="number"
                    min="1"
                    class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="例如：2"
                  />
                </div>
              </div>

              <div v-if="form.frequencyType === 'weekly'">
                <label class="block text-sm font-medium text-text mb-2">选择星期</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="(day, index) in weekDays"
                    :key="index"
                    type="button"
                    @click="toggleWeekDay(index)"
                    :class="[
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      form.frequencyDays?.includes(index)
                        ? 'bg-primary text-white'
                        : 'bg-bg text-text-soft hover:bg-bg-soft'
                    ]"
                  >
                    {{ day }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text mb-2">开始日期 *</label>
                  <input
                    v-model="form.startDate"
                    type="date"
                    class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text mb-2">结束日期</label>
                  <input
                    v-model="form.endDate"
                    type="date"
                    class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text mb-2">提醒时间</label>
                  <input
                    v-model="form.reminderTime"
                    type="time"
                    class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div class="flex items-end">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      v-model="form.reminderEnabled"
                      type="checkbox"
                      class="w-5 h-5 rounded border-border text-primary focus:ring-primary/30"
                    />
                    <span class="text-sm text-text">启用提醒</span>
                  </label>
                </div>
              </div>

              <div v-if="form.sourceType === 'formula'">
                <label class="block text-sm font-medium text-text mb-2">关联配方</label>
                <select
                  v-model="form.formulaId"
                  class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option :value="null">请选择配方</option>
                  <option v-for="f in formulaList" :key="f.id" :value="f.id">
                    {{ f.name }}
                  </option>
                </select>
              </div>

              <div v-if="form.sourceType === 'subscription'">
                <label class="block text-sm font-medium text-text mb-2">关联订阅</label>
                <select
                  v-model="form.subscriptionId"
                  class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option :value="null">请选择订阅</option>
                  <option v-for="s in subscriptionList" :key="s.id" :value="s.id">
                    {{ s.planName }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              @click="handleClose"
              class="px-6 py-2.5 text-text-soft hover:text-text transition-colors"
            >
              取消
            </button>
            <button
              @click="handleSubmit"
              :disabled="loading || !canSubmit"
              class="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              {{ editSchedule ? '保存修改' : '创建计划' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import { formulas, subscriptions } from '@/api'
import { useSchedulesStore } from '@/stores/schedules'
import type { Schedule, ScheduleCreateInput, Formula, SubscriptionPlan } from '@/types'

const props = defineProps<{
  visible: boolean
  editSchedule?: Schedule | null
  prefillData?: Partial<ScheduleCreateInput>
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const schedulesStore = useSchedulesStore()
const loading = ref(false)
const formulaList = ref<Formula[]>([])
const subscriptionList = ref<SubscriptionPlan[]>([])

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const defaultForm = (): ScheduleCreateInput => ({
  title: '',
  description: '',
  sourceType: 'formula',
  sourceId: null,
  usagePart: '',
  frequencyType: 'daily',
  frequencyValue: 1,
  frequencyDays: [],
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  reminderTime: '21:00',
  reminderEnabled: true,
  formulaId: null,
  subscriptionId: null,
  status: 'active',
})

const form = reactive<ScheduleCreateInput>(defaultForm())

const canSubmit = computed(() => {
  return form.title.trim() && form.sourceType && form.frequencyType && form.startDate
})

watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
    if (props.prefillData) {
      Object.assign(form, props.prefillData)
    }
    if (props.editSchedule) {
      Object.assign(form, {
        title: props.editSchedule.title,
        description: props.editSchedule.description,
        sourceType: props.editSchedule.sourceType,
        sourceId: props.editSchedule.sourceId,
        usagePart: props.editSchedule.usagePart,
        frequencyType: props.editSchedule.frequencyType,
        frequencyValue: props.editSchedule.frequencyValue,
        frequencyDays: [...props.editSchedule.frequencyDays],
        startDate: props.editSchedule.startDate,
        endDate: props.editSchedule.endDate,
        reminderTime: props.editSchedule.reminderTime,
        reminderEnabled: props.editSchedule.reminderEnabled,
        formulaId: props.editSchedule.formulaId,
        subscriptionId: props.editSchedule.subscriptionId,
        status: props.editSchedule.status,
      })
    }
  }
})

onMounted(() => {
  loadFormulas()
  loadSubscriptions()
})

const loadFormulas = async () => {
  try {
    formulaList.value = await formulas.getList()
  } catch (e) {
    console.error('加载配方列表失败', e)
  }
}

const loadSubscriptions = async () => {
  try {
    subscriptionList.value = await subscriptions.getList()
  } catch (e) {
    console.error('加载订阅列表失败', e)
  }
}

const toggleWeekDay = (day: number) => {
  if (!form.frequencyDays) {
    form.frequencyDays = []
  }
  const index = form.frequencyDays.indexOf(day)
  if (index > -1) {
    form.frequencyDays.splice(index, 1)
  } else {
    form.frequencyDays.push(day)
  }
}

const resetForm = () => {
  Object.assign(form, defaultForm())
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  loading.value = true
  try {
    const data: ScheduleCreateInput = {
      ...form,
      endDate: form.endDate || undefined,
      formulaId: form.formulaId || undefined,
      subscriptionId: form.subscriptionId || undefined,
    }

    if (props.editSchedule) {
      await schedulesStore.update(props.editSchedule.id, data)
    } else {
      await schedulesStore.create(data)
    }

    emit('success')
    handleClose()
  } catch (e) {
    console.error('保存日程失败', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
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
