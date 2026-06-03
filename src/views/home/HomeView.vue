<template>
  <div class="home-page">
    <!-- ── Category Bar ── -->
    <div class="category-bar">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="cat-btn"
        :class="{ active: activeCategory === cat.key }"
        @click="switchCategory(cat.key)"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- ── Video Grid ── -->
    <div class="video-grid">
      <VideoCard v-for="v in videos" :key="v.id" :video="v" />
    </div>

    <!-- ── Loading State ── -->
    <div v-if="loading && videos.length === 0" class="grid-skeleton">
      <div v-for="i in 8" :key="i" class="skeleton-card">
        <el-skeleton :rows="3" animated />
      </div>
    </div>

    <!-- ── Empty State ── -->
    <div v-if="!loading && videos.length === 0" class="empty-state">
      <el-icon :size="48" color="#ddd"><VideoCamera /></el-icon>
      <p>No videos yet</p>
    </div>

    <!-- ── Load More ── -->
    <div v-if="hasMore" class="load-more">
      <el-button
        :loading="loadingMore"
        class="load-btn"
        @click="loadMore"
      >
        {{ loadingMore ? 'Loading...' : 'Load More' }}
      </el-button>
    </div>

    <!-- ── Loading More Spinner ── -->
    <div v-if="loadingMore" class="loading-more">
      <el-icon class="spin-icon" :size="20"><Loading /></el-icon>
      <span>Loading...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VideoCamera, Loading } from '@element-plus/icons-vue'
import { feedApi } from '@/api/feed'
import VideoCard from '@/components/VideoCard.vue'
import type { VideoVO } from '@/types/video'

// ── Categories ──
interface Category {
  key: string
  label: string
}

const categories: Category[] = [
  { key: '', label: 'Recommended' },
  { key: 'Tech', label: 'Tech' },
  { key: 'Life', label: 'Life' },
  { key: 'Gaming', label: 'Gaming' },
  { key: 'Music', label: 'Music' },
  { key: 'Education', label: 'Education' },
  { key: 'Sports', label: 'Sports' },
  { key: 'Vlog', label: 'Vlog' },
]

const activeCategory = ref('')
const videos = ref<VideoVO[]>([])
const page = ref(1)
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const PAGE_SIZE = 20

// ── Load Videos ──
async function loadVideos(reset = false) {
  if (reset) {
    page.value = 1
    videos.value = []
    hasMore.value = true
    loading.value = true
  }

  try {
    let res

    if (activeCategory.value) {
      // 按分类
      res = await feedApi.getByTag(activeCategory.value, { page: page.value, size: PAGE_SIZE })
    } else {
      // 推荐
      res = await feedApi.getRecommended({ page: page.value, size: PAGE_SIZE })
    }

    const data = res.data
    const records = data.records || []

    if (reset) {
      videos.value = records
    } else {
      videos.value.push(...records)
    }

    // 是否还有更多
    hasMore.value = page.value * PAGE_SIZE < data.total
  } catch {
    // Error handled by interceptor
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// ── Category Switch ──
function switchCategory(key: string) {
  if (key === activeCategory.value) return
  activeCategory.value = key
  loadVideos(true)
}

// ── Load More ──
async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  page.value += 1
  await loadVideos(false)
}

// ── Init ──
onMounted(() => {
  loadVideos(true)
})
</script>

<style scoped>
.home-page {
  padding-bottom: 32px;
}

/* ── Category Bar ── */
.category-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.cat-btn {
  padding: 6px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 20px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
  white-space: nowrap;
}

.cat-btn:hover {
  color: #fb7299;
  border-color: #fb7299;
}

.cat-btn.active {
  color: #fff;
  background: #fb7299;
  border-color: #fb7299;
}

/* ── Video Grid ── */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* ── Skeleton ── */
.grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.skeleton-card {
  padding: 12px;
}

/* ── Empty ── */
.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #ccc;
}

.empty-state p {
  margin: 12px 0 0;
  font-size: 14px;
}

/* ── Load More ── */
.load-more {
  text-align: center;
  margin-top: 32px;
}

.load-btn {
  width: 200px;
  border-radius: 20px;
}

/* ── Loading More ── */
.loading-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spin-icon {
  animation: rotating 1s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .category-bar {
    gap: 6px;
  }

  .cat-btn {
    padding: 4px 12px;
    font-size: 12px;
  }
}
</style>
