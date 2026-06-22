<template>
  <div class="danmaku-sender">
    <div class="input-wrapper">
      <!-- 弹幕输入框 -->
      <input
        v-model="content"
        type="text"
        placeholder="发送弹幕..."
        maxlength="100"
        @keyup.enter="sendDanmaku"
        :disabled="!loggedIn"
        class="danmaku-input"
      />

      <!-- 设置按钮（封装颜色 + 发送模式） -->
      <div class="settings-wrap" ref="settingsRef">
        <button class="settings-btn" @click="togglePanel">
          <!-- 当前选中颜色小圆点 -->
          <span class="cur-color" :style="{ backgroundColor: selectedColor }" />
          <!-- 当前模式文字 -->
          <span class="cur-mode">{{ currentTypeLabel }}</span>
          <svg class="arrow-icon" :class="{ open: panelOpen }" width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- 弹出面板 -->
        <transition name="pop">
          <div v-if="panelOpen" class="settings-panel">
            <!-- 颜色选择 -->
            <div class="panel-section">
              <span class="panel-label">颜色</span>
              <div class="color-picker">
                <button
                  v-for="color in colors"
                  :key="color"
                  class="color-btn"
                  :style="{ backgroundColor: color }"
                  :class="{ active: selectedColor === color }"
                  @click="selectedColor = color"
                  :title="color"
                />
              </div>
            </div>
            <div class="panel-divider" />
            <!-- 发送模式 -->
            <div class="panel-section">
              <span class="panel-label">模式</span>
              <div class="type-selector">
                <button
                  v-for="type in types"
                  :key="type.value"
                  class="type-btn"
                  :class="{ active: selectedType === type.value }"
                  @click="selectedType = type.value"
                >
                  {{ type.label }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 发送按钮 -->
      <button
        class="send-btn"
        @click="sendDanmaku"
        :disabled="!canSend"
        :class="{ sending: isSending }"
      >
        {{ isSending ? '发送中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { danmakuSocket } from '@/utils/danmakuSocket'

const props = defineProps<{
  videoId: number
  currentTime: number
  loggedIn: boolean
}>()

const content = ref('')
const selectedColor = ref('#FFFFFF')
const selectedType = ref(0)
const isSending = ref(false)
const panelOpen = ref(false)
const settingsRef = ref<HTMLElement | null>(null)

const canSend = computed(() => content.value.trim() && props.loggedIn)

const currentTypeLabel = computed(() => {
  return types.find(t => t.value === selectedType.value)?.label || '滚动'
})

const colors = [
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#FFA500'
]

const types = [
  { value: 0, label: '滚动' },
  { value: 1, label: '顶部' },
  { value: 2, label: '底部' }
]

function togglePanel() {
  panelOpen.value = !panelOpen.value
}

function closePanel(e: MouseEvent) {
  if (settingsRef.value && !settingsRef.value.contains(e.target as Node)) {
    panelOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closePanel)
})

onUnmounted(() => {
  document.removeEventListener('click', closePanel)
})

async function sendDanmaku() {
  if (!canSend.value || isSending.value) return

  isSending.value = true

  try {
    await danmakuSocket.sendDanmaku({
      videoId: props.videoId,
      content: content.value.trim(),
      time: props.currentTime,
      color: selectedColor.value,
      type: selectedType.value
    })
    content.value = ''
    ElMessage.success('弹幕发送成功')
  } catch (error) {
    ElMessage.error('发送失败，请重试')
  } finally {
    isSending.value = false
  }
}
</script>

<style scoped>
/*
 * ██ 弹幕工具栏 — 水平单行布局
 * 颜色 + 发送模式封装到一个设置按钮内
 */
.danmaku-sender {
  padding: 10px 14px;
  background: var(--bg-glass-dark);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  border-radius: var(--radius-md);
  margin-top: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/*
 * 水平布局：[输入框] [设置按钮] [发送]
 */
.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ── 输入框 ── */
.danmaku-input {
  flex: 1;
  min-width: 0;
  padding: 9px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.danmaku-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.danmaku-input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(255, 119, 169, 0.15);
}

.danmaku-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── 设置按钮 ── */
.settings-wrap {
  position: relative;
  flex-shrink: 0;
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.85);
}

/* 当前选中颜色小圆点 */
.cur-color {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

/* 当前模式文字 */
.cur-mode {
  font-weight: 500;
}

/* 箭头图标 */
.arrow-icon {
  transition: transform 0.25s;
}

.arrow-icon.open {
  transform: rotate(180deg);
}

/* ── 弹出面板 ── */
.settings-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  padding: 12px 14px;
  background: rgba(30, 30, 38, 0.95);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 50;
}

.panel-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
  min-width: 28px;
}

.panel-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 8px 0;
}

/* 弹出动画 */
.pop-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* ── 颜色选择器（面板内） ── */
.color-picker {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.color-btn:hover {
  transform: scale(1.15);
  border-color: rgba(255, 255, 255, 0.4);
}

.color-btn.active {
  border-color: #fff;
  transform: scale(1.2);
  box-shadow: 0 0 0 2px var(--brand);
}

/* ── 类型切换（面板内） ── */
.type-selector {
  display: flex;
  gap: 4px;
}

.type-btn {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1.4;
}

.type-btn:hover {
  color: rgba(255, 255, 255, 0.85);
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.05);
}

.type-btn.active {
  border-color: var(--brand);
  color: #fff;
  background: rgba(255, 119, 169, 0.25);
}

/* ── 发送按钮 ── */
.send-btn {
  flex-shrink: 0;
  padding: 7px 22px;
  border: none;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--brand), var(--brand-light));
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(255, 119, 169, 0.25);
  line-height: 1;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(255, 119, 169, 0.35);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.send-btn.sending {
  opacity: 0.8;
}
</style>
