# 工具箱 (Tools)

基于 Tauri v2 + React 18 + Fluent UI v9 的跨平台桌面工具箱，集成翻译、JSON 格式化、SQL 格式化等实用功能。

## 功能

- **翻译工具**：基于 DeepSeek API，支持中/英/韩/日/德/法/阿互译，自定义提示词模板，翻译历史管理，翻译等待动画
- **JSON 工具**：格式化 / 校验 / 压缩，语法高亮，输入历史
- **SQL 工具**：多方言格式化（SQLite/MySQL/PostgreSQL/TSQL/MariaDB），语法高亮，输入历史
- **提示词模板**：创建、管理翻译提示词模板，设置默认模板，SQLite 持久化
- **系统托盘**：托盘菜单快速切换功能，显示/隐藏窗口，切换桌面/悬浮窗模式，开机自启
- **悬浮窗模式**：迷你悬浮窗口，可折叠为桌面宠物，固定置顶，双击/拖拽
- **双窗口同步**：桌面与悬浮窗切换时自动同步全部内容、选项和设置
- **主题切换**：暗色/浅色主题，桌面与悬浮窗同步切换
- **自定义标题栏**：前端实现，支持最小化/最大化/还原/置顶/关闭
- **启动动画**：3 秒环形加载动画，暗色主题风格

## 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Tauri v2 (Rust) |
| 前端 | React 18 + TypeScript |
| UI 组件 | Fluent UI v9 |
| 图标 | @fluentui/react-icons |
| 路由 | React Router v6 |
| 语法高亮 | highlight.js |
| SQL 格式化 | sql-formatter |
| 本地存储 | SQLite (rusqlite) |
| 构建工具 | Vite + pnpm |

## 环境要求

- Node.js >= 18
- Rust >= 1.70
- pnpm >= 8
- Windows 10+ / macOS / Linux

## 开发

```bash
pnpm install
pnpm tauri dev
```

## 构建

```bash
pnpm tauri build
```

安装包输出在 `src-tauri/target/release/bundle/`。

## 项目结构

```
src/
├── api/deepseek.ts              # Rust 后端 API 封装
├── components/                  # 公共组件
│   ├── AppLayout.tsx            # 桌面端布局（标题栏 + 侧边栏）
│   ├── TitleBar.tsx             # 自定义标题栏
│   ├── Sidebar.tsx              # 侧边栏导航
│   ├── HistoryDialog.tsx        # 翻译历史弹窗
│   ├── InputHistoryDialog.tsx   # 输入历史弹窗
│   └── PromptDialog.tsx         # 提示词模板弹窗
├── contexts/ThemeContext.tsx     # 主题状态（明暗切换 + 跨窗口同步）
├── hooks/useWindowSync.ts       # 跨窗口同步 Hook
├── views/                       # 页面
│   ├── HomeView.tsx             # 首页
│   ├── TranslateView.tsx        # 翻译工具
│   ├── JsonView.tsx             # JSON 工具
│   ├── SqlView.tsx              # SQL 工具
│   ├── FloatingWindow.tsx       # 悬浮窗 / 桌面宠物
│   └── ToolStandalone.tsx       # 独立工具窗口
├── App.tsx                      # 根组件
├── main.tsx                     # 入口（含启动动画计时）
├── theme.ts                     # 主题配置
└── style.css                    # 全局样式

src-tauri/src/
├── lib.rs                       # 入口 + 窗口管理
├── db.rs                        # 数据库（设置/历史/提示词模板）
├── translate.rs                 # 翻译 API
├── tray.rs                      # 托盘菜单
├── mode.rs                      # 窗口模式切换
├── commands.rs                  # 窗口管理命令
└── autostart.rs                 # 开机自启
```

## 许可

MIT
