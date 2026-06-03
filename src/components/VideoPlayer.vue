<template>
  <div class="video-player-wrapper" :class="{ 'is-loading': loading }">
    <!-- Loading overlay -->
    <div v-if="loading" class="player-overlay">
      <el-icon class="loading-icon" :size="40"><VideoCamera /></el-icon>
      <p>Loading...</p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="player-overlay error">
      <el-icon :size="40"><WarningFilled /></el-icon>
      <p>Video failed to load</p>
    </div>

    <!-- Video element -->
    <video
      ref="videoRef"
      class="video-element"
      :src="src"
      :poster="poster || undefined"
      controls
      preload="metadata"
      :style="{ display: loading || error ? 'none' : 'block' }"
      @loadedmetadata="onLoadedMetadata"
      @canplay="onCanPlay"
      @play="onPlay"
      @pause="onPause"
      @timeupdate="onTimeUpdate"
      @ended="$emit('ended')"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VideoCamera, WarningFilled } from '@element-plus/icons-vue'

const props = defineProps<{
  src: string
  poster?: string
}>()

const emit = defineEmits<{
  play: []
  pause: []
  timeupdate: [currentTime: number]
  ended: []
  ready: []
}>()

const videoRef = ref<HTMLVideoElement>()
const loading = ref(true)
const error = ref(false)

// Reset state when src changes
watch(() => props.src, () => {
  loading.value = true
  error.value = false
})

function onLoadedMetadata() {
  // Poster will show until user plays
}

function onCanPlay() {
  loading.value = false
  error.value = false
  emit('ready')
}

function onPlay() {
  emit('play')
}

function onPause() {
  emit('pause')
}

function onTimeUpdate() {
  if (videoRef.value) {
    emit('timeupdate', videoRef.value.currentTime)
  }
}

function onError() {
  loading.value = false
  error.value = true
}
</script>

<style scoped>
.video-player-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.player-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 2;
}

.player-overlay p {
  margin: 12px 0 0;
  font-size: 14px;
  opacity: 0.8;
}

.loading-icon {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.error {
  background: rgba(0, 0, 0, 0.7);
}
</style>
