<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  Droplets,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-vue-next'
import { useToleranceStore } from '@/stores/tolerance'
import type {
  TolerancePlan,
  TolerancePlanPhase,
  ToleranceDailyFeedbackInput,
  PauseConditionWarning
} from '@/types'

interface Props {
  visible: boolean
  plan: TolerancePlan | null
  phase: TolerancePlanPhase | null
  feedbackDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success', data: any): void
}>()

const toleranceStore = useToleranceStore()

const submitting = ref(false)
const used = ref(true)
const actualDrops = ref(0)
const skinCondition = ref('')
const reactions = ref<string[]>([])
const sensitivity = ref<number | null>(null)
const comfort = ref<number | null>(null)
const absorption = ref<number | null>(null)
const notes = ref('')

const pauseWarnings = ref<PauseConditionWarning[]>([])

const commonReactions = [
  '轻微刺痛',
  '明显刺痛',
  '发红',
  '瘙痒',
  '灼热感',
  '干燥',
  '紧绷',
  '红疹',
  '脱屑',
  '无不适'
]

const ratingOptions = [
  { value: 1, label: '很差', icon: Frown },
  { value: 2, label: '较差', icon: Meh },
  { value: 3, label: '一般', icon: Meh },
  { value: 4, label: '较好', icon: Smile },
  { value: 5, label: '很好', icon: Smile }
]

const getRatingLabel = (value: number | null) => {
  if (!value) return ''
  return ratingOptions.find(r => r.value === value)?.label || ''
}

const toggleReaction = (reaction: string) => {
  const index = reactions.value.indexOf(reaction)
  if (index === -1) {
    reactions.value.push(reaction)
  } else {
    reactions.value.splice(index, 1)
  }
}

const canSubmit = computed(() => {
  return true
})

const resetForm = () => {
  used.value = true
  actualDrops.value = props.phase?.drops || 0
  skinCondition.value = ''
  reactions.value = []
  sensitivity.value = null
  comfort.value = null
  absorption.value = null
  notes.value = ''
  pauseWarnings.value = []
}

const submitFeedback = async () => {
  if (!props.plan || !props.phase) return
  
  submitting.value = true
  try {
    const feedbackData: ToleranceDailyFeedbackInput = {
      phaseId: props.phase.id!,
      feedbackDate: props.feedbackDate || new Date().toISOString().split('T')[0],
      used: used.value,
      actualDrops: used.value ? actualDrops.value : undefined,
      skinCondition: skinCondition.value || undefined,
      reactions: reactions.value.length > 0 ? reactions.value : undefined,
      sensitivity: sensitivity.value || undefined,
      comfort: comfort.value || undefined,
      absorption: absorption.value || undefined,
      notes: notes.value || undefined
    }

    const result = await toleranceStore.submitFeedback(props.plan.id!, feedbackData)
    pauseWarnings.value = result.pauseWarnings
    
    emit('success', result)
    
    if (pauseWarnings.value.length === 0) {
      setTimeout(() => {
        close()
      }, 1000)
    }
  } catch (error) {
    console.error('提交反馈失败:', error)
  } finally {
    submitting.value = false
  }
}

const close = () => {
  emit('update:visible', false)
  resetForm()
}

watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
    actualDrops.value = props.phase?.drops || 0
  }
})

watch(() => props.phase, (val) => {
  if (val) {
    actualDrops.value = val.drops
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />
        <div class="relative bg-bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
          <div class="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 class="text-xl font-bold text-text">每日反馈</h2>
              <p class="text-sm text-text-soft mt-1">
                {{ phase?.name }} · {{ feedbackDate || new Date().toISOString().split('T')[0] }}
              </p>
            </div>
            <button
              @click="close"
              class="p-2 hover:bg-bg-soft rounded-xl transition-colors"
            >
              <X :size="20" class="text-text-muted" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div v-if="pauseWarnings.length > 0" class="mb-6">
              <div
                v-for="(warning, idx) in pauseWarnings"
                :key="idx"
                :class="[
                  'p-4 rounded-xl mb-2 flex items-start gap-3',
                  warning.severity === 'danger' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                ]"
              >
                <AlertTriangle
                  :size="20"
                  :class="[
                    'flex-shrink-0 mt-0.5',
                    warning.severity === 'danger' ? 'text-red-500' : 'text-amber-500'
                  ]"
                />
                <div>
                  <div
                    :class="[
                      'text-sm font-medium',
                      warning.severity === 'danger' ? 'text-red-800' : 'text-amber-800'
                    ]"
                  >
                    {{ warning.message }}
                  </div>
                  <div class="text-xs mt-1" :class="warning.severity === 'danger' ? 'text-red-600' : 'text-amber-600'">
                    建议暂停使用，观察皮肤状态是否缓解
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-5">
              <div class="bg-bg-soft rounded-xl p-4">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    v-model="used"
                    type="checkbox"
                    class="w-5 h-5 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span class="font-medium text-text">今日已使用</span>
                </label>
              </div>

              <template v-if="used">
                <div>
                  <label class="block text-sm font-medium text-text mb-2">
                    实际使用滴数: <span class="text-primary font-bold">{{ actualDrops }}</span> 滴
                  </label>
                  <input
                    v-model.number="actualDrops"
                    type="range"
                    min="1"
                    max="20"
                    class="w-full h-2 bg-bg rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div class="flex justify-between text-xs text-text-muted mt-1">
                    <span>1滴</span>
                    <span>建议: {{ phase?.drops }} 滴</span>
                    <span>20滴</span>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-text mb-2">皮肤反应</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="reaction in commonReactions"
                      :key="reaction"
                      @click="toggleReaction(reaction)"
                      :class="[
                        'px-3 py-1.5 rounded-lg text-sm transition-all',
                        reactions.includes(reaction)
                          ? reaction === '无不适'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-bg border border-border text-text-soft hover:border-primary/50'
                      ]"
                    >
                      {{ reaction }}
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-text mb-2">皮肤状态描述</label>
                  <textarea
                    v-model="skinCondition"
                    rows="2"
                    placeholder="描述今日皮肤状态，如是否有不适、改善等..."
                    class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  ></textarea>
                </div>

                <div class="grid grid-cols-3 gap-4">
                  <div class="text-center">
                    <label class="block text-sm font-medium text-text mb-2">敏感度</label>
                    <div class="flex justify-center gap-1">
                      <button
                        v-for="opt in ratingOptions"
                        :key="opt.value"
                        @click="sensitivity = sensitivity === opt.value ? null : opt.value"
                        :class="[
                          'p-2 rounded-lg transition-all',
                          sensitivity === opt.value
                            ? 'bg-red-100 text-red-600'
                            : 'bg-bg hover:bg-bg-soft text-text-muted'
                        ]"
                      >
                        <component :is="opt.icon" :size="18" />
                      </button>
                    </div>
                    <p class="text-xs text-text-muted mt-1">{{ getRatingLabel(sensitivity) }}</p>
                  </div>

                  <div class="text-center">
                    <label class="block text-sm font-medium text-text mb-2">舒适度</label>
                    <div class="flex justify-center gap-1">
                      <button
                        v-for="opt in ratingOptions"
                        :key="opt.value"
                        @click="comfort = comfort === opt.value ? null : opt.value"
                        :class="[
                          'p-2 rounded-lg transition-all',
                          comfort === opt.value
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-bg hover:bg-bg-soft text-text-muted'
                        ]"
                      >
                        <component :is="opt.icon" :size="18" />
                      </button>
                    </div>
                    <p class="text-xs text-text-muted mt-1">{{ getRatingLabel(comfort) }}</p>
                  </div>

                  <div class="text-center">
                    <label class="block text-sm font-medium text-text mb-2">吸收度</label>
                    <div class="flex justify-center gap-1">
                      <button
                        v-for="opt in ratingOptions"
                        :key="opt.value"
                        @click="absorption = absorption === opt.value ? null : opt.value"
                        :class="[
                          'p-2 rounded-lg transition-all',
                          absorption === opt.value
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-bg hover:bg-bg-soft text-text-muted'
                        ]"
                      >
                        <component :is="opt.icon" :size="18" />
                      </button>
                    </div>
                    <p class="text-xs text-text-muted mt-1">{{ getRatingLabel(absorption) }}</p>
                  </div>
                </div>
              </template>

              <div>
                <label class="block text-sm font-medium text-text mb-2">备注</label>
                <textarea
                  v-model="notes"
                  rows="2"
                  placeholder="添加其他备注信息..."
                  class="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 p-6 border-t border-border bg-bg-card">
            <button
              @click="close"
              class="px-5 py-2.5 text-text-soft hover:text-text transition-colors"
            >
              取消
            </button>
            <button
              @click="submitFeedback"
              :disabled="!canSubmit || submitting"
              class="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Loader2 v-if="submitting" :size="16" class="animate-spin" />
              <CheckCircle2 v-else :size="16" />
              <span>{{ submitting ? '提交中...' : '提交反馈' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

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
