<template>
  <div class="settings-page">
    <h2 class="page-title">Settings</h2>

    <!-- ── Avatar ── -->
    <div class="avatar-section">
      <div class="avatar-upload" @click="triggerUpload">
        <el-avatar :size="80" class="avatar-img" :src="previewUrl || undefined">
          {{ authStore.user?.nickname?.[0]?.toUpperCase() || 'U' }}
        </el-avatar>
        <div class="avatar-overlay">
          <el-icon :size="24"><Camera /></el-icon>
          <span>Change</span>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden-input"
        @change="handleFileChange"
      />
      <div class="avatar-info">
        <p class="avatar-name">{{ authStore.user?.nickname }}</p>
        <p class="avatar-hint">JPG / PNG / WebP · Max 5MB</p>
      </div>
    </div>

    <!-- ── Form ── -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="settings-form"
      @keyup.enter="handleSave"
    >
      <el-form-item label="Nickname" prop="nickname">
        <el-input v-model="form.nickname" placeholder="Enter nickname" maxlength="50" />
      </el-form-item>

      <el-form-item label="Bio" prop="bio">
        <el-input
          v-model="form.bio"
          type="textarea"
          :rows="3"
          placeholder="Tell us about yourself"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="Email" prop="email">
        <el-input v-model="form.email" placeholder="Enter email" />
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Camera } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/api/user'

const authStore = useAuthStore()
const router = useRouter()
const formRef = ref<FormInstance>()
const fileInput = ref<HTMLInputElement>()
const saving = ref(false)
const previewUrl = ref('')
const avatarFile = ref<File | null>(null)

const form = reactive({
  nickname: '',
  bio: '',
  email: '',
})

const rules: FormRules = {
  nickname: [{ min: 1, max: 50, message: 'Nickname must be 1-50 characters', trigger: 'blur' }],
  email: [{ type: 'email', message: 'Invalid email format', trigger: 'blur' }],
}

// ── Init ──
onMounted(() => {
  if (authStore.user) {
    form.nickname = authStore.user.nickname || ''
    form.bio = authStore.user.bio || ''
    form.email = authStore.user.email || ''
    previewUrl.value = authStore.user.avatar || ''
  }
})

// ── Avatar Upload ──
function triggerUpload() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('Please select an image file')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('Image must be less than 5MB')
    return
  }

  avatarFile.value = file
  const reader = new FileReader()
  reader.onload = () => { previewUrl.value = reader.result as string }
  reader.readAsDataURL(file)
}

// ── Save ──
async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  const userId = authStore.user?.id
  if (!userId) { saving.value = false; return }

  try {
    // 1. Upload avatar if changed
    if (avatarFile.value) {
      const avatarRes = await userApi.uploadAvatar(userId, avatarFile.value)
      authStore.user = avatarRes.data  // 立即更新 store，HeaderNav 响应式回显
    }

    // 2. Update profile fields
    await userApi.updateUser(userId, {
      nickname: form.nickname,
      bio: form.bio,
      email: form.email,
    })

    // 3. Refresh store
    await authStore.fetchUser()

    ElMessage.success('Profile updated')
    router.push(`/user/${userId}`)  // 跳转到个人主页
  } catch {
    // handled by interceptor
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 600px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 28px;
  color: #333;
}

/* ── Avatar ── */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar-upload {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  display: block;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 12px;
  gap: 2px;
}

.avatar-upload:hover .avatar-overlay { opacity: 1; }

.hidden-input { display: none; }

.avatar-info { flex: 1; }

.avatar-name {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.avatar-hint {
  margin: 0;
  font-size: 12px;
  color: #bbb;
}

/* ── Form ── */
.settings-form {
  max-width: 500px;
}
</style>
