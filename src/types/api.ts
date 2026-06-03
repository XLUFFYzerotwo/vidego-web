/** 统一后端响应 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 分页响应 */
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

/** 分页请求参数 */
export interface PageParams {
  page?: number
  size?: number
}
