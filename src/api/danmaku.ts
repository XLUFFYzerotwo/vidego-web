import request from './request'
import type { ApiResponse } from '@/types/api'
import type { DanmakuVO } from '@/types/danmaku'

export const danmakuApi = {
  getDanmaku(videoId: number, startTime: number = 0, endTime: number = 60) {
    return request.get<any, ApiResponse<DanmakuVO[]>>(`/videos/${videoId}/danmaku`, {
      params: { startTime, endTime }
    })
  }
}