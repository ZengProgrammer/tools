# 工具箱 (Tools) — 研究发现

## 技术选型记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 前端框架 | React 18 | 用户偏好，桌面端 UI 选择更丰富 |
| UI 库 | Fluent UI v9 | Win11 原生风格，暗色主题一等公民 |
| 路由 | React Router v6 | 稳定成熟 |
| 状态管理 | React 内置 (useState/useRef/Context) | 项目规模小，不需要 Redux/Zustand |
| 跨窗口通信 | Tauri emit/listen + useRef | 轻量，直接对应 Vue 版本的实现 |

## 踩坑记录

- **Fluent UI makeStyles 限制**: animation/伪类支持不完整，复杂动画用 CSS 文件
- **DialogBody grid 约束**: Fluent UI DialogBody 默认 display:grid，子元素被限制列宽，需 override 为 display:block
- **startDragging 吞点击**: Tauri 的 startDragging() 在 mousedown 调用会阻止 onClick，需用 pointer 事件 + 位移检测区分拖拽和点击
- **跨窗口同步闭包陷阱**: useEffect 空依赖 + emit 会捕获过期 state，必须用 useRef 读最新值
- **FloatingWindow 早期 return**: 折叠时 return 宠物视图会卸载所有子视图，导致文本丢失，改为始终挂载 + CSS 隐藏

## 待记录

> 后续发现在此追加
