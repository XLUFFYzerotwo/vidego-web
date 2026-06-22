declare module 'sockjs-client' {
  export default class SockJS {
    constructor(url: string)
  }
}

declare module 'stompjs' {
  export interface Client {
    connected: boolean
    connect(
      headers: Record<string, string>,
      callback: () => void,
      errorCallback: (error: unknown) => void
    ): void
    subscribe(destination: string, callback: (message: { body: string }) => void): unknown
    send(destination: string, headers: Record<string, string>, body: string): void
    disconnect(): void
  }
  
  export function over(socket: unknown): Client
}