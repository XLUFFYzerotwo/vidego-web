<template>
  <div class="video-detail">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <el-result icon="warning" title="Video not found" sub-title="The video may have been removed">
        <template #extra>
          <el-button type="primary" @click="router.push('/home')">Back to Home</el-button>
        </template>
      </el-result>
    </div>

    <!-- Content -->
    <template v-else-if="video">
      <div class="detail-layout">
        <!-- ── Main Column ── -->
        <div class="detail-main">
          <!-- Player with Danmaku -->
          <div class="player-container">
            <VideoPlayer
              :src="video.videoUrl"
              :poster="video.coverUrl || undefined"
              @timeupdate="onTimeUpdate"
            />
            <DanmakuOverlay
              :video-id="videoId"
              :current-time="currentTime"
              :settings="danmakuSettings"
              :duration="video.duration || 0"
            />
            
            <!-- Danmaku Settings Button -->
            <button 
              class="danmaku-settings-btn"
              @click="showDanmakuSettings = !showDanmakuSettings"
            >
              <el-icon :size="18"><Setting /></el-icon>
            </button>
            
            <!-- Danmaku Settings Panel -->
            <transition name="slide-up">
              <div v-if="showDanmakuSettings" class="danmaku-settings-panel">
                <DanmakuSettings 
                  :settings="danmakuSettings"
                  @update="onDanmakuSettingsUpdate"
                />
              </div>
            </transition>
          </div>

          <!-- Danmaku Sender -->
          <DanmakuSender
            :video-id="videoId"
            :current-time="currentTime"
            :logged-in="authStore.isLoggedIn"
          />

          <!-- Video Info -->
          <div class="info-section">
            <h1 class="video-title">{{ video.title }}</h1>

            <div class="video-meta">
              <div class="meta-left">
                <span class="stat-item">
                  <el-icon><View /></el-icon>
                  {{ formatCount(video.viewCount) }} views
                </span>
                <span class="dot">·</span>
                <span>{{ formatDate(video.createdAt) }}</span>
              </div>

              <div class="meta-actions">
                <button class="action-btn" :class="{ active: liked }" @click="toggleLike">
                  <el-icon :size="20"><Pointer /></el-icon>
                  <span>{{ formatCount(video.likeCount) }}</span>
                </button>
                <button class="action-btn" :class="{ active: favorited }" @click="handleFavorite">
                  <el-icon :size="20"><Star /></el-icon>
                  <span>Favorite</span>
                </button>
                <button class="action-btn" @click="handleShare">
                  <el-icon :size="20"><Share /></el-icon>
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          <!-- UP主 Info -->
          <div class="author-section" v-if="video.user">
            <router-link :to="`/user/${video.userId}`" class="author-info">
              <el-avatar :size="48" :src="video.user.avatar || undefined">
                {{ video.user.nickname?.[0]?.toUpperCase() || 'U' }}
              </el-avatar>
              <div class="author-detail">
                <span class="author-name">{{ video.user.nickname || video.user.username }}</span>
                <span class="author-stats">
                  {{ video.user.followerCount }} followers · {{ video.user.videoCount }} videos
                </span>
              </div>
            </router-link>
          </div>

          <!-- Description -->
          <div v-if="video.description" class="desc-section">
            <p class="video-desc">{{ video.description }}</p>
            <div v-if="video.tags?.length" class="tag-list">
              <el-tag
                v-for="tag in video.tags"
                :key="tag"
                size="small"
                class="video-tag"
                @click="searchByTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <!-- ── Comments ── -->
          <CommentSection
            :video-id="videoId"
            :user="authStore.user"
            :logged-in="authStore.isLoggedIn"
          />
        </div>

        <!-- ── Sidebar ── -->
        <div class="detail-sidebar">
          <h3 class="sidebar-title">Recommended</h3>
          <div v-if="recommended.length" class="recommend-list">
            <router-link
              v-for="item in recommended"
              :key="item.id"
              :to="`/video/${item.id}`"
              class="recommend-card"
            >
              <div class="rec-thumb">
                <el-image :src="item.coverUrl || ''" fit="cover">
                  <template #error>
                    <div class="img-placeholder">
                      <el-icon><VideoCamera /></el-icon>
                    </div>
                  </template>
                </el-image>
                <span class="rec-duration">{{ formatDuration(item.duration) }}</span>
              </div>
              <div class="rec-info">
                <h4 class="rec-title">{{ item.title }}</h4>
                <p class="rec-meta">{{ item.user?.nickname || 'Unknown' }}</p>
                <p class="rec-meta">{{ formatCount(item.viewCount) }} views</p>
              </div>
            </router-link>
          </div>
          <div v-else class="loading-rec">
            <el-skeleton :rows="5" animated />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, Pointer, Star, Share, ChatDotRound, VideoCamera, Setting } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { videoApi } from '@/api/video'
import { feedApi } from '@/api/feed'
import VideoPlayer from '@/components/VideoPlayer.vue'
import CommentSection from '@/components/CommentSection.vue'
import DanmakuOverlay from '@/components/DanmakuOverlay.vue'
import DanmakuSender from '@/components/DanmakuSender.vue'
import DanmakuSettings from '@/components/DanmakuSettings.vue'
import type { VideoVO } from '@/types/video'
import type { DanmakuSettings as DanmakuSettingsType } from '@/types/danmaku'
import { defaultDanmakuSettings } from '@/types/danmaku'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// ── Video Data ──
const video = ref<VideoVO | null>(null)
const loading = ref(true)
const error = ref(false)
const liked = ref(false)
const favorited = ref(false)
const currentTime = ref(0)

// ── Danmaku Settings ──
const danmakuSettings = reactive<DanmakuSettingsType>({ ...defaultDanmakuSettings })
const showDanmakuSettings = ref(false)

// ── Recommended ──
const recommended = ref<VideoVO[]>([])

const videoId = computed(() => Number(route.params.id))

// ── Load Video ──
async function loadVideo() {
  const id = videoId.value
  if (!id || isNaN(id)) {
    error.value = true
    loading.value = false
    return
  }

  loading.value = true
  error.value = false

  try {
    const res = await videoApi.getVideoById(id)
    video.value = res.data
    document.title = `${res.data.title} - Vidego`

    // Fetch like status after video loads
    if (authStore.isLoggedIn) {
      fetchLikeStatus()
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function fetchLikeStatus() {
  if (!video.value) return
  try {
    const res = await videoApi.getLikeStatus(video.value.id)
    liked.value = res.data.liked
  } catch { /* not critical */ }
  try {
    const res = await videoApi.getFavoriteStatus(video.value.id)
    favorited.value = res.data.favorited
  } catch { /* not critical */ }
}

// ── View Recording ──
let viewRecorded = false

function onTimeUpdate(time: number) {
  currentTime.value = time
  if (!viewRecorded && time > 3) {
    viewRecorded = true
    videoApi.recordView(videoId.value).catch(() => {})
  }
}

// ── Danmaku Settings ──
function onDanmakuSettingsUpdate(settings: DanmakuSettingsType) {
  Object.assign(danmakuSettings, settings)
}

// ── Like ──
async function toggleLike() {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('Please login first')
    router.push('/login')
    return
  }
  if (!video.value) return

  try {
    if (liked.value) {
      await videoApi.unlike(video.value.id)
      liked.value = false
      video.value.likeCount = Math.max(0, video.value.likeCount - 1)
    } else {
      await videoApi.like(video.value.id)
      liked.value = true
      video.value.likeCount += 1
    }
  } catch {
    ElMessage.error('Operation failed')
  }
}

// ── Recommended ──
async function loadRecommended() {
  try {
    const res = await feedApi.getRecommended({ page: 1, size: 10 })
    recommended.value = res.data.records || []
  } catch {
    recommended.value = []
  }
}

// ── Utilities ──
function handleFavorite() {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('Please login first')
    router.push('/login')
    return
  }
  if (!video.value) return

  if (favorited.value) {
    videoApi.unfavorite(video.value.id).then(() => {
      favorited.value = false
    }).catch(() => {})
  } else {
    videoApi.favorite(video.value.id).then(() => {
      favorited.value = true
    }).catch(() => {})
  }
}

function handleShare() {
  navigator.clipboard?.writeText(window.location.href).then(() => {
    ElMessage.success('Link copied to clipboard')
  }).catch(() => {
    ElMessage.info('Share URL: ' + window.location.href)
  })
}

function searchByTag(tag: string) {
  router.push({ path: '/search', query: { q: tag } })
}

function formatCount(n: number): string {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'W'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

function formatDuration(seconds: number): string {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Watch route changes ──
watch(() => route.params.id, () => {
  viewRecorded = false
  loadVideo()
  loadRecommended()
})

onMounted(() => {
  loadVideo()
  loadRecommended()
})
</script>

<style scoped>
/*
 * ██ 视频详情页 — 全面 UI 优化
 * 统一圆角 12px，玻璃拟态，大量留白，粉色主色 #FF77A9
 */

.video-detail {
  max-width: 1200px;
  margin: 0 auto;
}

/* ── Loading / Error ── */
.loading-state, .error-state {
  padding: 48px 0;
}

/* ── 双栏布局，增加间距 ── */
.detail-layout {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

.detail-main {
  flex: 1;
  min-width: 0;
}

.detail-sidebar {
  width: 320px;
  flex-shrink: 0;
}

/* ── 播放器容器：大圆角 16px + 外发光 ── */
.player-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04),
              0 0 40px rgba(255, 119, 169, 0.10);
  background: #1A1A22;
}

.danmaku-settings-btn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  transition: background 0.2s, transform 0.2s;
}

.danmaku-settings-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: translateX(-50%) scale(1.1);
}

.danmaku-settings-panel {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  z-index: 30;
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* ── 视频信息区：去除生硬分割线，留白增加 ── */
.info-section {
  padding: 20px 0 14px;
  border-bottom: 1px solid var(--border-light);
}

.video-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 14px;
  color: var(--text-primary);
  line-height: 1.4;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  color: var(--text-tertiary);
  padding: 0 4px;
}

/* ── 互动按钮：圆润 + hover 填充粉色 ── */
.meta-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-full);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.25s ease;
}

.action-btn:hover {
  color: var(--brand);
  border-color: var(--brand);
  background: var(--brand-dim);
  transform: translateY(-1px);
}

.action-btn.active {
  color: var(--brand);
  border-color: var(--brand);
  background: var(--brand-dim);
}

.action-btn:active {
  transform: translateY(0);
}

/* ── UP主信息区 ── */
.author-section {
  display: flex;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--border-light);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
}

.author-detail {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.author-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
}

.author-stats {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ── 描述 & 标签 ── */
.desc-section {
  padding: 18px 0;
  border-bottom: 1px solid var(--border-light);
}

.video-desc {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
  opacity: 0.85;
  white-space: pre-wrap;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.video-tag {
  cursor: pointer;
  border-radius: var(--radius-full) !important;
  border: none !important;
  background: var(--brand-dim) !important;
  color: var(--brand) !important;
  font-weight: 500;
  transition: all 0.2s;
}

.video-tag:hover {
  background: rgba(255, 119, 169, 0.18) !important;
}

/* ── 右侧推荐栏 ── */
.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 18px;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/*
 * 推荐卡片 — 大圆角、hover 上浮 + 柔和阴影
 */
.recommend-card {
  display: flex;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  padding: 6px;
  margin: -6px;
}

.recommend-card:hover {
  background: rgba(0, 0, 0, 0.02);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 缩略图容器 — 去除黑边 */
.rec-thumb {
  width: 168px;
  flex-shrink: 0;
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #f0f0f0;
}

.rec-thumb :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  background: #f5f5f5;
}

/* 时长标签 — 深色半透明圆角，悬浮在右下角 */
.rec-duration {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(30, 30, 38, 0.75);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #fff;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

.rec-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
}

.rec-title {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.rec-meta {
  margin: 0;
  font-size: 11px;
  color: var(--text-secondary);
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .detail-layout {
    flex-direction: column;
  }

  .detail-sidebar {
    width: 100%;
  }

  .rec-thumb {
    width: 140px;
  }
}

@media (max-width: 640px) {
  .video-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .rec-thumb {
    width: 120px;
  }
}
</style>