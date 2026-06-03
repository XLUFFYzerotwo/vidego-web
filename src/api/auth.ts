import request from './request'
import type { ApiResponse } from '@/types/api'
import type { ChangePasswordRequest, LoginVO, LoginRequest, RegisterRequest, UserVO } from '@/types/user'

export const authApi = {
  register(data: RegisterRequest) {
    return request.post<any, ApiResponse<LoginVO>>('/auth/register', data)
  },

  login(data: LoginRequest) {
    return request.post<any, ApiResponse<LoginVO>>('/auth/login', data)
  },

  logout() {
    return request.post<any, ApiResponse<void>>('/auth/logout')
  },

  refresh(refreshToken: string) {
    return request.post<any, ApiResponse<LoginVO>>('/auth/refresh', refreshToken, {
      headers: { 'Content-Type': 'text/plain' },
    })
  },

  getMe() {
    return request.get<any, ApiResponse<UserVO>>('/auth/me')
  },

  changePassword(data: ChangePasswordRequest) {
    return request.put<any, ApiResponse<void>>('/auth/password', data)
  },
}
