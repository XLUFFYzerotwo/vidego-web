import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/token'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      redirect: '/home',
      children: [
        {
          path: 'home',
          name: 'Home',
          component: () => import('@/views/home/HomeView.vue'),
          meta: { title: 'Home' },
        },
        {
          path: 'upload',
          name: 'Upload',
          component: () => import('@/views/upload/UploadView.vue'),
          meta: { title: 'Upload', requiresAuth: true },
        },
        {
          path: 'video/:id',
          name: 'VideoDetail',
          component: () => import('@/views/video/VideoDetailView.vue'),
          meta: { title: 'Video' },
        },
        {
          path: 'search',
          name: 'Search',
          component: () => import('@/views/search/SearchView.vue'),
          meta: { title: 'Search' },
        },
        {
          path: 'user/:id',
          name: 'Profile',
          component: () => import('@/views/user/ProfileView.vue'),
          meta: { title: 'Profile' },
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/user/SettingsView.vue'),
          meta: { title: 'Settings', requiresAuth: true },
        },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginView.vue'),
      meta: { title: 'Login', guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/login/RegisterView.vue'),
      meta: { title: 'Register', guest: true },
    },
  ],
})

// ── 导航守卫 ──
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'Vidego'} - Vidego`

  const requiresAuth = to.meta.requiresAuth === true
  const isGuest = to.meta.guest === true
  const loggedIn = !!getToken()

  if (requiresAuth && !loggedIn) {
    next('/login')
  } else if (isGuest && loggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
