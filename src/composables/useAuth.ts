import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  // 返回响应式引用，避免解构丢失响应性
  const isLoggedIn = computed(() => authStore.isLoggedIn)
  const user = computed(() => authStore.user)

  function requireAuth(): boolean {
    if (!authStore.isLoggedIn) {
      return false
    }
    if (!authStore.user && authStore.initialized) {
      authStore.fetchUser()
    }
    return true
  }

  return { isLoggedIn, user, requireAuth }
}
