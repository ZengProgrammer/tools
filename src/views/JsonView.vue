<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { CopyDocument, Delete, Checked, CircleClose, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { saveInputHistory } from '../api/deepseek'
import InputHistoryDialog from '../components/InputHistoryDialog.vue'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/atom-one-dark.css'
hljs.registerLanguage('json', json)

const winId = getCurrentWindow().label
let unlistenSync: UnlistenFn | null = null

const input = ref('')
const output = ref('')
const errorMsg = ref('')
const indent = ref(2)
const sortKeys = ref(false)
const showHistory = ref(false)

onMounted(async () => {
  unlistenSync = await listen<{ from: string; input: string; output: string }>('json-sync', (e) => {
    if (e.payload.from === winId) return
    input.value = e.payload.input
    output.value = e.payload.output
  })
  const unlistenSwitch = await listen<string>('switch-sync', (e) => {
    if (e.payload === winId) {
      syncOut()
    } else {
      input.value = ''; output.value = ''; errorMsg.value = ''
    }
  })
  onUnmounted(() => unlistenSwitch())
})

onUnmounted(() => unlistenSync?.())

function syncOut() {
  emit('json-sync', { from: winId, input: input.value, output: output.value })
}

const highlightedOutput = computed(() => output.value ? hljs.highlight(output.value, { language: 'json' }).value : '')

const isValid = computed(() => {
  if (!input.value.trim()) return null
  try { JSON.parse(input.value); return true } catch { return false }
})

function format() {
  errorMsg.value = ''; output.value = ''
  if (!input.value.trim()) { errorMsg.value = '请输入 JSON 文本'; return }
  try {
    let obj = JSON.parse(input.value)
    if (sortKeys.value) obj = sortObjectKeys(obj)
    output.value = JSON.stringify(obj, null, indent.value === 0 ? '\t' : indent.value)
    saveInputHistory('json', input.value)
    ElMessage.success('格式化完成')
  } catch (e) { errorMsg.value = String(e) }
}

function compress() {
  errorMsg.value = ''; output.value = ''
  if (!input.value.trim()) { errorMsg.value = '请输入 JSON 文本'; return }
  try { output.value = JSON.stringify(JSON.parse(input.value)); saveInputHistory('json', input.value); ElMessage.success('压缩完成') } catch (e) { errorMsg.value = String(e) }
}

function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortObjectKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc, key) => { acc[key] = sortObjectKeys(obj[key]); return acc }, {} as Record<string, any>)
  }
  return obj
}

async function copyOutput() {
  if (!output.value) return
  try { await navigator.clipboard.writeText(output.value); ElMessage.success('已复制') } catch { ElMessage.error('复制失败') }
}

function clearInput() { input.value = ''; output.value = ''; errorMsg.value = '' }
</script>

<template>
  <div class="json-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="indent" size="small" style="width:100px">
          <el-option label="2 空格" :value="2" />
          <el-option label="4 空格" :value="4" />
          <el-option label="Tab" :value="0" />
        </el-select>
        <el-checkbox v-model="sortKeys" size="small">Key 排序</el-checkbox>
        <span v-if="isValid === true" class="status ok"><el-icon><Checked /></el-icon> JSON 有效</span>
        <span v-else-if="isValid === false" class="status err"><el-icon><CircleClose /></el-icon> JSON 无效</span>
      </div>
      <div class="toolbar-right">
        <el-button size="small" type="primary" @click="format">格式化</el-button>
        <el-button size="small" @click="compress">压缩</el-button>
        <el-button size="small" text :icon="Clock" @click="showHistory = true">历史</el-button>
      </div>
    </div>

    <div class="text-area-row">
      <div class="text-panel">
        <div class="panel-top">
          <span class="panel-title">输入</span>
          <el-button v-if="input" :icon="Delete" text size="small" @click="clearInput">清空</el-button>
        </div>
        <el-input v-model="input" type="textarea" placeholder="粘贴 JSON 文本..." class="ta-input" />
        <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon :closable="false" style="margin-top:6px" />
      </div>
      <div class="text-panel">
        <div class="panel-top">
          <span class="panel-title">输出</span>
          <el-button v-if="output" text size="small" :icon="CopyDocument" @click="copyOutput">复制</el-button>
        </div>
        <pre v-if="output" class="code-block"><code v-html="highlightedOutput" /></pre>
        <div v-else class="code-block code-empty">格式化结果将显示在这里</div>
        <p v-if="output" class="char-count">{{ output.length }} 字符</p>
      </div>
    </div>
    <InputHistoryDialog v-model="showHistory" tool="json" @use-text="input = $event" />
  </div>
</template>

<style scoped>
.json-page { height: 100%; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }

.toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 18px; background: var(--cyber-bg-card); border: 1px solid var(--cyber-border);
  border-radius: 8px; flex-wrap: wrap; gap: 10px;
}

.toolbar-left { display: flex; align-items: center; gap: 12px; }
.toolbar-right { display: flex; gap: 8px; }

.status { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; }
.status.ok { color: var(--el-color-success); }
.status.err { color: var(--el-color-danger); }

.text-area-row { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; min-height: 0; overflow: hidden; }
.text-panel { display: flex; flex-direction: column; gap: 6px; min-height: 0; overflow: hidden; }

.panel-top { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.panel-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }

.ta-input { flex: 1; min-height: 0; }
.ta-input :deep(.el-textarea),
.ta-input :deep(.el-textarea__inner) { height: 100% !important; resize: none !important; }
.ta-input :deep(.el-textarea__inner) { border-radius: 8px; font-size: 14px; font-family: 'JetBrains Mono','Fira Code',Consolas,monospace; line-height: 1.6; }

.code-block {
  flex: 1; min-height: 0; height: 100%; margin: 0; padding: 14px 16px;
  background: #1a1a2e; border: 1px solid var(--cyber-border); border-radius: 8px;
  overflow: auto; font-family: 'JetBrains Mono','Fira Code',Consolas,monospace;
  font-size: 13px; line-height: 1.7; color: #c0c0d8; white-space: pre;
}

.code-empty { display: flex; align-items: center; justify-content: center; color: var(--el-text-color-placeholder); }

.char-count { font-size: 12px; color: var(--el-text-color-placeholder); text-align: right; margin: 0; }
</style>
