import { useState, useEffect } from 'react'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'
import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event'
import { makeStyles, tokens } from '@fluentui/react-components'
import { MicRegular, CodeRegular, DataAreaRegular, PinRegular } from '@fluentui/react-icons'
import { getSyncCache, setSyncCache } from '../hooks/useWindowSync'
import TranslateView from './TranslateView'
import JsonView from './JsonView'
import SqlView from './SqlView'

const appWindow = getCurrentWindow()
const winId = appWindow.label

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

    // Handle switch-sync: broadcast all cached data from this window
    let unlistenSwitch: UnlistenFn | null = null
    listen<string>('switch-sync', (e) => {
      if (e.payload === winId) {
        // I'm the source — broadcast all tool data
        for (const ch of ['translate-sync', 'json-sync', 'sql-sync']) {
          const cached = getSyncCache(ch)
          if (cached) {
            const payload = { ...(cached as any), from: winId }
            setSyncCache(ch, payload)
            emit(ch, payload)
          }
        }
      }
    }).then((fn) => { unlistenSwitch = fn })

    let unlistenFloat: UnlistenFn | null = null
    listen<string>('float-navigate', async () => {}).then((fn) => { unlistenFloat = fn })

    return () => { unlistenSwitch?.(); unlistenFloat?.() }
  }, [])

  // All 3 views are ALWAYS rendered so their useWindowSync listeners stay active.
  // CSS hides inactive ones.
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

      {contentVisible && (
        <div className={styles.content}>
          <div style={{ display: activeKey === 'translate' ? 'block' : 'none', height: '100%' }}>
            <TranslateView />
          </div>
          <div style={{ display: activeKey === 'json' ? 'block' : 'none', height: '100%' }}>
            <JsonView />
          </div>
          <div style={{ display: activeKey === 'sql' ? 'block' : 'none', height: '100%' }}>
            <SqlView />
          </div>
        </div>
      )}
    </div>
  )
}
