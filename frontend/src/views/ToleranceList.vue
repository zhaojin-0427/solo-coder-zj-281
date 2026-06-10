<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Droplets,
  Plus,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  FileX
} from 'lucide-vue-next'
import { useToleranceStore } from '@/stores/tolerance'
import TolerancePlanCard from '@/components/Tolerance/TolerancePlanCard.vue'
import TolerancePlanCreateModal from '@/components/Tolerance/TolerancePlanCreateModal.vue'
import type { TolerancePlan, ToleranceSourceType } from '@/types'

const router = useRouter()
const toleranceStore = useToleranceStore()

const loading = ref(true)
const searchQuery = ref('')
const activeFilter = ref<'all' | 'active' | 'completed' | 'paused' | 'interrupted' | 'failed'>('all')
const showCreateModal = ref(false)
const stats = ref<any>(null)

const filterOptions = [
  { value: 'all', label: '全部', icon: FileX },
  { value: 'active', label: '进行中', icon: Clock },
  { value: 'completed', label: '已完成', icon: CheckCircle },
  { value: 'paused', label: '已暂停', icon: AlertTriangle }
]

const fetchData = async () => {
  loading.value = true
  try {
    await toleranceStore.fetchList()
    stats.value = await toleranceStore.fetchStats()
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const filteredPlans = computed(() => {
  let plans = toleranceStore.plans
  
  if (activeFilter.value !== 'all') {
    plans = plans.filter(p => p.status === activeFilter.value)
  }
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    plans = plans.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sourceName.toLowerCase().includes(query)
    )
  }
  
  return plans
})

const handleCreateSuccess = () => {
  showCreateModal.value = false
  fetchData()
}

const getSourceTypeIcon = (sourceType: ToleranceSourceType) => {
  return sourceType === 'formula' ? '🧪' : '🔬'
}
</script>

<template>
  <div class="min-h-screen bg-bg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-primary to-violet-500 rounded-xl flex items-center justify-center">
              <Droplets :size="22" class="text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-text">成分耐受计划</h1>
              <p class="text-text-muted text-sm">科学建立皮肤耐受，降低刺激风险</p>
            </div>
          </div>
        </div>
        <button
          @click="showCreateModal = true"
          class="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus :size="18" />
          <span>新建耐受计划</span>
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-bg-card rounded-2xl p-5 border border-border">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar :size="20" class="text-blue-600" />
            </div>
            <span class="text-text-soft text-sm">总计划</span>
          </div>
          <p class="text-3xl font-bold text-text">{{ stats?.totalPlans || 0 }}</p>
        </div>
        <div class="bg-bg-card rounded-2xl p-5 border border-border">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp :size="20" class="text-emerald-600" />
            </div>
            <span class="text-text-soft text-sm">进行中</span>
          </div>
          <p class="text-3xl font-bold text-emerald-600">{{ stats?.activePlans || 0 }}</p>
        </div>
        <div class="bg-bg-card rounded-2xl p-5 border border-border">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle :size="20" class="text-green-600" />
            </div>
            <span class="text-text-soft text-sm">已完成</span>
          </div>
          <p class="text-3xl font-bold text-green-600">{{ stats?.completedPlans || 0 }}</p>
        </div>
        <div class="bg-bg-card rounded-2xl p-5 border border-border">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle :size="20" class="text-amber-600" />
            </div>
            <span class="text-text-soft text-sm">中断风险</span>
          </div>
          <p class="text-3xl font-bold text-amber-600">{{ stats?.interruptedPlans || 0 }}</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="relative flex-1">
          <Search :size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索计划名称或来源..."
            class="w-full pl-11 pr-4 py-3 bg-bg-card border border-border rounded-xl text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="opt in filterOptions"
            :key="opt.value"
            @click="activeFilter = opt.value as any"
            :class="[
              'px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap',
              activeFilter === opt.value
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-bg-card text-text-soft hover:bg-bg-soft border border-border'
            ]"
          >
            <component :is="opt.icon" :size="16" />
            <span class="text-sm font-medium">{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 :size="32" class="animate-spin text-primary" />
      </div>

      <div v-else-if="filteredPlans.length === 0" class="bg-bg-card rounded-2xl border border-border p-12 text-center">
        <div class="w-20 h-20 bg-bg-soft rounded-full flex items-center justify-center mx-auto mb-4">
          <Droplets :size="36" class="text-text-muted" />
        </div>
        <h3 class="text-lg font-semibold text-text mb-2">暂无耐受计划</h3>
        <p class="text-text-muted mb-6 max-w-sm mx-auto">
          为您的配方或高风险成分创建耐受计划，科学建立皮肤耐受性
        </p>
        <button
          @click="showCreateModal = true"
          class="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all inline-flex items-center gap-2"
        >
          <Plus :size="18" />
          <span>创建第一个计划</span>
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <TolerancePlanCard
          v-for="plan in filteredPlans"
          :key="plan.id"
          :plan="plan"
        />
      </div>
    </div>

    <TolerancePlanCreateModal
      v-model:visible="showCreateModal"
      @success="handleCreateSuccess"
    />
  </div>
</template>
