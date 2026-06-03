<template>
  <div class="upload-page">
    <div class="upload-container">
      <!-- Header -->
      <div class="upload-header">
        <h2 class="page-title">Upload Video</h2>
        <p class="page-desc">Share your video with the community</p>
      </div>

      <!-- ── Step 1: File Selection ── -->
      <div v-if="step === 'idle'" class="upload-zone">
        <el-upload
          ref="uploadRef"
          drag
          :auto-upload="false"
          :accept="ACCEPTED_TYPES.join(',')"
          :on-change="handleFileChange"
          :show-file-list="false"
          class="upload-area"
        >
          <div class="upload-zone-content">
            <el-icon class="zone-icon" :size="56"><UploadFilled /></el-icon>
            <p class="zone-title">Drag & drop video here</p>
            <p class="zone-subtitle">or <em>click to browse</em></p>
            <p class="zone-hint">Supports MP4, WebM · Max 500MB</p>
          </div>
        </el-upload>
      </div>

      <!-- ── Step 2: Upload Form ── -->
      <div v-if="step === 'selected'" class="upload-body">
        <div class="upload-left">
          <!-- Video Preview -->
          <div class="preview-card">
            <div class="preview-label">Video Preview</div>
            <video
              v-if="videoObjectUrl"
              :src="videoObjectUrl"
              class="video-preview"
              controls
              preload="metadata"
            />
            <div class="preview-info">
              <span>{{ fileName }}</span>
              <span class="dot">·</span>
              <span>{{ formatFileSize(fileSize) }}</span>
              <span class="dot">·</span>
              <span>{{ formattedDuration }}</span>
            </div>
          </div>

          <!-- Cover Preview -->
          <div class="preview-card">
            <div class="preview-label">Cover Preview</div>
            <div class="cover-area" @click="triggerCoverInput">
              <img
                v-if="coverPreview"
                :src="coverPreview"
                class="cover-image"
                alt="cover"
              />
              <div v-else class="cover-placeholder">
                <el-icon :size="32"><Picture /></el-icon>
                <p>Click to select cover</p>
                <p class="cover-hint">Optional · Auto-generated if not set</p>
              </div>
            </div>
            <input
              ref="coverInputRef"
              type="file"
              accept="image/jpeg,image/png"
              class="hidden-input"
              @change="handleCoverChange"
            />
          </div>

          <!-- Change File -->
          <el-button text class="change-file-btn" @click="resetUpload">
            <el-icon><Refresh /></el-icon>
            Choose a different file
          </el-button>
        </div>

        <!-- Right: Form -->
        <div class="upload-right">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            class="upload-form"
          >
            <el-form-item label="Title" prop="title">
              <el-input
                v-model="form.title"
                placeholder="Give your video a catchy title"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="Description" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="5"
                placeholder="Describe your video (optional)"
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="Tags" prop="tags">
              <el-select
                v-model="form.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="Add tags (press Enter to add)"
                class="tag-select"
              >
                <el-option
                  v-for="t in suggestedTags"
                  :key="t"
                  :label="t"
                  :value="t"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- ── Action Bar ── -->
      <div v-if="step === 'selected'" class="upload-actions">
        <div class="actions-left">
          <span class="file-badge">{{ fileName }}</span>
        </div>
        <div class="actions-right">
          <el-button :disabled="uploading" @click="resetUpload">Cancel</el-button>
          <el-button
            type="primary"
            class="upload-btn"
            :loading="uploading"
            @click="startUpload"
          >
            <template v-if="!uploading">
              <el-icon><Upload /></el-icon>
              Upload
            </template>
            <template v-else>
              Uploading {{ uploadProgress }}%
            </template>
          </el-button>
        </div>
      </div>
    </div>

    <!-- ── Upload Progress Overlay ── -->
    <Transition name="fade">
      <div v-if="uploading" class="progress-overlay">
        <div class="progress-card">
          <el-progress type="circle" :percentage="uploadProgress" :width="160" :stroke-width="8" color="#fb7299" />
          <p class="progress-text">
            {{ uploadStage === 'token' ? 'Preparing upload...' : '' }}
            {{ uploadStage === 'uploading' ? `Uploading video... ${uploadProgress}%` : '' }}
            {{ uploadStage === 'cover' ? 'Uploading cover...' : '' }}
            {{ uploadStage === 'creating' ? 'Creating video record...' : '' }}
          </p>
          <p class="progress-size">{{ formatFileSize(uploadedBytes) }} / {{ formatFileSize(fileSize) }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadInstance } from 'element-plus'
import { UploadFilled, Picture, Refresh, Upload } from '@element-plus/icons-vue'
import { videoApi } from '@/api/video'

const router = useRouter()

// ── Constants ──
const ACCEPTED_TYPES = ['video/mp4', 'video/webm']
const ACCEPTED_EXTENSIONS = ['.mp4', '.webm']
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const SUGGESTED_TAGS = ['Tech', 'Life', 'Gaming', 'Music', 'Education', 'Entertainment', 'Sports', 'Vlog']

// ── Refs ──
const uploadRef = ref<UploadInstance>()
const formRef = ref<FormInstance>()
const coverInputRef = ref<HTMLInputElement>()

// ── Step State ──
type UploadStep = 'idle' | 'selected' | 'uploading'
const step = ref<UploadStep>('idle')
const selectedFile = ref<File | null>(null)
const videoObjectUrl = ref<string>('')
const videoDuration = ref(0)
const coverFile = ref<File | null>(null)
const coverPreview = ref<string>('')
const suggestedTags = ref(SUGGESTED_TAGS)

// ── Upload Progress ──
const uploadProgress = ref(0)
const uploadedBytes = ref(0)
const uploadStage = ref<'token' | 'uploading' | 'cover' | 'creating'>('token')
const uploading = computed(() => step.value === 'uploading')

// ── Computed ──
const fileName = computed(() => selectedFile.value?.name || '')
const fileSize = computed(() => selectedFile.value?.size || 0)

const formattedDuration = computed(() => {
  const d = videoDuration.value
  if (!d) return '--:--'
  const m = Math.floor(d / 60)
  const s = d % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

// ── Form ──
const form = reactive({
  title: '',
  description: '',
  tags: [] as string[],
})

const rules: FormRules = {
  title: [
    { required: true, message: 'Please enter a video title', trigger: 'blur' },
    { min: 1, max: 100, message: 'Title must be 1-100 characters', trigger: 'blur' },
  ],
}

// ── File Selection ──
function validateFile(file: File): boolean {
  if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.some(e => file.name.toLowerCase().endsWith(e))) {
    ElMessage.error('Only MP4 and WebM files are supported')
    return false
  }
  if (file.size > MAX_FILE_SIZE) {
    ElMessage.error('File size exceeds the 500MB limit')
    return false
  }
  return true
}

async function handleFileChange(uploadFile: any) {
  const file = uploadFile.raw as File
  if (!file) return

  // Client-side validation
  if (!validateFile(file)) {
    return
  }

  selectedFile.value = file

  // Create object URL for preview
  if (videoObjectUrl.value) URL.revokeObjectURL(videoObjectUrl.value)
  videoObjectUrl.value = URL.createObjectURL(file)

  // Extract video duration
  await extractVideoDuration(file)

  // Auto-capture cover frame
  captureCoverFrame()

  step.value = 'selected'
}

function extractVideoDuration(file: File): Promise<void> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      videoDuration.value = Math.floor(video.duration)
      URL.revokeObjectURL(video.src)
      resolve()
    }
    video.onerror = () => resolve()
    video.src = URL.createObjectURL(file)
  })
}

function captureCoverFrame() {
  if (!videoObjectUrl.value) return
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.src = videoObjectUrl.value
  video.currentTime = 1 // Seek to 1 second

  video.onseeked = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 180
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, 320, 180)
      coverPreview.value = canvas.toDataURL('image/jpeg', 0.85)
    }
    video.remove()
  }

  // Fallback: if seek takes too long
  setTimeout(() => video.remove(), 5000)
}

function triggerCoverInput() {
  coverInputRef.value?.click()
}

function handleCoverChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Validate image type and size
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('Please select an image file')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('Cover image must be less than 5MB')
    return
  }

  coverFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    coverPreview.value = reader.result as string
  }
  reader.readAsDataURL(file)
}

// ── Upload Logic ──
async function startUpload() {
  // Validate form
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const file = selectedFile.value
  if (!file) return

  step.value = 'uploading'
  uploadProgress.value = 0
  uploadStage.value = 'token'

  try {
    // 1. Get upload token
    const tokenRes = await videoApi.getUploadToken(file.name, file.size)
    const { uploadUrl, objectKey } = tokenRes.data

    // 生产环境：通过 Nginx 代理上传，不直接暴露 MinIO
    // 将 presigned URL 的 host 部分替换为 /upload-minio
    // const proxiedUrl = uploadUrl.replace(/https?:\/\/[^/]+/, '/upload-minio')

    // 2. Upload video via Nginx proxy
    uploadStage.value = 'uploading'
    // await uploadFileToMinIO(proxiedUrl, file)
    await uploadFileToMinIO(uploadUrl, file)

    // 3. Create video record
    uploadStage.value = 'creating'
    uploadProgress.value = 100

    const createRes = await videoApi.createVideo({
      title: form.title,
      description: form.description || undefined,
      videoKey: objectKey,
      duration: videoDuration.value,
      size: file.size,
      tags: form.tags.length > 0 ? form.tags : undefined,
    })

    // 4. Success
    ElMessage.success('Video uploaded successfully!')
    const videoId = createRes.data.id
    router.push(`/video/${videoId}`)

  } catch (err: any) {
    ElMessage.error(err?.message || 'Upload failed, please try again')
    step.value = 'selected'
    uploadProgress.value = 0
  }
}

function uploadFileToMinIO(url: string, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100)
        uploadedBytes.value = e.loaded
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed (HTTP ${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.ontimeout = () => reject(new Error('Upload timed out'))

    xhr.open('PUT', url, true)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.timeout = 30 * 60 * 1000 // 30 minutes for large files
    xhr.send(file)
  })
}

// ── Reset ──
function resetUpload() {
  if (uploading.value) return
  step.value = 'idle'
  selectedFile.value = null
  if (videoObjectUrl.value) URL.revokeObjectURL(videoObjectUrl.value)
  videoObjectUrl.value = ''
  videoDuration.value = 0
  coverFile.value = null
  coverPreview.value = ''
  uploadProgress.value = 0
  uploadedBytes.value = 0
  form.title = ''
  form.description = ''
  form.tags = []
}

// ── Utilities ──
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i]
}
</script>

<style scoped>
.upload-page {
  max-width: 960px;
  margin: 0 auto;
}

.upload-container {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

/* ── Header ── */
.upload-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #333;
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: #999;
}

/* ── Upload Zone ── */
.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  padding: 64px 24px;
  border: 2px dashed #ddd;
  border-radius: 12px;
  transition: border-color 0.3s, background 0.3s;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #fb7299;
  background: #fff8fa;
}

.upload-area :deep(.el-upload-dragger.is-dragover) {
  border-color: #fb7299;
  background: #fff0f4;
}

.upload-zone-content {
  text-align: center;
}

.zone-icon {
  color: #fb7299;
  margin-bottom: 12px;
}

.zone-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.zone-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px;
}

.zone-subtitle em {
  color: #fb7299;
  font-style: normal;
  font-weight: 500;
}

.zone-hint {
  font-size: 12px;
  color: #bbb;
  margin: 0;
}

/* ── Upload Body (Two Columns) ── */
.upload-body {
  display: flex;
  gap: 28px;
  margin-bottom: 24px;
}

.upload-left {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-right {
  flex: 1;
  min-width: 0;
}

/* ── Preview Cards ── */
.preview-card {
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  padding: 10px 12px 0;
  letter-spacing: 0.5px;
}

.video-preview {
  width: 100%;
  display: block;
  background: #000;
  max-height: 200px;
}

.preview-info {
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  color: #ddd;
}

/* Cover */
.cover-area {
  cursor: pointer;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-image {
  width: 100%;
  display: block;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.cover-placeholder {
  text-align: center;
  padding: 20px;
  color: #bbb;
}

.cover-placeholder p {
  margin: 6px 0 0;
  font-size: 13px;
}

.cover-hint {
  font-size: 11px !important;
  margin-top: 2px !important;
}

.hidden-input {
  display: none;
}

.change-file-btn {
  font-size: 13px;
  color: #999;
}

/* ── Form ── */
.upload-form {
  width: 100%;
}

.upload-form :deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  padding-bottom: 6px;
}

.tag-select {
  width: 100%;
}

/* ── Actions Bar ── */
.upload-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.file-badge {
  font-size: 13px;
  color: #999;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-right {
  display: flex;
  gap: 12px;
}

.upload-btn {
  padding: 10px 32px;
  font-size: 14px;
  border-radius: 8px;
}

/* ── Progress Overlay ── */
.progress-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.progress-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 64px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.progress-text {
  margin: 20px 0 4px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.progress-size {
  margin: 0;
  font-size: 13px;
  color: #999;
}

/* ── Transition ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .upload-body {
    flex-direction: column;
  }

  .upload-left {
    width: 100%;
  }

  .upload-container {
    padding: 20px;
    border-radius: 0;
  }

  .progress-card {
    padding: 32px 24px;
    margin: 0 20px;
  }
}
</style>
