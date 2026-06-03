<template>
  <div class="profile-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <el-result icon="warning" title="User not found">
        <template #extra>
          <el-button type="primary" @click="router.push('/home')">Back to Home</el-button>
        </template>
      </el-result>
    </div>

    <template v-else-if="user">
      <!-- ── Profile Header ── -->
      <div class="profile-header">
        <el-avatar :size="80" class="profile-avatar" :src="user.avatar || undefined">
          {{ user.nickname?.[0]?.toUpperCase() || 'U' }}
        </el-avatar>
        <div class="profile-info">
          <h1 class="profile-name">{{ user.nickname || user.username }}</h1>
          <p v-if="user.bio" class="profile-bio">{{ user.bio }}</p>
          <div class="profile-stats">
            <span><strong>{{ user.videoCount }}</strong> Videos</span>
            <span><strong>{{ user.followerCount }}</strong> Followers</span>
            <span><strong>{{ user.followingCount }}</strong> Following</span>
          </div>
        </div>
        <div class="profile-actions">
          <template v-if="isOwner">
            <el-button class="action-btn" @click="router.push('/settings')">
              <el-icon><Edit /></el-icon> Edit
            </el-button>
          </template>
          <template v-else>
            <el-button
              v-if="!isFollowing"
              type="primary"
              class="follow-btn"
              :loading="followLoading"
              @click="doFollow"
            >
              + Follow
            </el-button>
            <el-button
              v-else
              class="follow-btn following"
              :loading="followLoading"
              @click="doUnfollow"
            >
              Following
            </el-button>
          </template>
        </div>
      </div>

      <!-- ── Tabs ── -->
      <div class="profile-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- ── Tab Content: Video Grid ── -->
      <div v-if="activeTab === 'videos' || activeTab === 'likes' || activeTab === 'favorites'" class="video-grid">
        <div v-for="v in listData" :key="v.id" class="video-card-wrapper">
          <VideoCard :video="v" />
          <button
            v-if="showDelete(v)"
            class="delete-overlay"
            title="Delete video"
            @click.prevent="confirmDelete(v)"
          >
            <el-icon :size="16"><Delete /></el-icon>
          </button>
        </div>
      </div>

      <!-- ── Tab Content: User Grid (followers/following) ── -->
      <div v-if="activeTab === 'followers' || activeTab === 'following'" class="user-grid">
        <div v-for="u in listData" :key="u.id" class="user-card">
          <router-link :to="`/user/${u.id}`" class="user-card-link">
            <el-avatar :size="44" :src="u.avatar || undefined">
              {{ u.nickname?.[0]?.toUpperCase() || 'U' }}
            </el-avatar>
            <div class="user-card-info">
              <span class="user-card-name">{{ u.nickname || u.username }}</span>
              <span class="user-card-meta">{{ u.followerCount }} followers</span>
            </div>
          </router-link>
        </div>
      </div>

      <!-- ── Empty ── -->
      <div v-if="!listLoading && listData.length === 0" class="empty-state">
        <el-icon :size="40" color="#ccc"><Folder /></el-icon>
        <p>Nothing here yet</p>
      </div>

      <!-- ── Skeleton ── -->
      <div v-if="listLoading" class="grid-skeleton">
        <div v-for="i in 6" :key="i" class="skeleton-item">
          <el-skeleton :rows="3" animated />
        </div>
      </div>

      <!-- ── Load More ── -->
      <div v-if="hasMore && !listLoading" class="load-more">
        <el-button :loading="loadingMore" size="small" @click="loadMore">
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Folder } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/api/user'
import { videoApi } from '@/api/video'
import VideoCard from '@/components/VideoCard.vue'
import type { UserVO } from '@/types/user'
import type { VideoVO } from '@/types/video'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// ── User Data ──
const user = ref<UserVO | null>(null)
const loading = ref(true)
const error = ref(false)
const isFollowing = ref(false)
const followLoading = ref(false)

const userId = computed(() => Number(route.params.id))
const isOwner = computed(() => authStore.user?.id === userId.value)

// ── Tabs ──
interface Tab { key: string; label: string }
const tabs: Tab[] = [
  { key: 'videos', label: 'Videos' },
  { key: 'likes', label: 'Likes' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'following', label: 'Following' },
  { key: 'followers', label: 'Followers' },
]
const activeTab = ref('videos')

// ── List ──
const listData = ref<any[]>([])
const listLoading = ref(true)
const loadingMore = ref(false)
const page = ref(1)
const hasMore = ref(true)
const PAGE_SIZE = 20

// ── Load User Profile ──
async function loadUser() {
  const id = userId.value
  if (!id || isNaN(id)) { error.value = true; loading.value = false; return }

  loading.value = true; error.value = false
  try {
    const res = await userApi.getUserById(id)
    user.value = res.data
    document.title = `${res.data.nickname || res.data.username} - Vidego`
  } catch { error.value = true }
  finally { loading.value = false }
}

// ── Follow / Unfollow ──
async function doFollow() {
  if (!authStore.isLoggedIn) { ElMessage.warning('Please login first'); return }
  followLoading.value = true
  try {
    await userApi.follow(userId.value)
    isFollowing.value = true
    if (user.value) user.value.followerCount += 1
  } catch { /* handled */ }
  finally { followLoading.value = false }
}

async function doUnfollow() {
  followLoading.value = true
  try {
    await userApi.unfollow(userId.value)
    isFollowing.value = false
    if (user.value) user.value.followerCount = Math.max(0, user.value.followerCount - 1)
  } catch { /* handled */ }
  finally { followLoading.value = false }
}

// ── Tab Switching ──
async function switchTab(key: string) {
  if (key === activeTab.value) return
  activeTab.value = key
  await loadList(true)
}

// ── Load List Data ──
async function loadList(reset = false) {
  if (reset) { page.value = 1; listData.value = []; hasMore.value = true; listLoading.value = true }

  try {
    let res: any
    const params = { page: page.value, size: PAGE_SIZE }
    const id = userId.value

    switch (activeTab.value) {
      case 'videos':    res = await userApi.getUserVideos(id, params); break
      case 'likes':     res = await userApi.getLikedVideos(id, params); break
      case 'favorites': res = await userApi.getFavoritedVideos(id, params); break
      case 'following': res = await userApi.getFollowing(id, params); break
      case 'followers': res = await userApi.getFollowers(id, params); break
      default:          res = await userApi.getUserVideos(id, params)
    }

    const data = res.data
    const records = data.records || []
    if (reset) listData.value = records
    else listData.value.push(...records)

    hasMore.value = page.value * PAGE_SIZE < data.total
  } catch { listData.value = [] }
  finally { listLoading.value = false; loadingMore.value = false }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  page.value += 1
  await loadList(false)
}

// ── Delete Video ──
function showDelete(v: any): boolean {
  return isOwner.value && activeTab.value === 'videos' && v.userId === userId.value
}

async function confirmDelete(v: VideoVO) {
  try {
    await ElMessageBox.confirm(
      `Delete "${v.title}"? This cannot be undone.`,
      'Delete Video',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' }
    )
    await videoApi.deleteVideo(v.id)
    ElMessage.success('Video deleted')
    listData.value = listData.value.filter(item => item.id !== v.id)
    if (user.value) user.value.videoCount = Math.max(0, user.value.videoCount - 1)
  } catch { /* cancelled or error */ }
}

// ── Watchers ──
watch(() => route.params.id, () => {
  loadUser()
  loadList(true)
})

onMounted(() => {
  loadUser()
  loadList(true)
})
</script>

<style scoped>
.profile-page {
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Loading / Error ── */
.loading-state, .error-state { padding: 40px 0; }

/* ── Profile Header ── */
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 0 20px;
  border-bottom: 1px solid #f0f0f0;
}

.profile-avatar { flex-shrink: 0; }

.profile-info { flex: 1; min-width: 0; }

.profile-name {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

.profile-bio {
  margin: 0 0 10px;
  font-size: 14px;
  color: #888;
}

.profile-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #999;
}
.profile-stats strong { color: #333; font-weight: 600; }

.profile-actions { flex-shrink: 0; }

.follow-btn {
  min-width: 100px;
  border-radius: 20px;
}

.follow-btn.following {
  background: #fff;
  color: #fb7299;
  border-color: #fb7299;
}

/* ── Tabs ── */
.profile-tabs {
  display: flex;
  gap: 4px;
  margin: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  position: relative;
  transition: color 0.2s;
}

.tab-btn:hover { color: #fb7299; }

.tab-btn.active {
  color: #fb7299;
  font-weight: 600;
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20px;
  right: 20px;
  height: 2px;
  background: #fb7299;
  border-radius: 1px;
}

/* ── Video Grid ── */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.video-card-wrapper {
  position: relative;
}

.delete-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.video-card-wrapper:hover .delete-overlay { opacity: 1; }
.delete-overlay:hover { background: rgba(245, 108, 108, 0.8); }

/* ── User Grid ── */
.user-grid {
  display: flex;
  flex-direction: column;
}

.user-card {
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.user-card-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.user-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.user-card-meta {
  font-size: 12px;
  color: #999;
}

/* ── States ── */
.empty-state {
  text-align: center;
  padding: 64px 0;
  color: #ccc;
}
.empty-state p { margin: 8px 0 0; font-size: 14px; }

.grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.skeleton-item { padding: 12px; }

.load-more { text-align: center; margin-top: 24px; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .profile-header {
    flex-wrap: wrap;
    gap: 16px;
  }

  .profile-actions { width: 100%; }
  .follow-btn { width: 100%; }

  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .profile-stats { gap: 16px; font-size: 13px; }
}
</style>
