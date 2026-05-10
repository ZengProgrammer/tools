<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowDown, Delete, Setting } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { translate, loadSettings, saveSetting } from '../api/deepseek'
import HistoryDialog from '../components/HistoryDialog.vue'
import PromptDialog from '../components/PromptDialog.vue'

const winId = getCurrentWindow().label
let unlistenSync: UnlistenFn | null = null

const DEFAULT_PROMPT = '你是一名专业翻译。将以下文本从{source}翻译成{target}。只返回翻译结果，不要添加任何解释、注释或引号。'

const languages = [
  { label: '自动检测', value: 'auto' },
  { label: '中文', value: 'Chinese' }, { label: 'English', value: 'English' },
  { label: '한국어', value: 'Korean' }, { label: '日本語', value: 'Japanese' },
  { label: 'Deutsch', value: 'German' }, { label: 'Français', value: 'French' },
  { label: 'العربية', value: 'Arabic' },
]

const modelOptions = [
  { label: 'deepseek-v4-flash', value: 'deepseek-v4-flash' },
  { label: 'deepseek-v4-pro', value: 'deepseek-v4-pro' },
  { label: '自定义', value: 'custom' },
]

const apiKey = ref('')
const model = ref('deepseek-v4-flash')
const customModel = ref('')
const systemPrompt = ref(DEFAULT_PROMPT)
const showSettings = ref(false)
const effectiveModel = computed(() => model.value === 'custom' ? (customModel.value || 'deepseek-v4-flash') : model.value)

const sourceText = ref('')
const sourceLang = ref('auto')
const targetLang = ref('English')
const result = ref('')
const translating = ref(false)
const errorMsg = ref('')

const showPromptDialog = ref(false)
const showHistory = ref(false)
const historyDialogRef = ref<InstanceType<typeof HistoryDialog> | null>(null)

onMounted(async () => {
  try {
    const settings = await loadSettings()
    if (settings.api_key) apiKey.value = settings.api_key
    if (settings.model) model.value = settings.model
    if (settings.custom_model) customModel.value = settings.custom_model
    if (settings.system_prompt) systemPrompt.value = settings.system_prompt
    unlistenSync = await listen<{ from: string; sourceText: string; result: string }>('translate-sync', (e) => {
      if (e.payload.from === winId) return
      sourceText.value = e.payload.sourceText
      result.value = e.payload.result
    })
    // Settings sync: update in-memory values when other window saves
    const unlistenSettings = await listen<{ from: string; apiKey: string; model: string; customModel: string; systemPrompt: string }>('settings-sync', (s) => {
      if (s.payload.from === winId) return
      apiKey.value = s.payload.apiKey
      model.value = s.payload.model
      customModel.value = s.payload.customModel
      if (s.payload.systemPrompt) systemPrompt.value = s.payload.systemPrompt
    })
    onUnmounted(() => unlistenSettings())
    // When tray switches: source window broadcasts; target window picks it up
    const unlistenSwitch = await listen<string>('switch-sync', (e) => {
      if (e.payload === winId) {
        // I'm the source → broadcast my state to all windows
        syncOut()
      } else {
        // I'm the target → clear local state, source's syncOut will fill it
        sourceText.value = ''
        result.value = ''
        errorMsg.value = ''
      }
    })
    onUnmounted(() => unlistenSwitch())
  } catch (e) { ElMessage.error('加载设置失败: ' + String(e)) }
})

onUnmounted(() => { unlistenSync?.() })

// Explicit sync — only on clear/translate/copy + tray switch
function syncOut() {
  emit('translate-sync', { from: winId, sourceText: sourceText.value, result: result.value })
}

async function handleSaveSettings() {
  try {
    await saveSetting('api_key', apiKey.value)
    await saveSetting('model', model.value)
    await saveSetting('custom_model', customModel.value)
    await saveSetting('system_prompt', systemPrompt.value)
    ElMessage.success('设置已保存')
    emit('settings-sync', { from: winId, apiKey: apiKey.value, model: model.value, customModel: customModel.value, systemPrompt: systemPrompt.value })
  } catch (e) { ElMessage.error('保存失败: ' + String(e)) }
}

function swapLanguages() {
  if (sourceLang.value === 'auto') return
  [sourceLang.value, targetLang.value] = [targetLang.value, sourceLang.value]
}

async function doTranslate() {
  if (!apiKey.value.trim()) { ElMessageBox.alert('请先在翻译设置中配置 DeepSeek API Key', '提示', { confirmButtonText: '确定' }); return }
  if (!sourceText.value.trim()) { ElMessageBox.alert('请输入要翻译的文本', '提示', { confirmButtonText: '确定' }); return }
  if (sourceLang.value !== 'auto' && sourceLang.value === targetLang.value) { ElMessageBox.alert('源语言和目标语言不能相同', '提示', { confirmButtonText: '确定' }); return }
  errorMsg.value = ''; translating.value = true
  try {
    result.value = await translate({ apiKey: apiKey.value.trim(), model: effectiveModel.value, sourceLang: sourceLang.value, targetLang: targetLang.value, text: sourceText.value.trim(), systemPrompt: systemPrompt.value })
    ElMessage.success('翻译完成')
    if (showHistory.value) historyDialogRef.value?.refresh()
  } catch (e) { errorMsg.value = String(e) }
  translating.value = false
}

async function copyResult() {
  if (!result.value) return
  try { await navigator.clipboard.writeText(result.value); ElMessage.success('已复制到剪贴板') } catch { ElMessage.error('复制失败') }
}
</script>

<template>
  <div class="translate-page">
    <el-card class="control-card" shadow="never">
      <div class="control-row">
        <div class="lang-group">
          <span class="label">源语言</span>
          <el-select v-model="sourceLang" size="default" style="width:130px">
            <el-option v-for="l in languages" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
          <el-button :icon="ArrowDown" circle size="small" :disabled="sourceLang === 'auto'" class="swap" @click="swapLanguages" />
          <span class="label">目标语言</span>
          <el-select v-model="targetLang" size="default" style="width:130px">
            <el-option v-for="l in languages.filter(x => x.value !== 'auto')" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
        </div>
        <div class="action-group">
          <el-button :icon="Setting" @click="showSettings = !showSettings">{{ showSettings ? '收起设置' : '设置' }}</el-button>
          <el-button type="primary" size="large" :loading="translating" class="do-btn" @click="doTranslate">翻译</el-button>
        </div>
      </div>

      <div v-if="showSettings" class="settings-panel">
        <el-divider />
        <div class="setting-grid">
          <el-input v-model="apiKey" type="password" show-password placeholder="DeepSeek API Key (sk-...)" clearable>
            <template #prepend><span style="font-weight:600">Key</span></template>
          </el-input>
          <el-select v-model="model" style="width:200px">
            <el-option v-for="m in modelOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
          <el-input v-if="model === 'custom'" v-model="customModel" placeholder="自定义模型名..." style="width:220px" />
          <el-button type="primary" @click="handleSaveSettings">保存设置</el-button>
        </div>
      </div>
    </el-card>

    <div class="text-area-row">
      <div class="text-panel">
        <div class="panel-top">
          <span class="panel-title">源文本</span>
          <el-button v-if="sourceText" :icon="Delete" text size="small" @click="sourceText = ''">清空</el-button>
        </div>
        <el-input v-model="sourceText" type="textarea" placeholder="输入要翻译的文本..." class="ta-input" />
      </div>
      <div class="text-panel">
        <div class="panel-top">
          <span class="panel-title">翻译结果</span>
          <div class="panel-actions">
            <el-button v-if="result" text size="small" @click="copyResult">复制</el-button>
            <el-button v-if="result" text size="small" @click="result = ''; errorMsg = ''">清空</el-button>
          </div>
        </div>
        <el-input :model-value="errorMsg ? '' : result" type="textarea" readonly placeholder="翻译结果将显示在这里" class="ta-input result-ta" />
        <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon :closable="false" style="margin-top:6px" />
      </div>
    </div>

    <div class="bottom-bar">
      <el-button text @click="showPromptDialog = true">提示词</el-button>
      <el-button text @click="showHistory = true">翻译历史</el-button>
    </div>

    <PromptDialog v-model="showPromptDialog" :system-prompt="systemPrompt" @update:system-prompt="systemPrompt = $event" />
    <HistoryDialog ref="historyDialogRef" v-model="showHistory" />
  </div>
</template>

<style scoped>
.translate-page { height: 100%; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }

.control-card { flex-shrink: 0; }

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.lang-group { display: flex; align-items: center; gap: 8px; }

.label { font-size: 13px; color: var(--el-text-color-secondary); white-space: nowrap; }

.swap { flex-shrink: 0; }

.action-group { display: flex; align-items: center; gap: 8px; }

.do-btn { min-width: 90px; font-weight: 600; letter-spacing: 2px; }

.settings-panel { margin-top: 4px; }

.setting-grid { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.text-area-row {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  min-height: 0;
  overflow: hidden;
}

.text-panel { display: flex; flex-direction: column; gap: 6px; min-height: 0; overflow: hidden; }

.panel-top { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }

.panel-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }

.panel-actions { display: flex; gap: 2px; }

.ta-input { flex: 1; min-height: 0; }

.ta-input :deep(.el-textarea),
.ta-input :deep(.el-textarea__inner) {
  height: 100% !important;
  resize: none !important;
}

.ta-input :deep(.el-textarea__inner) {
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.7;
}

.result-ta :deep(.el-textarea__inner) {
  background: #0d1a1a !important;
  color: var(--cyber-green) !important;
  border-color: rgba(0, 255, 65, 0.15) !important;
}

.bottom-bar { text-align: center; flex-shrink: 0; }
</style>
