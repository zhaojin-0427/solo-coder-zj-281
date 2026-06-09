<template>
  <div class="flex items-center gap-1">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      class="focus:outline-none transition-transform duration-fast hover:scale-110"
      :class="{ 'cursor-pointer': !readonly, 'cursor-default': readonly }"
      :disabled="readonly"
      @click="handleClick(star)"
      @mouseenter="handleMouseEnter(star)"
      @mouseleave="handleMouseLeave"
    >
      <svg
        class="w-5 h-5 transition-colors duration-fast"
        :class="getStarClass(star)"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    </button>
    <span v-if="showValue" class="ml-2 text-sm font-medium text-text-soft">
      {{ displayValue }} / 5
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue?: number
  readonly?: boolean
  showValue?: boolean
  color?: 'primary' | 'warning' | 'secondary'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  readonly: false,
  showValue: false,
  color: 'warning'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [value: number]
}>()

const hoverValue = ref(0)

const displayValue = computed(() => {
  return hoverValue.value || props.modelValue
})

const getStarClass = (star: number) => {
  const isFilled = star <= displayValue.value
  const colorClasses = {
    primary: isFilled ? 'text-primary' : 'text-border',
    warning: isFilled ? 'text-warning' : 'text-border',
    secondary: isFilled ? 'text-secondary-lavender' : 'text-border'
  }
  return colorClasses[props.color]
}

const handleClick = (star: number) => {
  if (props.readonly) return
  emit('update:modelValue', star)
  emit('change', star)
}

const handleMouseEnter = (star: number) => {
  if (props.readonly) return
  hoverValue.value = star
}

const handleMouseLeave = () => {
  hoverValue.value = 0
}
</script>
