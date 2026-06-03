import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserVO, LoginVO, LoginRequest, RegisterRequest } from '@/types/user'
import { authApi } from '@/api/auth'
import { getToken, setToken, setRefreshToken, clearAuth } from '@/utils/token'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserVO | null>(null)
  const initialized = ref(false) // 标记是否已完成 session 恢复

  /**
   * 是否已登录。依赖 user ref（响应式）兜底 localStorage（首次加载时）。
   * user.value 变化时 computed 自动重算，此时 getToken() 拿到最新值。
   */
  const isLoggedIn = computed(() => user.value !== null || !!getToken())

  /**
   * 登录
   */
  async function login(data: LoginRequest) {
    const res = await authApi.login(data)
    const loginVO: LoginVO = res.data
    setToken(loginVO.token)
    setRefreshToken(loginVO.refreshToken)
    user.value = loginVO.user
    router.push('/')
  }

  /**
   * 注册
   */
  async function register(data: RegisterRequest) {
    const res = await authApi.register(data)
    const loginVO: LoginVO = res.data
    setToken(loginVO.token)
    setRefreshToken(loginVO.refreshToken)
    user.value = loginVO.user
    router.push('/')
  }

  /**
   * 退出登录
   */
  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Ignore — still clear local state
    }
    clearAuth()
    user.value = null
    router.push('/login')
  }

  /**
   * 从服务端拉取当前用户信息（页面刷新后恢复 session）
   */
  async function fetchUser() {
    try {
      const res = await authApi.getMe()
      user.value = res.data
    } catch {
      clearAuth()
      user.value = null
    }
  }

  /**
   * 应用启动时调用：若有 token 则恢复登录状态
   */
  async function restoreSession() {
    if (getToken()) {
      await fetchUser()
    }
    initialized.value = true
  }

  return { user, initialized, isLoggedIn, login, register, logout, fetchUser, restoreSession }
})
