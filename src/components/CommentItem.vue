<template>
  <div class="comment-item" :class="{ 'is-reply': isReply }">
    <!-- Avatar -->
    <router-link :to="`/user/${comment.userId}`" class="comment-avatar">
      <el-avatar :size="isReply ? 28 : 36" :src="comment.user?.avatar || undefined">
        {{ comment.user?.nickname?.[0]?.toUpperCase() || 'U' }}
      </el-avatar>
    </router-link>

    <div class="comment-body">
      <!-- Header: name + time + delete -->
      <div class="comment-header">
        <router-link :to="`/user/${comment.userId}`" class="comment-user">
          {{ comment.user?.nickname || comment.user?.username || 'Unknown' }}
        </router-link>
        <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
        <button
          v-if="isOwner"
          class="delete-btn"
          title="Delete"
          @click="$emit('delete', comment.id)"
        >
          <el-icon :size="12"><Delete /></el-icon>
        </button>
      </div>

      <!-- Content -->
      <p class="comment-content">{{ comment.content }}</p>

      <!-- Actions -->
      <div class="comment-actions">
        <button class="action-btn" :class="{ active: liked }" @click="toggleLike">
          <el-icon :size="14"><Pointer /></el-icon>
          <span>{{ displayLikeCount }}</span>
        </button>
        <button v-if="!isReply" class="action-btn" @click="toggleReplyInput">
          <el-icon :size="14"><ChatDotRound /></el-icon>
          <span>Reply</span>
        </button>
        <span v-if="comment.replies?.length" class="reply-count" @click="toggleReplyInput">
          {{ comment.replies.length }} {{ comment.replies.length === 1 ? 'reply' : 'replies' }}
        </span>
      </div>

      <!-- Inline reply input (root comment only) -->
      <div v-if="showReplyInput && !isReply" class="reply-input-area">
        <el-input
          v-model="replyText"
          :placeholder="`Reply to ${comment.user?.nickname || 'user'}...`"
          size="small"
          maxlength="500"
          show-word-limit
          @keyup.enter="submitReply"
        />
        <div class="reply-input-actions">
          <el-button size="small" @click="closeReplyInput">Cancel</el-button>
          <el-button
            size="small"
            type="primary"
            :disabled="!replyText.trim()"
            :loading="replying"
            @click="submitReply"
          >
            Reply
          </el-button>
        </div>
      </div>

      <!-- Nested replies -->
      <div v-if="comment.replies?.length" class="replies">
        <CommentItem
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          :is-reply="true"
          :owner-id="ownerId"
          @like="$emit('like', $event)"
          @delete="(id: number) => $emit('delete', id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Pointer, ChatDotRound, Delete } from '@element-plus/icons-vue'
import type { CommentVO } from '@/types/comment'

const props = defineProps<{
  comment: CommentVO
  isReply?: boolean
  ownerId?: number | null
}>()

const emit = defineEmits<{
  like: [commentId: number]
  delete: [commentId: number]
  reply: [commentId: number, content: string]
}>()

const liked = ref(false)
const showReplyInput = ref(false)
const replyText = ref('')
const replying = ref(false)

const isOwner = computed(() => props.ownerId != null && props.ownerId === props.comment.userId)

const displayLikeCount = computed(() => {
  const count = props.comment.likeCount + (liked.value ? 1 : 0)
  return count > 0 ? count : ''
})

function toggleLike() {
  liked.value = !liked.value
  emit('like', props.comment.id)
}

function toggleReplyInput() {
  showReplyInput.value = !showReplyInput.value
  if (!showReplyInput.value) {
    replyText.value = ''
  }
}

function closeReplyInput() {
  showReplyInput.value = false
  replyText.value = ''
}

async function submitReply() {
  const text = replyText.value.trim()
  if (!text) return
  replying.value = true
  emit('reply', props.comment.id, text)
  // Parent will clear and close on success
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return dateStr.slice(0, 10)
}

// Expose reset for parent to call after successful reply
function resetReplyInput() {
  replyText.value = ''
  replying.value = false
  showReplyInput.value = false
}

defineExpose({ resetReplyInput })
</script>

<style scoped>
.comment-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}
.comment-item:last-of-type {
  border-bottom: none;
}
.comment-item.is-reply {
  padding: 10px 0 0 44px;
  border-bottom: none;
}

.comment-avatar { flex-shrink: 0; line-height: 0; }

.comment-body { flex: 1; min-width: 0; }

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.comment-user {
  font-size: 13px;
  font-weight: 600;
  color: #fb7299;
  text-decoration: none;
}
.comment-time { font-size: 12px; color: #bbb; }
.delete-btn {
  margin-left: auto;
  padding: 2px;
  border: none;
  background: none;
  cursor: pointer;
  color: #ccc;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}
.comment-item:hover .delete-btn { opacity: 1; }
.delete-btn:hover { color: #f56c6c; }

.comment-content {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: #999;
  border-radius: 4px;
  transition: color 0.2s;
}
.action-btn:hover { color: #fb7299; }
.action-btn.active { color: #fb7299; }
.reply-count {
  font-size: 12px;
  color: #fb7299;
  cursor: pointer;
}
.reply-count:hover { opacity: 0.8; }

/* Reply input */
.reply-input-area {
  margin-top: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}
.reply-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.replies { margin-top: 4px; }
</style>
