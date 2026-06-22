<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

onMounted(() => {
  useAuthStore().restoreSession()
})
</script>

<style>
/* ── 全局重置 & 设计令牌 ── */
:root {
  /* 品牌色系 —— 柔和粉 */
  --brand: #FF77A9;
  --brand-light: #FF99BF;
  --brand-dim: rgba(255, 119, 169, 0.08);
  --brand-glow: rgba(255, 119, 169, 0.25);

  /* 背景 */
  --bg-page: #FAFAFC;
  --bg-card: #FFFFFF;
  --bg-glass: rgba(255, 255, 255, 0.72);
  --bg-glass-dark: rgba(30, 30, 38, 0.75);

  /* 文字 */
  --text-primary: #1E1E26;
  --text-secondary: #777;
  --text-tertiary: #AAA;
  --text-inverse: #FFFFFF;

  /* 边框 / 分割线 */
  --border-light: rgba(0, 0, 0, 0.06);
  --border-hover: rgba(0, 0, 0, 0.10);

  /* 圆角系统 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 999px;

  /* 阴影系统 — 极柔和 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.02);
  --shadow-glow: 0 0 24px rgba(255, 119, 169, 0.15);

  /* Element Plus 主题色覆盖 */
  --el-color-primary: #FF77A9;
  --el-color-primary-light-3: #FF99BF;
  --el-color-primary-light-5: #FFBBD4;
  --el-color-primary-light-7: #FFDDE9;
  --el-color-primary-dark-2: #E05A8A;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-primary);
  background: var(--bg-page);
  line-height: 1.6;
}

a {
  color: var(--brand);
  text-decoration: none;
  transition: color 0.2s;
}
a:hover {
  color: var(--brand-light);
}

/* 滚动条美化 — 轻量化 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.10);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.18);
}

/* Element Plus 通用微调 */
.el-button {
  --el-border-radius-base: var(--radius-full);
}
.el-button--primary {
  --el-button-bg-color: var(--brand);
  --el-button-border-color: var(--brand);
  --el-button-hover-bg-color: var(--brand-light);
  --el-button-hover-border-color: var(--brand-light);
}
.el-input__wrapper {
  --el-input-border-radius: var(--radius-md);
  box-shadow: none !important;
}
</style>
