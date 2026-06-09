<template>
  <div
    class="flex items-center justify-center"
    :class="containerClass"
  >
    <div
      class="rounded-full border-2 border-transparent border-t-primary animate-spin"
      :class="spinnerClass"
      :style="{ borderTopColor: colorValue, borderRightColor: colorValue }"
    />
    <span v-if="text" class="text-sm text-text-soft">
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white'
  text?: string
  fullScreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  text: '',
  fullScreen: false
})

const containerClass = computed(() => {
  const classes: string[] = []
  
  if (props.fullScreen) {
    classes.push('fixed inset-0 bg-bg/80 backdrop-blur-sm z-50')
  }
  
  if (props.text) {
    classes.push('gap-3')
  }
  
  return classes
})

const spinnerClass = computed(() => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  
  return sizeClasses[props.size]
})

const colorValue = computed(() => {
  const colorMap = {
    primary: '#7BA17B',
    secondary: '#B8A9C9',
    white: '#FFFFFF'
  }
  return colorMap[props.color]
})
</script>
