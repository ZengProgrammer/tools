import { useState, useEffect, useRef } from 'react'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { makeStyles, tokens } from '@fluentui/react-components'
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
    width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  titleBar: {
    height: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', fontSize: '12px', color: tokens.colorNeutralForeground4,
    cursor: 'grab', borderBottom: `1px solid ${tokens.colorNeutralStroke1}`, letterSpacing: '1px', userSelect: 'none',
  },
  pinBtn: { position: 'absolute', right: '8px', cursor: 'pointer', color: tokens.colorNeutralForeground4, transition: 'color 0.15s' },
  pinBtnActive: { color: tokens.colorBrandForeground1 },
  tabBar: {
    display: 'flex', borderBottom: `1px solid ${tokens.colorNeutralStroke1}`, flexShrink: 0,
  },
  tabBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 0',
    fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', borderBottom: '2px solid transparent', userSelect: 'none',
  },
  content: { flex: 1, overflow: 'auto', minHeight: 0, padding: '10px' },
  pet: {
    width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', userSelect: 'none', position: 'relative',
  },
  petIcon: {
    width: '56px', height: '56px', borderRadius: '50%',
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground}, ${tokens.colorBrandBackgroundHover})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '26px', fontWeight: 700,
    animation: 'pet-pulse 2s ease-in-out infinite, pet-float 3s ease-in-out infinite',
  },
  petPin: {
    position: 'absolute', top: '2px', right: '2px',
    width: '20px', height: '20px', borderRadius: '50%',
    background: tokens.colorNeutralBackground3, border: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
})

export default function FloatingWindow() {
  const styles = useStyles()
  const [activeKey, setActiveKey] = useState('translate')
  const [pinned, setPinned] = useState(true)
  const [contentVisible, setContentVisible] = useState(true)
  const contentVisibleRef = useRef(contentVisible)
  contentVisibleRef.current = contentVisible

  async function togglePin() {
    const next = !pinned
    setPinned(next)
    await appWindow.setAlwaysOnTop(next)
  }

  async function toggleContent(tool: string) {
    if (activeKey === tool) {
      const next = !contentVisible
      setContentVisible(next)
      await appWindow.setSize(next ? new LogicalSize(780, 480) : new LogicalSize(72, 72))
    } else {
      setActiveKey(tool)
      if (!contentVisible) {
        setContentVisible(true)
        await appWindow.setSize(new LogicalSize(780, 480))
      }
    }
  }

  useEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'

    ;(window as any).__floatNav = async (tool: string) => {
      setActiveKey(tool)
      if (!contentVisibleRef.current) {
        setContentVisible(true)
        await appWindow.setSize(new LogicalSize(780, 480))
      }
    }

    let unlistenFloat: UnlistenFn | null = null
    listen<string>('float-navigate', async (event) => {
      setActiveKey(event.payload)
      if (!contentVisibleRef.current) {
        setContentVisible(true)
        await appWindow.setSize(new LogicalSize(780, 480))
      }
    }).then((fn) => { unlistenFloat = fn })

    return () => { unlistenFloat?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!contentVisible) {
    return (
      <div className={styles.pet} onMouseDown={() => appWindow.startDragging()} onClick={() => toggleContent(activeKey)}>
        <div className={styles.petIcon}>
          {(() => {
            const Icon = tools.find(t => t.key === activeKey)?.icon ?? tools[0].icon
            return <Icon fontSize={28} />
          })()}
        </div>
        <div
          className={styles.petPin}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); togglePin() }}
          title={pinned ? '取消置顶' : '置顶'}
        >
          <PinRegular fontSize={10} color={pinned ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground4} />
        </div>
      </div>
    )
  }

  // Keep all views mounted (like Vue's <KeepAlive>) so event listeners stay active
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
    </div>
  )
}
