import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { FluentProvider } from '@fluentui/react-components'
import { listen, emit } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { appDarkTheme, appLightTheme } from '../theme'

const winId = getCurrentWindow().label

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved !== 'light'
  })

  useEffect(() => {
    const unlisten = listen<{ from: string; isDark: boolean }>('theme-sync', (e) => {
      if (e.payload.from !== winId) {
        setIsDark(e.payload.isDark)
        localStorage.setItem('theme', e.payload.isDark ? 'dark' : 'light')
      }
    })
    return () => { unlisten.then((fn) => fn()) }
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem('theme', next ? 'dark' : 'light')
      emit('theme-sync', { from: winId, isDark: next })
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <FluentProvider theme={isDark ? appDarkTheme : appLightTheme} style={{ height: '100%' }}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  )
}
