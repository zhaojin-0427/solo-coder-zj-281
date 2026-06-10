<template>
  <div class="flex min-h-screen bg-bg">
    <aside
      class="fixed left-0 top-0 h-screen w-64 bg-bg-card border-r border-border shadow-sm z-30 transform transition-transform duration-base lg:translate-x-0"
      :class="{ '-translate-x-full': !sidebarOpen }"
    >
      <div class="flex flex-col h-full">
        <div class="p-6 border-b border-border">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg
                class="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h1 class="text-lg font-semibold text-text">芳香配方库</h1>
              <p class="text-xs text-text-muted">Aroma Formula</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 p-4 overflow-y-auto">
          <ul class="space-y-1">
            <li v-for="item in navItems" :key="item.path">
              <router-link
                :to="item.path"
                class="nav-link"
                :class="{ 'nav-link-active': isActive(item.path) }"
                @click="handleNavClick"
              >
                <component :is="item.icon" class="w-5 h-5" />
                <span>{{ item.label }}</span>
                <span
                  v-if="getBadgeCount(item) > 0"
                  class="ml-auto min-w-[20px] h-5 px-1.5 bg-error text-white text-xs font-medium rounded-full flex items-center justify-center"
                >
                  {{ getBadgeCount(item) > 99 ? '99+' : getBadgeCount(item) }}
                </span>
              </router-link>
            </li>
          </ul>
        </nav>

        <div class="p-4 border-t border-border">
          <div class="p-4 rounded-xl bg-secondary-apricot-light/50">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 rounded-full bg-secondary-apricot flex items-center justify-center">
                <svg
                  class="w-4 h-4 text-text"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <span class="text-sm font-medium text-text">今日提示</span>
            </div>
            <p class="text-xs text-text-soft">
              每种精油都有独特的功效，使用前请仔细阅读注意事项。
            </p>
          </div>
        </div>
      </div>
    </aside>

    <div
      class="fixed inset-0 bg-text/30 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-base"
      :class="{
        'opacity-100 pointer-events-auto': sidebarOpen,
        'opacity-0 pointer-events-none': !sidebarOpen
      }"
      @click="sidebarOpen = false"
    />

    <div class="flex-1 lg:ml-64">
      <header class="sticky top-0 h-16 bg-bg-card/80 backdrop-blur-md border-b border-border z-10">
        <div class="flex items-center justify-between h-full px-4 lg:px-8">
          <div class="flex items-center gap-4">
            <button
              class="lg:hidden p-2 rounded-lg hover:bg-bg-soft transition-colors duration-fast"
              @click="sidebarOpen = !sidebarOpen"
            >
              <svg
                class="w-6 h-6 text-text-soft"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h2 class="text-xl font-semibold text-text">{{ currentPageTitle }}</h2>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="router.push('/reminders')"
              class="p-2 rounded-lg hover:bg-bg-soft transition-colors duration-fast relative"
            >
              <svg
                class="w-5 h-5 text-text-soft"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span
                v-if="unreadCount > 0"
                class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center"
              >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>
            <button class="p-2 rounded-lg hover:bg-bg-soft transition-colors duration-fast">
              <svg
                class="w-5 h-5 text-text-soft"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors duration-fast">
              <svg
                class="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main class="p-4 lg:p-8 animate-fade-in">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSchedulesStore } from '@/stores/schedules'
import { useToleranceStore } from '@/stores/tolerance'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)
const schedulesStore = useSchedulesStore()
const toleranceStore = useToleranceStore()
let refreshTimer: number | null = null

interface NavItem {
  path: string
  label: string
  icon: () => ReturnType<typeof h>
  badge?: number | (() => number)
}

const reminderBadge = computed(() => schedulesStore.stats?.totalPending || 0)
const toleranceBadge = computed(() => toleranceStore.stats?.activePlans || 0)

const navItems: NavItem[] = [
  {
    path: '/formulas',
    label: '配方库',
    icon: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
      })
    ])
  },
  {
    path: '/ingredients',
    label: '成分百科',
    icon: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
      })
    ])
  },
  {
    path: '/records',
    label: '使用记录',
    icon: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
      })
    ])
  },
  {
    path: '/subscriptions',
    label: '订阅管理',
    icon: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 8v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
      })
    ])
  },
  {
    path: '/analysis',
    label: '肤质分析',
    icon: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
      })
    ])
  },
  {
    path: '/statistics',
    label: '统计',
    icon: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
      })
    ])
  },
  {
    path: '/reminders',
    label: '提醒中心',
    badge: () => reminderBadge.value,
    icon: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
      })
    ])
  },
  {
    path: '/tolerance',
    label: '耐受计划',
    badge: () => toleranceBadge.value,
    icon: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
      })
    ])
  }
]

const currentPageTitle = computed(() => {
  const navItem = navItems.find(item => route.path.startsWith(item.path))
  return navItem?.label || '芳香配方库'
})

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const getBadgeCount = (item: NavItem) => {
  if (typeof item.badge === 'function') {
    return item.badge()
  }
  return item.badge || 0
}

const handleNavClick = () => {
  if (window.innerWidth < 1024) {
    sidebarOpen.value = false
  }
}

const unreadCount = computed(() => {
  return (schedulesStore.stats?.pendingToday || 0) + (schedulesStore.stats?.riskCount || 0)
})

const refreshNotifications = async () => {
  try {
    await Promise.all([
      schedulesStore.fetchTodayReminders(),
      schedulesStore.fetchRiskWarnings(),
    ])
  } catch (e) {
    console.error('刷新提醒失败', e)
  }
}

onMounted(() => {
  refreshNotifications()
  refreshTimer = window.setInterval(refreshNotifications, 60000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: all 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
