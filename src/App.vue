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
/* ── 全局重置 ── */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC',
    'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
}

* {
  box-sizing: border-box;
}

a {
  color: #fb7299;
  text-decoration: none;
}
a:hover {
  color: #fc8bab;
}

/* ── 覆盖 Element Plus 主题色 ── */
:root {
  --el-color-primary: #fb7299;
  --el-color-primary-light-3: #fc8bab;
  --el-color-primary-light-5: #fda5be;
  --el-color-primary-light-7: #febfd2;
  --el-color-primary-dark-2: #d15f7e;
}
</style>
