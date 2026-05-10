<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeFilled, Promotion, Setting, Document, DataBoard } from '@element-plus/icons-vue'
import { getCurrentWindow } from '@tauri-apps/api/window'

const router = useRouter()
const route = useRoute()
const appWindow = getCurrentWindow()
const pinned = ref(false)

async function togglePin() {
  pinned.value = !pinned.value
  await appWindow.setAlwaysOnTop(pinned.value)
}

function navigate(path: string) { router.push(path) }
</script>

<template>
  <el-container class="layout">
    <el-aside width="220px">
      <div class="sidebar-brand">
        <el-icon :size="20" class="brand-icon"><Setting /></el-icon>
        <span class="brand-text">工具箱</span>
        <div class="pin-btn" :class="{ pinned }" title="固定窗口" @click="togglePin">
          <svg viewBox="0 0 24 24" width="14" height="14" :fill="pinned ? '#00f0ff' : 'rgba(255,255,255,0.2)'">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
        </div>
      </div>

      <el-menu :default-active="route.path" @select="navigate">
        <el-menu-item index="/">
          <template #title>
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/translate">
          <template #title>
            <el-icon><Promotion /></el-icon>
            <span>翻译工具</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/json">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>JSON 工具</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/sql">
          <template #title>
            <el-icon><DataBoard /></el-icon>
            <span>SQL 工具</span>
          </template>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <span class="version">v0.1.0</span>
      </div>
    </el-aside>

    <el-main>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </el-main>
  </el-container>
</template>

<style scoped>
.layout { height: 100%; }

.el-aside {
  background: linear-gradient(180deg, #0d0d20 0%, #0a0a16 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--cyber-border);
}

.sidebar-brand {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid var(--cyber-border);
}

.pin-btn {
  margin-left: auto;
  width: 30px; height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--el-transition-duration-fast);
}

.pin-btn:hover { background: rgba(0, 240, 255, 0.08); }
.pin-btn.pinned { background: rgba(0, 240, 255, 0.12); }

.brand-icon {
  width: 34px; height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--cyber-cyan), var(--cyber-magenta));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  box-shadow: var(--cyber-glow-cyan);
}

.brand-text {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--cyber-cyan);
  text-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
}

.el-menu {
  flex: 1;
  border-right: none !important;
  padding: 8px 0;
}

.el-menu :deep(.el-menu-item) {
  margin: 2px 10px;
  border-radius: 8px;
  height: 42px;
  line-height: 42px;
  font-size: 14px;
  color: rgba(200, 200, 230, 0.5) !important;
  transition: all var(--el-transition-duration);
}

.el-menu :deep(.el-menu-item:hover) {
  background: rgba(0, 240, 255, 0.06) !important;
  color: var(--cyber-cyan) !important;
}

.el-menu :deep(.el-menu-item.is-active) {
  background: rgba(0, 240, 255, 0.1) !important;
  color: var(--cyber-cyan) !important;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.1);
  border-left: 2px solid var(--cyber-cyan);
}

.sidebar-footer {
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--cyber-border);
}

.version { font-size: 11px; color: rgba(200, 200, 230, 0.2); }

.pin-btn {
  width: 26px; height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--el-transition-duration-fast);
}

.pin-btn:hover { background: rgba(0, 240, 255, 0.08); }
.pin-btn.pinned { background: rgba(0, 240, 255, 0.12); }

.el-main {
  padding: 24px;
  background: var(--cyber-bg);
}
</style>
