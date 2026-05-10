# 工具箱 (Tools)

一款基于 Tauri v2 + Vue 3 的跨平台桌面工具箱，集成翻译、JSON 格式化、SQL 格式化等实用功能。

## 功能

- **翻译工具**：基于 DeepSeek API，支持中/英/韩/日/德/法/阿互译，自定义提示词，翻译历史管理
- **JSON 工具**：格式化 / 校验 / 压缩，语法高亮，输入历史
- **SQL 工具**：多方言格式化（SQLite/MySQL/PostgreSQL 等），语法高亮，输入历史
- **系统托盘**：托盘菜单快速切换功能，显示/隐藏窗口，开机自启
- **悬浮窗模式**：迷你悬浮窗口，可固定置顶，折叠/展开
- **双窗口同步**：桌面与悬浮窗切换时自动同步内容

## 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Tauri v2 (Rust) |
| 前端 | Vue 3 + TypeScript |
| UI 组件 | Element Plus |
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
├── api/deepseek.ts        # Rust 后端 API 封装
├── components/            # 公共组件
│   ├── AppLayout.vue      # 桌面端布局（侧边栏）
│   ├── HistoryDialog.vue  # 翻译历史弹窗
│   ├── InputHistoryDialog.vue # 输入历史弹窗
│   └── PromptDialog.vue   # 翻译提示词弹窗
├── router/index.ts        # 路由配置
├── views/                 # 页面
│   ├── HomeView.vue       # 首页
│   ├── TranslateView.vue  # 翻译工具
│   ├── JsonView.vue       # JSON 工具
│   ├── SqlView.vue        # SQL 工具
│   ├── FloatingWindow.vue # 悬浮窗
│   └── ToolStandalone.vue # 独立工具窗口
└── style.css              # 全局主题

src-tauri/src/
├── lib.rs                 # 入口
├── db.rs                  # 数据库操作
├── translate.rs           # 翻译 API
├── tray.rs                # 托盘菜单
├── mode.rs                # 窗口模式切换
├── commands.rs            # 窗口管理命令
└── autostart.rs           # 开机自启
```

## 许可

MIT
