import { useEffect, useRef } from 'react'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { useConfigStore } from '@/stores/configStore'
import { useProjectsStore } from '@/stores/projectsStore'

/**
 * Config file change event payload from Rust backend
 */
interface ConfigChangedEvent {
  path: string
  changeType: 'create' | 'modify' | 'delete'
}

// Debounce timeout in milliseconds
const DEBOUNCE_MS = 300

/**
 * Custom hook to listen for configuration file changes from the Tauri watcher
 *
 * This hook automatically:
 * - Listens for 'config-changed' events emitted by the Rust file watcher
 * - Debounces rapid file changes to avoid excessive updates
 * - Invalidates cache and triggers reload only on file change events
 * - Cleans up the event listener on unmount
 *
 * Usage: Call this hook once at the app root level (e.g., in App.tsx)
 */
export function useFileWatcher() {
  const { invalidateCache, switchToScope, removeConfig } = useConfigStore()
  const { invalidateProjectCache } = useProjectsStore()
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingChangesRef = useRef<ConfigChangedEvent[]>([])

  useEffect(() => {
    let unlisten: UnlistenFn | null = null

    // Process accumulated changes after debounce period
    const processChanges = async () => {
      const changes = [...pendingChangesRef.current]
      pendingChangesRef.current = []

      if (changes.length === 0) return

      // Determine what caches to invalidate based on changed paths
      let invalidateUser = false
      let invalidateProject = false
      const deletedPaths: string[] = []

      for (const { path, changeType } of changes) {
        if (changeType === 'delete') {
          deletedPaths.push(path)
        }

        // Determine scope based on path
        if (path.includes('.claude.json') || path.includes('claude_desktop_config')) {
          invalidateUser = true
        }
        if (path.includes('.mcp.json') || path.includes('mcp.json')) {
          invalidateProject = true
        }
      }

      // Remove deleted configs
      for (const path of deletedPaths) {
        removeConfig(path)
      }

      // Invalidate appropriate caches
      if (invalidateUser) {
        invalidateCache('user')
        if (process.env.NODE_ENV === 'development') {
          console.log('[useFileWatcher] User config cache invalidated')
        }
      }
      if (invalidateProject) {
        invalidateCache('project')
        invalidateProjectCache()
        if (process.env.NODE_ENV === 'development') {
          console.log('[useFileWatcher] Project config cache invalidated')
        }
      }

      // Trigger reload for current scope (will use cache-first pattern)
      const { useUiStore } = await import('@/stores/uiStore')
      const { currentScope } = useUiStore.getState()
      await switchToScope(currentScope)

      if (process.env.NODE_ENV === 'development') {
        console.log(`[useFileWatcher] Processed ${changes.length} file changes, reloaded ${currentScope} scope`)
      }
    }

    // Set up event listener
    const setupListener = async () => {
      unlisten = await listen<ConfigChangedEvent>('config-changed', (event) => {
        const { path, changeType } = event.payload

        if (process.env.NODE_ENV === 'development') {
          console.log(`[useFileWatcher] Config change detected: ${changeType} - ${path}`)
        }

        // Accumulate changes
        pendingChangesRef.current.push({ path, changeType })

        // Debounce: clear existing timer and set new one
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
          processChanges()
        }, DEBOUNCE_MS)
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[useFileWatcher] File watcher listener initialized with debouncing')
      }
    }

    setupListener()

    // Cleanup on unmount
    return () => {
      if (unlisten) {
        unlisten()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('[useFileWatcher] File watcher listener cleaned up')
      }
    }
  }, [invalidateCache, switchToScope, removeConfig, invalidateProjectCache])
}
