<template>
  <div
    class="danmaku-overlay"
    :class="{ 'is-hidden': !props.settings.enabled }"
    :style="{ opacity: props.settings.opacity }"
  >
    <div
      v-for="danmaku in activeDanmaku"
      :key="danmaku.uniqueId"
      class="danmaku-item"
      :class="[getDanmakuClass(danmaku.type), `font-${props.settings.fontSize}`]"
      :style="getDanmakuStyle(danmaku)"
    >
      {{ danmaku.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { danmakuSocket } from '@/utils/danmakuSocket'
import { danmakuApi } from '@/api/danmaku'
import type { DanmakuVO, DanmakuSettings } from '@/types/danmaku'
import { defaultDanmakuSettings } from '@/types/danmaku'

interface DanmakuItem extends DanmakuVO {
  uniqueId: number
  animDuration: number
  track: number
}

const props = withDefaults(defineProps<{
  videoId: number
  currentTime: number
  settings?: DanmakuSettings
  duration?: number        // 视频总时长（秒），用于控制预取边界
}>(), {
  settings: () => ({ ...defaultDanmakuSettings }),
  duration: 0,
})

const emit = defineEmits<{
  danmakuReceived: [danmaku: DanmakuVO]
}>()

// ── Constants ──
const LOOKAHEAD = 12            // 弹幕提前多少秒出现（与滚动动画时长匹配）
const FETCH_WINDOW = 60         // 每次预取的时间窗口（秒）
const PREFETCH_MARGIN = 20      // 距离缓存末端多远时触发预取
const SCROLL_TRACK_COUNT = 6    // 滚动弹幕轨道数
const TRACK_HEIGHT = 40         // 每轨道像素高度
const TOP_BOTTOM_DURATION = 3000  // 顶部/底部弹幕停留时间（ms）

// ── State ──
const activeDanmaku = ref<DanmakuItem[]>([])        // 屏幕上可见的弹幕
const danmakuQueue = ref<DanmakuItem[]>([])          // 滚动弹幕排队队列
const danmakuPool = ref<DanmakuVO[]>([])             // 已获取的所有弹幕（按 time 排序）
const poolIds = new Set<number>()                    // 已在 pool 中的 id（避免重复 fetch）
const displayIds = new Set<number>()                 // 已展示/入列的弹幕 id（避免重复展示）
const fetchedEnd = ref(0)                            // 已预取的最远时间
let isFetching = false
let danmakuIdCounter = 0
let nextTrack = 0
let animationTimer: number | null = null
let prefetchTimer: number | null = null
let scanIndex = 0                                    // 遍历 pool 的游标

// ── Computed ──
const densityInterval = computed(() => {
  const intervals: Record<string, number> = { low: 1000, normal: 500, high: 200 }
  return intervals[props.settings.density] || 500
})

const effectiveDuration = computed(() => props.duration || Infinity)

// ── Helpers ──
function getDanmakuClass(type: number) {
  return ['danmaku-scroll', 'danmaku-top', 'danmaku-bottom'][type] || 'danmaku-scroll'
}

function getDanmakuStyle(danmaku: DanmakuItem) {
  return {
    color: danmaku.color,
    animationDuration: `${danmaku.animDuration}s`,
    '--random-offset': `${danmaku.track * TRACK_HEIGHT}px`,
  } as any
}

// ── 数据获取（滑动窗口） ──

async function fetchDanmakuWindow() {
  if (isFetching) return
  isFetching = true
  try {
    const start = fetchedEnd.value
    const end = Math.min(start + FETCH_WINDOW, effectiveDuration.value)
    if (start >= end) return

    const res = await danmakuApi.getDanmaku(props.videoId, start, end)
    let added = false
    for (const d of res.data) {
      if (!poolIds.has(d.id)) {
        poolIds.add(d.id)
        danmakuPool.value.push(d)
        added = true
      }
    }
    if (added) {
      danmakuPool.value.sort((a, b) => a.time - b.time)
    }
    fetchedEnd.value = end
  } catch {
    console.error('Failed to fetch danmaku')
  } finally {
    isFetching = false
  }
}

// ── 从 pool 中扫描并调度弹幕 ──

function scheduleFromPool(now: number) {
  if (danmakuPool.value.length === 0) return

  const lookaheadEnd = now + LOOKAHEAD

  // 跳过已过期的弹幕（time < now - 1）
  while (scanIndex < danmakuPool.value.length && danmakuPool.value[scanIndex].time < now - 1) {
    scanIndex++
  }

  // 调度 lookahead 窗口内的弹幕
  for (let i = scanIndex; i < danmakuPool.value.length; i++) {
    const d = danmakuPool.value[i]
    if (d.time > lookaheadEnd) break
    if (!displayIds.has(d.id)) {
      showDanmaku(d)
    }
  }
}

// ── 展示弹幕 ──

function showDanmaku(d: DanmakuVO) {
  displayIds.add(d.id)

  const animDuration = 8 + Math.random() * 4
  const uniqueId = ++danmakuIdCounter

  if (d.type === 0) {
    // 滚动弹幕 → 入队列，由 processQueue 限速调度
    danmakuQueue.value.push({ ...d, uniqueId, animDuration, track: 0 })
  } else {
    // 顶部 / 底部弹幕 → 立刻展示
    activeDanmaku.value.push({ ...d, uniqueId, animDuration, track: 0 })
    setTimeout(() => removeDanmaku(uniqueId), TOP_BOTTOM_DURATION)
  }
}

// ── 队列处理器（限速） ──

function processQueue() {
  if (danmakuQueue.value.length > 0) {
    const item = danmakuQueue.value.shift()!
    item.track = nextTrack
    nextTrack = (nextTrack + 1) % SCROLL_TRACK_COUNT
    activeDanmaku.value.push(item)
    setTimeout(() => removeDanmaku(item.uniqueId), item.animDuration * 1000 + 500)
  }
  animationTimer = window.setTimeout(processQueue, densityInterval.value)
}

function removeDanmaku(uniqueId: number) {
  const idx = activeDanmaku.value.findIndex(d => d.uniqueId === uniqueId)
  if (idx > -1) activeDanmaku.value.splice(idx, 1)
}

// ── WebSocket 实时弹幕 ──

function handleDanmakuReceived(danmaku: DanmakuVO) {
  if (danmaku.videoId !== props.videoId) return
  // 只在时间窗口内展示，过早的弹幕等 pool fetch 覆盖
  if (danmaku.time >= props.currentTime - 1 && danmaku.time <= props.currentTime + LOOKAHEAD) {
    if (!displayIds.has(danmaku.id)) {
      showDanmaku(danmaku)
      emit('danmakuReceived', danmaku)
    }
  }
}

// ── 重置（切换视频时） ──

function reset() {
  activeDanmaku.value = []
  danmakuQueue.value = []
  danmakuPool.value = []
  poolIds.clear()
  displayIds.clear()
  danmakuIdCounter = 0
  fetchedEnd.value = 0
  scanIndex = 0
  nextTrack = 0
  isFetching = false
  if (prefetchTimer) {
    clearTimeout(prefetchTimer)
    prefetchTimer = null
  }
}

// ── Lifecycle ──

onMounted(async () => {
  danmakuSocket.addListener(handleDanmakuReceived)
  danmakuSocket.connect().catch(console.error)
  await fetchDanmakuWindow()
  scheduleFromPool(props.currentTime)
  animationTimer = window.setTimeout(processQueue, 0)
})

onUnmounted(() => {
  danmakuSocket.removeListener(handleDanmakuReceived)
  if (animationTimer) clearTimeout(animationTimer)
  if (prefetchTimer) clearTimeout(prefetchTimer)
})

watch(() => props.videoId, async () => {
  reset()
  await fetchDanmakuWindow()
  scheduleFromPool(props.currentTime)
  animationTimer = window.setTimeout(processQueue, 0)
})

watch(() => props.currentTime, (now) => {
  scheduleFromPool(now)

  // 需要预取？
  if (now + LOOKAHEAD + PREFETCH_MARGIN >= fetchedEnd.value &&
      fetchedEnd.value < effectiveDuration.value &&
      !isFetching &&
      prefetchTimer === null) {
    prefetchTimer = window.setTimeout(async () => {
      prefetchTimer = null
      await fetchDanmakuWindow()
      scheduleFromPool(props.currentTime)
    }, 300)
  }
})
</script>

<style scoped>
.danmaku-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 10;
}

.danmaku-overlay.is-hidden {
  opacity: 0 !important;
}

.danmaku-item {
  position: absolute;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  padding: 2px 8px;
  border-radius: 4px;
}

.font-normal {
  font-size: 14px;
}

.font-large {
  font-size: 18px;
}

.danmaku-scroll {
  top: calc(20% + var(--random-offset, 0px));
  right: -100%;
  animation: scroll-left linear forwards;
}

.danmaku-top {
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
}

.danmaku-bottom {
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
}

@keyframes scroll-left {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100% - 100vw));
  }
}
</style>
