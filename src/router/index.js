import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import FoodFactsView from '@/views/FoodFactsView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/food-facts',
    name: 'FoodFacts',
    component: FoodFactsView
  },
  {
    path: '/food-facts/:fdcId',
    name: 'FoodFactsDetails',
    component: FoodFactsView,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
