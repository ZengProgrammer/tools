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
