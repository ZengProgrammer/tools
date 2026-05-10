<script setup lang="ts">
import { ref, computed, markRaw, onMounted, onUnmounted } from 'vue'
import { Promotion, Document, DataBoard } from '@element-plus/icons-vue'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import TranslateView from './TranslateView.vue'
import JsonView from './JsonView.vue'
import SqlView from './SqlView.vue'

const appWindow = getCurrentWindow()
let unlisten: UnlistenFn | null = null

const tools = [
  { name: '翻译', icon: Promotion, key: 'translate', color: '#00f0ff' },
  { name: 'JSON', icon: Document, key: 'json', color: '#00ff41' },
  { name: 'SQL', icon: DataBoard, key: 'sql', color: '#ff00ff' },
] as const

const activeKey = ref('translate')
const pinned = ref(true)
const contentVisible = ref(true)

async function togglePin() {
  pinned.value = !pinned.value
  await appWindow.setAlwaysOnTop(pinned.value)
}

async function toggleContent(tool: string) {
  if (activeKey.value === tool) {
    contentVisible.value = !contentVisible.value
    if (contentVisible.value) {
      await appWindow.setSize(new LogicalSize(600, 480))
    } else {
      await appWindow.setSize(new LogicalSize(600, 80))
    }
  } else {
    activeKey.value = tool
    if (!contentVisible.value) {
      contentVisible.value = true
      await appWindow.setSize(new LogicalSize(600, 480))
    }
  }
}

const component = computed(() => {
  switch (activeKey.value) {
    case 'translate': return markRaw(TranslateView)
    case 'json': return markRaw(JsonView)
    case 'sql': return markRaw(SqlView)
    default: return null
  }
})

;(window as any).__floatNav = async (tool: string) => {
  activeKey.value = tool
  if (!contentVisible.value) {
    contentVisible.value = true
    await appWindow.setSize(new LogicalSize(600, 480))
  }
}

onMounted(async () => {
  document.documentElement.style.background = 'transparent'
  document.body.style.background = 'transparent'
  unlisten = await listen<string>('float-navigate', async (event) => {
    activeKey.value = event.payload
    if (!contentVisible.value) {
      contentVisible.value = true
      await appWindow.setSize(new LogicalSize(600, 480))
    }
  })
})

onUnmounted(() => {
  unlisten?.()
})
</script>

<template>
  <div class="float-win">
    <div class="title-bar" @mousedown="appWindow.startDragging()">
      <span>工具箱</span>
      <span class="pin-btn" :class="{ pinned }" @mousedown.stop @click.stop="togglePin">
        <svg viewBox="0 0 24 24" width="14" height="14" :fill="pinned ? '#00f0ff' : 'rgba(255,255,255,0.2)'">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
        </svg>
      </span>
    </div>

    <div class="tab-bar">
      <div
        v-for="t in tools" :key="t.key"
        class="tab-btn"
        :class="{ active: activeKey === t.key }"
        :style="{ '--c': t.color }"
        @click="toggleContent(t.key)"
      >
        <el-icon :size="16"><component :is="t.icon" /></el-icon>
        <span>{{ t.name }}</span>
      </div>
    </div>

    <div v-show="contentVisible" class="float-content">
      <KeepAlive>
        <component :is="component" />
      </KeepAlive>
    </div>
  </div>
</template>

<style>
html, body, #app {
  background: transparent !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>

<style scoped>
.float-win {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--cyber-bg);
  overflow: hidden;
}

.title-bar {
  height: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  cursor: grab;
  border-bottom: 1px solid var(--cyber-border);
  letter-spacing: 1px;
  user-select: none;
}

.pin-btn {
  position: absolute;
  right: 8px;
  cursor: pointer;
  color: rgba(255,255,255,0.2);
  transition: color 0.15s;
}

.pin-btn:hover { color: rgba(255,255,255,0.5); }
.pin-btn.pinned { color: #00f0ff; }

.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--cyber-border);
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 0;
  font-size: 13px;
  color: rgba(200,200,230,0.4);
  cursor: pointer;
  transition: all 0.15s;
  border-bottom: 2px solid transparent;
  user-select: none;
}

.tab-btn:hover {
  color: var(--c);
  background: rgba(0,240,255,0.04);
}

.tab-btn.active {
  color: var(--c);
  border-bottom-color: var(--c);
  background: rgba(0,240,255,0.06);
}

.float-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: 10px;
}
</style>

<style>
.float-content .translate-page,
.float-content .json-page,
.float-content .sql-page {
  gap: 8px !important;
  padding: 0 !important;
}

.float-content .top-bar {
  padding: 10px 14px !important;
}

.float-content .lang-select { width: 110px !important; }

.float-content .text-area-row {
  grid-template-columns: 1fr 1fr !important;
  gap: 8px !important;
}

.float-content .text-panel {
  overflow: hidden !important;
}

.float-content .text-panel label,
.float-content .panel-title {
  font-size: 12px !important;
}

.float-content .text-input .el-textarea__inner,
.float-content .code-block {
  font-size: 13px !important;
  min-height: 80px !important;
  border: 1px solid var(--el-border-color) !important;
  border-radius: 6px !important;
  overflow: auto !important;
  resize: none !important;
}

.float-content .result-input .el-textarea__inner {
  background: #0d1a1a !important;
  color: #00ff41 !important;
}

.float-content .el-card {
  border-radius: 6px !important;
}

.float-content .toolbar {
  padding: 10px 14px !important;
  gap: 6px !important;
}

.float-content .translate-btn {
  min-width: 70px !important;
}
</style>
