import request from './request'
import type { ApiResponse, PageResult, PageParams } from '@/types/api'
import type { CommentVO, CommentRequest } from '@/types/comment'

export const commentApi = {
  getComments(videoId: number, params?: PageParams) {
    return request.get<any, ApiResponse<PageResult<CommentVO>>>(`/videos/${videoId}/comments`, { params })
  },

  createComment(videoId: number, data: CommentRequest) {
    return request.post<any, ApiResponse<CommentVO>>(`/videos/${videoId}/comments`, data)
  },

  deleteComment(commentId: number) {
    return request.delete<any, ApiResponse<void>>(`/comments/${commentId}`)
  },

  likeComment(commentId: number) {
    return request.post<any, ApiResponse<void>>(`/comments/${commentId}/like`)
  },
}
