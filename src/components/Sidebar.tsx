import { useNavigate, useLocation } from 'react-router-dom'
import { Button, makeStyles, tokens } from '@fluentui/react-components'
import {
  HomeRegular,
  MicRegular,
  CodeRegular,
  DataAreaRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
} from '@fluentui/react-icons'
import { useTheme } from '../contexts/ThemeContext'

const useStyles = makeStyles({
  aside: {
    width: '220px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
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

  return (
    <aside className={styles.aside}>

      <nav className={styles.nav} style={{ paddingTop: '16px' }}>
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
          title={isDark ? '切换浅色' : '切换深色'}
        />
        <span className={styles.version}>v0.2.0</span>
      </div>
    </aside>
  )
}
