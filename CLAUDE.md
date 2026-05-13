# tools 项目 — Claude 工作指南

## 启动/构建
- `pnpm tauri dev` — 开发, `pnpm tauri build` — 发布
- 重启前: PowerShell: `Stop-Process -Name 'tools' -Force`
- 端口 5173 被占: `Get-NetTCPConnection -LocalPort 5173 | Stop-Process -Id {$_.OwningProcess}`

## 技术栈
Tauri v2 + React 18 + Fluent UI v9 + React Router v6 | Vite + pnpm | v0.2.0

## 新增工具步骤
1. `src/views/XxxView.tsx` 2. HomeView tools 加卡片 3. Sidebar navItems 加导航
4. AppLayout import + main 内加 display:none div 5. FloatingWindow tools 加标签
6. `src-tauri/src/tray.rs` 桌面和悬浮窗托盘各加菜单项

## 悬浮窗
- label: "floating-ball", 780x480, 折叠 72x72 桌面宠物
- 所有视图始终挂载 (display:none), 折叠时绝对定位宠物覆盖
- `isCompact = winId === 'floating-ball'` 紧凑布局

## Fluent UI 踩坑
- DialogBody 默认 display:grid → 覆盖为 display:block 才能全宽
- Dropdown value 就是显示文字, 要用 label 做 value
- Textarea 内联不撑满 → 块级 div 包裹 + width:100%
- startDragging() 阻止 onClick → 用 pointer 事件 + 移动距离区分拖拽/点击

## Tauri 事件
- emit() 广播所有窗口, listen() 接收
- useEffect 空 deps + emit 会捕获过期 state → 必须用 useRef
- 跨窗口同步: 每个视图自己管理 switch-sync, 不在顶层集中处理
