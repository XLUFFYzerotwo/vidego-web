<template>
  <div class="danmaku-settings">
    <div class="setting-item">
      <span class="setting-label">开启弹幕</span>
      <el-switch 
        v-model="localSettings.enabled" 
        @change="onSettingsChange"
      />
    </div>
    
    <div class="setting-item">
      <span class="setting-label">透明度</span>
      <div class="opacity-slider">
        <el-slider 
          v-model="localSettings.opacity" 
          :min="0.1" 
          :max="1" 
          :step="0.1"
          @change="onSettingsChange"
        />
        <span class="opacity-value">{{ Math.round(localSettings.opacity * 100) }}%</span>
      </div>
    </div>
    
    <div class="setting-item">
      <span class="setting-label">字体大小</span>
      <el-radio-group 
        v-model="localSettings.fontSize" 
        class="font-size-group"
        @change="onSettingsChange"
      >
        <el-radio label="normal">正常</el-radio>
        <el-radio label="large">大号</el-radio>
      </el-radio-group>
    </div>
    
    <div class="setting-item">
      <span class="setting-label">弹幕密度</span>
      <el-radio-group 
        v-model="localSettings.density" 
        class="density-group"
        @change="onSettingsChange"
      >
        <el-radio label="low">稀疏</el-radio>
        <el-radio label="normal">正常</el-radio>
        <el-radio label="high">密集</el-radio>
      </el-radio-group>
    </div>
    
    <div class="setting-item">
      <button class="reset-btn" @click="resetSettings">
        重置为默认
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DanmakuSettings } from '@/types/danmaku'
import { defaultDanmakuSettings } from '@/types/danmaku'

const props = defineProps<{
  settings: DanmakuSettings
}>()

const emit = defineEmits<{
  update: [settings: DanmakuSettings]
}>()

const localSettings = ref<DanmakuSettings>({ ...props.settings })

watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })

function onSettingsChange() {
  emit('update', { ...localSettings.value })
}

function resetSettings() {
  localSettings.value = { ...defaultDanmakuSettings }
  emit('update', { ...defaultDanmakuSettings })
}
</script>

<style scoped>
.danmaku-settings {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 14px;
  color: #333;
}

.opacity-slider {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 200px;
}

.opacity-value {
  font-size: 12px;
  color: #999;
  width: 40px;
}

.font-size-group,
.density-group {
  display: flex;
  gap: 16px;
}

.reset-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #f5f5f5;
  border-color: #d9d9d9;
}
</style>