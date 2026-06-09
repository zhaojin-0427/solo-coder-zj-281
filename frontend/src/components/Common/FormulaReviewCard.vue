<template>
  <div class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
            <BarChart3 :size="20" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-stone-800">配方复盘分析</h3>
            <p class="text-sm text-emerald-600">基于 {{ review?.useCount || 0 }} 次使用记录</p>
          </div>
        </div>
        <div v-if="review" class="text-right">
          <div class="text-2xl font-bold text-emerald-600">{{ review.fitnessScore }}</div>
          <div class="text-xs text-stone-500">综合适配分</div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="md" />
    </div>

    <div v-else-if="!review" class="p-6 text-center">
      <AlertCircle :size="48" class="mx-auto text-stone-300 mb-4" />
      <p class="text-stone-500">暂无复盘数据</p>
    </div>

    <div v-else class="p-6 space-y-6">
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-emerald-50/50 rounded-xl p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <Droplets :size="16" class="text-emerald-600" />
            <span class="text-sm font-medium text-emerald-800">平均吸收度</span>
          </div>
          <StarRating :model-value="review.avgAbsorption" readonly color="primary" show-value />
        </div>
        <div class="bg-rose-50/50 rounded-xl p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <Zap :size="16" class="text-rose-600" />
            <span class="text-sm font-medium text-rose-800">平均敏感度</span>
          </div>
          <StarRating :model-value="review.avgSensitivity" readonly color="warning" show-value />
        </div>
        <div class="bg-amber-50/50 rounded-xl p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <Heart :size="16" class="text-amber-600" />
            <span class="text-sm font-medium text-amber-800">平均改善效果</span>
          </div>
          <StarRating :model-value="review.avgImprovement" readonly color="primary" show-value />
        </div>
      </div>

      <div v-if="review.lastFeedback" class="bg-stone-50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <MessageSquare :size="16" class="text-stone-500" />
          <span class="text-sm font-medium text-stone-700">最近一次使用反馈</span>
          <span v-if="review.lastFeedbackDate" class="text-xs text-stone-400">
            ({{ formatDate(review.lastFeedbackDate) }})
          </span>
          <StarRating
            v-if="review.lastRating"
            :model-value="review.lastRating"
            readonly
            size="sm"
            color="primary"
          />
        </div>
        <p class="text-sm text-stone-600">{{ review.lastFeedback }}</p>
      </div>

      <div v-if="review.reactionKeywords.length > 0">
        <div class="flex items-center gap-2 mb-3">
          <Tags :size="16" class="text-stone-500" />
          <span class="text-sm font-medium text-stone-700">主要皮肤反应关键词</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="keyword in review.reactionKeywords"
            :key="keyword"
            class="px-3 py-1 text-xs bg-stone-100 text-stone-600 rounded-full"
          >
            {{ keyword }}
          </span>
        </div>
      </div>

      <div
        :class="[
          'rounded-xl p-4 border',
          review.riskLevel === 'high'
            ? 'bg-red-50 border-red-200'
            : review.riskLevel === 'medium'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        ]"
      >
        <div class="flex items-start gap-3">
          <div
            :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              review.riskLevel === 'high'
                ? 'bg-red-500 text-white'
                : review.riskLevel === 'medium'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-500 text-white'
            ]"
          >
            <component :is="recommendationIcon" :size="20" />
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span
                :class="[
                  'text-sm font-semibold',
                  review.riskLevel === 'high'
                    ? 'text-red-700'
                    : review.riskLevel === 'medium'
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                ]"
              >
                {{ recommendationLabel }}
              </span>
              <span
                :class="[
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  review.riskLevel === 'high'
                    ? 'bg-red-100 text-red-600'
                    : review.riskLevel === 'medium'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
                ]"
              >
                {{ riskLevelLabel }}
              </span>
            </div>
            <p class="text-sm text-stone-600 mb-2">{{ review.adaptationConclusion }}</p>
            <p
              :class="[
                'text-sm',
                review.riskLevel === 'high'
                  ? 'text-red-600'
                  : review.riskLevel === 'medium'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              ]"
            >
              <strong>建议：</strong>{{ review.recommendationReason }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="review.sensitiveIngredients.length > 0">
        <div class="flex items-center gap-2 mb-3">
          <AlertTriangle :size="16" class="text-amber-500" />
          <span class="text-sm font-medium text-stone-700">需关注的敏感成分</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="ing in review.sensitiveIngredients"
            :key="ing.id"
            class="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-md bg-amber-200 flex items-center justify-center">
                <Droplets :size="12" class="text-amber-700" />
              </div>
              <span class="text-sm font-medium text-stone-700">{{ ing.name }}</span>
            </div>
            <div class="text-right">
              <span class="text-sm text-amber-600 font-medium">
                敏感 {{ ing.sensitivityCount }} 次 · 平均 {{ ing.avgSensitivity }} 分
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  BarChart3,
  Droplets,
  Zap,
  Heart,
  MessageSquare,
  Tags,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  PauseCircle,
  Edit3,
  Minus
} from 'lucide-vue-next';
import StarRating from './StarRating.vue';
import LoadingSpinner from './LoadingSpinner.vue';
import type { FormulaReviewSummary } from '@/types';

interface Props {
  review: FormulaReviewSummary | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const recommendationIcon = computed(() => {
  switch (props.review?.recommendation) {
    case 'continue':
      return CheckCircle;
    case 'suspend':
      return PauseCircle;
    case 'replace_ingredient':
      return Edit3;
    case 'reduce_drops':
      return Minus;
    default:
      return CheckCircle;
  }
});

const recommendationLabel = computed(() => {
  switch (props.review?.recommendation) {
    case 'continue':
      return '继续使用';
    case 'suspend':
      return '暂停使用';
    case 'replace_ingredient':
      return '更换敏感成分';
    case 'reduce_drops':
      return '降低精油滴数';
    default:
      return '继续使用';
  }
});

const riskLevelLabel = computed(() => {
  switch (props.review?.riskLevel) {
    case 'high':
      return '高风险';
    case 'medium':
      return '中风险';
    case 'low':
      return '低风险';
    default:
      return '低风险';
  }
});

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};
</script>
