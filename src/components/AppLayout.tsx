import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { makeStyles } from '@fluentui/react-components'
import { getSyncCache, setSyncCache } from '../hooks/useWindowSync'
import Sidebar from './Sidebar'

const winId = getCurrentWindow().label

const useStyles = makeStyles({
  layout: {
    height: '100%',
    display: 'flex',
  },
  main: {
    flex: 1,
    padding: '24px',
    overflow: 'auto',
  },
})

export default function AppLayout() {
  const styles = useStyles()
  const navigate = useNavigate()

  useEffect(() => {
    let unlistenNav: UnlistenFn | null = null
    listen<string>('navigate', (event) => {
      navigate(event.payload)
    }).then((fn) => { unlistenNav = fn })

    // Handle switch-sync: when desktop is source, broadcast all cached data
    let unlistenSwitch: UnlistenFn | null = null
    listen<string>('switch-sync', (e) => {
      if (e.payload === winId) {
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

    return () => { unlistenNav?.(); unlistenSwitch?.() }
  }, [navigate])

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
