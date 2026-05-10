<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Delete, Refresh, Top, Bottom, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getInputHistory, getInputHistoryCount, deleteInputHistory, type InputRecord } from '../api/deepseek'

const props = defineProps<{ modelValue: boolean; tool: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; 'useText': [text: string] }>()

const records = ref<InputRecord[]>([])
const total = ref(0)
const selectedIds = ref<Set<number>>(new Set())
const page = ref(1)
const pageSize = ref(5)
const sortDesc = ref(true)
const loading = ref(false)

const pageSizes = [5, 10, 20]
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const allSelected = computed(() => records.value.length > 0 && records.value.every(r => selectedIds.value.has(r.id)))
const anySelected = computed(() => selectedIds.value.size > 0)

async function copyItem(text: string) {
  try { await navigator.clipboard.writeText(text); ElMessage.success('已复制') } catch { ElMessage.error('复制失败') }
}

function formatTime(dt: string) {
  if (!dt) return ''
  const d = dt.replace('T', ' ').replace('Z', '')
  return d.length >= 19 ? d.substring(0, 19) : d
}

function toggleSelect(id: number) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) { s.delete(id) } else { s.add(id) }
  selectedIds.value = s
}
function toggleAll() {
  selectedIds.value = allSelected.value ? new Set() : new Set(records.value.map(r => r.id))
}

async function loadTotal() { total.value = await getInputHistoryCount(props.tool) }

async function loadPage() {
  loading.value = true
  try {
    const maxPage = Math.max(1, Math.ceil(total.value / pageSize.value))
    if (page.value > maxPage) page.value = maxPage
    records.value = await getInputHistory(props.tool, (page.value - 1) * pageSize.value, pageSize.value, sortDesc.value)
    selectedIds.value = new Set()
  } catch (e) { ElMessage.error('加载失败: ' + String(e)) }
  loading.value = false
}

async function fullReload() { await loadTotal(); await loadPage() }
async function goPage(p: number) { if (p >= 1 && p <= totalPages.value) { page.value = p; await loadPage() } }
async function refresh() { page.value = 1; await fullReload() }

async function deleteSelected() {
  if (selectedIds.value.size === 0) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.size} 条？`, '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    await deleteInputHistory(props.tool, [...selectedIds.value])
    total.value = await getInputHistoryCount(props.tool)
    const maxPage = Math.max(1, Math.ceil(total.value / pageSize.value))
    if (page.value > maxPage) page.value = maxPage
    selectedIds.value = new Set()
    await loadPage()
  } catch {}
}

async function deleteAll() {
  try {
    await ElMessageBox.confirm('确定删除所有历史记录？', '确认', { confirmButtonText: '全部删除', cancelButtonText: '取消', type: 'warning' })
    await deleteInputHistory(props.tool, [])
    page.value = 1; total.value = 0; records.value = []; selectedIds.value = new Set()
    await loadPage()
  } catch {}
}

function useRecord(text: string) {
  emit('useText', text)
  emit('update:modelValue', false)
}

watch([pageSize, sortDesc], () => { page.value = 1; fullReload() })

function handleOpen() { page.value = 1; fullReload() }
defineExpose({ refresh })
</script>

<template>
  <el-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @open="handleOpen" title="输入历史" width="80%" top="3vh">
    <div class="itoolbar">
      <div class="itool-left">
        <el-checkbox :model-value="allSelected" :indeterminate="anySelected && !allSelected" @change="toggleAll">全选</el-checkbox>
        <el-button v-if="anySelected" :icon="Delete" size="small" type="danger" plain @click="deleteSelected">删除({{ selectedIds.size }})</el-button>
      </div>
      <div class="itool-right">
        <span class="isort" :class="{ active: sortDesc }" @click="sortDesc = !sortDesc" title="排序">
          <el-icon :size="16"><component :is="sortDesc ? Bottom : Top" /></el-icon>
        </span>
        <el-button :icon="Refresh" size="small" text :loading="loading" @click="refresh">刷新</el-button>
        <el-button size="small" text type="danger" @click="deleteAll">清空全部</el-button>
      </div>
    </div>

    <div class="ilist" v-loading="loading">
      <div v-for="item in records" :key="item.id" class="iitem">
        <el-checkbox :model-value="selectedIds.has(item.id)" class="icheck" @change="toggleSelect(item.id)" />
        <div class="ibody">
          <div class="imeta">
            <span class="itime">{{ formatTime(item.created_at) }}</span>
            <el-button class="icopy" :icon="CopyDocument" text size="small" @click="copyItem(item.input_text)" title="复制" />
          </div>
          <pre class="itext" @dblclick="useRecord(item.input_text)">{{ item.input_text }}</pre>
        </div>
      </div>
      <div v-if="records.length === 0 && !loading" class="iempty">暂无记录（双击可回填）</div>
    </div>

    <div class="ipager">
      <el-select v-model="pageSize" size="small" style="width:80px">
        <el-option v-for="s in pageSizes" :key="s" :label="`${s}条/页`" :value="s" />
      </el-select>
      <div class="ipages">
        <el-button size="small" text :disabled="page <= 1" @click="goPage(1)">«</el-button>
        <el-button size="small" text :disabled="page <= 1" @click="goPage(page - 1)">‹</el-button>
        <span class="iinfo">{{ page }} / {{ totalPages }}</span>
        <el-button size="small" text :disabled="page >= totalPages" @click="goPage(page + 1)">›</el-button>
        <el-button size="small" text :disabled="page >= totalPages" @click="goPage(totalPages)">»</el-button>
      </div>
      <span class="itotal">共 {{ total }} 条</span>
    </div>
  </el-dialog>
</template>

<style scoped>
.itoolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--cyber-border); flex-wrap: wrap; gap: 8px; }
.itool-left { display: flex; align-items: center; gap: 10px; }
.itool-right { display: flex; align-items: center; gap: 6px; }

.isort { cursor: pointer; padding: 4px; border-radius: 4px; color: var(--el-text-color-placeholder); transition: all .15s; }
.isort:hover { color: var(--el-text-color-regular); background: var(--el-fill-color-light); }
.isort.active { color: var(--cyber-cyan); }

.ilist { display: flex; flex-direction: column; gap: 6px; max-height: 50vh; overflow-y: auto; min-height: 100px; }

.iitem { display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; background: var(--el-fill-color-lighter); border-radius: 8px; }
.icheck { flex-shrink: 0; margin-top: 4px; }
.ibody { flex: 1; min-width: 0; }

.imeta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.icopy { opacity: 0; transition: opacity .15s; }
.iitem:hover .icopy { opacity: 0.6; }
.iitem:hover .icopy:hover { opacity: 1; }
.itime { font-size: 11px; color: var(--el-text-color-placeholder); font-family: 'JetBrains Mono', Consolas, monospace; }

.itext {
  margin: 0; padding: 8px 10px;
  background: #1a1a2e; border: 1px solid var(--cyber-border); border-radius: 6px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 12px; line-height: 1.55; color: #c0c0d8;
  white-space: pre-wrap; word-break: break-all;
  max-height: 200px; overflow-y: auto;
  cursor: pointer; transition: border-color .15s;
}

.itext:hover { border-color: var(--cyber-cyan); }

.iempty { text-align: center; color: var(--el-text-color-placeholder); padding: 50px 0; font-size: 14px; }

.ipager { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--cyber-border); }
.ipages { display: flex; align-items: center; gap: 2px; }
.iinfo { font-size: 13px; color: var(--el-text-color-regular); padding: 0 8px; }
.itotal { font-size: 12px; color: var(--el-text-color-placeholder); margin-left: auto; }
</style>
