const TOKEN_KEY = 'vidego_token'
const REFRESH_KEY = 'vidego_refresh'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token)
}

export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_KEY)
}

export function clearAuth(): void {
  removeToken()
  removeRefreshToken()
}
