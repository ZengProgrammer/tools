<script setup lang="ts">
import { computed, markRaw } from 'vue'
import { useRoute } from 'vue-router'
import TranslateView from './TranslateView.vue'
import JsonView from './JsonView.vue'
import SqlView from './SqlView.vue'

const route = useRoute()
const tool = computed(() => route.params.tool as string)

const component = computed(() => {
  switch (tool.value) {
    case 'translate': return markRaw(TranslateView)
    case 'json': return markRaw(JsonView)
    case 'sql': return markRaw(SqlView)
    default: return null
  }
})
</script>

<template>
  <div class="standalone-page">
    <component :is="component" v-if="component" />
  </div>
</template>

<style>
.standalone-page {
  height: 100vh;
  overflow: hidden;
  padding: 12px;
  background: var(--cyber-bg);
}
</style>
