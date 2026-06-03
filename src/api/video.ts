import request from './request'
import type { ApiResponse, PageResult, PageParams } from '@/types/api'
import type { VideoVO } from '@/types/video'

export interface UploadTokenVO {
  uploadUrl: string
  objectKey: string
}

export const videoApi = {
  getUploadToken(filename: string, size: number) {
    return request.get<any, ApiResponse<UploadTokenVO>>('/videos/upload-token', {
      params: { filename, size },
    })
  },

  createVideo(data: {
    title: string
    description?: string
    videoKey: string
    coverKey?: string
    duration?: number
    size?: number
    tags?: string[]
  }) {
    // 封面生成需要 FFmpeg 处理，超时设为 60 秒
    return request.post<any, ApiResponse<VideoVO>>('/videos', data, {
      timeout: 60000,
    })
  },

  getVideoById(videoId: number) {
    return request.get<any, ApiResponse<VideoVO>>(`/videos/${videoId}`)
  },

  deleteVideo(videoId: number) {
    return request.delete<any, ApiResponse<void>>(`/videos/${videoId}`)
  },

  like(videoId: number) {
    return request.post<any, ApiResponse<void>>(`/videos/${videoId}/like`)
  },

  unlike(videoId: number) {
    return request.delete<any, ApiResponse<void>>(`/videos/${videoId}/like`)
  },

  getLikeStatus(videoId: number) {
    return request.get<any, ApiResponse<{ liked: boolean }>>(`/videos/${videoId}/like/status`)
  },

  /** 记录播放量（fire-and-forget，不阻塞流程） */
  recordView(videoId: number) {
    return request.post<any, ApiResponse<void>>(`/videos/${videoId}/view`)
  },

  // ── 收藏 ──

  favorite(videoId: number) {
    return request.post<any, ApiResponse<void>>(`/videos/${videoId}/favorite`)
  },

  unfavorite(videoId: number) {
    return request.delete<any, ApiResponse<void>>(`/videos/${videoId}/favorite`)
  },

  getFavoriteStatus(videoId: number) {
    return request.get<any, ApiResponse<{ favorited: boolean }>>(`/videos/${videoId}/favorite/status`)
  },
}
