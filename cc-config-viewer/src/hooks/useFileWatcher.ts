import { useEffect, useRef } from 'react'

export function useFileWatcher(
  path: string,
  callback: (path: string) => void,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    let unsubscribe: (() => void) | undefined

    // TODO: Implement file watching
    // This will be implemented in Story 1.8 using Tauri fs watchers
    // For now, just log that it would be set up
    console.log(`Watching file: ${path}`)

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [path, enabled])
}
