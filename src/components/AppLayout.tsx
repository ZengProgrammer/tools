import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { makeStyles } from '@fluentui/react-components'
import TitleBar from './TitleBar'
import Sidebar from './Sidebar'
import HomeView from '../views/HomeView'
import TranslateView from '../views/TranslateView'
import JsonView from '../views/JsonView'
import SqlView from '../views/SqlView'
import TimestampView from '../views/TimestampView'

const useStyles = makeStyles({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  body: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
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
  const location = useLocation()

  useEffect(() => {
    let unlisten: UnlistenFn | null = null
    listen<string>('navigate', (event) => {
      navigate(event.payload)
    }).then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
  }, [navigate])

  const path = location.pathname === '/' ? '/' : '/' + location.pathname.split('/')[1]

  return (
    <div className={styles.container}>
      <TitleBar />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>
          <div style={{ display: path === '/' ? 'block' : 'none', height: '100%' }}>
            <HomeView />
          </div>
          <div style={{ display: path === '/translate' ? 'block' : 'none', height: '100%' }}>
            <TranslateView />
          </div>
          <div style={{ display: path === '/json' ? 'block' : 'none', height: '100%' }}>
            <JsonView />
          </div>
          <div style={{ display: path === '/sql' ? 'block' : 'none', height: '100%' }}>
            <SqlView />
          </div>
          <div style={{ display: path === '/timestamp' ? 'block' : 'none', height: '100%' }}>
            <TimestampView />
          </div>
        </main>
      </div>
    </div>
  )
}
