import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/translate', name: 'translate', component: () => import('../views/TranslateView.vue') },
    { path: '/json', name: 'json', component: () => import('../views/JsonView.vue') },
    { path: '/sql', name: 'sql', component: () => import('../views/SqlView.vue') },
    { path: '/floating', name: 'floating', component: () => import('../views/FloatingWindow.vue') },
    { path: '/tool/:tool', name: 'tool', component: () => import('../views/ToolStandalone.vue') },
  ],
})

export default router
