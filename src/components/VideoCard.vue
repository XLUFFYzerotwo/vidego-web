<template>
  <router-link :to="`/video/${video.id}`" class="video-card">
    <!-- Thumbnail -->
    <div class="card-thumb">
      <el-image
        :src="video.coverUrl || ''"
        fit="cover"
        loading="lazy"
        class="thumb-img"
      >
        <template #placeholder>
          <div class="thumb-placeholder">
            <el-icon :size="24"><VideoCamera /></el-icon>
          </div>
        </template>
        <template #error>
          <div class="thumb-placeholder">
            <el-icon :size="24"><VideoCamera /></el-icon>
          </div>
        </template>
      </el-image>
      <span class="card-duration">{{ formatDuration(video.duration) }}</span>
    </div>

    <!-- Info -->
    <div class="card-body">
      <div class="card-avatar">
        <el-avatar :size="32" :src="video.user?.avatar">
          {{ video.user?.nickname?.[0]?.toUpperCase() || 'U' }}
        </el-avatar>
      </div>
      <div class="card-info">
        <h4 class="card-title">{{ video.title }}</h4>
        <p v-if="video.description" class="card-desc">{{ video.description }}</p>
        <p class="card-meta">{{ formatCount(video.viewCount) }} views</p>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { VideoCamera } from '@element-plus/icons-vue'
import type { VideoVO } from '@/types/video'

defineProps<{
  video: VideoVO
}>()

function formatCount(n: number): string {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'W'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function formatDuration(seconds: number): string {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<style scoped>
/*
 * 视频卡片 — 12px 圆角、hover 上浮 + 柔和阴影
 */
.video-card {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
  cursor: pointer;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #f5f5f5;
}

.thumb-img {
  width: 100%;
  height: 100%;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

/* 时长标签 — 深色半透明磨砂，悬浮右下角 */
.card-duration {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(30, 30, 38, 0.75);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #fff;
  font-size: 12px;
  padding: 2px 7px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

.card-body {
  display: flex;
  gap: 10px;
  padding: 12px 8px 10px;
}

.card-avatar {
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0 0 5px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-desc {
  margin: 0 0 5px;
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-author {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.card-meta {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
