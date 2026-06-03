import type { UserVO } from './user'

export interface VideoVO {
  id: number
  userId: number
  title: string
  description: string
  videoUrl: string
  coverUrl: string | null
  duration: number
  size: number
  status: number
  viewCount: number
  likeCount: number
  commentCount: number
  tags: string[]
  user: UserVO | null
  createdAt: string
}

export interface UploadTokenVO {
  uploadUrl: string
  objectKey: string
}
