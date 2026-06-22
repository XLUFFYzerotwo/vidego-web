import type { UserVO } from './user'

export interface DanmakuVO {
  id: number
  videoId: number
  userId: number
  content: string
  time: number
  color: string
  type: number
  createdAt: string
  user?: UserVO
  uniqueId?: number
}

export interface DanmakuCreateRequest {
  videoId: number
  content: string
  time: number
  color?: string
  type?: number
}

export interface DanmakuSettings {
  enabled: boolean
  opacity: number
  fontSize: 'normal' | 'large'
  density: 'low' | 'normal' | 'high'
}

export const defaultDanmakuSettings: DanmakuSettings = {
  enabled: true,
  opacity: 1,
  fontSize: 'normal',
  density: 'normal'
}