<script setup lang="ts">
const props = defineProps<{ modelValue: boolean; systemPrompt: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; 'update:systemPrompt': [v: string] }>()

function updatePrompt(val: string) {
  emit('update:systemPrompt', val)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="翻译提示词"
    width="80%"
    top="3vh"
  >
    <el-input
      :model-value="systemPrompt"
      @update:model-value="updatePrompt"
      type="textarea"
      :rows="4"
      placeholder="自定义翻译提示词..."
    />
    <div class="prompt-hint">
      占位符 <code>{source}</code> 源语言, <code>{target}</code> 目标语言
    </div>
  </el-dialog>
</template>

<style scoped>
.prompt-hint { font-size: 12px; color: var(--el-text-color-placeholder); margin-top: 8px; }
.prompt-hint code { background: var(--el-color-primary-light-9); color: var(--el-color-primary); padding: 1px 6px; border-radius: 4px; font-size: 12px; }
</style>
