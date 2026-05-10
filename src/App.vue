<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import AppLayout from './components/AppLayout.vue'
import FloatingWindow from './views/FloatingWindow.vue'

const router = useRouter()
let unlisten: UnlistenFn | null = null
const isFloating = ref(false)
const isTool = ref(false)

onMounted(async () => {
  const label = getCurrentWindow().label
  if (label === 'floating-ball') {
    isFloating.value = true
    return
  }
  if (label.startsWith('tool-')) {
    isTool.value = true
    return
  }

  unlisten = await listen<string>('navigate', (event) => {
    router.push(event.payload)
  })
})

onUnmounted(() => {
  unlisten?.()
})
</script>

<template>
  <FloatingWindow v-if="isFloating" />
  <router-view v-else-if="isTool" />
  <AppLayout v-else />
</template>
