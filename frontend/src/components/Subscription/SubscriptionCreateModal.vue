<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  User,
  MapPin,
  Phone,
  Calendar,
  Gift,
  DollarSign,
  Package,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-vue-next'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import type { SubscriptionPlanCreateInput, SpecialDate, DeliveryCycle } from '@/types'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const subscriptionsStore = useSubscriptionsStore()

const currentStep = ref(1)
const totalSteps = 5
const creating = ref(false)

const planName = ref('')
const recipientName = ref('')
const recipientPhone = ref('')
const recipientAddress = ref('')
const deliveryCycle = ref<DeliveryCycle>('biweekly')
const budgetLimit = ref(300)
const candlesPerDelivery = ref(2)
const deliveryScene = ref('home')
const preferredAromas = ref<string[]>([])
const excludedScents = ref<string[]>([])
const specialDates = ref<SpecialDate[]>([])
const userNotes = ref('')
const startDate = ref(new Date().toISOString().split('T')[0])

const aromaOptions = [
  '薰衣草', '玫瑰', '柠檬', '薄荷', '檀香', '乳香', '洋甘菊', '橙花',
  '天竺葵', '依兰依兰', '茶树', '甜橙', '佛手柑', '雪松', '香草', '肉桂',
  '茉莉', '海盐', '焦糖', '白麝香', 'floral', 'citrus', 'woody', 'herbal',
  'fresh', 'gourmand', 'oriental', 'spicy'
]

const deliverySceneOptions = [
  { value: 'home', label: '居家自用', description: '日常居家使用' },
  { value: 'office', label: '办公空间', description: '办公室/工作室' },
  { value: 'gift', label: '送礼佳品', description: '送朋友/家人' },
  { value: 'spa', label: 'SPA疗愈', description: 'SPA/按摩馆' },
  { value: 'hotel', label: '酒店民宿', description: '营造舒适氛围' },
  { value: 'yoga', label: '瑜伽冥想', description: '瑜伽/冥想练习' },
]

const newSpecialDate = ref<SpecialDate>({
  date: '',
  type: 'festival',
  note: ''
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return planName.value.trim().length > 0 && recipientName.value.trim().length > 0 && recipientAddress.value.trim().length > 0
    case 2:
      return budgetLimit.value > 0 && candlesPerDelivery.value > 0
    case 3:
      return deliveryCycle.value && deliveryScene.value && startDate.value
    case 4:
      return preferredAromas.value.length > 0
    case 5:
      return true
    default:
      return false
  }
})

const cycleLabel = computed(() => {
  const labels: Record<DeliveryCycle, string> = {
    weekly: '每周',
    biweekly: '每两周',
    monthly: '每月'
  }
  return labels[deliveryCycle.value] || ''
})

const sceneLabel = computed(() => {
  return deliverySceneOptions.find(s => s.value === deliveryScene.value)?.label || ''
})

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const goToStep = (step: number) => {
  if (step < currentStep.value) {
    currentStep.value = step
  }
}

const toggleAroma = (aroma: string, type: 'preferred' | 'excluded') => {
  const target = type === 'preferred' ? preferredAromas : excludedScents
  const index = target.value.indexOf(aroma)
  if (index > -1) {
    target.value.splice(index, 1)
  } else {
    if (type === 'excluded') {
      const preferredIndex = preferredAromas.value.indexOf(aroma)
      if (preferredIndex > -1) {
        preferredAromas.value.splice(preferredIndex, 1)
      }
    }
    target.value.push(aroma)
  }
}

const addSpecialDate = () => {
  if (newSpecialDate.value.date && newSpecialDate.value.type) {
    specialDates.value.push({ ...newSpecialDate.value })
    newSpecialDate.value = { date: '', type: 'festival', note: '' }
  }
}

const removeSpecialDate = (index: number) => {
  specialDates.value.splice(index, 1)
}

const closeModal = () => {
  emit('update:visible', false)
}

const resetForm = () => {
  currentStep.value = 1
  planName.value = ''
  recipientName.value = ''
  recipientPhone.value = ''
  recipientAddress.value = ''
  deliveryCycle.value = 'biweekly'
  budgetLimit.value = 300
  candlesPerDelivery.value = 2
  deliveryScene.value = 'home'
  preferredAromas.value = []
  excludedScents.value = []
  specialDates.value = []
  userNotes.value = ''
  startDate.value = new Date().toISOString().split('T')[0]
}

const createSubscription = async () => {
  if (!canProceed.value) return

  creating.value = true
  try {
    const input: SubscriptionPlanCreateInput = {
      planName: planName.value.trim(),
      recipientName: recipientName.value.trim(),
      recipientPhone: recipientPhone.value.trim() || null,
      recipientAddress: recipientAddress.value.trim(),
      deliveryCycle: deliveryCycle.value,
      budgetLimit: budgetLimit.value,
      candlesPerDelivery: candlesPerDelivery.value,
      deliveryScene: deliveryScene.value,
      preferredAromas: preferredAromas.value,
      excludedScents: excludedScents.value,
      specialDates: specialDates.value,
      userNotes: userNotes.value.trim() || null,
      startDate: startDate.value
    }

    await subscriptionsStore.create(input)
    emit('success')
    closeModal()
    resetForm()
  } catch (error) {
    console.error('创建订阅失败:', error)
  } finally {
    creating.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 class="text-xl font-bold text-stone-800">创建订阅计划</h2>
          <button
            @click="closeModal"
            class="p-2 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X :size="20" class="text-stone-500" />
          </button>
        </div>

        <div class="px-6 py-4 border-b border-stone-100">
          <div class="flex items-center justify-between">
            <div
              v-for="step in totalSteps"
              :key="step"
              class="flex items-center"
            >
              <button
                @click="goToStep(step)"
                :disabled="step > currentStep"
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                  step === currentStep
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                    : step < currentStep
                      ? 'bg-violet-100 text-violet-700 cursor-pointer hover:bg-violet-200'
                      : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                ]"
              >
                <Check v-if="step < currentStep" :size="18" />
                <span v-else>{{ step }}</span>
              </button>
              <div
                v-if="step < totalSteps"
                :class="[
                  'w-10 sm:w-16 h-1 mx-2 rounded-full transition-colors',
                  step < currentStep ? 'bg-violet-500' : 'bg-stone-200'
                ]"
              ></div>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-stone-500 px-1">
            <span>收件信息</span>
            <span>预算配置</span>
            <span>配送设置</span>
            <span>香调偏好</span>
            <span>完成</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="currentStep === 1" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                计划名称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="planName"
                type="text"
                placeholder="例如：我的香薰订阅计划"
                class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                <User :size="14" class="inline mr-1" />
                收件人 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="recipientName"
                type="text"
                placeholder="收件人姓名"
                class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                <Phone :size="14" class="inline mr-1" />
                联系电话
              </label>
              <input
                v-model="recipientPhone"
                type="tel"
                placeholder="收件人联系电话"
                class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                <MapPin :size="14" class="inline mr-1" />
                收货地址 <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="recipientAddress"
                placeholder="详细收货地址"
                rows="3"
                class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <div v-else-if="currentStep === 2" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                <DollarSign :size="14" class="inline mr-1" />
                每期预算上限 (元) <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">¥</span>
                <input
                  v-model.number="budgetLimit"
                  type="number"
                  min="50"
                  max="2000"
                  step="10"
                  class="w-full pl-8 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                />
              </div>
              <input
                v-model.number="budgetLimit"
                type="range"
                min="50"
                max="2000"
                step="10"
                class="w-full mt-3 accent-violet-600"
              />
              <div class="flex justify-between text-xs text-stone-400 mt-1">
                <span>¥50</span>
                <span>¥2000</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                <Package :size="14" class="inline mr-1" />
                每期蜡烛数量 <span class="text-red-500">*</span>
              </label>
              <div class="flex items-center gap-4">
                <button
                  @click="candlesPerDelivery = Math.max(1, candlesPerDelivery - 1)"
                  class="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft :size="20" class="text-stone-600" />
                </button>
                <span class="text-2xl font-bold text-violet-600 w-12 text-center">{{ candlesPerDelivery }}</span>
                <button
                  @click="candlesPerDelivery = Math.min(10, candlesPerDelivery + 1)"
                  class="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                >
                  <ChevronRight :size="20" class="text-stone-600" />
                </button>
              </div>
              <p class="text-sm text-stone-500 mt-2">
                预计单支价格：¥{{ (budgetLimit / candlesPerDelivery).toFixed(0) }}
              </p>
            </div>
          </div>

          <div v-else-if="currentStep === 3" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-3">
                配送周期 <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="cycle in (['weekly', 'biweekly', 'monthly'] as DeliveryCycle[])"
                  :key="cycle"
                  @click="deliveryCycle = cycle"
                  :class="[
                    'p-4 rounded-xl border-2 text-center transition-all',
                    deliveryCycle === cycle
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-stone-100 hover:border-violet-200'
                  ]"
                >
                  <div :class="['text-lg font-bold', deliveryCycle === cycle ? 'text-violet-600' : 'text-stone-700']">
                    {{ cycle === 'weekly' ? '每周' : cycle === 'biweekly' ? '每两周' : '每月' }}
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 mb-3">
                收货场景 <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="scene in deliverySceneOptions"
                  :key="scene.value"
                  @click="deliveryScene = scene.value"
                  :class="[
                    'p-4 rounded-xl border-2 text-left transition-all',
                    deliveryScene === scene.value
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-stone-100 hover:border-violet-200'
                  ]"
                >
                  <div :class="['font-medium', deliveryScene === scene.value ? 'text-violet-600' : 'text-stone-700']">
                    {{ scene.label }}
                  </div>
                  <div class="text-xs text-stone-500 mt-1">{{ scene.description }}</div>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                <Calendar :size="14" class="inline mr-1" />
                开始日期 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="startDate"
                type="date"
                :min="new Date().toISOString().split('T')[0]"
                class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                <Gift :size="14" class="inline mr-1" />
                特殊日期（生日/节日/纪念日）
              </label>
              <div class="space-y-3">
                <div v-for="(date, index) in specialDates" :key="index" class="flex items-center gap-2 bg-stone-50 rounded-xl p-3">
                  <span class="text-sm">{{ date.type === 'birthday' ? '🎂' : date.type === 'festival' ? '🎉' : '💝' }}</span>
                  <span class="text-sm text-stone-700">{{ date.date }}</span>
                  <span v-if="date.note" class="text-sm text-stone-500">- {{ date.note }}</span>
                  <button
                    @click="removeSpecialDate(index)"
                    class="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 :size="16" class="text-red-500" />
                  </button>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="newSpecialDate.date"
                    type="date"
                    class="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  />
                  <select
                    v-model="newSpecialDate.type"
                    class="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  >
                    <option value="festival">节日</option>
                    <option value="birthday">生日</option>
                    <option value="anniversary">纪念日</option>
                  </select>
                  <input
                    v-model="newSpecialDate.note"
                    type="text"
                    placeholder="备注"
                    class="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  />
                  <button
                    @click="addSpecialDate"
                    class="px-4 py-2 bg-violet-100 hover:bg-violet-200 text-violet-600 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Plus :size="16" class="inline" />
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 4" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                <Sparkles :size="14" class="inline mr-1" />
                偏好香调 <span class="text-red-500">*</span>
              </label>
              <p class="text-sm text-stone-500 mb-3">选择您喜欢的香调（可多选）</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="aroma in aromaOptions"
                  :key="aroma"
                  @click="toggleAroma(aroma, 'preferred')"
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm transition-all',
                    preferredAromas.includes(aroma)
                      ? 'bg-violet-500 text-white'
                      : excludedScents.includes(aroma)
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-stone-100 text-stone-600 hover:bg-violet-100 hover:text-violet-600'
                  ]"
                  :disabled="excludedScents.includes(aroma)"
                >
                  {{ aroma }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                排斥香味
              </label>
              <p class="text-sm text-stone-500 mb-3">选择您不喜欢或过敏的香味（可多选）</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="aroma in aromaOptions"
                  :key="aroma"
                  @click="toggleAroma(aroma, 'excluded')"
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm transition-all',
                    excludedScents.includes(aroma)
                      ? 'bg-red-500 text-white'
                      : preferredAromas.includes(aroma)
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-stone-100 text-stone-600 hover:bg-red-100 hover:text-red-600'
                  ]"
                  :disabled="preferredAromas.includes(aroma)"
                >
                  {{ aroma }}
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="currentStep === 5" class="space-y-6">
            <div class="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100">
              <h3 class="text-lg font-semibold text-violet-800 mb-4">订阅预览</h3>
              
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <div class="text-sm text-violet-600 mb-1">计划名称</div>
                    <div class="font-medium text-stone-800">{{ planName }}</div>
                  </div>
                  <div>
                    <div class="text-sm text-violet-600 mb-1">收件人</div>
                    <div class="font-medium text-stone-800">{{ recipientName }}</div>
                  </div>
                  <div>
                    <div class="text-sm text-violet-600 mb-1">配送周期</div>
                    <div class="font-medium text-stone-800">{{ cycleLabel }}</div>
                  </div>
                  <div>
                    <div class="text-sm text-violet-600 mb-1">收货场景</div>
                    <div class="font-medium text-stone-800">{{ sceneLabel }}</div>
                  </div>
                  <div>
                    <div class="text-sm text-violet-600 mb-1">每期预算</div>
                    <div class="font-bold text-violet-600">¥{{ budgetLimit }}</div>
                  </div>
                  <div>
                    <div class="text-sm text-violet-600 mb-1">每期数量</div>
                    <div class="font-medium text-stone-800">{{ candlesPerDelivery }} 个</div>
                  </div>
                </div>

                <div>
                  <div class="text-sm text-violet-600 mb-1">收货地址</div>
                  <div class="text-stone-700">{{ recipientAddress }}</div>
                </div>

                <div v-if="preferredAromas.length > 0">
                  <div class="text-sm text-violet-600 mb-1">偏好香调</div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="aroma in preferredAromas"
                      :key="aroma"
                      class="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full"
                    >
                      {{ aroma }}
                    </span>
                  </div>
                </div>

                <div v-if="excludedScents.length > 0">
                  <div class="text-sm text-red-600 mb-1">排斥香味</div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="aroma in excludedScents"
                      :key="aroma"
                      class="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full"
                    >
                      {{ aroma }}
                    </span>
                  </div>
                </div>

                <div v-if="specialDates.length > 0">
                  <div class="text-sm text-violet-600 mb-1">特殊日期</div>
                  <div class="space-y-1">
                    <div
                      v-for="date in specialDates"
                      :key="date.date"
                      class="text-sm text-stone-700"
                    >
                      {{ date.type === 'birthday' ? '🎂' : date.type === 'festival' ? '🎉' : '💝' }}
                      {{ date.date }} - {{ date.note || (date.type === 'birthday' ? '生日' : date.type === 'festival' ? '节日' : '纪念日') }}
                    </div>
                  </div>
                </div>

                <div v-if="userNotes">
                  <div class="text-sm text-violet-600 mb-1">备注</div>
                  <div class="text-stone-700">{{ userNotes }}</div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 mb-2">
                备注信息
              </label>
              <textarea
                v-model="userNotes"
                placeholder="其他需要说明的信息..."
                rows="3"
                class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50">
          <button
            v-if="currentStep > 1"
            @click="prevStep"
            class="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-stone-100 text-stone-700 rounded-xl border border-stone-200 transition-colors"
          >
            <ChevronLeft :size="18" />
            <span>上一步</span>
          </button>
          <div v-else></div>
          
          <div class="flex items-center gap-3">
            <button
              @click="closeModal"
              class="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              v-if="currentStep < totalSteps"
              @click="nextStep"
              :disabled="!canProceed"
              class="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>下一步</span>
              <ChevronRight :size="18" />
            </button>
            <button
              v-else
              @click="createSubscription"
              :disabled="!canProceed || creating"
              class="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check v-if="!creating" :size="18" />
              <span>{{ creating ? '创建中...' : '创建订阅' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
