import { useEffect, useRef, useCallback } from 'react'
import { listen, emit, type UnlistenFn } from '@tauri-apps/api/event'

interface SyncPayload { from: string; [key: string]: unknown }

const lastSyncCache = new Map<string, unknown>()

export function getSyncCache(channel: string) {
  return lastSyncCache.get(channel)
}

export function setSyncCache(channel: string, payload: unknown) {
  lastSyncCache.set(channel, payload)
}

export function useWindowSync<T extends SyncPayload>(
  channel: string,
  winId: string,
  onReceive: (payload: T) => void,
) {
  const onReceiveRef = useRef(onReceive)
  onReceiveRef.current = onReceive

  useEffect(() => {
    const cached = lastSyncCache.get(channel) as T | undefined
    if (cached && cached.from !== winId) {
      onReceiveRef.current(cached)
    }

    let unlisten: UnlistenFn | null = null
    listen<T>(channel, (event) => {
      lastSyncCache.set(channel, event.payload)
      if (event.payload.from !== winId) {
        onReceiveRef.current(event.payload)
      }
    }).then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
  }, [channel, winId])

  const syncOut = useCallback((payload: Omit<T, 'from'>) => {
    const full = { ...payload, from: winId } as T
    lastSyncCache.set(channel, full)
    emit(channel, full)
  }, [channel, winId])

  return syncOut
}
