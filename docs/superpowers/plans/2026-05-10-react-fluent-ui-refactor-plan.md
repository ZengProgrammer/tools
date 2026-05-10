# React + Fluent UI v9 重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 tools 项目前端从 Vue 3 + Element Plus 重构为 React 18 + Fluent UI v9，所有功能不变。

**Architecture:** React 18 + Fluent UI v9 + React Router v6 前端，Tauri v2 Rust 后端不动。`FluentProvider` 包裹全应用提供主题，`ThemeContext` 管理明暗切换。React Router 的 `HashRouter` 管理路由。`useWindowSync` hook 封装 Tauri 事件实现窗口同步。

**Tech Stack:** React 18.3.1, Fluent UI v9 (@fluentui/react-components 9.56.0), React Router DOM 6.28.0, @vitejs/plugin-react 4.3.4, TypeScript 5.6.3, Tauri v2, highlight.js, sql-formatter

---

## 文件结构

### 新建

| 文件 | 职责 |
|------|------|
| `src/main.tsx` | React 入口，挂载 app |
| `src/App.tsx` | 根组件，FluentProvider + HashRouter |
| `src/theme.ts` | 明暗主题定义（品牌色） |
| `src/contexts/ThemeContext.tsx` | 主题状态 + localStorage 持久化 |
| `src/hooks/useWindowSync.ts` | 封装 Tauri emit/listen |
| `src/api/deepseek.ts` | Tauri invoke 封装（去掉 Vue ref） |
| `src/components/AppLayout.tsx` | 桌面布局（Sidebar + main） |
| `src/components/Sidebar.tsx` | 侧边栏 |
| `src/components/PromptDialog.tsx` | 翻译提示词编辑弹窗 |
| `src/components/HistoryDialog.tsx` | 翻译历史弹窗 |
| `src/components/InputHistoryDialog.tsx` | 输入历史弹窗 |
| `src/views/HomeView.tsx` | 首页工具卡片 |
| `src/views/TranslateView.tsx` | 翻译工具 |
| `src/views/JsonView.tsx` | JSON 格式化工具 |
| `src/views/SqlView.tsx` | SQL 格式化工具 |
| `src/views/FloatingWindow.tsx` | 悬浮窗 |
| `src/views/ToolStandalone.tsx` | 独立工具窗口 |

### 修改

| 文件 | 变更 |
|------|------|
| `package.json` | 版本 0.2.0 + 依赖替换 |
| `vite.config.ts` | `@vitejs/plugin-react` 替换 vue |
| `tsconfig.app.json` | 去掉 `@vue/tsconfig`，加 React 配置 |
| `tsconfig.json` | 不变（只做 references） |
| `tsconfig.node.json` | 不变 |
| `index.html` | 入口改为 `src/main.tsx` |
| `src/style.css` | 缩减为 reset + 滚动条 + 代码块 |

### 删除

| 文件 | 原因 |
|------|------|
| `src/main.ts` | Vue 入口 |
| `src/App.vue` | Vue 根组件 |
| `src/router/index.ts` | Vue Router |
| `src/env.d.ts` | Vue SFC 类型声明 |
| `src/components/AppLayout.vue` | → AppLayout.tsx |
| `src/components/PromptDialog.vue` | → PromptDialog.tsx |
| `src/components/HistoryDialog.vue` | → HistoryDialog.tsx |
| `src/components/InputHistoryDialog.vue` | → InputHistoryDialog.tsx |
| `src/views/HomeView.vue` | → HomeView.tsx |
| `src/views/TranslateView.vue` | → TranslateView.tsx |
| `src/views/JsonView.vue` | → JsonView.tsx |
| `src/views/SqlView.vue` | → SqlView.tsx |
| `src/views/FloatingWindow.vue` | → FloatingWindow.tsx |
| `src/views/ToolStandalone.vue` | → ToolStandalone.tsx |

---

### Task 1: 更新 package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 写入新 package.json**

```json
{
  "name": "tools",
  "private": true,
  "version": "0.2.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "@fluentui/react-components": "9.56.0",
    "@fluentui/react-icons": "2.0.270",
    "@tauri-apps/api": "^2.11.0",
    "highlight.js": "^11.11.1",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router-dom": "6.28.0",
    "sql-formatter": "^15.7.3"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.11.1",
    "@types/react": "18.3.1",
    "@types/react-dom": "18.3.1",
    "@vitejs/plugin-react": "4.3.4",
    "typescript": "5.6.3",
    "vite": "^8.0.10"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: update package.json for React + Fluent UI v9 (v0.2.0)"
```

---

### Task 2: 更新构建配置

**Files:**
- Modify: `vite.config.ts`, `tsconfig.app.json`, `index.html`
- Delete: `src/env.d.ts`

- [ ] **Step 1: 写 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
```

- [ ] **Step 2: 写 tsconfig.app.json**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

- [ ] **Step 3: 写 index.html — 入口改为 src/main.tsx**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>tools</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: 删除 src/env.d.ts（Vue SFC 类型声明，不再需要）**

```bash
rm src/env.d.ts
```

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts tsconfig.app.json index.html
git rm src/env.d.ts
git commit -m "chore: update build config for React (vite plugin, tsconfig, index.html)"
```

---

### Task 3: 主题配置

**Files:**
- Create: `src/theme.ts`

- [ ] **Step 1: 写 src/theme.ts**

```typescript
import {
  teamsDarkTheme,
  teamsLightTheme,
  brandRamp,
  type Theme,
} from '@fluentui/react-components'

const cyanBrand: typeof brandRamp = {
  10: '#030303',
  20: '#0d1a1a',
  30: '#003338',
  40: '#004a52',
  50: '#00636d',
  60: '#007d89',
  70: '#008c99',
  80: '#009ba8',
  90: '#00aab8',
  100: '#00b8c8',
  110: '#00c8d8',
  120: '#00d8e8',
  130: '#00e8f8',
  140: '#33f0f8',
  150: '#66f4f8',
  160: '#99f8f8',
} as typeof brandRamp

export const appDarkTheme: Theme = {
  ...teamsDarkTheme,
  colorBrandForeground1: cyanBrand[110],
  colorBrandForeground2: cyanBrand[120],
  colorBrandBackground: cyanBrand[80],
  colorBrandBackgroundHover: cyanBrand[70],
  colorBrandBackgroundPressed: cyanBrand[60],
  colorBrandBackgroundSelected: cyanBrand[80],
  colorBrandBackgroundStatic: cyanBrand[80],
  colorBrandForegroundLink: cyanBrand[110],
  colorBrandForegroundLinkHover: cyanBrand[120],
  colorBrandForegroundLinkPressed: cyanBrand[100],
  colorBrandForegroundLinkSelected: cyanBrand[110],
  colorCompoundBrandForeground1: cyanBrand[110],
  colorCompoundBrandForeground1Hover: cyanBrand[120],
  colorCompoundBrandForeground1Pressed: cyanBrand[100],
  colorCompoundBrandBackground: cyanBrand[80],
  colorCompoundBrandBackgroundHover: cyanBrand[70],
  colorCompoundBrandBackgroundPressed: cyanBrand[60],
  colorBrandStroke1: cyanBrand[110],
  colorBrandStroke2: cyanBrand[80],
}

export const appLightTheme: Theme = {
  ...teamsLightTheme,
  colorBrandForeground1: cyanBrand[60],
  colorBrandForeground2: cyanBrand[70],
  colorBrandBackground: cyanBrand[100],
  colorBrandBackgroundHover: cyanBrand[110],
  colorBrandBackgroundPressed: cyanBrand[120],
  colorBrandBackgroundSelected: cyanBrand[100],
  colorBrandBackgroundStatic: cyanBrand[100],
  colorBrandForegroundLink: cyanBrand[60],
  colorBrandForegroundLinkHover: cyanBrand[70],
  colorBrandForegroundLinkPressed: cyanBrand[50],
  colorBrandForegroundLinkSelected: cyanBrand[60],
  colorCompoundBrandForeground1: cyanBrand[60],
  colorCompoundBrandForeground1Hover: cyanBrand[70],
  colorCompoundBrandForeground1Pressed: cyanBrand[50],
  colorCompoundBrandBackground: cyanBrand[100],
  colorCompoundBrandBackgroundHover: cyanBrand[110],
  colorCompoundBrandBackgroundPressed: cyanBrand[120],
  colorBrandStroke1: cyanBrand[60],
  colorBrandStroke2: cyanBrand[100],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/theme.ts
git commit -m "feat: add Fluent UI theme config (dark + light, cyan brand)"
```

---

### Task 4: ThemeContext 主题状态管理

**Files:**
- Create: `src/contexts/ThemeContext.tsx`

使用 React Context 管理主题状态，`localStorage` 持久化。

- [ ] **Step 1: 创建目录并写文件**

```bash
mkdir -p src/contexts
```

```tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { FluentProvider } from '@fluentui/react-components'
import { appDarkTheme, appLightTheme } from '../theme'

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved !== 'light'
  })

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <FluentProvider theme={isDark ? appDarkTheme : appLightTheme}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contexts/ThemeContext.tsx
git commit -m "feat: add ThemeContext with dark/light toggle and localStorage persistence"
```

---

### Task 5: useWindowSync hook 和 API 层

**Files:**
- Create: `src/hooks/useWindowSync.ts`
- Modify: `src/api/deepseek.ts`

- [ ] **Step 1: 创建目录并写 useWindowSync hook**

```bash
mkdir -p src/hooks
```

```typescript
import { useEffect, useRef } from 'react'
import { listen, emit, type UnlistenFn } from '@tauri-apps/api/event'

interface SyncPayload { from: string; [key: string]: unknown }

export function useWindowSync<T extends SyncPayload>(
  channel: string,
  winId: string,
  onReceive: (payload: T) => void,
) {
  const onReceiveRef = useRef(onReceive)
  onReceiveRef.current = onReceive

  useEffect(() => {
    let unlisten: UnlistenFn | null = null
    listen<T>(channel, (event) => {
      if (event.payload.from !== winId) {
        onReceiveRef.current(event.payload)
      }
    }).then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
  }, [channel, winId])

  const syncOut = (payload: Omit<T, 'from'>) => {
    emit(channel, { ...payload, from: winId } as T)
  }

  return syncOut
}
```

- [ ] **Step 2: 重写 src/api/deepseek.ts — 移除所有 Vue ref 依赖，保持纯函数**

```typescript
import { invoke } from '@tauri-apps/api/core'

// ---- Settings ----

export function loadSettings(): Promise<Record<string, string>> {
  return invoke<string>('load_settings').then((json) => JSON.parse(json || '{}'))
}

export function saveSetting(key: string, value: string): Promise<void> {
  return invoke('save_setting', { key, value })
}

// ---- Translation ----

export interface TranslateParams {
  apiKey: string
  model: string
  sourceLang: string
  targetLang: string
  text: string
  systemPrompt: string
}

export function translate(params: TranslateParams): Promise<string> {
  return invoke('translate_text', {
    apiKey: params.apiKey,
    model: params.model,
    sourceLang: params.sourceLang,
    targetLang: params.targetLang,
    text: params.text,
    systemPrompt: params.systemPrompt,
  })
}

// ---- History ----

export interface HistoryRecord {
  id: number
  source_text: string
  source_lang: string
  target_lang: string
  result_text: string
  model: string
  created_at: string
}

export function getHistory(offset: number, limit: number, sortDesc = true): Promise<HistoryRecord[]> {
  return invoke('get_translation_history', { offset, limit, sortDesc })
}

export function getHistoryCount(): Promise<number> {
  return invoke('get_translation_history_count')
}

export function deleteHistory(ids: number[]): Promise<void> {
  return invoke('delete_translation_history', { ids })
}

// ---- Input History (JSON / SQL) ----

export interface InputRecord {
  id: number
  tool: string
  input_text: string
  created_at: string
}

export function saveInputHistory(tool: string, inputText: string): Promise<void> {
  return invoke('save_input_history', { tool, inputText })
}

export function getInputHistory(tool: string, offset: number, limit: number, sortDesc = true): Promise<InputRecord[]> {
  return invoke('get_input_history', { tool, offset, limit, sortDesc })
}

export function getInputHistoryCount(tool: string): Promise<number> {
  return invoke('get_input_history_count', { tool })
}

export function deleteInputHistory(tool: string, ids: number[]): Promise<void> {
  return invoke('delete_input_history', { tool, ids })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useWindowSync.ts src/api/deepseek.ts
git commit -m "feat: add useWindowSync hook and rewrite API layer for React"
```

---

### Task 6: 入口文件 main.tsx 和 App.tsx

**Files:**
- Create: `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: 写 src/main.tsx**

```tsx
import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
```

- [ ] **Step 2: 写 src/App.tsx**

```tsx
import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { ThemeProvider } from './contexts/ThemeContext'
import AppLayout from './components/AppLayout'
import FloatingWindow from './views/FloatingWindow'
import ToolStandalone from './views/ToolStandalone'
import HomeView from './views/HomeView'
import TranslateView from './views/TranslateView'
import JsonView from './views/JsonView'
import SqlView from './views/SqlView'

export default function App() {
  const [mode, setMode] = useState<'loading' | 'floating' | 'tool' | 'desktop'>('loading')

  useEffect(() => {
    const label = getCurrentWindow().label
    if (label === 'floating-ball') {
      setMode('floating')
    } else if (label.startsWith('tool-')) {
      setMode('tool')
    } else {
      setMode('desktop')
    }
  }, [])

  if (mode === 'loading') return null

  return (
    <ThemeProvider>
      <HashRouter>
        {mode === 'floating' ? (
          <FloatingWindow />
        ) : mode === 'tool' ? (
          <ToolStandalone />
        ) : (
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomeView />} />
              <Route path="translate" element={<TranslateView />} />
              <Route path="json" element={<JsonView />} />
              <Route path="sql" element={<SqlView />} />
            </Route>
          </Routes>
        )}
      </HashRouter>
    </ThemeProvider>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx src/App.tsx
git commit -m "feat: add React entry point and root App component"
```

---

### Task 7: Sidebar 组件

**Files:**
- Create: `src/components/Sidebar.tsx`

- [ ] **Step 1: 写 src/components/Sidebar.tsx**

```tsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Tooltip, makeStyles, tokens } from '@fluentui/react-components'
import {
  HomeRegular,
  MicRegular,
  CodeRegular,
  DataAreaRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
  PinRegular,
  PinOffRegular,
} from '@fluentui/react-icons'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useTheme } from '../contexts/ThemeContext'

const useStyles = makeStyles({
  aside: {
    width: '220px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  brand: {
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  brandIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundHover})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForegroundInverted,
  },
  brandText: {
    fontSize: '17px',
    fontWeight: 700,
    letterSpacing: '2px',
    color: tokens.colorBrandForeground1,
  },
  pinBtn: {
    marginLeft: 'auto',
  },
  nav: {
    flex: 1,
    padding: '8px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    margin: '2px 10px',
    borderRadius: '8px',
    height: '42px',
    justifyContent: 'flex-start',
    gap: '10px',
    padding: '0 14px',
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    fontWeight: 400,
  },
  navItemActive: {
    color: `${tokens.colorBrandForeground1} !important`,
    backgroundColor: `${tokens.colorBrandBackground} !important`,
    opacity: 0.1,
  },
  footer: {
    padding: '14px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  version: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
  },
})

const navItems = [
  { path: '/', label: '首页', icon: HomeRegular },
  { path: '/translate', label: '翻译工具', icon: MicRegular },
  { path: '/json', label: 'JSON 工具', icon: CodeRegular },
  { path: '/sql', label: 'SQL 工具', icon: DataAreaRegular },
]

export default function Sidebar() {
  const styles = useStyles()
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const [pinned, setPinned] = useState(false)

  async function togglePin() {
    const next = !pinned
    setPinned(next)
    await getCurrentWindow().setAlwaysOnTop(next)
  }

  return (
    <aside className={styles.aside}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <CodeRegular fontSize={20} />
        </div>
        <span className={styles.brandText}>工具箱</span>
        <Tooltip content={pinned ? '取消置顶' : '固定窗口'} relationship="label">
          <Button
            className={styles.pinBtn}
            appearance="subtle"
            icon={pinned ? <PinOffRegular /> : <PinRegular />}
            size="small"
            onClick={togglePin}
          />
        </Tooltip>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const active = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
          return (
            <Button
              key={item.path}
              className={styles.navItem}
              appearance={active ? 'primary' : 'subtle'}
              icon={<item.icon />}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </Button>
          )
        })}
      </nav>

      <div className={styles.footer}>
        <Button
          appearance="subtle"
          icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
          size="small"
          onClick={toggleTheme}
        >
          {isDark ? '浅色' : '深色'}
        </Button>
        <span className={styles.version}>v0.2.0</span>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add Sidebar component with nav, pin, and theme toggle"
```

---

### Task 8: AppLayout 组件

**Files:**
- Create: `src/components/AppLayout.tsx`

- [ ] **Step 1: 写 src/components/AppLayout.tsx**

```tsx
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { makeStyles } from '@fluentui/react-components'
import Sidebar from './Sidebar'

const useStyles = makeStyles({
  layout: {
    height: '100%',
    display: 'flex',
  },
  main: {
    flex: 1,
    padding: '24px',
    overflow: 'auto',
  },
})

export default function AppLayout() {
  const styles = useStyles()
  const navigate = useNavigate()

  useEffect(() => {
    let unlisten: UnlistenFn | null = null
    listen<string>('navigate', (event) => {
      navigate(event.payload)
    }).then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
  }, [navigate])

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AppLayout.tsx
git commit -m "feat: add AppLayout with sidebar and router outlet"
```

---

### Task 9: HomeView 首页

**Files:**
- Create: `src/views/HomeView.tsx`

- [ ] **Step 1: 写 src/views/HomeView.tsx**

```tsx
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, makeStyles, tokens, Body1, Caption1 } from '@fluentui/react-components'
import { MicRegular, CodeRegular, DataAreaRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  home: {
    maxWidth: '700px',
    margin: '0 auto',
  },
  hero: {
    textAlign: 'center',
    padding: '36px 0 44px',
  },
  title: {
    fontSize: '30px',
    fontWeight: 800,
    letterSpacing: '4px',
    margin: '0 0 8px',
    background: `linear-gradient(135deg, ${tokens.colorBrandForeground1}, ${tokens.colorBrandForeground2})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    margin: 0,
  },
  divider: {
    width: '50px',
    height: '2px',
    margin: '14px auto 0',
    background: `linear-gradient(90deg, transparent, ${tokens.colorBrandForeground1}, transparent)`,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: tokens.colorBrandForeground1,
    border: `1px solid ${tokens.colorBrandStroke2}`,
  },
  toolBody: {
    flex: 1,
    minWidth: 0,
  },
  toolName: {
    fontSize: '15px',
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
    margin: '0 0 3px',
  },
  desc: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    margin: '0 0 3px',
  },
  detail: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    margin: 0,
    lineHeight: 1.5,
  },
  arrow: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
    opacity: 0.4,
  },
})

const tools = [
  {
    name: '翻译工具',
    desc: '基于 DeepSeek AI 的智能翻译',
    detail: '支持中英韩日德法阿互译，自定义提示词，翻译历史记录。',
    route: '/translate',
    icon: MicRegular,
  },
  {
    name: 'JSON 工具',
    desc: 'JSON 格式化 / 校验 / 压缩',
    detail: '实时检测 JSON 格式是否正确，支持缩进切换、Key 排序、一键压缩。',
    route: '/json',
    icon: CodeRegular,
  },
  {
    name: 'SQL 工具',
    desc: 'SQL 格式化 / 压缩',
    detail: '支持 SQLite、MySQL、PostgreSQL、TSQL、MariaDB 方言，关键字大小写切换。',
    route: '/sql',
    icon: DataAreaRegular,
  },
]

export default function HomeView() {
  const styles = useStyles()
  const navigate = useNavigate()

  return (
    <div className={styles.home}>
      <div className={styles.hero}>
        <h1 className={styles.title}>工具箱</h1>
        <p className={styles.subtitle}>实用桌面工具集合</p>
        <div className={styles.divider} />
      </div>

      <div className={styles.grid}>
        {tools.map((tool) => (
          <Card key={tool.name} className={styles.card} onClick={() => navigate(tool.route)}>
            <div className={styles.cardInner}>
              <div className={styles.iconWrap}>
                <tool.icon fontSize={24} />
              </div>
              <div className={styles.toolBody}>
                <h3 className={styles.toolName}>{tool.name}</h3>
                <p className={styles.desc}>{tool.desc}</p>
                <p className={styles.detail}>{tool.detail}</p>
              </div>
              <tool.icon className={styles.arrow} fontSize={18} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/HomeView.tsx
git commit -m "feat: add HomeView with tool cards"
```

---

### Task 10: PromptDialog 组件

**Files:**
- Create: `src/components/PromptDialog.tsx`

- [ ] **Step 1: 写 src/components/PromptDialog.tsx**

```tsx
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  Textarea,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components'

const useStyles = makeStyles({
  hint: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    marginTop: '8px',
  },
  code: {
    background: tokens.colorNeutralBackground4,
    color: tokens.colorBrandForeground1,
    padding: '1px 6px',
    borderRadius: '4px',
    fontSize: '12px',
  },
})

interface PromptDialogProps {
  open: boolean
  systemPrompt: string
  onOpenChange: (open: boolean) => void
  onSystemPromptChange: (val: string) => void
}

export default function PromptDialog({
  open,
  systemPrompt,
  onOpenChange,
  onSystemPromptChange,
}: PromptDialogProps) {
  const styles = useStyles()

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>翻译提示词</DialogTitle>
          <Textarea
            value={systemPrompt}
            onChange={(_, data) => onSystemPromptChange(data.value)}
            rows={4}
            placeholder="自定义翻译提示词..."
          />
          <div className={styles.hint}>
            占位符 <code className={styles.code}>{'{source}'}</code> 源语言,{' '}
            <code className={styles.code}>{'{target}'}</code> 目标语言
          </div>
        </DialogBody>
        <DialogActions>
          <Button appearance="primary" onClick={() => onOpenChange(false)}>
            确定
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PromptDialog.tsx
git commit -m "feat: add PromptDialog component"
```

---

### Task 11: HistoryDialog 翻译历史弹窗

**Files:**
- Create: `src/components/HistoryDialog.tsx`

- [ ] **Step 1: 写 src/components/HistoryDialog.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  Button,
  Checkbox,
  Dropdown,
  Option,
  SpinButton,
  Spinner,
  Toast,
  ToastTitle,
  useToastController,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  DeleteRegular,
  ArrowSyncRegular,
  ArrowSortDownRegular,
  ArrowSortUpRegular,
  CopyRegular,
} from '@fluentui/react-icons'
import { getHistory, getHistoryCount, deleteHistory, type HistoryRecord } from '../api/deepseek'

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexWrap: 'wrap',
    gap: '8px',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: '6px' },
  sortBtn: {
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    color: tokens.colorNeutralForeground4,
    transition: 'all 0.15s',
  },
  sortBtnActive: { color: tokens.colorBrandForeground1 },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '50vh',
    overflowY: 'auto',
    minHeight: '120px',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 14px',
    background: tokens.colorNeutralBackground4,
    borderRadius: '8px',
  },
  check: { flexShrink: 0, marginTop: '2px' },
  body: { flex: 1, minWidth: 0 },
  meta: { display: 'flex', gap: '8px', marginBottom: '3px', fontSize: '12px', alignItems: 'center' },
  langs: { fontWeight: 600, color: tokens.colorBrandForeground1 },
  model: { color: tokens.colorNeutralForeground4, fontSize: '11px' },
  time: {
    marginLeft: 'auto',
    color: tokens.colorNeutralForeground4,
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', Consolas, monospace",
  },
  texts: { display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '13px', lineHeight: 1.55 },
  text: {
    flex: 1,
    minWidth: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: tokens.colorNeutralForeground2,
  },
  textResult: { color: tokens.colorStatusSuccessForeground1 },
  arrow: { flexShrink: 0, color: tokens.colorBrandForeground1, fontWeight: 600, opacity: 0.6 },
  copyBtn: { flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' },
  empty: { textAlign: 'center', color: tokens.colorNeutralForeground4, padding: '50px 0', fontSize: '14px' },
  pager: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '14px',
    paddingTop: '10px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  pages: { display: 'flex', alignItems: 'center', gap: '2px' },
  pageInfo: { fontSize: '13px', color: tokens.colorNeutralForeground2, padding: '0 8px' },
  total: { fontSize: '12px', color: tokens.colorNeutralForeground4, marginLeft: 'auto' },
  itemHover: {
    '&:hover .copyBtn': { opacity: 0.6 },
    '&:hover .copyBtn:hover': { opacity: 1 },
  },
})

const languages = [
  { label: '自动检测', value: 'auto' },
  { label: '中文', value: 'Chinese' },
  { label: 'English', value: 'English' },
  { label: '한국어', value: 'Korean' },
  { label: '日本語', value: 'Japanese' },
  { label: 'Deutsch', value: 'German' },
  { label: 'Français', value: 'French' },
  { label: 'العربية', value: 'Arabic' },
]

const pageSizes = [5, 10, 20]

export default function HistoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortDesc, setSortDesc] = useState(true)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const allSelected = history.length > 0 && history.every((h) => selectedIds.has(h.id))
  const anySelected = selectedIds.size > 0

  function formatTime(dt: string) {
    if (!dt) return ''
    const d = dt.replace('T', ' ').replace('Z', '')
    return d.length >= 19 ? d.substring(0, 19) : d
  }

  function langLabel(v: string) {
    return languages.find((l) => l.value === v)?.label ?? v
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      dispatchToast(<Toast><ToastTitle>已复制</ToastTitle></Toast>, { intent: 'success' })
    } catch {
      dispatchToast(<Toast><ToastTitle>复制失败</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(history.map((h) => h.id)))
  }

  async function loadTotal() {
    setTotal(await getHistoryCount())
  }

  async function loadPage() {
    setLoading(true)
    try {
      const maxPage = Math.max(1, Math.ceil(total / pageSize))
      const p = page > maxPage ? maxPage : page
      if (p !== page) setPage(p)
      setHistory(await getHistory((p - 1) * pageSize, pageSize, sortDesc))
      setSelectedIds(new Set())
    } catch (e) {
      dispatchToast(<Toast><ToastTitle>{'加载失败: ' + String(e)}</ToastTitle></Toast>, { intent: 'error' })
    }
    setLoading(false)
  }

  async function fullReload() {
    await loadTotal()
    await loadPage()
  }

  async function goPage(p: number) {
    if (p < 1 || p > totalPages) return
    setPage(p)
  }

  async function refresh() {
    setPage(1)
    await fullReload()
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    try {
      await deleteHistory([...selectedIds])
      setTotal(await getHistoryCount())
      setSelectedIds(new Set())
      await loadPage()
    } catch {}
  }

  async function deleteAll() {
    try {
      await deleteHistory([])
      setPage(1)
      setTotal(0)
      setHistory([])
      setSelectedIds(new Set())
    } catch {}
  }

  const handleOpen = useCallback(() => {
    setPage(1)
    setSelectedIds(new Set())
    fullReload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (open) handleOpen()
  }, [open, handleOpen])

  useEffect(() => {
    if (open) loadPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortDesc])

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>翻译历史</DialogTitle>

          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <Checkbox
                checked={allSelected}
                indeterminate={anySelected && !allSelected}
                onChange={toggleAll}
                label="全选"
              />
              {anySelected && (
                <Button
                  icon={<DeleteRegular />}
                  size="small"
                  appearance="primary"
                  onClick={deleteSelected}
                >
                  删除({selectedIds.size})
                </Button>
              )}
            </div>
            <div className={styles.toolbarRight}>
              <span
                className={`${styles.sortBtn} ${sortDesc ? styles.sortBtnActive : ''}`}
                onClick={() => setSortDesc(!sortDesc)}
                title="切换排序"
              >
                {sortDesc ? <ArrowSortDownRegular fontSize={16} /> : <ArrowSortUpRegular fontSize={16} />}
              </span>
              <Button
                icon={<ArrowSyncRegular />}
                size="small"
                appearance="subtle"
                disabled={loading}
                onClick={refresh}
              >
                刷新
              </Button>
              <Button size="small" appearance="subtle" onClick={deleteAll}>
                清空全部
              </Button>
            </div>
          </div>

          <div className={styles.list}>
            {loading ? (
              <Spinner />
            ) : history.length === 0 ? (
              <div className={styles.empty}>暂无翻译记录</div>
            ) : (
              history.map((item) => (
                <div key={item.id} className={styles.item}>
                  <Checkbox
                    className={styles.check}
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                  <div className={styles.body}>
                    <div className={styles.meta}>
                      <span className={styles.langs}>
                        {langLabel(item.source_lang)} → {langLabel(item.target_lang)}
                      </span>
                      <span className={styles.model}>{item.model}</span>
                      <span className={styles.time}>{formatTime(item.created_at)}</span>
                    </div>
                    <div className={styles.texts}>
                      <span className={styles.text}>{item.source_text}</span>
                      <Button
                        className={styles.copyBtn}
                        icon={<CopyRegular />}
                        appearance="subtle"
                        size="small"
                        onClick={() => copyText(item.source_text)}
                        title="复制源文本"
                      />
                      <span className={styles.arrow}>→</span>
                      <span className={`${styles.text} ${styles.textResult}`}>{item.result_text}</span>
                      <Button
                        className={styles.copyBtn}
                        icon={<CopyRegular />}
                        appearance="subtle"
                        size="small"
                        onClick={() => copyText(item.result_text)}
                        title="复制译文"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.pager}>
            <Dropdown
              value={pageSize}
              onOptionSelect={(_, data) => setPageSize(Number(data.optionValue))}
              style={{ width: '80px' }}
              size="small"
            >
              {pageSizes.map((s) => (
                <Option key={s} value={String(s)}>
                  {s}条/页
                </Option>
              ))}
            </Dropdown>
            <div className={styles.pages}>
              <Button size="small" appearance="subtle" disabled={page <= 1} onClick={() => goPage(1)}>
                «
              </Button>
              <Button size="small" appearance="subtle" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                ‹
              </Button>
              <span className={styles.pageInfo}>
                {page} / {totalPages}
              </span>
              <Button
                size="small"
                appearance="subtle"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                ›
              </Button>
              <Button
                size="small"
                appearance="subtle"
                disabled={page >= totalPages}
                onClick={() => goPage(totalPages)}
              >
                »
              </Button>
            </div>
            <span className={styles.total}>共 {total} 条</span>
          </div>
        </DialogBody>
        <DialogActions>
          <Button appearance="primary" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HistoryDialog.tsx
git commit -m "feat: add HistoryDialog with pagination and batch delete"
```

---

### Task 12: InputHistoryDialog 输入历史弹窗

**Files:**
- Create: `src/components/InputHistoryDialog.tsx`

- [ ] **Step 1: 写 src/components/InputHistoryDialog.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  Button,
  Checkbox,
  Dropdown,
  Option,
  Spinner,
  Toast,
  ToastTitle,
  useToastController,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  DeleteRegular,
  ArrowSyncRegular,
  ArrowSortDownRegular,
  ArrowSortUpRegular,
  CopyRegular,
} from '@fluentui/react-icons'
import { getInputHistory, getInputHistoryCount, deleteInputHistory, type InputRecord } from '../api/deepseek'

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexWrap: 'wrap',
    gap: '8px',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: '6px' },
  sortBtn: {
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    color: tokens.colorNeutralForeground4,
    transition: 'all 0.15s',
  },
  sortBtnActive: { color: tokens.colorBrandForeground1 },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '50vh',
    overflowY: 'auto',
    minHeight: '100px',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 12px',
    background: tokens.colorNeutralBackground4,
    borderRadius: '8px',
  },
  check: { flexShrink: 0, marginTop: '4px' },
  body: { flex: 1, minWidth: 0 },
  meta: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  time: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
    fontFamily: "'JetBrains Mono', Consolas, monospace",
  },
  text: {
    margin: 0,
    padding: '8px 10px',
    background: '#1a1a2e',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '6px',
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontSize: '12px',
    lineHeight: 1.55,
    color: '#c0c0d8',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '200px',
    overflowY: 'auto',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  empty: { textAlign: 'center', color: tokens.colorNeutralForeground4, padding: '50px 0', fontSize: '14px' },
  pager: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '14px',
    paddingTop: '10px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  pages: { display: 'flex', alignItems: 'center', gap: '2px' },
  pageInfo: { fontSize: '13px', color: tokens.colorNeutralForeground2, padding: '0 8px' },
  total: { fontSize: '12px', color: tokens.colorNeutralForeground4, marginLeft: 'auto' },
  copyBtn: { opacity: 0, transition: 'opacity 0.15s' },
})

const pageSizes = [5, 10, 20]

interface InputHistoryDialogProps {
  open: boolean
  tool: string
  onOpenChange: (open: boolean) => void
  onUseText: (text: string) => void
}

export default function InputHistoryDialog({
  open,
  tool,
  onOpenChange,
  onUseText,
}: InputHistoryDialogProps) {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [records, setRecords] = useState<InputRecord[]>([])
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortDesc, setSortDesc] = useState(true)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const allSelected = records.length > 0 && records.every((r) => selectedIds.has(r.id))
  const anySelected = selectedIds.size > 0

  function formatTime(dt: string) {
    if (!dt) return ''
    const d = dt.replace('T', ' ').replace('Z', '')
    return d.length >= 19 ? d.substring(0, 19) : d
  }

  async function copyItem(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      dispatchToast(<Toast><ToastTitle>已复制</ToastTitle></Toast>, { intent: 'success' })
    } catch {
      dispatchToast(<Toast><ToastTitle>复制失败</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(records.map((r) => r.id)))
  }

  async function loadTotal() {
    setTotal(await getInputHistoryCount(tool))
  }

  async function loadPage() {
    setLoading(true)
    try {
      const maxPage = Math.max(1, Math.ceil(total / pageSize))
      const p = page > maxPage ? maxPage : page
      if (p !== page) setPage(p)
      setRecords(await getInputHistory(tool, (p - 1) * pageSize, pageSize, sortDesc))
      setSelectedIds(new Set())
    } catch (e) {
      dispatchToast(<Toast><ToastTitle>{'加载失败: ' + String(e)}</ToastTitle></Toast>, { intent: 'error' })
    }
    setLoading(false)
  }

  async function fullReload() {
    await loadTotal()
    await loadPage()
  }

  async function goPage(p: number) {
    if (p < 1 || p > totalPages) return
    setPage(p)
  }

  async function refresh() {
    setPage(1)
    await fullReload()
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    try {
      await deleteInputHistory(tool, [...selectedIds])
      setTotal(await getInputHistoryCount(tool))
      setSelectedIds(new Set())
      await loadPage()
    } catch {}
  }

  async function deleteAll() {
    try {
      await deleteInputHistory(tool, [])
      setPage(1)
      setTotal(0)
      setRecords([])
      setSelectedIds(new Set())
    } catch {}
  }

  function useRecord(text: string) {
    onUseText(text)
    onOpenChange(false)
  }

  const handleOpen = useCallback(() => {
    setPage(1)
    setSelectedIds(new Set())
    fullReload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (open) handleOpen()
  }, [open, handleOpen])

  useEffect(() => {
    if (open) loadPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortDesc])

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>输入历史</DialogTitle>

          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <Checkbox
                checked={allSelected}
                indeterminate={anySelected && !allSelected}
                onChange={toggleAll}
                label="全选"
              />
              {anySelected && (
                <Button
                  icon={<DeleteRegular />}
                  size="small"
                  appearance="primary"
                  onClick={deleteSelected}
                >
                  删除({selectedIds.size})
                </Button>
              )}
            </div>
            <div className={styles.toolbarRight}>
              <span
                className={`${styles.sortBtn} ${sortDesc ? styles.sortBtnActive : ''}`}
                onClick={() => setSortDesc(!sortDesc)}
                title="排序"
              >
                {sortDesc ? <ArrowSortDownRegular fontSize={16} /> : <ArrowSortUpRegular fontSize={16} />}
              </span>
              <Button
                icon={<ArrowSyncRegular />}
                size="small"
                appearance="subtle"
                disabled={loading}
                onClick={refresh}
              >
                刷新
              </Button>
              <Button size="small" appearance="subtle" onClick={deleteAll}>
                清空全部
              </Button>
            </div>
          </div>

          <div className={styles.list}>
            {loading ? (
              <Spinner />
            ) : records.length === 0 ? (
              <div className={styles.empty}>暂无记录（双击可回填）</div>
            ) : (
              records.map((item) => (
                <div key={item.id} className={styles.item}>
                  <Checkbox
                    className={styles.check}
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                  <div className={styles.body}>
                    <div className={styles.meta}>
                      <span className={styles.time}>{formatTime(item.created_at)}</span>
                      <Button
                        className={styles.copyBtn}
                        icon={<CopyRegular />}
                        appearance="subtle"
                        size="small"
                        onClick={() => copyItem(item.input_text)}
                        title="复制"
                      />
                    </div>
                    <pre className={styles.text} onDoubleClick={() => useRecord(item.input_text)}>
                      {item.input_text}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.pager}>
            <Dropdown
              value={pageSize}
              onOptionSelect={(_, data) => setPageSize(Number(data.optionValue))}
              style={{ width: '80px' }}
              size="small"
            >
              {pageSizes.map((s) => (
                <Option key={s} value={String(s)}>
                  {s}条/页
                </Option>
              ))}
            </Dropdown>
            <div className={styles.pages}>
              <Button size="small" appearance="subtle" disabled={page <= 1} onClick={() => goPage(1)}>
                «
              </Button>
              <Button size="small" appearance="subtle" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                ‹
              </Button>
              <span className={styles.pageInfo}>
                {page} / {totalPages}
              </span>
              <Button
                size="small"
                appearance="subtle"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                ›
              </Button>
              <Button
                size="small"
                appearance="subtle"
                disabled={page >= totalPages}
                onClick={() => goPage(totalPages)}
              >
                »
              </Button>
            </div>
            <span className={styles.total}>共 {total} 条</span>
          </div>
        </DialogBody>
        <DialogActions>
          <Button appearance="primary" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/InputHistoryDialog.tsx
git commit -m "feat: add InputHistoryDialog with pagination and double-click fill"
```

---

### Task 13: TranslateView 翻译工具

**Files:**
- Create: `src/views/TranslateView.tsx`

- [ ] **Step 1: 写 src/views/TranslateView.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { emit } from '@tauri-apps/api/event'
import {
  Button,
  Dropdown,
  Option,
  Input,
  Textarea,
  Badge,
  Divider,
  Toast,
  ToastTitle,
  useToastController,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  ArrowSortRegular,
  DeleteRegular,
  SettingsRegular,
  MicRegular,
  HistoryRegular,
} from '@fluentui/react-icons'
import { translate, loadSettings, saveSetting } from '../api/deepseek'
import { useWindowSync } from '../hooks/useWindowSync'
import HistoryDialog from '../components/HistoryDialog'
import PromptDialog from '../components/PromptDialog'

const winId = getCurrentWindow().label

const DEFAULT_PROMPT = '你是一名专业翻译。将以下文本从{source}翻译成{target}。只返回翻译结果，不要添加任何解释、注释或引号。'

const languages = [
  { label: '自动检测', value: 'auto' },
  { label: '中文', value: 'Chinese' },
  { label: 'English', value: 'English' },
  { label: '한국어', value: 'Korean' },
  { label: '日本語', value: 'Japanese' },
  { label: 'Deutsch', value: 'German' },
  { label: 'Français', value: 'French' },
  { label: 'العربية', value: 'Arabic' },
]

const modelOptions = [
  { label: 'deepseek-v4-flash', value: 'deepseek-v4-flash' },
  { label: 'deepseek-v4-pro', value: 'deepseek-v4-pro' },
  { label: '自定义', value: 'custom' },
]

const useStyles = makeStyles({
  page: { height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' },
  controlCard: { flexShrink: 0 },
  controlRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '16px', flexWrap: 'wrap',
  },
  langGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  label: { fontSize: '13px', color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap' },
  swapBtn: { flexShrink: 0 },
  actionGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  settingsPanel: { marginTop: '4px' },
  settingGrid: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  textRow: {
    flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '14px', minHeight: 0, overflow: 'hidden',
  },
  textPanel: { display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0, overflow: 'hidden' },
  panelTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  panelTitle: { fontSize: '14px', fontWeight: 600, color: tokens.colorNeutralForeground1 },
  panelActions: { display: 'flex', gap: '2px' },
  taInput: { flex: 1, minHeight: 0 },
  resultTextarea: {
    flex: 1, minHeight: 0,
    '& textarea': { color: `${tokens.colorStatusSuccessForeground1} !important` },
  },
  alert: {
    marginTop: '6px',
    backgroundColor: tokens.colorStatusDangerBackground1,
    border: `1px solid ${tokens.colorStatusDangerStroke1}`,
    borderRadius: '6px',
    padding: '8px 12px',
    color: tokens.colorStatusDangerForeground1,
    fontSize: '13px',
  },
  bottomBar: { textAlign: 'center', flexShrink: 0 },
})

export default function TranslateView() {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('deepseek-v4-flash')
  const [customModel, setCustomModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT)
  const [showSettings, setShowSettings] = useState(false)
  const effectiveModel = model === 'custom' ? (customModel || 'deepseek-v4-flash') : model

  const [sourceText, setSourceText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('English')
  const [result, setResult] = useState('')
  const [translating, setTranslating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [showPrompt, setShowPrompt] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  function syncOut() {
    emit('translate-sync', { from: winId, sourceText, result })
  }

  useWindowSync<{ from: string; sourceText: string; result: string }>(
    'translate-sync', winId,
    (payload) => { setSourceText(payload.sourceText); setResult(payload.result) },
  )

  useWindowSync<{ from: string; apiKey: string; model: string; customModel: string; systemPrompt: string }>(
    'settings-sync', winId,
    (payload) => {
      setApiKey(payload.apiKey)
      setModel(payload.model)
      setCustomModel(payload.customModel)
      if (payload.systemPrompt) setSystemPrompt(payload.systemPrompt)
    },
  )

  // Switch sync: when tray switches, source window broadcasts, target clears
  useEffect(() => {
    const { listen } = require('@tauri-apps/api/event') as typeof import('@tauri-apps/api/event')
    let unlisten: any = null
    listen<string>('switch-sync', (e: { payload: string }) => {
      if (e.payload === winId) {
        syncOut()
      } else {
        setSourceText(''); setResult(''); setErrorMsg('')
      }
    }).then((fn: any) => { unlisten = fn })
    return () => { unlisten?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load settings on mount
  useEffect(() => {
    loadSettings().then((s) => {
      if (s.api_key) setApiKey(s.api_key)
      if (s.model) setModel(s.model)
      if (s.custom_model) setCustomModel(s.custom_model)
      if (s.system_prompt) setSystemPrompt(s.system_prompt)
    }).catch((e) => {
      dispatchToast(<Toast><ToastTitle>{'加载设置失败: ' + String(e)}</ToastTitle></Toast>, { intent: 'error' })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSaveSettings() {
    try {
      await saveSetting('api_key', apiKey)
      await saveSetting('model', model)
      await saveSetting('custom_model', customModel)
      await saveSetting('system_prompt', systemPrompt)
      dispatchToast(<Toast><ToastTitle>设置已保存</ToastTitle></Toast>, { intent: 'success' })
      emit('settings-sync', { from: winId, apiKey, model, customModel, systemPrompt })
    } catch (e) {
      dispatchToast(<Toast><ToastTitle>{'保存失败: ' + String(e)}</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  function swapLanguages() {
    if (sourceLang === 'auto') return
    ;[sourceLang, targetLang] = [targetLang, sourceLang]
    setSourceLang(sourceLang)
    setTargetLang(targetLang)
  }

  async function doTranslate() {
    if (!apiKey.trim()) {
      dispatchToast(<Toast><ToastTitle>请先在翻译设置中配置 DeepSeek API Key</ToastTitle></Toast>, { intent: 'warning' })
      return
    }
    if (!sourceText.trim()) {
      dispatchToast(<Toast><ToastTitle>请输入要翻译的文本</ToastTitle></Toast>, { intent: 'warning' })
      return
    }
    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      dispatchToast(<Toast><ToastTitle>源语言和目标语言不能相同</ToastTitle></Toast>, { intent: 'warning' })
      return
    }
    setErrorMsg('')
    setTranslating(true)
    try {
      const res = await translate({
        apiKey: apiKey.trim(), model: effectiveModel,
        sourceLang, targetLang, text: sourceText.trim(), systemPrompt,
      })
      setResult(res)
      dispatchToast(<Toast><ToastTitle>翻译完成</ToastTitle></Toast>, { intent: 'success' })
    } catch (e) {
      setErrorMsg(String(e))
    }
    setTranslating(false)
  }

  async function copyResult() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      dispatchToast(<Toast><ToastTitle>已复制到剪贴板</ToastTitle></Toast>, { intent: 'success' })
    } catch {
      dispatchToast(<Toast><ToastTitle>复制失败</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.controlCard}>
        <div className={styles.controlRow}>
          <div className={styles.langGroup}>
            <span className={styles.label}>源语言</span>
            <Dropdown value={sourceLang} onOptionSelect={(_, d) => setSourceLang(d.optionValue!)} style={{ width: '130px' }}>
              {languages.map((l) => <Option key={l.value} value={l.value}>{l.label}</Option>)}
            </Dropdown>
            <Button className={styles.swapBtn} icon={<ArrowSortRegular />} size="small" disabled={sourceLang === 'auto'} onClick={swapLanguages} />
            <span className={styles.label}>目标语言</span>
            <Dropdown value={targetLang} onOptionSelect={(_, d) => setTargetLang(d.optionValue!)} style={{ width: '130px' }}>
              {languages.filter((x) => x.value !== 'auto').map((l) => <Option key={l.value} value={l.value}>{l.label}</Option>)}
            </Dropdown>
          </div>
          <div className={styles.actionGroup}>
            <Button icon={<SettingsRegular />} onClick={() => setShowSettings(!showSettings)}>
              {showSettings ? '收起设置' : '设置'}
            </Button>
            <Button appearance="primary" size="large" disabled={translating} onClick={doTranslate}>
              翻译
            </Button>
          </div>
        </div>

        {showSettings && (
          <div className={styles.settingsPanel}>
            <Divider />
            <div className={styles.settingGrid} style={{ marginTop: '8px' }}>
              <Input
                value={apiKey}
                onChange={(_, d) => setApiKey(d.value)}
                type="password"
                placeholder="DeepSeek API Key (sk-...)"
                contentBefore={<span style={{ fontWeight: 600 }}>Key</span>}
              />
              <Dropdown value={model} onOptionSelect={(_, d) => setModel(d.optionValue!)} style={{ width: '200px' }}>
                {modelOptions.map((m) => <Option key={m.value} value={m.value}>{m.label}</Option>)}
              </Dropdown>
              {model === 'custom' && (
                <Input
                  value={customModel}
                  onChange={(_, d) => setCustomModel(d.value)}
                  placeholder="自定义模型名..."
                  style={{ width: '220px' }}
                />
              )}
              <Button appearance="primary" onClick={handleSaveSettings}>保存设置</Button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.textRow}>
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>源文本</span>
            {sourceText && (
              <Button icon={<DeleteRegular />} appearance="subtle" size="small" onClick={() => setSourceText('')}>清空</Button>
            )}
          </div>
          <Textarea
            className={styles.taInput}
            value={sourceText}
            onChange={(_, d) => setSourceText(d.value)}
            placeholder="输入要翻译的文本..."
          />
        </div>
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>翻译结果</span>
            <div className={styles.panelActions}>
              {result && <Button appearance="subtle" size="small" onClick={copyResult}>复制</Button>}
              {result && <Button appearance="subtle" size="small" onClick={() => { setResult(''); setErrorMsg('') }}>清空</Button>}
            </div>
          </div>
          <Textarea
            className={styles.resultTextarea}
            value={errorMsg ? '' : result}
            readOnly
            placeholder="翻译结果将显示在这里"
          />
          {errorMsg && <div className={styles.alert}>{errorMsg}</div>}
        </div>
      </div>

      <div className={styles.bottomBar}>
        <Button appearance="subtle" icon={<MicRegular />} onClick={() => setShowPrompt(true)}>提示词</Button>
        <Button appearance="subtle" icon={<HistoryRegular />} onClick={() => setShowHistory(true)}>翻译历史</Button>
      </div>

      <PromptDialog
        open={showPrompt}
        systemPrompt={systemPrompt}
        onOpenChange={setShowPrompt}
        onSystemPromptChange={setSystemPrompt}
      />
      <HistoryDialog open={showHistory} onOpenChange={setShowHistory} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/TranslateView.tsx
git commit -m "feat: add TranslateView with DeepSeek translation, settings, and sync"
```

---

### Task 14: JsonView JSON 工具

**Files:**
- Create: `src/views/JsonView.tsx`

- [ ] **Step 1: 写 src/views/JsonView.tsx**

```tsx
import { useState, useEffect, useMemo } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { emit } from '@tauri-apps/api/event'
import {
  Button,
  Dropdown,
  Option,
  Textarea,
  Checkbox,
  Badge,
  Toast,
  ToastTitle,
  useToastController,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  DeleteRegular,
  CopyRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  HistoryRegular,
} from '@fluentui/react-icons'
import { saveInputHistory } from '../api/deepseek'
import { useWindowSync } from '../hooks/useWindowSync'
import InputHistoryDialog from '../components/InputHistoryDialog'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/atom-one-dark.css'
hljs.registerLanguage('json', json)

const winId = getCurrentWindow().label

const useStyles = makeStyles({
  page: { height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' },
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 18px', border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px', flexWrap: 'wrap', gap: '10px',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  toolbarRight: { display: 'flex', gap: '8px' },
  status: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 },
  statusOk: { color: tokens.colorStatusSuccessForeground1 },
  statusErr: { color: tokens.colorStatusDangerForeground1 },
  textRow: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', minHeight: 0, overflow: 'hidden' },
  textPanel: { display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0, overflow: 'hidden' },
  panelTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  panelTitle: { fontSize: '14px', fontWeight: 600, color: tokens.colorNeutralForeground1 },
  taInput: { flex: 1, minHeight: 0 },
  codeBlock: {
    flex: 1, minHeight: 0, height: '100%', margin: 0, padding: '14px 16px',
    background: '#1a1a2e', border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px', overflow: 'auto',
    fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
    fontSize: '13px', lineHeight: 1.7, color: '#c0c0d8', whiteSpace: 'pre',
  },
  codeEmpty: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: tokens.colorNeutralForeground4,
  },
  charCount: { fontSize: '12px', color: tokens.colorNeutralForeground4, textAlign: 'right', margin: 0 },
})

export default function JsonView() {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [indent, setIndent] = useState(2)
  const [sortKeys, setSortKeys] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  function syncOut() {
    emit('json-sync', { from: winId, input, output })
  }

  useWindowSync<{ from: string; input: string; output: string }>(
    'json-sync', winId,
    (payload) => { setInput(payload.input); setOutput(payload.output) },
  )

  useEffect(() => {
    const { listen } = require('@tauri-apps/api/event') as typeof import('@tauri-apps/api/event')
    let unlisten: any = null
    listen<string>('switch-sync', (e: { payload: string }) => {
      if (e.payload === winId) syncOut()
      else { setInput(''); setOutput(''); setErrorMsg('') }
    }).then((fn: any) => { unlisten = fn })
    return () => { unlisten?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const highlightedOutput = useMemo(
    () => (output ? hljs.highlight(output, { language: 'json' }).value : ''),
    [output],
  )

  const isValid = useMemo(() => {
    if (!input.trim()) return null
    try { JSON.parse(input); return true } catch { return false }
  }, [input])

  function sortObjectKeys(obj: any): any {
    if (Array.isArray(obj)) return obj.map(sortObjectKeys)
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = sortObjectKeys(obj[key])
        return acc
      }, {} as Record<string, any>)
    }
    return obj
  }

  function doFormat() {
    setErrorMsg(''); setOutput('')
    if (!input.trim()) { setErrorMsg('请输入 JSON 文本'); return }
    try {
      let obj = JSON.parse(input)
      if (sortKeys) obj = sortObjectKeys(obj)
      setOutput(JSON.stringify(obj, null, indent === 0 ? '\t' : indent))
      saveInputHistory('json', input)
      dispatchToast(<Toast><ToastTitle>格式化完成</ToastTitle></Toast>, { intent: 'success' })
    } catch (e) { setErrorMsg(String(e)) }
  }

  function doCompress() {
    setErrorMsg(''); setOutput('')
    if (!input.trim()) { setErrorMsg('请输入 JSON 文本'); return }
    try {
      setOutput(JSON.stringify(JSON.parse(input)))
      saveInputHistory('json', input)
      dispatchToast(<Toast><ToastTitle>压缩完成</ToastTitle></Toast>, { intent: 'success' })
    } catch (e) { setErrorMsg(String(e)) }
  }

  async function copyOutput() {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      dispatchToast(<Toast><ToastTitle>已复制</ToastTitle></Toast>, { intent: 'success' })
    } catch {
      dispatchToast(<Toast><ToastTitle>复制失败</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  function clearInput() { setInput(''); setOutput(''); setErrorMsg('') }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Dropdown value={indent} onOptionSelect={(_, d) => setIndent(Number(d.optionValue))} style={{ width: '100px' }} size="small">
            <Option value="2">2 空格</Option>
            <Option value="4">4 空格</Option>
            <Option value="0">Tab</Option>
          </Dropdown>
          <Checkbox checked={sortKeys} onChange={(_, d) => setSortKeys(d.checked === true)} label="Key 排序" size="small" />
          {isValid === true && (
            <span className={`${styles.status} ${styles.statusOk}`}>
              <CheckmarkCircleRegular /> JSON 有效
            </span>
          )}
          {isValid === false && (
            <span className={`${styles.status} ${styles.statusErr}`}>
              <DismissCircleRegular /> JSON 无效
            </span>
          )}
        </div>
        <div className={styles.toolbarRight}>
          <Button size="small" appearance="primary" onClick={doFormat}>格式化</Button>
          <Button size="small" onClick={doCompress}>压缩</Button>
          <Button size="small" appearance="subtle" icon={<HistoryRegular />} onClick={() => setShowHistory(true)}>历史</Button>
        </div>
      </div>

      <div className={styles.textRow}>
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>输入</span>
            {input && <Button icon={<DeleteRegular />} appearance="subtle" size="small" onClick={clearInput}>清空</Button>}
          </div>
          <Textarea
            className={styles.taInput}
            value={input}
            onChange={(_, d) => setInput(d.value)}
            placeholder="粘贴 JSON 文本..."
          />
          {errorMsg && (
            <div style={{
              marginTop: '6px', backgroundColor: tokens.colorStatusDangerBackground1,
              border: `1px solid ${tokens.colorStatusDangerStroke1}`, borderRadius: '6px',
              padding: '8px 12px', color: tokens.colorStatusDangerForeground1, fontSize: '13px',
            }}>
              {errorMsg}
            </div>
          )}
        </div>
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>输出</span>
            {output && <Button icon={<CopyRegular />} appearance="subtle" size="small" onClick={copyOutput}>复制</Button>}
          </div>
          {output ? (
            <pre className={styles.codeBlock}><code dangerouslySetInnerHTML={{ __html: highlightedOutput }} /></pre>
          ) : (
            <div className={`${styles.codeBlock} ${styles.codeEmpty}`}>格式化结果将显示在这里</div>
          )}
          {output && <p className={styles.charCount}>{output.length} 字符</p>}
        </div>
      </div>

      <InputHistoryDialog
        open={showHistory}
        tool="json"
        onOpenChange={setShowHistory}
        onUseText={setInput}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/JsonView.tsx
git commit -m "feat: add JsonView with format/compress/validation"
```

---

### Task 15: SqlView SQL 工具

**Files:**
- Create: `src/views/SqlView.tsx`

- [ ] **Step 1: 写 src/views/SqlView.tsx**

```tsx
import { useState, useEffect, useMemo } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { emit } from '@tauri-apps/api/event'
import {
  Button,
  Dropdown,
  Option,
  Textarea,
  Checkbox,
  Toast,
  ToastTitle,
  useToastController,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  DeleteRegular,
  CopyRegular,
  HistoryRegular,
} from '@fluentui/react-icons'
import { saveInputHistory } from '../api/deepseek'
import { useWindowSync } from '../hooks/useWindowSync'
import InputHistoryDialog from '../components/InputHistoryDialog'
import { format } from 'sql-formatter'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/atom-one-dark.css'
hljs.registerLanguage('sql', sql)

const winId = getCurrentWindow().label

const dialects = [
  { label: 'SQLite', value: 'sqlite' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'TSQL', value: 'tsql' },
  { label: 'MariaDB', value: 'mariadb' },
]

const useStyles = makeStyles({
  page: { height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' },
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 18px', border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px', flexWrap: 'wrap', gap: '10px',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  toolbarRight: { display: 'flex', gap: '8px' },
  textRow: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', minHeight: 0, overflow: 'hidden' },
  textPanel: { display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0, overflow: 'hidden' },
  panelTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  panelTitle: { fontSize: '14px', fontWeight: 600, color: tokens.colorNeutralForeground1 },
  taInput: { flex: 1, minHeight: 0 },
  codeBlock: {
    flex: 1, minHeight: 0, height: '100%', margin: 0, padding: '14px 16px',
    background: '#1a1a2e', border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px', overflow: 'auto',
    fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
    fontSize: '13px', lineHeight: 1.7, color: '#c0c0d8', whiteSpace: 'pre',
  },
  codeEmpty: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.colorNeutralForeground4 },
  charCount: { fontSize: '12px', color: tokens.colorNeutralForeground4, textAlign: 'right', margin: 0 },
})

export default function SqlView() {
  const styles = useStyles()
  const { dispatchToast } = useToastController()

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [dialect, setDialect] = useState('sqlite')
  const [uppercase, setUppercase] = useState(false)
  const [tabWidth, setTabWidth] = useState(2)
  const [showHistory, setShowHistory] = useState(false)

  function syncOut() {
    emit('sql-sync', { from: winId, input, output })
  }

  useWindowSync<{ from: string; input: string; output: string }>(
    'sql-sync', winId,
    (payload) => { setInput(payload.input); setOutput(payload.output) },
  )

  useEffect(() => {
    const { listen } = require('@tauri-apps/api/event') as typeof import('@tauri-apps/api/event')
    let unlisten: any = null
    listen<string>('switch-sync', (e: { payload: string }) => {
      if (e.payload === winId) syncOut()
      else { setInput(''); setOutput(''); setErrorMsg('') }
    }).then((fn: any) => { unlisten = fn })
    return () => { unlisten?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const highlightedOutput = useMemo(
    () => (output ? hljs.highlight(output, { language: 'sql' }).value : ''),
    [output],
  )

  function doFormat() {
    setErrorMsg(''); setOutput('')
    if (!input.trim()) { setErrorMsg('请输入 SQL 文本'); return }
    try {
      setOutput(format(input, {
        language: dialect as any,
        keywordCase: uppercase ? 'upper' : 'lower',
        ...(tabWidth === 0 ? { useTabs: true } : { tabWidth }),
      }))
      saveInputHistory('sql', input)
      dispatchToast(<Toast><ToastTitle>格式化完成</ToastTitle></Toast>, { intent: 'success' })
    } catch (e) { setErrorMsg(String(e)) }
  }

  function doCompress() {
    setErrorMsg(''); setOutput('')
    if (!input.trim()) { setErrorMsg('请输入 SQL 文本'); return }
    try {
      const formatted = format(input, { language: dialect as any })
      setOutput(formatted.replace(/\n\s*/g, ' ').trim())
      saveInputHistory('sql', input)
      dispatchToast(<Toast><ToastTitle>压缩完成</ToastTitle></Toast>, { intent: 'success' })
    } catch (e) { setErrorMsg(String(e)) }
  }

  async function copyOutput() {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      dispatchToast(<Toast><ToastTitle>已复制</ToastTitle></Toast>, { intent: 'success' })
    } catch {
      dispatchToast(<Toast><ToastTitle>复制失败</ToastTitle></Toast>, { intent: 'error' })
    }
  }

  function clearInput() { setInput(''); setOutput(''); setErrorMsg('') }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Dropdown value={dialect} onOptionSelect={(_, d) => setDialect(d.optionValue!)} style={{ width: '130px' }} size="small">
            {dialects.map((d) => <Option key={d.value} value={d.value}>{d.label}</Option>)}
          </Dropdown>
          <Dropdown value={tabWidth} onOptionSelect={(_, d) => setTabWidth(Number(d.optionValue))} style={{ width: '100px' }} size="small">
            <Option value="2">2 空格</Option>
            <Option value="4">4 空格</Option>
            <Option value="0">Tab</Option>
          </Dropdown>
          <Checkbox checked={uppercase} onChange={(_, d) => setUppercase(d.checked === true)} label="关键字大写" size="small" />
        </div>
        <div className={styles.toolbarRight}>
          <Button size="small" appearance="primary" onClick={doFormat}>格式化</Button>
          <Button size="small" onClick={doCompress}>压缩</Button>
          <Button size="small" appearance="subtle" icon={<HistoryRegular />} onClick={() => setShowHistory(true)}>历史</Button>
        </div>
      </div>

      <div className={styles.textRow}>
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>输入</span>
            {input && <Button icon={<DeleteRegular />} appearance="subtle" size="small" onClick={clearInput}>清空</Button>}
          </div>
          <Textarea className={styles.taInput} value={input} onChange={(_, d) => setInput(d.value)} placeholder="粘贴 SQL 语句..." />
          {errorMsg && (
            <div style={{
              marginTop: '6px', backgroundColor: tokens.colorStatusDangerBackground1,
              border: `1px solid ${tokens.colorStatusDangerStroke1}`, borderRadius: '6px',
              padding: '8px 12px', color: tokens.colorStatusDangerForeground1, fontSize: '13px',
            }}>
              {errorMsg}
            </div>
          )}
        </div>
        <div className={styles.textPanel}>
          <div className={styles.panelTop}>
            <span className={styles.panelTitle}>输出</span>
            {output && <Button icon={<CopyRegular />} appearance="subtle" size="small" onClick={copyOutput}>复制</Button>}
          </div>
          {output ? (
            <pre className={styles.codeBlock}><code dangerouslySetInnerHTML={{ __html: highlightedOutput }} /></pre>
          ) : (
            <div className={`${styles.codeBlock} ${styles.codeEmpty}`}>格式化结果将显示在这里</div>
          )}
          {output && <p className={styles.charCount}>{output.length} 字符</p>}
        </div>
      </div>

      <InputHistoryDialog open={showHistory} tool="sql" onOpenChange={setShowHistory} onUseText={setInput} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/SqlView.tsx
git commit -m "feat: add SqlView with format/compress and dialect support"
```

---

### Task 16: FloatingWindow 悬浮窗

**Files:**
- Create: `src/views/FloatingWindow.tsx`

- [ ] **Step 1: 写 src/views/FloatingWindow.tsx**

```tsx
import { useState, useMemo, useEffect } from 'react'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { Button, makeStyles, tokens } from '@fluentui/react-components'
import { MicRegular, CodeRegular, DataAreaRegular, PinRegular } from '@fluentui/react-icons'
import TranslateView from './TranslateView'
import JsonView from './JsonView'
import SqlView from './SqlView'

const appWindow = getCurrentWindow()

const tools = [
  { name: '翻译', icon: MicRegular, key: 'translate', color: '#00f0ff' },
  { name: 'JSON', icon: CodeRegular, key: 'json', color: '#00ff41' },
  { name: 'SQL', icon: DataAreaRegular, key: 'sql', color: '#ff00ff' },
] as const

const useStyles = makeStyles({
  win: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  titleBar: {
    height: '32px',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    cursor: 'grab',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    letterSpacing: '1px',
    userSelect: 'none',
  },
  pinBtn: {
    position: 'absolute',
    right: '8px',
    cursor: 'pointer',
    color: tokens.colorNeutralForeground4,
    transition: 'color 0.15s',
  },
  pinBtnActive: { color: tokens.colorBrandForeground1 },
  tabBar: {
    display: 'flex',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
  },
  tabBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '9px 0',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderBottom: '2px solid transparent',
    userSelect: 'none',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    padding: '10px',
  },
})

export default function FloatingWindow() {
  const styles = useStyles()
  const [activeKey, setActiveKey] = useState('translate')
  const [pinned, setPinned] = useState(true)
  const [contentVisible, setContentVisible] = useState(true)

  async function togglePin() {
    const next = !pinned
    setPinned(next)
    await appWindow.setAlwaysOnTop(next)
  }

  async function toggleContent(tool: string) {
    if (activeKey === tool) {
      const next = !contentVisible
      setContentVisible(next)
      await appWindow.setSize(next ? new LogicalSize(600, 480) : new LogicalSize(600, 80))
    } else {
      setActiveKey(tool)
      if (!contentVisible) {
        setContentVisible(true)
        await appWindow.setSize(new LogicalSize(600, 480))
      }
    }
  }

  const ActiveView = useMemo(() => {
    switch (activeKey) {
      case 'translate': return <TranslateView />
      case 'json': return <JsonView />
      case 'sql': return <SqlView />
      default: return null
    }
  }, [activeKey])

  useEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'

    ;(window as any).__floatNav = async (tool: string) => {
      setActiveKey(tool)
      if (!contentVisible) {
        setContentVisible(true)
        await appWindow.setSize(new LogicalSize(600, 480))
      }
    }

    let unlisten: UnlistenFn | null = null
    listen<string>('float-navigate', async (event) => {
      setActiveKey(event.payload)
      if (!contentVisible) {
        setContentVisible(true)
        await appWindow.setSize(new LogicalSize(600, 480))
      }
    }).then((fn) => { unlisten = fn })

    return () => { unlisten?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.win}>
      <div className={styles.titleBar} onMouseDown={() => appWindow.startDragging()}>
        <span>工具箱</span>
        <span
          className={`${styles.pinBtn} ${pinned ? styles.pinBtnActive : ''}`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); togglePin() }}
        >
          <PinRegular fontSize={14} />
        </span>
      </div>

      <div className={styles.tabBar}>
        {tools.map((t) => (
          <div
            key={t.key}
            className={styles.tabBtn}
            style={{
              color: activeKey === t.key ? t.color : tokens.colorNeutralForeground4,
              borderBottomColor: activeKey === t.key ? t.color : 'transparent',
              background: activeKey === t.key ? `${t.color}11` : 'transparent',
            }}
            onClick={() => toggleContent(t.key)}
          >
            <t.icon fontSize={16} />
            <span>{t.name}</span>
          </div>
        ))}
      </div>

      {contentVisible && <div className={styles.content}>{ActiveView}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/FloatingWindow.tsx
git commit -m "feat: add FloatingWindow with tabs and pin toggle"
```

---

### Task 17: ToolStandalone 独立工具窗口

**Files:**
- Create: `src/views/ToolStandalone.tsx`

- [ ] **Step 1: 写 src/views/ToolStandalone.tsx**

```tsx
import { useParams } from 'react-router-dom'
import TranslateView from './TranslateView'
import JsonView from './JsonView'
import SqlView from './SqlView'

export default function ToolStandalone() {
  const { tool } = useParams<{ tool: string }>()

  return (
    <div style={{ height: '100vh', overflow: 'hidden', padding: '12px' }}>
      {tool === 'translate' && <TranslateView />}
      {tool === 'json' && <JsonView />}
      {tool === 'sql' && <SqlView />}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/ToolStandalone.tsx
git commit -m "feat: add ToolStandalone for independent tool windows"
```

---

### Task 18: 更新 style.css

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: 重写 src/style.css — 只保留 reset + 滚动条 + 代码块**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body, #root { height: 100%; overflow: hidden; }

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #777; }

/* Fluent UI textarea full height */
.fui-Textarea, .fui-Textarea textarea {
  height: 100% !important;
  resize: none;
}

/* Code block styling (highlight.js) */
pre code {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "style: simplify to reset + scrollbar + code block, remove Element Plus overrides"
```

---

### Task 19: 删除旧 Vue 文件

**Files:**
- Delete: 所有 `.vue` 文件 + `src/main.ts` + `src/router/index.ts`

- [ ] **Step 1: 删除所有旧前端文件**

```bash
rm src/main.ts
rm src/App.vue
rm -rf src/router
rm src/components/AppLayout.vue
rm src/components/PromptDialog.vue
rm src/components/HistoryDialog.vue
rm src/components/InputHistoryDialog.vue
rm src/views/HomeView.vue
rm src/views/TranslateView.vue
rm src/views/JsonView.vue
rm src/views/SqlView.vue
rm src/views/FloatingWindow.vue
rm src/views/ToolStandalone.vue
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove all Vue files, replaced by React components"
```

---

### Task 20: 安装依赖并验证构建

- [ ] **Step 1: 安装依赖**

```bash
pnpm install
```

- [ ] **Step 2: 运行 TypeScript 类型检查**

```bash
pnpm run build
```

- [ ] **Step 3: 验证 dev 启动**

```bash
pnpm run dev
```

- [ ] **Step 4: 如有编译错误，修复后提交**

```bash
git add -A
git commit -m "fix: resolve build errors from Vue-to-React migration"
```

- [ ] **Step 5: 最终提交版本号**

```bash
git add -A
git commit -m "release: tools v0.2.0 — React + Fluent UI v9 refactor"
```

---

### Task 21: 清理根目录残留（可选）

检查并删除 pnpm-lock.yaml 中不再引用的旧依赖残留（vue, element-plus, vue-router, @vitejs/plugin-vue, vue-tsc, @vue/tsconfig）。

```bash
pnpm prune
```
