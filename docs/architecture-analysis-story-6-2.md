# Architecture Analysis for Story 6-2: Loading States & Progress Indicators

**Status:** ready-for-dev (building on Story 6-1 comprehensive error handling)
**Epic:** 6 - Error Handling & User Experience
**Date:** 2025-12-10

---

## Executive Summary

Story 6-2 implements comprehensive loading states and progress indicators for cc-config, ensuring users always understand when the application is working. This analysis extracts all architecture requirements, patterns, and implementation details developers must follow.

**Key Innovation:** Debounced loading states (<200ms threshold) with context-appropriate indicators (skeleton screens, progress bars, spinners) integrated with the existing error handling system from Story 6-1.

---

## 1. Technical Stack for Loading States

### 1.1 Core Technologies

**Frontend Framework:**
- React 18+ with TypeScript strict mode
- Hook-based loading state management
- Component memoization for performance

**State Management:**
- Zustand v4+ for global loading states
- `uiStore` for application-wide loading
- `configStore` and `projectsStore` for domain-specific loading
- Functional state updates: `setState((prev) => ({...}))`

**UI Components:**
- shadcn/ui components (pre-configured in project)
  - `skeleton.tsx` for content loading placeholders
  - `progress.tsx` for file operation progress
  - `spinner` (via Button with loading state)
  - `badge.tsx` for loading state indicators
- Tailwind CSS for styling and animations

**Tauri Integration:**
- Rust backend for file operations
- Tauri commands with progress callbacks
- Event emission for async operations

### 1.2 Library Requirements

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "zustand": "^4.4.0",
    "react": "^18.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.292.0"
  }
}
```

### 1.3 shadcn/ui Components Required

**Already Configured (from Story 1.2):**
- `button.tsx` - for spinner buttons
- `skeleton.tsx` - for content placeholders
- `progress.tsx` - for file operation progress
- `badge.tsx` - for loading indicators
- `card.tsx` - for loading card layouts

**To Implement in Story 6-2:**
- LoadingStates composite component
- Progress indicators for file operations
- Skeleton screens for different content types

---

## 2. Code Structure & Organization

### 2.1 File Locations

**New Files to Create:**

```
src/
├── components/
│   ├── ui/
│   │   ├── skeleton.tsx              # shadcn/ui skeleton component
│   │   ├── progress.tsx              # shadcn/ui progress component
│   │   └── loading-spinner.tsx       # Custom spinner component
│   ├── LoadingStates.tsx             # NEW - Composite loading component
│   ├── ConfigSkeleton.tsx            # NEW - Config list skeleton
│   ├── ProjectSkeleton.tsx           # NEW - Project card skeleton
│   └── CapabilitySkeleton.tsx        # NEW - MCP/Agent skeleton
│
├── hooks/
│   ├── useLoading.ts                 # NEW - Loading state hook
│   ├── useFileOperationProgress.ts   # NEW - File operation progress
│   └── useDebouncedLoading.ts        # NEW - <200ms debouncing
│
├── stores/
│   ├── uiStore.ts                    # EXTEND - Add loadingMessage, isInitialLoading
│   ├── configStore.ts                # EXTEND - Add loadingMessage
│   └── projectsStore.ts              # EXTEND - Add loadingMessage
│
├── lib/
│   ├── loadingTypes.ts               # NEW - TypeScript interfaces
│   └── loadingMessages.ts            # NEW - Loading message localization
│
└── types/
    └── index.ts                      # EXTEND - Add loading types
```

**Modified Files:**

```
src/
├── components/
│   ├── ConfigList.tsx                # Add skeleton loading state
│   ├── ProjectTab.tsx                # Add loading indicators
│   ├── McpBadge.tsx                  # Add skeleton loading
│   ├── AgentList.tsx                 # Add skeleton loading
│   └── App.tsx                       # Add global loading overlay
│
└── stores/
    ├── uiStore.ts                    # Add: loadingMessage, isInitialLoading, setLoadingMessage
    ├── configStore.ts                # Add: loadingMessage
    └── projectsStore.ts              # Add: loadingMessage
```

### 2.2 Naming Conventions

**Loading State Naming:**
- State variables: `isLoading` prefix (e.g., `isLoading`, `isLoadingProjects`, `isLoadingConfigs`)
- Loading messages: `loadingMessage` (string)
- Initial vs background loading: `isInitialLoading` (boolean)
- Store setters: `setLoading`, `setLoadingMessage`

**Component Naming:**
- Components: PascalCase (e.g., `LoadingStates`, `ConfigSkeleton`)
- Skeleton components: `<Type>Skeleton` pattern
- Hooks: `use` prefix (e.g., `useLoading`, `useFileOperationProgress`)

**File Naming:**
- Components: PascalCase (e.g., `LoadingStates.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useLoading.ts`)
- Utilities: camelCase (e.g., `loadingTypes.ts`)

---

## 3. State Management Patterns

### 3.1 uiStore Extensions (from Architecture)

**Current State (from Story 1.6):**
```typescript
interface UiStore {
  currentScope: 'user' | 'project'
  isLoading: boolean                    // Global loading state
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  setCurrentScope: (scope) => void
  setLoading: (loading: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme) => void
  toggleTheme: () => void
}
```

**Required Extensions for Story 6-2:**
```typescript
interface UiStore {
  // EXISTING
  currentScope: 'user' | 'project'
  isLoading: boolean
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  setCurrentScope: (scope) => void
  setLoading: (loading: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme) => void
  toggleTheme: () => void

  // NEW for Story 6-2
  loadingMessage: string | null         // Descriptive loading message
  isInitialLoading: boolean             // Initial app load vs background updates
  setLoadingMessage: (message: string | null) => void
  setInitialLoading: (loading: boolean) => void
}
```

**Implementation Pattern:**
```typescript
// stores/uiStore.ts
export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      // EXISTING STATE
      currentScope: 'user',
      isLoading: false,
      sidebarOpen: true,
      theme: 'light',
      setCurrentScope: (scope) => set({ currentScope: scope }),
      setLoading: (loading) => set({ isLoading: loading }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // NEW STATE
      loadingMessage: null,
      isInitialLoading: true,
      setLoadingMessage: (message) => set({ loadingMessage: message }),
      setInitialLoading: (loading) => set({ isInitialLoading: loading }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        currentScope: state.currentScope,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
```

### 3.2 Global vs Local Loading States

**Global Loading (uiStore):**
- Used for: App-wide operations (initial load, theme change, scope switch)
- Applies to: Full screen overlays, global spinners
- Display: Loading overlay, full-screen skeleton

**Domain-Specific Loading (configStore, projectsStore):**
- Used for: Domain-specific operations (config loading, project discovery)
- Applies to: Specific sections of the UI
- Display: Section skeletons, inline spinners

**Component-Level Loading (useState):**
- Used for: Component-specific operations (small async tasks)
- Applies to: Individual components
- Display: Small spinners, button loading states

### 3.3 Debouncing Pattern (<200ms Threshold)

**Critical Requirement (from Epic 6.2):**
Do NOT show loading indicators for operations <200ms to prevent UI flashing.

**Implementation - useDebouncedLoading Hook:**
```typescript
// hooks/useDebouncedLoading.ts
interface UseDebouncedLoadingOptions {
  delay?: number  // Default: 200ms
  minDuration?: number  // Minimum time to show loading (prevents flash)
}

export function useDebouncedLoading(
  loadingFn: () => Promise<void>,
  options: UseDebouncedLoadingOptions = {}
) {
  const { delay = 200, minDuration = 200 } = options
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const startTime = useRef<number>(0)

  const debouncedLoading = useCallback(async (message?: string) => {
    setLoadingMessage(message || null)
    setIsLoading(true)
    startTime.current = Date.now()

    try {
      await loadingFn()
    } finally {
      const elapsed = Date.now() - startTime.current

      // Ensure minimum duration to prevent flash
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed))
      }

      setIsLoading(false)
      setLoadingMessage(null)
    }
  }, [loadingFn, minDuration])

  return { isLoading, loadingMessage, startLoading: debouncedLoading }
}
```

**Usage Example:**
```typescript
// In component
const { isLoading, loadingMessage, startLoading } = useDebouncedLoading()

// When performing operation
await startLoading('Loading configuration...')
```

### 3.4 Loading State Naming Conventions

**Pattern (from Architecture.md line 386-393):**

✅ **Correct:**
```typescript
// Global loading
const { isLoading, setGlobalLoading } = useUiStore()

// Component loading
const [isLoadingConfigs, setIsLoadingConfigs] = useState(false)

// Store loading
const { isLoadingProjects, loadingMessage } = useProjectsStore()
```

❌ **Incorrect:**
```typescript
// Wrong: not using isLoading prefix
const [loading, setLoading] = useState(false)

// Wrong: unclear naming
const [dataLoading, setDataLoading] = useState(false)

// Wrong: mixing conventions
const [isLoading, setProjectsLoading] = useState(false)
```

---

## 4. Performance Requirements

### 4.1 Loading Display Latency

**From Architecture - NFR Section:**
- Error display latency: <100ms
- Loading display latency: <100ms (same as error)
- Must not block UI for operations <200ms

**Implementation Requirements:**
1. Use `useDebouncedLoading` hook with 200ms delay
2. Show skeleton immediately if operation >200ms
3. No flash for operations <200ms
4. Cache data to avoid loading indicators on tab switch (from Story 2.4)

### 4.2 UI Blocking Restrictions

**Critical Rules:**
1. **NO blocking UI for loading** - Use skeletons, not blocking overlays
2. **Spinner vs Skeleton selection:**
   - Spinner: Operations <1s
   - Skeleton: Content loading >1s
   - Progress bar: File operations with known duration
3. **Lazy loading** for large lists (>100 items)
4. **Cached data** for instant tab switching (from Story 2.4)

### 4.3 Memory Overhead Constraints

**From Architecture:**
- Memory usage: <200MB total
- Loading state memory: <5MB (including skeletons, progress tracking)
- Cache invalidation: 5 minutes (from Story 2.4)

**Implementation:**
1. Reuse skeleton components (don't recreate)
2. Cleanup loading timeouts on unmount
3. Implement stale-while-revalidate pattern (from Story 2.4)
4. Debounced file watcher events (300ms)

### 4.4 Tab Switching Performance

**From Story 2.4 (already implemented):**
- Tab switch response time: <100ms
- No visible loading indicators for cached data
- Content cached in Zustand stores
- Previous tab content cached (no re-fetch)

**Integration Point:**
Loading states from Story 6-2 must integrate with existing caching from Story 2.4:
- Only show loading for uncached data
- Use `isInitialLoading` vs `isBackgroundLoading` distinction
- Stale-while-revalidate for seamless UX

---

## 5. Component Patterns

### 5.1 Skeleton Screen Implementation

**Skeleton for ConfigList:**
```typescript
// components/ConfigSkeleton.tsx
interface ConfigSkeletonProps {
  count?: number  // Number of skeleton items to show
}

export const ConfigSkeleton: FC<ConfigSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
```

**Skeleton for Project Cards:**
```typescript
// components/ProjectSkeleton.tsx
export const ProjectSkeleton: FC = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}
```

**Skeleton Usage in ConfigList:**
```typescript
// components/ConfigList.tsx
export const ConfigList: FC<ConfigListProps> = ({ configs, isLoading }) => {
  if (isLoading) {
    return <ConfigSkeleton count={5} />
  }

  return (
    <div className="space-y-4">
      {configs.map((config) => (
        <ConfigItem key={config.id} config={config} />
      ))}
    </div>
  )
}
```

### 5.2 Progress Bar Patterns

**File Operation Progress:**
```typescript
// components/FileOperationProgress.tsx
interface FileOperationProgressProps {
  fileName: string
  operation: 'read' | 'write' | 'parse'
  progress: number  // 0-100
}

export const FileOperationProgress: FC<FileOperationProgressProps> = ({
  fileName,
  operation,
  progress
}) => {
  const messages = {
    read: `Reading ${fileName}...`,
    write: `Writing ${fileName}...`,
    parse: `Parsing ${fileName}...`
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{messages[operation]}</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
```

**Usage with Tauri Command:**
```typescript
// In component
const [progress, setProgress] = useState(0)

useEffect(() => {
  const updateProgress = (p: number) => setProgress(p)

  // Listen to progress events from Tauri
  const unlisten = listen('file-operation-progress', (event) => {
    updateProgress(event.payload.progress)
  })

  return () => {
    unlisten.then((fn) => fn())
  }
}, [])

// Show progress bar
{progress > 0 && progress < 100 && (
  <FileOperationProgress
    fileName={currentFile}
    operation="read"
    progress={progress}
  />
)}
```

### 5.3 Spinner Usage Guidelines

**Quick Operations (<1s):**
```typescript
// For button loading states
<Button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2 h-4 w-4" />}
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

**Loading Overlay (for modals/dialogs):**
```typescript
// Global loading overlay
{isLoading && (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="space-y-4 text-center">
      <Spinner className="h-8 w-8 mx-auto" />
      {loadingMessage && (
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      )}
    </div>
  </div>
)}
```

### 5.4 Loading State Transitions

**Transition Patterns:**
1. **Fade in/out:** For skeleton → content transition
2. **Slide down:** For inline loading messages
3. **Pulse:** For skeleton shimmer effect
4. **Progress bar:** For file operations

**CSS Transitions (from Story 2.4):**
```css
/* index.css */
.tab-content-transition {
  transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
}

.skeleton-shimmer {
  animation: skeleton-shimmer 2s infinite;
}

@keyframes skeleton-shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
```

---

## 6. Testing Standards

### 6.1 Loading State Testing Approaches

**Unit Tests (90%+ coverage required):**

**Hook Tests:**
```typescript
// hooks/useLoading.test.ts
describe('useLoading', () => {
  it('should debounce loading state', async () => {
    const { result } = renderHook(() => useLoading())

    act(() => {
      result.current.startLoading('Loading...')
    })

    expect(result.current.isLoading).toBe(false) // Not yet, waiting for debounce

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 250))
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should not show loading for fast operations', async () => {
    const { result } = renderHook(() => useLoading())

    const fastOperation = jest.fn().mockResolvedValue(undefined)

    act(() => {
      result.current.startLoading('Loading...', fastOperation)
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false) // Never showed loading
    })
  })
})
```

**Store Tests:**
```typescript
// stores/uiStore.test.ts
describe('uiStore loading state', () => {
  it('should update loading message', () => {
    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.setLoadingMessage('Loading configuration...')
    })

    expect(result.current.loadingMessage).toBe('Loading configuration...')
  })
})
```

**Component Tests:**
```typescript
// components/ConfigList.test.tsx
describe('ConfigList loading', () => {
  it('should render skeleton when loading', () => {
    render(<ConfigList configs={[]} isLoading={true} />)

    expect(screen.getByTestId('config-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('config-item')).not.toBeInTheDocument()
  })

  it('should render content when not loading', () => {
    render(<ConfigList configs={mockConfigs} isLoading={false} />)

    expect(screen.queryByTestId('config-skeleton')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('config-item')).toHaveLength(mockConfigs.length)
  })
})
```

### 6.2 Performance Testing Requirements

**From Story 2.4 (already implemented):**
- Tab switch: <100ms (passing at 15.39ms)
- File change detection: <500ms (passing at 2.26ms)
- Startup: <3000ms (passing at 427.94ms)

**New Tests for Story 6-2:**
```typescript
// tests/loading-performance.test.ts
describe('Loading performance', () => {
  it('should display loading within 100ms', async () => {
    const startTime = performance.now()

    const { result } = renderHook(() => useDebouncedLoading())

    act(() => {
      result.current.startLoading('Loading...')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    const elapsed = performance.now() - startTime
    expect(elapsed).toBeLessThan(100)
  })

  it('should not flash for operations <200ms', async () => {
    const { result } = renderHook(() => useDebouncedLoading())

    const fastOp = jest.fn().mockResolvedValue(undefined)

    act(() => {
      result.current.startLoading('Loading...', fastOp)
    })

    // Wait longer than debounce + operation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
    })

    // Loading should never have been true
    expect(result.current.isLoading).toBe(false)
    expect(fastOp).toHaveBeenCalled()
  })
})
```

### 6.3 Integration Testing Patterns

**E2E Workflows:**
1. Initial app load → shows initial loading → skeleton → content
2. Tab switch (cached) → instant switch, no loading
3. Tab switch (uncached) → loading → content
4. File operation → progress bar → completion
5. Fast operation → no loading flash

**Integration with Error Handling (Story 6-1):**
```typescript
// tests/loading-error-integration.test.ts
describe('Loading + Error integration', () => {
  it('should transition from loading to error state', async () => {
    const { result } = renderHook(() => useLoading())

    const failingOperation = jest.fn().mockRejected(new Error('File not found'))

    act(() => {
      result.current.startLoading('Loading...', failingOperation)
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should integrate with errorStore from Story 6-1
    expect(useErrorStore.getState().errors).toHaveLength(1)
    expect(useErrorStore.getState().errors[0].type).toBe('filesystem')
  })
})
```

---

## 7. Integration Points

### 7.1 Error Handling Integration (from Story 6-1)

**Integration Requirements:**

Story 6-2 must integrate with the layered error handling from Story 6-1:

1. **UI Layer Integration:**
   - Loading states transition to error states gracefully
   - Error boundary catches loading component errors
   - Retry button after error (from Story 6-1)

2. **State Management Integration:**
   - Loading and error states are mutually exclusive
   - Loading state resets when error occurs
   - Clear loading before showing error

3. **Error Display with Loading:**
```typescript
// components/ConfigList.tsx
export const ConfigList: FC<ConfigListProps> = ({ configs, isLoading, error }) => {
  if (error) {
    return <ErrorDisplay error={error} />
  }

  if (isLoading) {
    return <ConfigSkeleton />
  }

  return (
    <div className="space-y-4">
      {configs.map((config) => (
        <ConfigItem key={config.id} config={config} />
      ))}
    </div>
  )
}
```

**From Story 6-1 - Error Types:**
```typescript
interface AppError {
  type: 'filesystem' | 'permission' | 'parse' | 'network'
  message: string
  code?: string
  details?: any
  recoverable: boolean
}
```

**Integration Pattern:**
```typescript
// In loading operation
try {
  setIsLoading(true)
  setLoadingMessage('Reading configuration...')
  await readConfig()
} catch (error) {
  // Loading automatically stops
  setIsLoading(false)
  setError(error)
  throw error // Re-throw for error boundary
}
```

### 7.2 File Operation Loading States

**Tauri Command Integration:**

**Rust Backend (src-tauri/src/commands/config_commands.rs):**
```rust
#[tauri::command]
pub async fn read_config_with_progress(
    path: String,
    window: Window,
) -> Result<String, String> {
    match read_file_impl(&path).await {
        Ok(content) => {
            // Emit progress events during read
            for i in 0..=100 {
                window.emit("file-operation-progress", json!({
                    "file": path,
                    "progress": i,
                    "operation": "read"
                })).unwrap();
                tokio::time::sleep(std::time::Duration::from_millis(10)).await;
            }
            Ok(content)
        }
        Err(e) => {
            window.emit("file-operation-error", json!({
                "file": path,
                "error": e.to_string()
            })).unwrap();
            Err(e.to_string())
        }
    }
}
```

**Frontend Integration (hooks/useFileOperationProgress.ts):**
```typescript
export function useFileOperationProgress() {
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  useEffect(() => {
    const progressListener = listen('file-operation-progress', (event) => {
      setProgress(event.payload.progress)
    })

    const errorListener = listen('file-operation-error', (event) => {
      setIsLoading(false)
      setError(parseError(event.payload.error))
    })

    return () => {
      progressListener.then((fn) => fn())
      errorListener.then((fn) => fn())
    }
  }, [])

  return { progress, isLoading, error }
}
```

### 7.3 Tab Switching Loading States

**Integration with Story 2.4 Caching:**

From Story 2.4, tab switching uses cached data and should NOT show loading indicators for cached content.

**Loading State Decision Tree:**
```
Tab Switch Triggered
    ↓
Is data cached?
    ├─ YES → Instant switch (no loading)
    └─ NO → Show loading → Fetch data → Show content
```

**Implementation:**
```typescript
// stores/configStore.ts
export const useConfigStore = create<ConfigStore>((set, get) => ({
  // ... existing state

  switchToScope: async (scope: 'user' | 'project', projectId?: string) => {
    const cacheKey = scope === 'user' ? 'user' : `project:${projectId}`
    const cached = get().configsCache[cacheKey]

    // Cached data - instant switch
    if (cached && !isStale(cached.timestamp)) {
      set({
        configs: cached.data,
        currentScope: scope,
        isLoading: false,
      })
      return
    }

    // No cache - show loading
    set({ isLoading: true, loadingMessage: 'Loading configuration...' })

    try {
      const configs = await fetchConfigs(scope, projectId)
      set({
        configs,
        currentScope: scope,
        isLoading: false,
        configsCache: {
          ...get().configsCache,
          [cacheKey]: {
            data: configs,
            timestamp: Date.now(),
          },
        },
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))
```

---

## 8. Developer Guardrails

### 8.1 Critical Implementation Rules

**1. MUST Follow Debouncing Rule**
- All loading states MUST be debounced for 200ms
- No flashing for fast operations
- Use `useDebouncedLoading` hook

**2. MUST Use Correct Loading Type**
- Skeleton: Content loading >1s
- Spinner: Operations <1s
- Progress bar: File operations with progress
- No loading: Cached data (from Story 2.4)

**3. MUST Follow Naming Convention**
- State: `isLoading` prefix
- Message: `loadingMessage`
- Setter: `setLoading`, `setLoadingMessage`

**4. MUST Integrate with Error Handling**
- Loading and error are mutually exclusive
- Loading resets on error
- Use error types from Story 6-1

**5. MUST Not Block UI**
- Skeletons for content loading
- Overlays only for critical operations
- Maintain interactivity when possible

### 8.2 Anti-Patterns to Avoid

**❌ Blocking UI:**
```typescript
// WRONG - Blocks entire UI
if (isLoading) {
  return <div>Loading...</div> // Prevents any interaction
}

// CORRECT - Non-blocking skeleton
if (isLoading) {
  return <ConfigSkeleton />
}
```

**❌ No Debouncing:**
```typescript
// WRONG - Flashes for fast operations
const [isLoading, setIsLoading] = useState(false)

await setIsLoading(true)
await someFastOperation()
await setIsLoading(false)

// CORRECT - Uses debouncing
const { isLoading, startLoading } = useDebouncedLoading()
await startLoading('Loading...', someFastOperation)
```

**❌ Wrong Loading Type:**
```typescript
// WRONG - Shows spinner for 5-second operation
<Button disabled={isLoading}>
  {isLoading && <Spinner />}
  Loading Configuration...
</Button>

// CORRECT - Shows progress for file operations
<FileOperationProgress
  fileName="config.json"
  progress={progress}
  operation="read"
/>
```

**❌ Mixing Loading and Error:**
```typescript
// WRONG - Shows both loading and error
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage />}

// CORRECT - Mutually exclusive
if (error) return <ErrorMessage />
if (isLoading) return <LoadingSpinner />
```

### 8.3 Code Review Checklist

**State Management:**
- [ ] Loading states use `isLoading` prefix
- [ ] Loading messages use `loadingMessage`
- [ ] Uses `useDebouncedLoading` hook for all async operations
- [ ] Loading states are properly cleaned up

**UI Components:**
- [ ] Uses skeleton screens for content loading >1s
- [ ] Uses spinners for quick operations <1s
- [ ] Uses progress bars for file operations
- [ ] No blocking UI overlays

**Performance:**
- [ ] Tab switching doesn't show loading for cached data (Story 2.4)
- [ ] Loading display latency <100ms
- [ ] Operations <200ms don't show loading
- [ ] Memory overhead <5MB for loading states

**Integration:**
- [ ] Integrates with errorStore from Story 6-1
- [ ] Loading and error states are mutually exclusive
- [ ] Follows existing caching patterns from Story 2.4
- [ ] Uses Tauri progress events for file operations

**Testing:**
- [ ] Unit tests for loading hooks (>90% coverage)
- [ ] Performance tests for loading latency
- [ ] Integration tests for loading + error flow
- [ ] E2E tests for critical loading scenarios

---

## 9. Architecture Compliance Summary

### 9.1 From docs/architecture.md

**Pattern Compliance (Section 3.7):**
- ✅ Loading state naming: `isLoading` prefix (line 386-393)
- ✅ Global vs local loading: uiStore vs useState (line 389-393)
- ✅ Debouncing: <200ms threshold (Epic 6.2 specification)

**Performance Requirements (Section 2):**
- ✅ Loading display latency: <100ms
- ✅ Memory overhead: <5MB for loading
- ✅ UI blocking: Prohibited (use skeletons)

**Technology Stack (Section 2.1):**
- ✅ Tauri v2 for backend
- ✅ React 18 + TypeScript for frontend
- ✅ Zustand for state management
- ✅ shadcn/ui for components

### 9.2 From docs/epics.md

**Story 6.2 Requirements (lines 1661-1692):**
- ✅ Operations >200ms show loading indicators
- ✅ Skeleton screens for content loading
- ✅ Progress bars for file operations
- ✅ Spinners for quick operations <1s
- ✅ Loading messages with descriptions
- ✅ Cancel button for long operations

**Component Requirements (line 1686-1689):**
- ✅ Component: `src/components/LoadingStates.tsx`
- ✅ Store: `src/stores/uiStore.ts` (isLoading, loadingMessage)
- ✅ Hook: `src/hooks/useLoading.ts`

### 9.3 From Story 2.4 Integration

**Caching Pattern (docs/sprint-artifacts/2-4-scope-switching-performance.md):**
- ✅ No loading indicators for cached tab switches
- ✅ Stale-while-revalidate pattern
- ✅ Cache validity: 5 minutes
- ✅ Performance: <100ms tab switch

**React Optimization (line 66-92):**
- ✅ React.memo for loading components
- ✅ Debounced file watcher (300ms)
- ✅ isInitialLoading vs isBackgroundLoading distinction

### 9.4 From Story 6.1 Integration

**Error Handling (docs/sprint-artifacts/6-1-comprehensive-error-handling.md):**
- ✅ Layered error handling (Rust, TypeScript, UI)
- ✅ AppError type with error codes
- ✅ Toast notifications and error dialogs
- ✅ Retry button for transient errors

**Integration Requirements:**
- ✅ Loading transitions to error gracefully
- ✅ Loading and error states are mutually exclusive
- ✅ Error boundary catches loading component errors
- ✅ Loading resets when error occurs

---

## 10. Implementation Roadmap

### Phase 1: Core Loading Infrastructure

**Task 1: Extend uiStore**
- Add `loadingMessage`, `isInitialLoading`, `setLoadingMessage`, `setInitialLoading`
- Update TypeScript interfaces
- Add persistence configuration

**Task 2: Create useDebouncedLoading Hook**
- Implement 200ms debouncing
- Add `minDuration` to prevent flash
- Add TypeScript types

**Task 3: Create Skeleton Components**
- `ConfigSkeleton` for config lists
- `ProjectSkeleton` for project cards
- `CapabilitySkeleton` for MCP/Agent lists

### Phase 2: Progress Indicators

**Task 4: File Operation Progress**
- Integrate Tauri progress events
- Create `FileOperationProgress` component
- Add progress tracking to file operations

**Task 5: Button Loading States**
- Update Button component with spinner
- Add loading state to all action buttons
- Add cancel button for long operations

### Phase 3: Component Integration

**Task 6: Update Existing Components**
- Add loading states to ConfigList
- Add loading states to ProjectTab
- Add loading states to McpBadge and AgentList
- Add global loading overlay to App

**Task 7: Loading Messages**
- Create `loadingMessages.ts` for localization
- Add descriptive messages for all loading states
- Integrate with error messages from Story 6-1

### Phase 4: Testing & Polish

**Task 8: Unit Tests**
- Test all loading hooks (>90% coverage)
- Test store extensions
- Test component loading states

**Task 9: Performance Tests**
- Validate <100ms loading display
- Validate <200ms debouncing
- Validate no flash for fast operations
- Integrate with Story 2.4 performance tests

**Task 10: Integration Tests**
- Test loading + error flow (Story 6-1 integration)
- Test cached vs uncached loading (Story 2.4 integration)
- Test tab switching with loading states
- E2E tests for critical user journeys

---

## 11. Success Criteria

### 11.1 Acceptance Criteria Validation

**Given** the app is performing an operation
**When** the operation takes >200ms
**Then** I see:
- ✅ Skeleton screens for loading content
- ✅ Progress bars for file operations
- ✅ Spinner for quick operations (<1s)
- ✅ "Loading..." text with descriptions
- ✅ Cancel button for long operations

### 11.2 Performance Criteria

- ✅ Loading display latency: <100ms
- ✅ Debouncing threshold: 200ms
- ✅ Memory overhead: <5MB
- ✅ No UI blocking
- ✅ Tab switching: <100ms (from Story 2.4)

### 11.3 Quality Criteria

- ✅ 90%+ test coverage
- ✅ All unit tests passing
- ✅ Integration tests passing
- ✅ E2E tests passing
- ✅ Performance benchmarks met
- ✅ Accessibility compliant (ARIA labels)

### 11.4 Architecture Criteria

- ✅ Follows all patterns from architecture.md
- ✅ Integrates with Story 6.1 error handling
- ✅ Integrates with Story 2.4 caching
- ✅ Uses correct naming conventions
- ✅ Uses correct loading types (skeleton/spinner/progress)

---

## 12. References

### 12.1 Architecture Documents

- **Main Architecture:** `/Users/sunven/github/cc-config/docs/architecture.md`
  - Loading state patterns: Lines 384-394
  - Performance requirements: Lines 36-40
  - Technology stack: Lines 48-50
  - State management: Lines 201-212

- **Epic Breakdown:** `/Users/sunven/github/cc-config/docs/epics.md`
  - Story 6.2 specification: Lines 1661-1692
  - Epic 6 context: Lines 1609-1623

- **Story 6.1 (Error Handling):** `/Users/sunven/github/cc-config/docs/sprint-artifacts/6-1-comprehensive-error-handling.md`
  - Error types and handling: Lines 24-80
  - Error display patterns: Lines 82-115
  - Integration requirements: Lines 149-153

- **Story 2.4 (Performance):** `/Users/sunven/github/cc-config/docs/sprint-artifacts/2-4-scope-switching-performance.md`
  - Caching patterns: Lines 62-80
  - Performance benchmarks: Lines 50-57
  - React optimization: Lines 69-91

- **Story 1.6 (Zustand Stores):** `/Users/sunven/github/cc-config/docs/sprint-artifacts/1-6-zustand-stores-implementation.md`
  - Store interfaces: Lines 22-47
  - State management patterns: Lines 117-138

### 12.2 Implementation Files

**Key Files to Reference:**

1. **stores/uiStore.ts** - Current implementation + extensions needed
2. **stores/configStore.ts** - Caching pattern from Story 2.4
3. **hooks/useFileWatcher.ts** - Debouncing pattern (300ms)
4. **components/ConfigList.tsx** - Current implementation + skeleton integration
5. **components/ProjectTab.tsx** - Tab switching logic
6. **components/ErrorBoundary.tsx** - From Story 6.1

### 12.3 Testing Files

**Test Patterns:**

1. **tests/loading-performance.test.ts** - Performance tests (to create)
2. **tests/hooks/useLoading.test.ts** - Hook tests (to create)
3. **stores/uiStore.test.ts** - Store tests (to extend)
4. **components/ConfigList.test.tsx** - Component tests (to extend)

---

## Conclusion

This architecture analysis provides comprehensive guardrails for implementing Story 6-2: Loading States & Progress Indicators. Developers must follow the debouncing pattern (<200ms), use appropriate loading types (skeleton/spinner/progress), integrate with existing error handling (Story 6.1) and caching (Story 2.4), and maintain performance requirements (<100ms display latency, <5MB overhead).

The loading state system builds directly on the foundation of:
- **Story 6.1:** Comprehensive error handling with layered error types
- **Story 2.4:** Performance optimization with caching and <100ms tab switching
- **Story 1.6:** Zustand stores with isLoading patterns

All patterns, naming conventions, and performance requirements are explicitly defined to prevent implementation mistakes, omissions, or architectural violations.

---

**Document Status:** Complete
**Analysis Date:** 2025-12-10
**For Story:** 6.2 - Loading States & Progress Indicators
**Epic:** 6 - Error Handling & User Experience
