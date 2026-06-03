<template>
  <header class="site-header">
    <div class="header-inner">
      <!-- Logo -->
      <router-link to="/home" class="header-logo">
        <svg viewBox="0 0 48 48" width="32" height="32" fill="none">
          <rect width="48" height="48" rx="12" fill="#fb7299"/>
          <path d="M16 14v20l16-10L16 14z" fill="#fff"/>
        </svg>
        <span class="logo-text">Vidego</span>
      </router-link>

      <!-- Search -->
      <div class="header-search">
        <el-input
          v-model="keyword"
          placeholder="Search videos..."
          :prefix-icon="Search"
          clearable
          size="default"
          class="search-input"
          @keyup.enter="doSearch"
        />
      </div>

      <!-- Actions -->
      <div class="header-actions">
        <template v-if="authStore.isLoggedIn">
          <el-button class="upload-btn" @click="router.push('/upload')">
            <el-icon><Upload /></el-icon>
            <span class="upload-text">Upload</span>
          </el-button>

          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" class="user-avatar" :src="authStore.user?.avatar || undefined">
                {{ authStore.user?.nickname?.[0]?.toUpperCase() || 'U' }}
              </el-avatar>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  Profile
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  Settings
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  Logout
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button class="nav-btn" @click="router.push('/login')">Login</el-button>
          <el-button type="primary" class="nav-btn-primary" @click="router.push('/register')">Register</el-button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Upload, User, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const keyword = ref(appStore.searchKeyword)

function doSearch() {
  const trimmed = keyword.value.trim()
  if (!trimmed) return
  appStore.setSearchKeyword(trimmed)
  router.push({ path: '/search', query: { q: trimmed } })
}

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      if (authStore.user?.id) router.push(`/user/${authStore.user.id}`)
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      authStore.logout()
      break
  }
}
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 20px;
}

/* ── Logo ── */
.header-logo {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #fb7299;
  letter-spacing: 0.5px;
}

/* ── Search ── */
.header-search {
  flex: 1;
  max-width: 480px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  background: #f5f5f5;
  box-shadow: none !important;
}

.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.el-input__wrapper.is-focus) {
  background: #f0f0f0;
}

/* ── Actions ── */
.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.upload-btn {
  border: 1px solid #e8e8e8;
  border-radius: 20px;
  color: #666;
  font-size: 13px;
}

.upload-btn:hover {
  color: #fb7299;
  border-color: #fb7299;
}

.upload-text {
  margin-left: 4px;
}

.nav-btn {
  border-radius: 20px;
  font-size: 13px;
  color: #666;
}

.nav-btn-primary {
  border-radius: 20px;
  font-size: 13px;
}

.user-dropdown {
  cursor: pointer;
  display: block;
  line-height: 0;
}

.user-avatar {
  border: 2px solid transparent;
  transition: border-color 0.2s;
  cursor: pointer;
}

.user-avatar:hover {
  border-color: #fb7299;
}

:deep(.el-dropdown-menu__item) {
  font-size: 13px;
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin-right: 6px;
}
</style>
