<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Delete, Refresh, Top, Bottom, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getHistory, getHistoryCount, deleteHistory, type HistoryRecord } from '../api/deepseek'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const history = ref<HistoryRecord[]>([])
const historyTotal = ref(0)
const selectedIds = ref<Set<number>>(new Set())
const page = ref(1)
const pageSize = ref(5)
const sortDesc = ref(true)
const loading = ref(false)

const languages = [
  { label: '自动检测', value: 'auto' }, { label: '中文', value: 'Chinese' },
  { label: 'English', value: 'English' }, { label: '한국어', value: 'Korean' },
  { label: '日本語', value: 'Japanese' }, { label: 'Deutsch', value: 'German' },
  { label: 'Français', value: 'French' }, { label: 'العربية', value: 'Arabic' },
]

const pageSizes = [5, 10, 20]
const totalPages = computed(() => Math.max(1, Math.ceil(historyTotal.value / pageSize.value)))
const allSelected = computed(() => history.value.length > 0 && history.value.every(h => selectedIds.value.has(h.id)))
const anySelected = computed(() => selectedIds.value.size > 0)

function formatTime(dt: string) {
  if (!dt) return ''
  const d = dt.replace('T', ' ').replace('Z', '')
  return d.length >= 19 ? d.substring(0, 19) : d
}

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); ElMessage.success('已复制') } catch { ElMessage.error('复制失败') }
}

function langLabel(v: string) { return languages.find(l => l.value === v)?.label ?? v }

function toggleSelect(id: number) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) { s.delete(id) } else { s.add(id) }
  selectedIds.value = s
}

function toggleAll() {
  selectedIds.value = allSelected.value ? new Set() : new Set(history.value.map(h => h.id))
}

async function loadTotal() {
  historyTotal.value = await getHistoryCount()
}

async function loadPage() {
  loading.value = true
  try {
    const maxPage = Math.max(1, Math.ceil(historyTotal.value / pageSize.value))
    if (page.value > maxPage) page.value = maxPage
    const offset = (page.value - 1) * pageSize.value
    history.value = await getHistory(offset, pageSize.value, sortDesc.value)
    selectedIds.value = new Set()
  } catch (e) { ElMessage.error('加载失败: ' + String(e)) }
  loading.value = false
}

// Full reload: re-query total + current page
async function fullReload() {
  await loadTotal()
  await loadPage()
}

// Page-only: navigate to new page without re-counting
async function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  await loadPage()
}

async function refresh() {
  page.value = 1
  await fullReload()
}

async function deleteSelected() {
  if (selectedIds.value.size === 0) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.size} 条记录？`, '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    const ids = [...selectedIds.value]
    await deleteHistory(ids)
    // Refresh: re-count + smart page adjust (loadPage auto-clamps if page exceeds available)
    historyTotal.value = await getHistoryCount()
    const maxPage = Math.max(1, Math.ceil(historyTotal.value / pageSize.value))
    if (page.value > maxPage) page.value = maxPage
    selectedIds.value = new Set()
    await loadPage()
  } catch {}
}

async function deleteAll() {
  try {
    await ElMessageBox.confirm('确定删除所有翻译历史记录？此操作不可撤销！', '确认全部删除', { confirmButtonText: '全部删除', cancelButtonText: '取消', type: 'warning' })
    await deleteHistory([])
    page.value = 1; historyTotal.value = 0; history.value = []; selectedIds.value = new Set()
    await loadPage()
  } catch {}
}

// Watch for page-size or sort changes — full reload
watch([pageSize, sortDesc], () => {
  page.value = 1
  fullReload()
})

function handleOpen() { page.value = 1; selectedIds.value = new Set(); fullReload() }
defineExpose({ refresh })
</script>

<template>
  <el-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @open="handleOpen" title="翻译历史" width="90%" top="3vh" destroy-on-close>
    <!-- Toolbar -->
    <div class="htoolbar">
      <div class="htool-left">
        <el-checkbox :model-value="allSelected" :indeterminate="anySelected && !allSelected" @change="toggleAll">全选</el-checkbox>
        <el-button v-if="anySelected" :icon="Delete" size="small" type="danger" plain @click="deleteSelected">删除({{ selectedIds.size }})</el-button>
      </div>
      <div class="htool-right">
        <span class="sort-btn" :class="{ active: sortDesc }" @click="sortDesc = !sortDesc" title="切换排序">
          <el-icon :size="16"><component :is="sortDesc ? Bottom : Top" /></el-icon>
        </span>
        <el-button :icon="Refresh" size="small" text :loading="loading" @click="refresh">刷新</el-button>
        <el-button size="small" text type="danger" @click="deleteAll">清空全部</el-button>
      </div>
    </div>

    <!-- List -->
    <div class="hlist" v-loading="loading">
      <div v-for="item in history" :key="item.id" class="hitem">
        <el-checkbox :model-value="selectedIds.has(item.id)" class="hcheck" @change="toggleSelect(item.id)" />
        <div class="hbody">
          <div class="hmeta">
            <span class="hlangs">{{ langLabel(item.source_lang) }} → {{ langLabel(item.target_lang) }}</span>
            <span class="hmodel">{{ item.model }}</span>
            <span class="htime">{{ formatTime(item.created_at) }}</span>
          </div>
          <div class="htexts">
            <span class="htext">{{ item.source_text }}</span>
            <el-button class="hcopy" :icon="CopyDocument" text size="small" @click="copyText(item.source_text)" title="复制源文本" />
            <span class="harrow">→</span>
            <span class="htext hresult">{{ item.result_text }}</span>
            <el-button class="hcopy" :icon="CopyDocument" text size="small" @click="copyText(item.result_text)" title="复制译文" />
          </div>
        </div>
      </div>
      <div v-if="history.length === 0 && !loading" class="hempty">暂无翻译记录</div>
    </div>

    <!-- Pagination -->
    <div class="hpager">
      <el-select v-model="pageSize" size="small" style="width:80px">
        <el-option v-for="s in pageSizes" :key="s" :label="`${s}条/页`" :value="s" />
      </el-select>
      <div class="hpages">
        <el-button size="small" text :disabled="page <= 1" @click="goPage(1)">«</el-button>
        <el-button size="small" text :disabled="page <= 1" @click="goPage(page - 1)">‹</el-button>
        <span class="hpinfo">{{ page }} / {{ totalPages }}</span>
        <el-button size="small" text :disabled="page >= totalPages" @click="goPage(page + 1)">›</el-button>
        <el-button size="small" text :disabled="page >= totalPages" @click="goPage(totalPages)">»</el-button>
      </div>
      <span class="htotal">共 {{ historyTotal }} 条</span>
    </div>
  </el-dialog>
</template>

<style scoped>
.htoolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--cyber-border); flex-wrap: wrap; gap: 8px; }
.htool-left { display: flex; align-items: center; gap: 10px; }
.htool-right { display: flex; align-items: center; gap: 6px; }

.sort-btn { cursor: pointer; padding: 4px; border-radius: 4px; color: var(--el-text-color-placeholder); transition: all .15s; }
.sort-btn:hover { color: var(--el-text-color-regular); background: var(--el-fill-color-light); }
.sort-btn.active { color: var(--cyber-cyan); }

.hlist { display: flex; flex-direction: column; gap: 6px; max-height: 50vh; overflow-y: auto; min-height: 120px; }

.hitem { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: var(--el-fill-color-lighter); border-radius: 8px; }
.hcheck { flex-shrink: 0; margin-top: 2px; }
.hbody { flex: 1; min-width: 0; }

.hmeta { display: flex; gap: 8px; margin-bottom: 3px; font-size: 12px; }
.hlangs { font-weight: 600; color: var(--cyber-cyan); }
.hmodel { color: var(--el-text-color-placeholder); font-size: 11px; }
.htime { margin-left: auto; color: var(--el-text-color-placeholder); font-size: 11px; font-family: 'JetBrains Mono', Consolas, monospace; }

.htexts { display: flex; align-items: baseline; gap: 8px; font-size: 13px; line-height: 1.55; }
.htext { flex: 1; min-width: 0; white-space: pre-wrap; word-break: break-word; color: var(--el-text-color-regular); }
.hresult { color: var(--cyber-green); }
.harrow { flex-shrink: 0; color: var(--cyber-cyan); font-weight: 600; opacity: 0.6; }
.hcopy { flex-shrink: 0; opacity: 0; transition: opacity .15s; }
.hitem:hover .hcopy { opacity: 0.6; }
.hitem:hover .hcopy:hover { opacity: 1; }

.hempty { text-align: center; color: var(--el-text-color-placeholder); padding: 50px 0; font-size: 14px; }

.hpager { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--cyber-border); }
.hpages { display: flex; align-items: center; gap: 2px; }
.hpinfo { font-size: 13px; color: var(--el-text-color-regular); padding: 0 8px; }
.htotal { font-size: 12px; color: var(--el-text-color-placeholder); margin-left: auto; }
</style>
