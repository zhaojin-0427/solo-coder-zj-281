<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Droplets,
  Sparkles,
  AlertTriangle,
  MapPin,
  Shield,
  Leaf,
  Wind,
  Droplet,
  Palette,
  Heart,
  Info
} from 'lucide-vue-next'
import { ingredients } from '@/api'
import type { Ingredient } from '@/types'
import { cn } from '@/lib/utils'
import TolerancePlanCreateModal from '@/components/Tolerance/TolerancePlanCreateModal.vue'
import { useToleranceStore } from '@/stores/tolerance'

const route = useRoute()
const router = useRouter()
const ingredientId = computed(() => Number(route.params.id))
const toleranceStore = useToleranceStore()

const loading = ref(false)
const ingredient = ref<Ingredient | null>(null)
const showToleranceModal = ref(false)

const fetchIngredient = async () => {
  loading.value = true
  try {
    ingredient.value = await ingredients.getDetail(ingredientId.value)
  } catch (error) {
    console.error('获取成分详情失败:', error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const getTypeText = (type: string) => {
  return type === 'base' ? '基础油' : '单方精油'
}

const getTypeIcon = (type: string) => {
  return type === 'base' ? Droplets : Sparkles
}

const getTypeGradient = (type: string) => {
  return type === 'base' 
    ? 'from-amber-400 to-orange-500' 
    : 'from-emerald-400 to-teal-500'
}

const getTypeBg = (type: string) => {
  return type === 'base' ? 'bg-amber-50' : 'bg-emerald-50'
}

const getTypeBorder = (type: string) => {
  return type === 'base' ? 'border-amber-200' : 'border-emerald-200'
}

const getTypeTextColor = (type: string) => {
  return type === 'base' ? 'text-amber-700' : 'text-emerald-700'
}

const getSafetyStars = (level: number) => {
  return Math.max(1, 5 - level)
}

const getSafetyColor = (level: number) => {
  if (level <= 2) return 'text-green-500'
  if (level <= 3) return 'text-yellow-500'
  return 'text-red-500'
}

const getSafetyBg = (level: number) => {
  if (level <= 2) return 'bg-green-100 text-green-700'
  if (level <= 3) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

const getSafetyText = (level: number) => {
  if (level <= 2) return '安全性高，可放心使用'
  if (level <= 3) return '使用时需注意稀释比例'
  return '刺激性较强，需谨慎使用'
}

onMounted(() => {
  fetchIngredient()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
    <div class="max-w-4xl mx-auto px-4 py-6">
      <div class="flex items-center gap-4 mb-6">
        <button
          @click="goBack"
          class="p-2 hover:bg-white rounded-xl transition-colors"
        >
          <ArrowLeft :size="20" class="text-stone-600" />
        </button>
        <h1 class="text-2xl font-bold text-stone-800">成分详情</h1>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="!ingredient" class="text-center py-12">
        <Droplets :size="48" class="mx-auto text-stone-300 mb-4" />
        <p class="text-stone-500">成分不存在</p>
      </div>

      <div v-else class="space-y-6">
        <div
          :class="[
            'rounded-2xl overflow-hidden shadow-lg',
            getTypeBg(ingredient.type),
            getTypeBorder(ingredient.type),
            'border'
          ]"
        >
          <div
            :class="[
              'h-48 flex items-center justify-center relative overflow-hidden',
              'bg-gradient-to-br',
              getTypeGradient(ingredient.type)
            ]"
          >
            <div class="absolute inset-0 opacity-20">
              <div class="absolute top-8 left-8 w-32 h-32 rounded-full bg-white/30 blur-3xl"></div>
              <div class="absolute bottom-8 right-8 w-40 h-40 rounded-full bg-white/20 blur-3xl"></div>
            </div>
            <div
              :class="[
                'w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center relative z-10',
                'shadow-2xl'
              ]"
            >
              <component
                :is="getTypeIcon(ingredient.type)"
                :size="56"
                class="text-white"
              />
            </div>
            <div class="absolute top-4 right-4">
              <span
                :class="[
                  'px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm bg-white/20 text-white'
                ]"
              >
                {{ getTypeText(ingredient.type) }}
              </span>
            </div>
          </div>

          <div class="p-6">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 class="text-3xl font-bold text-stone-800">{{ ingredient.name }}</h2>
                <p class="text-lg text-stone-500 italic mt-1">{{ ingredient.english_name }}</p>
              </div>
              <div class="text-right">
                <div :class="['flex items-center gap-1', getSafetyColor(ingredient.safety_level)]">
                  <Shield :size="20" />
                  <span class="font-bold text-lg">{{ getSafetyStars(ingredient.safety_level) }}/5</span>
                </div>
                <div class="text-xs text-stone-500 mt-0.5">安全等级</div>
              </div>
            </div>

            <div
              :class="[
                'flex items-center gap-2 px-4 py-3 rounded-xl',
                getSafetyBg(ingredient.safety_level)
              ]"
            >
              <Info :size="18" />
              <span class="text-sm">{{ getSafetyText(ingredient.safety_level) }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <MapPin :size="18" class="text-blue-600" />
              </div>
              <h3 class="font-semibold text-stone-800">产地</h3>
            </div>
            <p class="text-stone-600">{{ ingredient.origin || '暂无信息' }}</p>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <Heart :size="18" class="text-purple-600" />
              </div>
              <h3 class="font-semibold text-stone-800">适配肤质</h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="type in ingredient.skin_types"
                :key="type"
                class="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-lg"
              >
                {{ type }}
              </span>
              <span v-if="ingredient.skin_types.length === 0" class="text-stone-400 text-sm">
                暂无信息
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center">
              <Leaf :size="18" class="text-stone-600" />
            </div>
            <h3 class="font-semibold text-stone-800">特性描述</h3>
          </div>
          <p class="text-stone-600 leading-relaxed">
            {{ ingredient.description || '暂无详细描述' }}
          </p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <div class="flex items-center gap-2 mb-4">
            <div
              :class="[
                'w-9 h-9 rounded-xl flex items-center justify-center',
                ingredient.type === 'base' ? 'bg-amber-100' : 'bg-emerald-100'
              ]"
            >
              <Sparkles :size="18" :class="getTypeTextColor(ingredient.type)" />
            </div>
            <h3 class="font-semibold text-stone-800">主要功效</h3>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="eff in ingredient.effects"
              :key="eff"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-medium',
                ingredient.type === 'base' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              ]"
            >
              {{ eff }}
            </span>
            <span v-if="ingredient.effects.length === 0" class="text-stone-400 text-sm">
              暂无功效信息
            </span>
          </div>
        </div>

        <div
          v-if="ingredient.contraindications.length > 0"
          class="bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl shadow-sm border border-red-200 p-6"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle :size="24" class="text-red-500" />
            </div>
            <div>
              <h3 class="font-bold text-red-800 text-lg mb-3">禁忌提示</h3>
              <ul class="space-y-2">
                <li
                  v-for="item in ingredient.contraindications"
                  :key="item"
                  class="flex items-start gap-2 text-red-700"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <h3 class="font-semibold text-stone-800 mb-4">感官特性</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
              <div class="flex items-center gap-2 mb-2">
                <Wind :size="18" class="text-orange-500" />
                <span class="text-sm font-medium text-orange-800">香气</span>
              </div>
              <p class="text-stone-600 text-sm">{{ ingredient.aroma || '暂无信息' }}</p>
            </div>
            <div class="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
              <div class="flex items-center gap-2 mb-2">
                <Palette :size="18" class="text-pink-500" />
                <span class="text-sm font-medium text-pink-800">颜色</span>
              </div>
              <p class="text-stone-600 text-sm">{{ ingredient.color || '暂无信息' }}</p>
            </div>
            <div class="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
              <div class="flex items-center gap-2 mb-2">
                <Droplet :size="18" class="text-cyan-500" />
                <span class="text-sm font-medium text-cyan-800">黏稠度</span>
              </div>
              <p class="text-stone-600 text-sm">{{ ingredient.viscosity || '暂无信息' }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="ingredient.pairing_suggestions.length > 0"
          class="bg-white rounded-2xl shadow-sm border border-stone-100 p-6"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
              <Sparkles :size="18" class="text-teal-600" />
            </div>
            <h3 class="font-semibold text-stone-800">搭配建议</h3>
          </div>
          <div class="space-y-3">
            <div
              v-for="(suggestion, index) in ingredient.pairing_suggestions"
              :key="index"
              class="flex items-start gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100"
            >
              <div class="w-6 h-6 rounded-full bg-teal-200 flex items-center justify-center flex-shrink-0 text-teal-700 text-sm font-bold">
                {{ index + 1 }}
              </div>
              <p class="text-teal-800 text-sm">{{ suggestion }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-stone-800 flex items-center gap-2">
              <Shield :size="20" class="text-amber-500" />
              耐受建立
            </h3>
            <p class="text-sm text-stone-500 mt-1">
              {{ ingredient.safety_level >= 4 ? '该成分刺激性较强，建议先建立皮肤耐受性' : '科学建立耐受，降低刺激风险' }}
            </p>
          </div>
          <button
            @click="showToleranceModal = true"
            :class="[
              'px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-medium',
              ingredient.safety_level >= 4
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-200'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200'
            ]"
          >
            <Shield :size="18" />
            <span>开始耐受计划</span>
          </button>
        </div>
      </div>
    </div>

    <TolerancePlanCreateModal
      v-model:visible="showToleranceModal"
      :prefill-data="{
        sourceType: 'ingredient',
        sourceId: ingredientId,
        sourceName: ingredient?.name || '',
        name: ingredient ? `「${ingredient.name}」耐受计划` : '',
        skinSensitivityLevel: ingredient?.safety_level || 3
      }"
      @success="toleranceStore.fetchList"
    />
  </div>
</template>
