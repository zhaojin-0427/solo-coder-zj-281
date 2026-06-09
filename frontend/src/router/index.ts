import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import FormulaList from '@/pages/FormulaList.vue'
import FormulaDetail from '@/pages/FormulaDetail.vue'
import IngredientList from '@/pages/IngredientList.vue'
import IngredientDetail from '@/pages/IngredientDetail.vue'
import RecordList from '@/pages/RecordList.vue'
import Analysis from '@/pages/Analysis.vue'
import Statistics from '@/pages/Statistics.vue'
import SubscriptionList from '@/pages/SubscriptionList.vue'
import SubscriptionDetail from '@/pages/SubscriptionDetail.vue'
import ReminderCenter from '@/pages/ReminderCenter.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/formulas'
  },
  {
    path: '/formulas',
    name: 'formulas',
    component: FormulaList
  },
  {
    path: '/formulas/:id',
    name: 'formula-detail',
    component: FormulaDetail
  },
  {
    path: '/ingredients',
    name: 'ingredients',
    component: IngredientList
  },
  {
    path: '/ingredients/:id',
    name: 'ingredient-detail',
    component: IngredientDetail
  },
  {
    path: '/records',
    name: 'records',
    component: RecordList
  },
  {
    path: '/subscriptions',
    name: 'subscriptions',
    component: SubscriptionList
  },
  {
    path: '/subscriptions/:id',
    name: 'subscription-detail',
    component: SubscriptionDetail
  },
  {
    path: '/analysis',
    name: 'analysis',
    component: Analysis
  },
  {
    path: '/statistics',
    name: 'statistics',
    component: Statistics
  },
  {
    path: '/reminders',
    name: 'reminders',
    component: ReminderCenter
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
