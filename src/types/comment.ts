import type { UserVO } from './user'

export interface CommentVO {
  id: number
  videoId: number
  userId: number
  parentId: number | null
  content: string
  likeCount: number
  user: UserVO
  replies?: CommentVO[]
  createdAt: string
}

export interface CommentRequest {
  content: string
  parentId?: number | null
}
