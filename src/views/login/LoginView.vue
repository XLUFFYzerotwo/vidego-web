<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧品牌区 -->
      <div class="auth-brand">
        <div class="brand-content">
          <div class="logo">
            <svg viewBox="0 0 48 48" width="64" height="64" fill="none">
              <rect width="48" height="48" rx="12" fill="#fb7299"/>
              <path d="M16 14v20l16-10L16 14z" fill="#fff"/>
            </svg>
          </div>
          <h1 class="brand-title">Vidego</h1>
          <p class="brand-subtitle">Share your moments, discover the world</p>
        </div>
      </div>

      <!-- 右侧登录区 -->
      <div class="auth-form">
        <h2 class="form-title">Welcome Back</h2>
        <p class="form-subtitle">Login to your account</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="account">
            <el-input
              v-model="form.account"
              placeholder="Username or email"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="Password"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="rememberMe">Remember me</el-checkbox>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="submit-btn"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? 'Logging in...' : 'Login' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <span>Don't have an account?</span>
          <router-link to="/register">Register now</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(true)

const form = reactive({
  account: '',
  password: '',
})

const rules: FormRules = {
  account: [
    { required: true, message: 'Please enter username or email', trigger: 'blur' },
    { min: 2, message: 'At least 2 characters', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Please enter password', trigger: 'blur' },
    { min: 6, message: 'At least 6 characters', trigger: 'blur' },
  ],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login(form)
    ElMessage.success('Login successful')
  } catch (err: any) {
    // Error message is already displayed by the axios interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #fce4ec 0%, #fff5f7 50%, #f3f4f6 100%);
}

.auth-container {
  display: flex;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  width: 840px;
  min-height: 520px;
}

/* ── 左侧品牌区 ── */
.auth-brand {
  width: 380px;
  background: linear-gradient(135deg, #fb7299 0%, #fc8bab 50%, #fda5be 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-content {
  text-align: center;
  color: #fff;
  padding: 40px;
}

.logo {
  margin-bottom: 16px;
  display: inline-block;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: 1px;
}

.brand-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
  line-height: 1.6;
}

/* ── 右侧登录区 ── */
.auth-form {
  flex: 1;
  padding: 56px 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #333;
}

.form-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0 0 32px;
}

.login-form {
  width: 100%;
}

.form-options {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.form-options :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #999;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  border-radius: 8px;
}

.submit-btn:hover {
  opacity: 0.9;
}

.form-footer {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.form-footer a {
  margin-left: 4px;
  font-weight: 500;
}

/* ── 响应式 ── */
@media (max-width: 860px) {
  .auth-container {
    width: 92%;
    flex-direction: column;
    min-height: auto;
  }

  .auth-brand {
    width: 100%;
    padding: 48px 24px;
  }

  .brand-title {
    font-size: 24px;
  }

  .auth-form {
    padding: 40px 32px;
  }
}

@media (max-width: 480px) {
  .auth-page {
    background: #fff;
    align-items: flex-start;
  }

  .auth-container {
    width: 100%;
    border-radius: 0;
    box-shadow: none;
    min-height: 100vh;
  }

  .auth-brand {
    padding: 36px 24px;
  }

  .brand-subtitle {
    font-size: 13px;
  }

  .auth-form {
    padding: 32px 24px;
  }
}
</style>
