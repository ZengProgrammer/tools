import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@fluentui/react-components'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { ThemeProvider } from './contexts/ThemeContext'
import AppLayout from './components/AppLayout'
import FloatingWindow from './views/FloatingWindow'
import ToolStandalone from './views/ToolStandalone'
import HomeView from './views/HomeView'
import TranslateView from './views/TranslateView'
import JsonView from './views/JsonView'
import SqlView from './views/SqlView'

export default function App() {
  const [mode, setMode] = useState<'loading' | 'floating' | 'tool' | 'desktop'>('loading')

  useEffect(() => {
    const label = getCurrentWindow().label
    if (label === 'floating-ball') {
      setMode('floating')
    } else if (label.startsWith('tool-')) {
      setMode('tool')
    } else {
      setMode('desktop')
    }
  }, [])

  if (mode === 'loading') return null

  return (
    <ThemeProvider>
      <Toaster />
      <HashRouter>
        {mode === 'floating' ? (
          <FloatingWindow />
        ) : mode === 'tool' ? (
          <ToolStandalone />
        ) : (
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomeView />} />
              <Route path="translate" element={<TranslateView />} />
              <Route path="json" element={<JsonView />} />
              <Route path="sql" element={<SqlView />} />
            </Route>
          </Routes>
        )}
      </HashRouter>
    </ThemeProvider>
  )
}
