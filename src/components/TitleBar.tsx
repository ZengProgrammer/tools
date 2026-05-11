import { useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { makeStyles, tokens, Tooltip } from '@fluentui/react-components'
import {
  SubtractRegular,
  SquareRegular,
  DismissRegular,
  PinRegular,
  PinOffRegular,
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  bar: {
    height: '36px', minHeight: '36px',
    display: 'flex', alignItems: 'center',
    background: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    userSelect: 'none',
    paddingLeft: '12px',
  },
  icon: {
    width: '20px', height: '20px', borderRadius: '4px',
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundHover})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '12px', fontWeight: 700,
    marginRight: '8px',
  },
  title: {
    fontSize: '13px', color: tokens.colorNeutralForeground2,
    letterSpacing: '1px', flex: 1,
  },
  btns: {
    display: 'flex', height: '100%',
  },
  btn: {
    width: '46px', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: tokens.colorNeutralForeground3,
    transition: 'background 0.1s',
    border: 'none', background: 'none', outline: 'none',
  },
  btnHover: { background: tokens.colorNeutralBackground4 },
  closeHover: { background: '#c42b1c', color: '#fff' },
})

export default function TitleBar() {
  const styles = useStyles()
  const win = getCurrentWindow()
  const [maximized, setMaximized] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  async function handleMin() { await win.minimize() }
  async function handleMax() {
    await win.toggleMaximize()
    setMaximized(!maximized)
  }
  async function handleClose() { await win.close() }
  async function togglePin() {
    const next = !pinned
    setPinned(next)
    await win.setAlwaysOnTop(next)
  }

  return (
    <div className={styles.bar} onMouseDown={() => win.startDragging()}>
      <div className={styles.icon}>T</div>
      <span className={styles.title}>工具箱</span>
      <div className={styles.btns}>
        <Tooltip content={pinned ? '取消置顶' : '固定窗口'} relationship="label">
          <button
            className={`${styles.btn} ${hovered === 'pin' ? styles.btnHover : ''}`}
            onClick={togglePin}
            onMouseEnter={() => setHovered('pin')}
            onMouseLeave={() => setHovered(null)}
          >
            {pinned ? <PinOffRegular fontSize={14} /> : <PinRegular fontSize={14} />}
          </button>
        </Tooltip>
        <button
          className={`${styles.btn} ${hovered === 'min' ? styles.btnHover : ''}`}
          onClick={handleMin}
          onMouseEnter={() => setHovered('min')}
          onMouseLeave={() => setHovered(null)}
        >
          <SubtractRegular fontSize={12} />
        </button>
        <button
          className={`${styles.btn} ${hovered === 'max' ? styles.btnHover : ''}`}
          onClick={handleMax}
          onMouseEnter={() => setHovered('max')}
          onMouseLeave={() => setHovered(null)}
        >
          <SquareRegular fontSize={12} />
        </button>
        <button
          className={`${styles.btn} ${hovered === 'close' ? styles.closeHover : ''}`}
          onClick={handleClose}
          onMouseEnter={() => setHovered('close')}
          onMouseLeave={() => setHovered(null)}
        >
          <DismissRegular fontSize={14} />
        </button>
      </div>
    </div>
  )
}
