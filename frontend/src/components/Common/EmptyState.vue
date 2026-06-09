<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
    <div class="w-20 h-20 mb-6 rounded-full bg-bg-soft flex items-center justify-center">
      <slot name="icon">
        <svg
          class="w-10 h-10 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </slot>
    </div>

    <h3 class="text-lg font-semibold text-text mb-2">
      <slot name="title">{{ title }}</slot>
    </h3>

    <p class="text-text-muted max-w-sm mb-6">
      <slot name="description">{{ description }}</slot>
    </p>

    <div v-if="$slots.actions || actionText" class="flex items-center gap-3">
      <slot name="actions">
        <button
          v-if="actionText"
          type="button"
          class="btn btn-primary"
          @click="$emit('action')"
        >
          {{ actionText }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  actionText?: string
}

withDefaults(defineProps<Props>(), {
  title: '暂无数据',
  description: '这里还没有任何内容，添加一些数据开始使用吧。',
  actionText: ''
})

defineEmits<{
  action: []
}>()
</script>
