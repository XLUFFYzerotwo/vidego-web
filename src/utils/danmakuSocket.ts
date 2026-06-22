import SockJS from 'sockjs-client'
import Stomp from 'stompjs'
import type { DanmakuVO, DanmakuCreateRequest } from '@/types/danmaku'
import { getToken } from '@/utils/token'

class DanmakuSocket {
  private stompClient: Stomp.Client | null = null
  private connectPromise: Promise<void> | null = null
  private listeners: Set<(danmaku: DanmakuVO) => void> = new Set()

  connect(): Promise<void> {
    if (this.stompClient?.connected) {
      return Promise.resolve()
    }

    if (this.connectPromise) {
      return this.connectPromise
    }

    this.connectPromise = new Promise((resolve, reject) => {
      const socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws/danmaku`)
      this.stompClient = Stomp.over(socket)

      const token = getToken()
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      this.stompClient.connect(headers, () => {
        this.stompClient?.subscribe('/topic/danmaku', (message: { body: string }) => {
          try {
            const danmaku: DanmakuVO = JSON.parse(message.body)
            this.listeners.forEach(listener => listener(danmaku))
          } catch {
            console.error('Failed to parse danmaku message')
          }
        })
        this.connectPromise = null
        resolve()
      }, (error: unknown) => {
        this.connectPromise = null
        reject(error)
      })
    })

    return this.connectPromise
  }

  disconnect(): void {
    this.stompClient?.disconnect()
    this.stompClient = null
    this.connectPromise = null
  }

  sendDanmaku(request: DanmakuCreateRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connect().then(() => {
        this.stompClient?.send(
          '/app/danmaku/send',
          {},
          JSON.stringify(request)
        )
        resolve()
      }).catch(reject)
    })
  }

  addListener(listener: (danmaku: DanmakuVO) => void): void {
    this.listeners.add(listener)
  }

  removeListener(listener: (danmaku: DanmakuVO) => void): void {
    this.listeners.delete(listener)
  }

  isConnected(): boolean {
    return this.stompClient?.connected ?? false
  }
}

export const danmakuSocket = new DanmakuSocket()