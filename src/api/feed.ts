import request from './request'
import type { ApiResponse, PageResult, PageParams } from '@/types/api'
import type { VideoVO } from '@/types/video'

export const feedApi = {
  getRecommended(params?: PageParams) {
    return request.get<any, ApiResponse<PageResult<VideoVO>>>('/feed/recommended', { params })
  },

  getLatest(params?: PageParams) {
    return request.get<any, ApiResponse<PageResult<VideoVO>>>('/feed/latest', { params })
  },

  getByTag(tag: string, params?: PageParams) {
    return request.get<any, ApiResponse<PageResult<VideoVO>>>('/feed/by-tag', {
      params: { tag, ...params },
    })
  },
}

export const searchApi = {
  search(query: string, params?: PageParams) {
    return request.get<any, ApiResponse<PageResult<VideoVO>>>('/search', {
      params: { q: query, ...params },
    })
  },
}
