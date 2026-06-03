export interface UserVO {
  id: number
  username: string
  nickname: string
  avatar: string | null
  email: string | null
  bio: string | null
  followerCount: number
  followingCount: number
  videoCount: number
  likeCount: number
  createdAt: string
}

export interface LoginVO {
  token: string
  refreshToken: string
  user: UserVO
}

export interface RegisterRequest {
  username: string
  password: string
  confirmPassword: string
  email?: string
}

export interface LoginRequest {
  account: string
  password: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  confirmNewPassword: string
}
