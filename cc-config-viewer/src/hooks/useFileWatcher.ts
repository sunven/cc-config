import { useEffect } from 'react'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { useConfigStore } from '@/stores/configStore'

/**
 * Config file change event payload from Rust backend
 */
interface ConfigChangedEvent {
  path: string
  changeType: 'create' | 'modify' | 'delete'
}

/**
 * Custom hook to listen for configuration file changes from the Tauri watcher
 *
 * This hook automatically:
 * - Listens for 'config-changed' events emitted by the Rust file watcher
 * - Updates the configStore when files are modified or created
 * - Removes configs from the store when files are deleted
 * - Cleans up the event listener on unmount
 *
 * Usage: Call this hook once at the app root level (e.g., in App.tsx)
 */
export function useFileWatcher() {
  const { updateConfigs, removeConfig } = useConfigStore()

  useEffect(() => {
    let unlisten: UnlistenFn | null = null

    // Set up event listener
    const setupListener = async () => {
      unlisten = await listen<ConfigChangedEvent>('config-changed', async (event) => {
        const { path, changeType } = event.payload

        console.log(`[useFileWatcher] Config change detected: ${changeType} - ${path}`)

        try {
          if (changeType === 'delete') {
            // Remove deleted config from store
            removeConfig(path)
            console.log(`[useFileWatcher] Removed config: ${path}`)
          } else {
            // For create/modify events, reload all configs
            await updateConfigs()
            console.log(`[useFileWatcher] Reloaded configs after ${changeType}`)
          }
        } catch (error) {
          console.error(`[useFileWatcher] Error handling config change:`, error)
        }
      })

      console.log('[useFileWatcher] File watcher listener initialized')
    }

    setupListener()

    // Cleanup on unmount
    return () => {
      if (unlisten) {
        unlisten()
        console.log('[useFileWatcher] File watcher listener cleaned up')
      }
    }
  }, [updateConfigs, removeConfig])
}
