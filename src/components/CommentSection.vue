<template>
  <div class="comment-section">
    <!-- Title -->
    <h3 class="section-title">
      Comments
      <span v-if="totalComments > 0">({{ totalComments }})</span>
    </h3>

    <!-- Input area -->
    <div class="comment-input">
      <el-avatar :size="36" class="input-avatar" :src="user?.avatar || undefined">
        {{ user?.nickname?.[0]?.toUpperCase() || 'U' }}
      </el-avatar>
      <div class="input-wrapper">
        <template v-if="loggedIn">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="2"
            placeholder="Write a comment..."
            maxlength="500"
            show-word-limit
            @keyup.enter.prevent="submitComment"
          />
          <div class="input-actions">
            <el-button
              size="small"
              type="primary"
              :disabled="!newComment.trim()"
              :loading="submitting"
              @click="submitComment"
            >
              Post
            </el-button>
          </div>
        </template>
        <div v-else class="login-hint">
          <router-link to="/login">Login</router-link> to leave a comment
        </div>
      </div>
    </div>

    <!-- List -->
    <div v-if="comments.length" class="comment-list">
      <div v-for="comment in comments" :key="comment.id" class="comment-root">
        <CommentItem
          :ref="(el: any) => registerReplyRef(comment.id, el)"
          :comment="comment"
          :owner-id="user?.id ?? null"
          @like="handleLike"
          @delete="handleDelete"
          @reply="handleReply"
        />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!loading" class="empty-state">
      <el-icon :size="32" color="#ccc"><ChatDotRound /></el-icon>
      <p>No comments yet. Be the first!</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- Load More -->
    <div v-if="hasMore" class="load-more">
      <el-button
        :loading="loadingMore"
        size="small"
        @click="loadMore"
      >
        {{ loadingMore ? 'Loading...' : 'Load More Comments' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound } from '@element-plus/icons-vue'
import { commentApi } from '@/api/comment'
import CommentItem from '@/components/CommentItem.vue'
import type { CommentVO } from '@/types/comment'

const props = defineProps<{
  videoId: number
  user?: { id: number; nickname?: string; avatar?: string | null } | null
  loggedIn: boolean
}>()

const comments = ref<CommentVO[]>([])
const newComment = ref('')
const submitting = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const page = ref(1)
const hasMore = ref(true)
const totalComments = ref(0)
const PAGE_SIZE = 10

// Map of commentId -> CommentItem ref for calling resetReplyInput
const replyRefs = new Map<number, any>()

function registerReplyRef(id: number, el: any) {
  if (el) replyRefs.set(id, el)
}

// ── Load ──
async function loadComments(reset = false) {
  if (reset) {
    page.value = 1
    comments.value = []
    hasMore.value = true
    loading.value = true
  }

  try {
    const res = await commentApi.getComments(props.videoId, {
      page: page.value,
      size: PAGE_SIZE,
    })
    const data = res.data
    const records = data.records || []

    if (reset) {
      comments.value = records
    } else {
      comments.value.push(...records)
    }

    totalComments.value = data.total
    hasMore.value = page.value * PAGE_SIZE < data.total
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  page.value += 1
  await loadComments(false)
}

// ── Post root comment ──
async function submitComment() {
  const text = newComment.value.trim()
  if (!text || submitting.value) return
  submitting.value = true

  try {
    await commentApi.createComment(props.videoId, { content: text })
    ElMessage.success('Comment posted')
    newComment.value = ''
    await loadComments(true)
  } catch {
    // handled by interceptor
  } finally {
    submitting.value = false
  }
}

// ── Reply ──
async function handleReply(commentId: number, content: string) {
  try {
    await commentApi.createComment(props.videoId, {
      content,
      parentId: commentId,
    })
    ElMessage.success('Reply posted')
    // Reset the reply input
    const ref = replyRefs.get(commentId)
    ref?.resetReplyInput?.()
    // Reload to show the new reply
    await loadComments(true)
  } catch {
    // handled by interceptor
  }
}

// ── Like ──
async function handleLike(commentId: number) {
  if (!props.loggedIn) {
    ElMessage.warning('Please login first')
    return
  }
  // Fire and forget (optimistic update handled by CommentItem)
  commentApi.likeComment(commentId).catch(() => {})
}

// ── Delete ──
async function handleDelete(commentId: number) {
  try {
    await commentApi.deleteComment(commentId)
    ElMessage.success('Comment deleted')
    await loadComments(true)
  } catch {
    // handled by interceptor
  }
}

// ── Watch videoId changes ──
watch(() => props.videoId, () => {
  loadComments(true)
}, { immediate: true })
</script>

<style scoped>
/*
 * 评论区 — 浅灰磨砂输入框，柔和分割线
 */
.comment-section {
  padding: 24px 0 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 22px;
  color: var(--text-primary);
}

/* ── 评论输入框：浅灰色磨砂圆角 ── */
.comment-input {
  display: flex;
  gap: 14px;
  margin-bottom: 28px;
}

.input-avatar { flex-shrink: 0; }

.input-wrapper {
  flex: 1;
}

.input-wrapper :deep(.el-textarea__inner) {
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid var(--border-light);
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  transition: border-color 0.25s, box-shadow 0.25s;
  box-shadow: none !important;
  resize: none;
}

.input-wrapper :deep(.el-textarea__inner:focus) {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-dim) !important;
  background: #fff;
}

.input-wrapper :deep(.el-input__count) {
  background: transparent;
  font-size: 12px;
  color: var(--text-tertiary);
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.login-hint {
  font-size: 14px;
  color: var(--text-secondary);
  padding: 10px 0;
}

.login-hint a {
  color: var(--brand);
  font-weight: 500;
}

/* ── 评论列表 ── */
.comment-list {
  margin-top: 4px;
}

/* ── 分割线改用浅透明细线 ── */
.comment-root + .comment-root {
  border-top: 1px solid var(--border-light);
  padding-top: 18px;
  margin-top: 18px;
}

/* ── States ── */
.empty-state {
  text-align: center;
  padding: 48px 0;
  color: var(--text-tertiary);
}

.empty-state p {
  margin: 10px 0 0;
  font-size: 14px;
}

.loading-state { padding: 16px 0; }

.load-more {
  text-align: center;
  margin-top: 22px;
}
</style>
