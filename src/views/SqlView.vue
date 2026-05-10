<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { CopyDocument, Delete, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { saveInputHistory } from '../api/deepseek'
import InputHistoryDialog from '../components/InputHistoryDialog.vue'
import { format } from 'sql-formatter'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/atom-one-dark.css'
hljs.registerLanguage('sql', sql)

const winId = getCurrentWindow().label
let unlistenSync: UnlistenFn | null = null

const dialects = [
  { label: 'SQLite', value: 'sqlite' }, { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' }, { label: 'TSQL', value: 'tsql' },
  { label: 'MariaDB', value: 'mariadb' },
]

const input = ref('')
const output = ref('')
const errorMsg = ref('')
const dialect = ref('sqlite')
const uppercase = ref(false)
const tabWidth = ref(2)
const showHistory = ref(false)

onMounted(async () => {
  unlistenSync = await listen<{ from: string; input: string; output: string }>('sql-sync', (e) => {
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
  emit('sql-sync', { from: winId, input: input.value, output: output.value })
}

const highlightedOutput = computed(() => output.value ? hljs.highlight(output.value, { language: 'sql' }).value : '')

function doFormat() {
  errorMsg.value = ''; output.value = ''
  if (!input.value.trim()) { errorMsg.value = '请输入 SQL 文本'; return }
  try {
    output.value = format(input.value, {
      language: dialect.value as any,
      keywordCase: uppercase.value ? 'upper' : 'lower',
      ...(tabWidth.value === 0 ? { useTabs: true } : { tabWidth: tabWidth.value }),
    })
    saveInputHistory('sql', input.value)
    ElMessage.success('格式化完成')
  } catch (e) { errorMsg.value = String(e) }
}

function doCompress() {
  errorMsg.value = ''; output.value = ''
  if (!input.value.trim()) { errorMsg.value = '请输入 SQL 文本'; return }
  try {
    const formatted = format(input.value, { language: dialect.value as any })
    output.value = formatted.replace(/\n\s*/g, ' ').trim()
    saveInputHistory('sql', input.value)
    ElMessage.success('压缩完成')
  } catch (e) { errorMsg.value = String(e) }
}

async function copyOutput() {
  if (!output.value) return
  try { await navigator.clipboard.writeText(output.value); ElMessage.success('已复制') } catch { ElMessage.error('复制失败') }
}

function clearInput() { input.value = ''; output.value = ''; errorMsg.value = '' }
</script>

<template>
  <div class="sql-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="dialect" size="small" style="width:130px">
          <el-option v-for="d in dialects" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
        <el-select v-model="tabWidth" size="small" style="width:100px">
          <el-option label="2 空格" :value="2" />
          <el-option label="4 空格" :value="4" />
          <el-option label="Tab" :value="0" />
        </el-select>
        <el-checkbox v-model="uppercase" size="small">关键字大写</el-checkbox>
      </div>
      <div class="toolbar-right">
        <el-button size="small" type="primary" @click="doFormat">格式化</el-button>
        <el-button size="small" @click="doCompress">压缩</el-button>
        <el-button size="small" text :icon="Clock" @click="showHistory = true">历史</el-button>
      </div>
    </div>

    <div class="text-area-row">
      <div class="text-panel">
        <div class="panel-top">
          <span class="panel-title">输入</span>
          <el-button v-if="input" :icon="Delete" text size="small" @click="clearInput">清空</el-button>
        </div>
        <el-input v-model="input" type="textarea" placeholder="粘贴 SQL 语句..." class="ta-input" />
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
    <InputHistoryDialog v-model="showHistory" tool="sql" @use-text="input = $event" />
  </div>
</template>

<style scoped>
.sql-page { height: 100%; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }

.toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 18px; background: var(--cyber-bg-card); border: 1px solid var(--cyber-border);
  border-radius: 8px; flex-wrap: wrap; gap: 10px;
}

.toolbar-left { display: flex; align-items: center; gap: 12px; }
.toolbar-right { display: flex; gap: 8px; }

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
