import { createRouter, createWebHistory } from 'vue-router'
import PlayerView from '../views/PlayerView.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  {
    path: '/',
    name: 'Player',
    component: PlayerView,
    meta: {
      title: 'Spela Quiz'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: {
      title: 'Admin Panel'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Uppdatera sidtitel baserat på route
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - Realtids Quiz` : 'Realtids Quiz'
  next()
})

export default router