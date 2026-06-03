import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, clearAuth } from '@/utils/token'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** ── 请求拦截器 ── */
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/** ── 响应拦截器 ── */
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 业务错误（后端返回了 code !== 200）
    if (res.code !== 200) {
      ElMessage.error(res.message || 'request failed')

      // token 过期或无效，跳转登录
      if (res.code === 401 || res.code === 1006 || res.code === 1007) {
        clearAuth()
        router.push('/login')
      }

      return Promise.reject(new Error(res.message))
    }

    return res
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          clearAuth()
          router.push('/login')
          ElMessage.error('login expired, please login again')
          break
        case 403:
          ElMessage.error('no permission')
          break
        case 404:
          ElMessage.error('resource not found')
          break
        case 500:
          ElMessage.error('server error')
          break
        default:
          ElMessage.error(error.message || 'network error')
      }
    } else {
      ElMessage.error('network error, please try again later')
    }
    return Promise.reject(error)
  },
)

export default request
