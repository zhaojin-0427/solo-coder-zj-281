<template>
  <div v-if="warnings && warnings.length > 0" class="space-y-3">
    <div
      v-for="(warning, index) in warnings"
      :key="index"
      :class="[
        'rounded-xl p-4 border',
        warning.level === 'danger'
          ? 'bg-red-50 border-red-200'
          : warning.level === 'warning'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-blue-50 border-blue-200'
      ]"
    >
      <div class="flex items-start gap-3">
        <div
          :class="[
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            warning.level === 'danger'
              ? 'bg-red-500 text-white'
              : warning.level === 'warning'
              ? 'bg-amber-500 text-white'
              : 'bg-blue-500 text-white'
          ]"
        >
          <component :is="getWarningIcon(warning.type)" :size="16" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span
              :class="[
                'text-sm font-semibold',
                warning.level === 'danger'
                  ? 'text-red-700'
                  : warning.level === 'warning'
                  ? 'text-amber-700'
                  : 'text-blue-700'
              ]"
            >
              {{ warning.message }}
            </span>
          </div>
          <p
            v-if="warning.details"
            :class="[
              'text-sm',
              warning.level === 'danger'
                ? 'text-red-600'
                : warning.level === 'warning'
                ? 'text-amber-600'
                : 'text-blue-600'
            ]"
          >
            {{ warning.details }}
          </p>
          <div
            v-if="warning.relatedIngredients && warning.relatedIngredients.length > 0"
            class="mt-2 flex flex-wrap gap-1.5"
          >
            <span
              v-for="ing in warning.relatedIngredients"
              :key="ing.id"
              :class="[
                'px-2 py-0.5 text-xs font-medium rounded-md',
                warning.level === 'danger'
                  ? 'bg-red-100 text-red-600'
                  : warning.level === 'warning'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-blue-100 text-blue-600'
              ]"
            >
              {{ ing.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, AlertCircle, Gauge } from 'lucide-vue-next';
import type { FormulaRiskWarning } from '@/types';

interface Props {
  warnings: FormulaRiskWarning[] | null;
}

defineProps<Props>();

const getWarningIcon = (type: string) => {
  switch (type) {
    case 'contraindication':
      return AlertTriangle;
    case 'sensitivity_history':
      return AlertCircle;
    case 'drops_ratio':
      return Gauge;
    default:
      return AlertCircle;
  }
};
</script>
