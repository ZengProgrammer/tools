import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { makeStyles } from '@fluentui/react-components'
import Sidebar from './Sidebar'

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
    let unlisten: UnlistenFn | null = null
    listen<string>('navigate', (event) => {
      navigate(event.payload)
    }).then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
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
