<script setup lang="ts">
import { computed, ref } from 'vue'
import { Promotion, Tools } from '@element-plus/icons-vue'
import { invoke } from '@tauri-apps/api/core'

const name = ref('')
const greeting = ref('')
const loading = ref(false)

const platformName = computed(() => {
  if (typeof navigator === 'undefined') return 'Unknown'
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  return 'Unknown'
})

async function greet() {
  if (!name.value.trim()) return
  loading.value = true
  try {
    greeting.value = await invoke('greet', { name: name.value })
  } catch (e) {
    greeting.value = `Error: ${e}`
  }
  loading.value = false
}
</script>

<template>
  <div class="app-container">
    <el-container>
      <el-header>
        <h1>
          <el-icon :size="28"><Tools /></el-icon>
          Tools - Tauri v2
        </h1>
      </el-header>

      <el-main>
        <el-card class="greet-card">
          <template #header>
            <span>Tauri IPC Test</span>
          </template>

          <el-row :gutter="12" align="middle">
            <el-col :span="16">
              <el-input
                v-model="name"
                placeholder="Enter your name"
                clearable
                @keyup.enter="greet"
              />
            </el-col>
            <el-col :span="4">
              <el-button
                type="primary"
                :loading="loading"
                :icon="Promotion"
                @click="greet"
              >
                Greet
              </el-button>
            </el-col>
          </el-row>

          <div v-if="greeting" class="greeting-result">
            <el-alert
              :title="greeting"
              type="success"
              :closable="false"
              show-icon
            />
          </div>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <span>Environment Info</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Frontend">Vue 3 + Element Plus</el-descriptions-item>
            <el-descriptions-item label="Backend">Tauri v2 (Rust)</el-descriptions-item>
            <el-descriptions-item label="Package Manager">pnpm</el-descriptions-item>
            <el-descriptions-item label="Platform">{{ platformName }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.app-container {
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.el-header {
  display: flex;
  align-items: center;
  background: var(--el-color-primary);
  color: white;
  padding: 0 20px;
}

.el-header h1 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  margin: 0;
}

.el-main {
  max-width: 800px;
  margin: 24px auto;
  padding: 0 24px;
}

.greet-card {
  margin-bottom: 20px;
}

.greeting-result {
  margin-top: 16px;
}
</style>
