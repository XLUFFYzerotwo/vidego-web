import request from './request'
import type { ApiResponse, PageResult, PageParams } from '@/types/api'
import type { UserVO } from '@/types/user'
import type { VideoVO } from '@/types/video'

export const userApi = {
  getUserById(userId: number) {
    return request.get<any, ApiResponse<UserVO>>(`/users/${userId}`)
  },

  getUserVideos(userId: number, params?: PageParams) {
    return request.get<any, ApiResponse<PageResult<VideoVO>>>(`/users/${userId}/videos`, { params })
  },

  getLikedVideos(userId: number, params?: PageParams) {
    return request.get<any, ApiResponse<PageResult<VideoVO>>>(`/users/${userId}/likes`, { params })
  },

  getFavoritedVideos(userId: number, params?: PageParams) {
    return request.get<any, ApiResponse<PageResult<VideoVO>>>(`/users/${userId}/favorites`, { params })
  },

  getFollowing(userId: number, params?: PageParams) {
    return request.get<any, ApiResponse<PageResult<UserVO>>>(`/users/${userId}/following`, { params })
  },

  getFollowers(userId: number, params?: PageParams) {
    return request.get<any, ApiResponse<PageResult<UserVO>>>(`/users/${userId}/followers`, { params })
  },

  updateUser(userId: number, data: Partial<UserVO>) {
    return request.put<any, ApiResponse<UserVO>>(`/users/${userId}`, data)
  },

  follow(userId: number) {
    return request.post<any, ApiResponse<void>>(`/users/${userId}/follow`)
  },

  unfollow(userId: number) {
    return request.delete<any, ApiResponse<void>>(`/users/${userId}/follow`)
  },

  uploadAvatar(userId: number, file: File) {
    const form = new FormData()
    form.append('file', file)
    return request.post<any, ApiResponse<UserVO>>(`/users/${userId}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    })
  },
}
