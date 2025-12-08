import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { useUiStore } from '../stores/uiStore'

/**
 * ViewToggle Component
 *
 * Allows users to switch between merged and split view modes for configuration display.
 * This component is used to visualize inheritance chains in different layouts.
 *
 * - Merged View: Shows all configurations in a single list with inheritance indicators
 * - Split View: Shows user and project configurations side-by-side (future enhancement)
 *
 * The selected view mode is persisted to localStorage via Zustand persist middleware.
 *
 * @example
 * ```tsx
 * <ViewToggle />
 * ```
 */
export function ViewToggle() {
  const { viewMode, setViewMode } = useUiStore()

  return (
    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'merged' | 'split')}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="merged">Merged View</TabsTrigger>
        <TabsTrigger value="split">Split View</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
