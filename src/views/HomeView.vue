<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Promotion, Document, DataBoard } from '@element-plus/icons-vue'

const router = useRouter()

const tools = [
  {
    name: '翻译工具', desc: '基于 DeepSeek AI 的智能翻译',
    detail: '支持中英韩日德法阿互译，自定义提示词，翻译历史记录。',
    route: '/translate', icon: Promotion, accent: 'var(--cyber-cyan)', glow: 'var(--cyber-glow-cyan)',
  },
  {
    name: 'JSON 工具', desc: 'JSON 格式化 / 校验 / 压缩',
    detail: '实时检测 JSON 格式是否正确，支持缩进切换、Key 排序、一键压缩。',
    route: '/json', icon: Document, accent: 'var(--cyber-green)', glow: 'var(--cyber-glow-green)',
  },
  {
    name: 'SQL 工具', desc: 'SQL 格式化 / 压缩',
    detail: '支持 SQLite、MySQL、PostgreSQL、TSQL、MariaDB 方言，关键字大小写切换。',
    route: '/sql', icon: DataBoard, accent: 'var(--cyber-magenta)', glow: 'var(--cyber-glow-magenta)',
  },
]

function openTool(route: string) { router.push(route) }
</script>

<template>
  <div class="home">
    <div class="hero">
      <h1>工具箱</h1>
      <p>实用桌面工具集合</p>
      <div class="divider"></div>
    </div>

    <div class="grid">
      <el-card
        v-for="tool in tools" :key="tool.name"
        class="tool-card"
        :style="{ '--accent': tool.accent, '--glow': tool.glow }"
        shadow="hover"
        @click="openTool(tool.route)"
      >
        <div class="card-inner">
          <div class="tool-icon">
            <el-icon :size="24"><component :is="tool.icon" /></el-icon>
          </div>
          <div class="tool-body">
            <h3>{{ tool.name }}</h3>
            <p class="desc">{{ tool.desc }}</p>
            <p class="detail">{{ tool.detail }}</p>
          </div>
          <el-icon class="arrow" :size="18"><component :is="tool.icon" /></el-icon>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.home { max-width: 700px; margin: 0 auto; }

.hero {
  text-align: center;
  padding: 36px 0 44px;
}

.hero h1 {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 4px;
  margin: 0 0 8px;
  background: linear-gradient(135deg, var(--cyber-cyan), var(--cyber-magenta));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
}

.hero p {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.divider {
  width: 50px; height: 2px;
  margin: 14px auto 0;
  background: linear-gradient(90deg, transparent, var(--cyber-cyan), transparent);
}

.grid { display: flex; flex-direction: column; gap: 12px; }

.tool-card {
  cursor: pointer;
  transition: all var(--el-transition-duration);
  border-color: var(--cyber-border);
}

.tool-card:hover {
  border-color: var(--accent) !important;
  box-shadow: var(--glow), 0 4px 24px rgba(0,0,0,0.4) !important;
  transform: translateY(-2px);
}

.card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tool-icon {
  width: 48px; height: 48px;
  border-radius: 10px;
  background: var(--cyber-bg-elevated);
  border: 1px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
  box-shadow: var(--glow);
}

.tool-body { flex: 1; min-width: 0; }

.tool-body h3 { font-size: 15px; font-weight: 600; color: var(--accent); margin: 0 0 3px; }
.desc { font-size: 13px; color: var(--el-text-color-regular); margin: 0 0 3px; }
.detail { font-size: 12px; color: var(--el-text-color-secondary); margin: 0; line-height: 1.5; }

.arrow {
  color: var(--accent);
  flex-shrink: 0;
  opacity: 0.4;
  transition: opacity var(--el-transition-duration-fast);
}

.tool-card:hover .arrow { opacity: 1; }
</style>
