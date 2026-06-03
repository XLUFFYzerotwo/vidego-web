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
          <!-- Player -->
          <VideoPlayer
            :src="video.videoUrl"
            :poster="video.coverUrl || undefined"
            @timeupdate="onTimeUpdate"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, Pointer, Star, Share, ChatDotRound, VideoCamera } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { videoApi } from '@/api/video'
import { feedApi } from '@/api/feed'
import VideoPlayer from '@/components/VideoPlayer.vue'
import CommentSection from '@/components/CommentSection.vue'
import type { VideoVO } from '@/types/video'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// ── Video Data ──
const video = ref<VideoVO | null>(null)
const loading = ref(true)
const error = ref(false)
const liked = ref(false)
const favorited = ref(false)

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

function onTimeUpdate(currentTime: number) {
  if (!viewRecorded && currentTime > 3) {
    viewRecorded = true
    videoApi.recordView(videoId.value).catch(() => {})
  }
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
.video-detail {
  max-width: 1200px;
  margin: 0 auto;
}

/* ── Loading / Error ── */
.loading-state, .error-state {
  padding: 40px 0;
}

/* ── Layout ── */
.detail-layout {
  display: flex;
  gap: 24px;
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

/* ── Info Section ── */
.info-section {
  padding: 16px 0 12px;
  border-bottom: 1px solid #f0f0f0;
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #333;
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
  gap: 4px;
  font-size: 13px;
  color: #999;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  color: #ddd;
  padding: 0 4px;
}

.meta-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 20px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
}

.action-btn:hover {
  color: #fb7299;
  border-color: #fb7299;
}

.action-btn.active {
  color: #fb7299;
  border-color: #fb7299;
  background: #fff8fa;
}

/* ── Author Section ── */
.author-section {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.author-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.author-stats {
  font-size: 12px;
  color: #999;
}

/* ── Description ── */
.desc-section {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.video-desc {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.video-tag {
  cursor: pointer;
}

/* ── Sidebar ── */
.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #333;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommend-card {
  display: flex;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  border-radius: 6px;
  transition: background 0.2s;
  overflow: hidden;
}

.recommend-card:hover {
  background: #f9f9f9;
}

.rec-thumb {
  width: 160px;
  flex-shrink: 0;
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
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
  color: #ccc;
  background: #f5f5f5;
}

.rec-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 2px;
}

.rec-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rec-title {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.rec-meta {
  margin: 0;
  font-size: 11px;
  color: #999;
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .detail-layout {
    flex-direction: column;
  }

  .detail-sidebar {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .video-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .rec-thumb {
    width: 120px;
  }
}
</style>
