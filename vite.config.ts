import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 视频 / 封面文件 → MinIO（Nginx 在生产环境做相同映射）
      '/storage/videos/': {
        target: 'http://192.168.61.133:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage\/videos/, '/vidego-videos'),
      },
      '/storage/covers/': {
        target: 'http://192.168.61.133:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage\/covers/, '/vidego-covers'),
      },
      '/storage/avatars/': {
        target: 'http://192.168.61.133:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage\/avatars/, '/vidego-avatars'),
      },
    },
  },
})
