<template>
  <span
    class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-all duration-fast"
    :class="tagClass"
  >
    <span v-if="icon" class="w-3 h-3">
      <component :is="icon" />
    </span>
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

interface Props {
  label?: string
  type?: 'efficacy' | 'contraindication' | 'skinType' | 'default'
  size?: 'sm' | 'md'
  icon?: Component
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  type: 'default',
  size: 'md'
})

const tagClass = computed(() => {
  const typeClasses = {
    efficacy: 'bg-primary/10 text-primary border border-primary/20',
    contraindication: 'bg-error/10 text-error border border-error/20',
    skinType: 'bg-secondary-lavender/10 text-secondary-lavender border border-secondary-lavender/20',
    default: 'bg-bg-soft text-text-soft border border-border'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs'
  }

  return [typeClasses[props.type], sizeClasses[props.size]]
})
</script>
