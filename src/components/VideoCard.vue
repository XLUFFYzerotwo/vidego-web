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
        <!-- <p class="card-author">{{ video.user?.nickname || 'Unknown' }}</p> -->
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
.video-card {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.card-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 8px;
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
  color: #ccc;
}

.card-duration {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}

.card-body {
  display: flex;
  gap: 10px;
  padding: 10px 4px;
}

.card-avatar {
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-desc {
  margin: 0 0 4px;
  font-size: 12px;
  color: #aaa;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-author {
  margin: 0;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.card-meta {
  margin: 0;
  font-size: 12px;
  color: #bbb;
}
</style>
