# React + Fluent UI v9 重构设计

## 目标

将 tools 项目前端从 Vue 3 + Element Plus 重构为 React 18 + Fluent UI v9，后端（Tauri v2 Rust）不变，功能无增删。

版本号：`0.1.0` → `0.2.0`。

## 技术选型

| 层 | 旧 | 新 |
|---|-----|-----|
| 前端框架 | Vue 3 | React 18.3.1 |
| UI 库 | Element Plus | Fluent UI v9 (@fluentui/react-components 9.56.0) |
| 图标 | @element-plus/icons-vue | @fluentui/react-icons 2.0.270 |
| 路由 | Vue Router 5 | React Router DOM 6.28.0 |
| 构建 | @vitejs/plugin-vue | @vitejs/plugin-react 4.3.4 |
| TypeScript | ~6.0.2 | 5.6.3 |
| 保留不变 | @tauri-apps/api, highlight.js, sql-formatter | — |

所有依赖使用固定版本号，不用 `latest`。

## 视觉方案

Fluent UI 原生暗色主题（基于 `teamsDarkTheme`），品牌色改为青色（`#00a8b5`），不上赛博朋克风 CSS hack。

- 明暗主题切换：React Context (`ThemeContext`) + `localStorage` 持久化
- `FluentProvider` 包裹全应用，切换 `theme` prop 即可
- 切换按钮在侧边栏底部
- `style.css` 仅保留 reset、滚动条样式、代码块背景

## 架构

```
App
├── ThemeProvider (Context)
├── HashRouter
│   ├── FloatingWindow.tsx    (/floating 路由，label === 'floating-ball')
│   ├── ToolStandalone.tsx    (/tool/:tool 路由，label starts with 'tool-')
│   └── AppLayout.tsx         (默认路由)
│       ├── Sidebar (logo + nav + 置顶 + 主题切换 + 版本号)
│       └── main > Routes
│           ├── /            → HomeView.tsx
│           ├── /translate   → TranslateView.tsx
│           ├── /json        → JsonView.tsx
│           └── /sql         → SqlView.tsx
```

## 组件映射

| 旧 (.vue) | 新 (.tsx) | Fluent UI 组件 |
|---|---|---|
| App.vue | App.tsx | FluentProvider, HashRouter |
| AppLayout.vue | AppLayout.tsx | 自定义 Sidebar + Button |
| HomeView.vue | HomeView.tsx | Card, CardHeader |
| TranslateView.vue | TranslateView.tsx | Dropdown, Button, Input, Textarea, Dialog, Toast |
| JsonView.vue | JsonView.tsx | 同上 + Checkbox |
| SqlView.vue | SqlView.tsx | 同上 |
| FloatingWindow.vue | FloatingWindow.tsx | Tab, TabList |
| ToolStandalone.vue | ToolStandalone.tsx | 路由参数分发 |
| PromptDialog.vue | PromptDialog.tsx | Dialog, Textarea |
| HistoryDialog.vue | HistoryDialog.tsx | Dialog, Checkbox, 分页控件 |
| InputHistoryDialog.vue | InputHistoryDialog.tsx | 同上 |

### Element Plus → Fluent UI 关键映射

| Element Plus | Fluent UI v9 |
|---|---|
| `el-card` | `Card` / `CardHeader` |
| `el-menu` / `el-menu-item` | 自定义 `Sidebar` + `Button` |
| `el-select` / `el-option` | `Dropdown` + `Option` |
| `el-button` | `Button` |
| `el-input` (textarea) | `Textarea` |
| `el-input` (text, password) | `Input` |
| `el-checkbox` | `Checkbox` |
| `el-dialog` | `Dialog` / `DialogSurface` / `DialogBody` / `DialogTitle` / `DialogActions` |
| `el-alert` | `Toast` (useToastController) |
| `ElMessage` | `useToastController` 的 `dispatchToast` |
| `ElMessageBox.confirm` | `Dialog` + 确认按钮 |
| `el-divider` | `Divider` |
| `el-icon` | `@fluentui/react-icons` 直接渲染组件 |

## 数据流

- 组件状态：`useState` / `useReducer`
- 窗口间同步：自定义 `useWindowSync` hook，封装 Tauri `emit`/`listen`
- 主题：`ThemeContext` + `localStorage`
- 路由：React Router v6 `useNavigate` / `useParams` / `useLocation`
- Tauri 后端调用：`deepseek.ts` API 层保留，返回值从 Vue `ref` 改为 React `useState`

无额外状态库（Redux / Zustand / MobX）。

## 文件变更

### 新增

- `src/main.tsx` — React 入口
- `src/App.tsx` — 根组件
- `src/theme.ts` — 主题配置
- `src/contexts/ThemeContext.tsx` — 主题状态
- `src/hooks/useWindowSync.ts` — 窗口同步 hook
- `src/components/AppLayout.tsx`
- `src/components/Sidebar.tsx`
- `src/components/PromptDialog.tsx`
- `src/components/HistoryDialog.tsx`
- `src/components/InputHistoryDialog.tsx`
- `src/views/HomeView.tsx`
- `src/views/TranslateView.tsx`
- `src/views/JsonView.tsx`
- `src/views/SqlView.tsx`
- `src/views/FloatingWindow.tsx`
- `src/views/ToolStandalone.tsx`

### 删除

- `src/main.ts` 及所有 `.vue` 文件
- `src/router/index.ts`（用 React Router 替代）
- `src/env.d.ts`（不需要 `.vue` 类型声明）

### 修改

- `package.json` — 版本号 + 依赖替换
- `vite.config.ts` — `@vitejs/plugin-react` 替换 `@vitejs/plugin-vue`
- `tsconfig.json` — React 相关配置
- `index.html` — 入口 script 路径
- `src/style.css` — 缩减到 reset + 滚动条 + 代码块
- `src/api/deepseek.ts` — 去掉 Vue 依赖，保持纯函数

### 不变

- `src-tauri/` 全部文件
- `highlight.js`、`sql-formatter` 版本不变
