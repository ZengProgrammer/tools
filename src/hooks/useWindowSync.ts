import { useEffect, useRef } from 'react'
import { listen, emit, type UnlistenFn } from '@tauri-apps/api/event'

interface SyncPayload { from: string; [key: string]: unknown }

export function useWindowSync<T extends SyncPayload>(
  channel: string,
  winId: string,
  onReceive: (payload: T) => void,
) {
  const onReceiveRef = useRef(onReceive)
  onReceiveRef.current = onReceive

  useEffect(() => {
    let unlisten: UnlistenFn | null = null
    listen<T>(channel, (event) => {
      if (event.payload.from !== winId) {
        onReceiveRef.current(event.payload)
      }
    }).then((fn) => { unlisten = fn })
    return () => { unlisten?.() }
  }, [channel, winId])

  const syncOut = (payload: Omit<T, 'from'>) => {
    emit(channel, { ...payload, from: winId } as T)
  }

  return syncOut
}
