<template>
  <div class="search-page">
    <!-- Search bar -->
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="Search videos..."
        :prefix-icon="Search"
        size="large"
        clearable
        class="search-input"
        @keyup.enter="doSearch"
      />
      <el-button type="primary" size="large" class="search-btn" @click="doSearch">
        Search
      </el-button>
    </div>

    <!-- Result info -->
    <p v-if="searched && keyword" class="result-info">
      Results for: <strong>{{ keyword }}</strong>
      <span v-if="!loading"> · {{ total }} found</span>
    </p>

    <!-- Loading -->
    <div v-if="loading" class="grid-skeleton">
      <div v-for="i in 8" :key="i" class="skeleton-item">
        <el-skeleton :rows="3" animated />
      </div>
    </div>

    <!-- Results -->
    <div v-else-if="videos.length" class="video-grid">
      <VideoCard v-for="v in videos" :key="v.id" :video="v" />
    </div>

    <!-- Empty -->
    <div v-else-if="searched" class="empty-state">
      <el-icon :size="48" color="#ccc"><Search /></el-icon>
      <p>No results for "{{ keyword }}"</p>
      <p class="empty-hint">Try different keywords or check spelling</p>
    </div>

    <!-- Initial -->
    <div v-else class="initial-state">
      <el-icon :size="64" color="#ddd"><Search /></el-icon>
      <p>Enter a keyword to search videos</p>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="load-more">
      <el-button :loading="loadingMore" size="small" @click="loadMore">
        {{ loadingMore ? 'Loading...' : 'Load More' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { searchApi } from '@/api/feed'
import VideoCard from '@/components/VideoCard.vue'
import type { VideoVO } from '@/types/video'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const videos = ref<VideoVO[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const searched = ref(false)
const hasMore = ref(true)
const total = ref(0)
const page = ref(1)
const PAGE_SIZE = 20
const isSearching = ref(false)

// Read initial keyword from URL query
onMounted(() => {
  const q = (route.query.q as string) || ''
  if (q) {
    keyword.value = q
    doSearch()
  }
})

// Watch for query changes from HeaderNav search
watch(() => route.query.q, (newQ) => {
  if (newQ && newQ !== keyword.value && !isSearching.value) {
    keyword.value = newQ as string
    doSearch()
  }
})

async function doSearch() {
  const q = keyword.value.trim()
  if (!q) return

  isSearching.value = true
  // Sync keyword to URL (so HeaderNav search shows it)
  router.replace({ query: { q } })

  page.value = 1
  videos.value = []
  hasMore.value = true
  searched.value = true
  loading.value = true

  try {
    const res = await searchApi.search(q, { page: 1, size: PAGE_SIZE })
    const data = res.data
    videos.value = data.records || []
    total.value = data.total
    hasMore.value = page.value * PAGE_SIZE < data.total
  } catch {
    videos.value = []
  } finally {
    loading.value = false
    isSearching.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  page.value += 1

  try {
    const res = await searchApi.search(keyword.value.trim(), { page: page.value, size: PAGE_SIZE })
    const data = res.data
    videos.value.push(...(data.records || []))
    hasMore.value = page.value * PAGE_SIZE < data.total
  } catch {
    // handled by interceptor
  } finally {
    loadingMore.value = false
  }
}
</script>

<style scoped>
.search-page {
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Search Bar ── */
.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 24px;
}

.search-btn {
  border-radius: 24px;
  padding: 0 32px;
}

/* ── Result info ── */
.result-info {
  margin: 0 0 20px;
  font-size: 14px;
  color: #999;
}

/* ── Video Grid ── */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

/* ── Skeleton ── */
.grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.skeleton-item {
  padding: 12px;
}

/* ── States ── */
.empty-state, .initial-state {
  text-align: center;
  padding: 80px 0;
  color: #ccc;
}

.empty-state p, .initial-state p {
  margin: 12px 0 0;
  font-size: 14px;
}

.empty-hint {
  font-size: 13px !important;
  color: #ddd;
  margin-top: 4px !important;
}

/* ── Load More ── */
.load-more {
  text-align: center;
  margin-top: 32px;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .search-bar {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
  }

  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}
</style>
