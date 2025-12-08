# Story 2.5: Multi-Project Navigation

Status: done

## Story

As a developer,
I want to navigate between multiple project scopes efficiently,
So that I can compare configurations across different projects.

## Acceptance Criteria

**Given** I have multiple projects with configurations
**When** I click the project selector
**Then** I see:
1. Dropdown or list showing all discovered projects
2. Each project shows configuration summary (MCP count, Agent count)
3. Last access time for each project
4. Projects are sorted by recency or name
5. Quick jump to any project's tab

**And** I can switch projects without returning to user level first

## Tasks / Subtasks

- [x] Task 1: Implement Project Discovery Service (AC: #1, #4)
  - [x] Subtask 1.1: Create `discoverProjects()` function in `lib/projectDetection.ts`
  - [x] Subtask 1.2: Scan known paths for `.mcp.json` files (home dir Claude projects list)
  - [x] Subtask 1.3: Parse `~/.claude.json` for registered project paths
  - [x] Subtask 1.4: Validate each discovered project path exists
  - [x] Subtask 1.5: Sort projects by `lastAccessed` timestamp (most recent first)
- [x] Task 2: Extend Project Type and Store (AC: #2, #3)
  - [x] Subtask 2.1: Extend `Project` interface with `mcpCount`, `agentCount`, `lastAccessed`
  - [x] Subtask 2.2: Add `projects: Project[]` population in `projectsStore`
  - [x] Subtask 2.3: Add `loadProjects()` action to projectsStore
  - [x] Subtask 2.4: Add `updateProjectLastAccessed()` action
  - [x] Subtask 2.5: Persist `lastAccessed` to localStorage or config
- [x] Task 3: Create ProjectSelector Component (AC: #1, #5)
  - [x] Subtask 3.1: Create `ProjectSelector.tsx` using shadcn/ui Popover + Command
  - [x] Subtask 3.2: Display project name, path, MCP/Agent counts in list items
  - [x] Subtask 3.3: Show "last accessed: 2 hours ago" relative time
  - [x] Subtask 3.4: Add search/filter input for projects
  - [x] Subtask 3.5: Keyboard navigation support (arrow keys, Enter to select)
- [x] Task 4: Implement Quick Project Switching (AC: #5)
  - [x] Subtask 4.1: On project select, call `setActiveProject()` + `switchToScope('project', projectPath)`
  - [x] Subtask 4.2: Update tab label to show new project name
  - [x] Subtask 4.3: Update `lastAccessed` for newly selected project
  - [x] Subtask 4.4: Ensure cache is used for instant switch (leverage Story 2.4 work)
- [x] Task 5: Integrate ProjectSelector into App UI (AC: #1, #5)
  - [x] Subtask 5.1: Add ProjectSelector button/dropdown next to project tab
  - [x] Subtask 5.2: Show ProjectSelector in header or as tab menu
  - [x] Subtask 5.3: Handle empty state (no projects discovered)
  - [x] Subtask 5.4: Add loading state while discovering projects
- [x] Task 6: Testing and Validation (All ACs)
  - [x] Subtask 6.1: Unit tests for `discoverProjects()` function
  - [x] Subtask 6.2: Unit tests for ProjectSelector component
  - [x] Subtask 6.3: Integration test: discover → select → switch workflow
  - [x] Subtask 6.4: Test sorting (recency and alphabetical)
  - [x] Subtask 6.5: Performance test: project switch time <100ms (same as tab switch)

## Dev Notes

### Technical Implementation Guide

**From Architecture Document:**
- Component: `src/components/ProjectSelector.tsx`
- Store: `src/stores/projectsStore.ts`
- Utils: `src/lib/projectDetection.ts`
- File watching: auto-discover new projects via existing `useFileWatcher` hook

**From PRD (FR21-24):**
- FR21: Developer can view list of all configured projects
- FR22: Developer can switch to different project configuration views
- FR23: Developer can compare configuration differences between projects
- FR24: System can display project configuration status (exists/not exists)

### Existing Code Patterns to Follow

**1. Store Pattern (from `configStore.ts` and `projectsStore.ts`):**
```typescript
// Use Zustand selectors for fine-grained subscriptions
const projects = useProjectsStore((state) => state.projects)
const activeProject = useProjectsStore((state) => state.activeProject)

// Use functional updates
set((state) => ({ projects: [...state.projects, newProject] }))
```

**2. Component Pattern (from `ConfigList.tsx`, `McpBadge.tsx`):**
```typescript
// Use React.memo with custom comparison
export const ProjectSelector = memo(function ProjectSelector({ ... }) {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.projects === nextProps.projects
})
```

**3. Cache Pattern (from Story 2.4):**
- Leverage existing `projectConfigsCache` in `projectsStore`
- Use `switchToScope('project', projectPath)` for instant cached switching
- No re-fetch on project switch if cache is valid

**4. File Structure Pattern:**
```
src/
├── components/
│   ├── ProjectSelector.tsx          # New component
│   └── ProjectSelector.test.tsx     # Tests in same directory
├── lib/
│   └── projectDetection.ts          # Extend with discoverProjects()
├── stores/
│   └── projectsStore.ts             # Extend with projects list
└── types/
    └── project.ts                   # Extend Project interface
```

### Extended Project Interface

```typescript
// In src/types/project.ts
export interface Project {
  id: string
  name: string
  path: string
  configPath: string
  createdAt: Date
  updatedAt: Date
  // New fields for Story 2.5:
  lastAccessed?: Date | null
  mcpCount?: number
  agentCount?: number
  status?: 'valid' | 'invalid' | 'missing'
}

export interface ProjectSummary {
  project: Project
  mcpCount: number
  agentCount: number
  lastAccessed: Date | null
}
```

### ProjectsStore Extensions

```typescript
// Extensions to src/stores/projectsStore.ts
interface ProjectsStore {
  // Existing...
  projects: Project[]
  activeProject: Project | null
  projectConfigsCache: Record<string, CacheEntry<ConfigEntry[]>>

  // New for Story 2.5:
  isLoadingProjects: boolean
  projectsError: string | null
  sortOrder: 'recency' | 'name'

  // New actions:
  loadProjects: () => Promise<void>
  updateProjectLastAccessed: (projectId: string) => void
  setSortOrder: (order: 'recency' | 'name') => void
  getProjectSummary: (projectId: string) => ProjectSummary | null
}
```

### Project Discovery Logic

```typescript
// In src/lib/projectDetection.ts
export async function discoverProjects(): Promise<Project[]> {
  const projects: Project[] = []

  // 1. Parse ~/.claude.json for registered projects
  try {
    const userConfig = await readConfig('~/.claude.json')
    if (userConfig.projects) {
      for (const [name, projectData] of Object.entries(userConfig.projects)) {
        // Validate path exists
        const exists = await validateProjectPath(projectData.path)
        projects.push({
          id: generateProjectId(projectData.path),
          name,
          path: projectData.path,
          configPath: `${projectData.path}/.mcp.json`,
          status: exists ? 'valid' : 'missing',
          lastAccessed: projectData.lastOpened || null,
          // Count MCPs and Agents during discovery
          mcpCount: await countMcpServers(projectData.path),
          agentCount: await countAgents(projectData.path),
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
  } catch (error) {
    console.warn('Failed to read user config for projects:', error)
  }

  // 2. Add current project if not in list
  const currentProject = await detectCurrentProject()
  if (currentProject && !projects.find(p => p.path === currentProject.path)) {
    projects.unshift(currentProject)
  }

  return projects
}
```

### UI Component Design

**ProjectSelector using shadcn/ui:**
- Use `Popover` + `Command` pattern for searchable dropdown
- Similar to shadcn/ui ComboBox example
- Include project icon, name, path, stats badge

```typescript
// ProjectSelector visual structure:
<Popover>
  <PopoverTrigger>
    <Button variant="outline">
      <FolderIcon />
      {activeProject?.name || 'Select Project'}
      <ChevronDown />
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput placeholder="Search projects..." />
      <CommandList>
        <CommandGroup heading="Recent Projects">
          {projects.map(project => (
            <CommandItem key={project.id}>
              <ProjectItemContent project={project} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

### Performance Considerations

**From Story 2.4 Learnings:**
1. Use cache for instant project switching (already implemented)
2. Don't re-fetch configs on project switch if cache is valid
3. Background revalidation (stale-while-revalidate) for stale caches
4. Project discovery should be async and non-blocking
5. Show projects from cache immediately, update in background

**Performance Targets:**
- Project switch time: <100ms (same as tab switch)
- Project discovery: <500ms initial, cached after
- No visible loading for cached project switches

### Previous Story Learnings (Story 2.4)

**Key Patterns to Reuse:**
1. `switchToScope()` serves from cache first - use this for project switching
2. Selector patterns for store subscriptions prevent unnecessary re-renders
3. `React.memo` with custom comparison for list items
4. Debounced updates (300ms) from file watcher
5. `isInitialLoading` vs `isBackgroundLoading` distinction

**Files Modified in Story 2.4 (relevant context):**
- `stores/configStore.ts` - caching logic, `switchToScope`
- `stores/projectsStore.ts` - project configs cache
- `components/ConfigList.tsx` - React.memo patterns
- `App.tsx` - selector patterns, `useCallback`

### Testing Strategy

**Unit Tests:**
- `projectDetection.test.ts`: Test `discoverProjects()` with mocked file system
- `projectsStore.test.ts`: Test store actions and state updates
- `ProjectSelector.test.tsx`: Test component rendering and interactions

**Integration Tests:**
- Full workflow: load projects → select project → verify switch
- Cache behavior: verify instant switch for cached projects

**Test Files to Create/Update:**
- `src/lib/projectDetection.test.ts` (extend)
- `src/components/ProjectSelector.test.tsx` (new)
- `src/stores/projectsStore.test.ts` (extend)
- `src/__tests__/integration.test.tsx` (extend)

### Anti-Patterns to Avoid

1. **Don't** fetch configs on every project switch - use cache
2. **Don't** use destructuring for store subscriptions - use selectors
3. **Don't** block UI while discovering projects - async background load
4. **Don't** show loading indicator for cached switches
5. **Don't** mutate state directly - use functional updates

### References

- [PRD: FR21-25 Cross-Project Configuration Comparison](docs/prd.md#跨项目配置对比)
- [Architecture: Project Structure](docs/architecture.md#project-structure)
- [Epic 2: Story 2.5 Spec](docs/epics.md#story-25-multi-project-navigation)
- [Story 2.4: Performance Implementation](docs/sprint-artifacts/2-4-scope-switching-performance.md)

## Dev Agent Record

### Context Reference

Story 2.5 from Epic 2: Configuration Scope Display

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Task 1 - Project Discovery Service**: Implemented `discoverProjects()` function that:
   - Parses `~/.claude.json` for registered projects
   - Validates project paths exist
   - Counts MCP servers and agents per project
   - Sorts by lastAccessed timestamp

2. **Task 2 - Store Extensions**: Extended `projectsStore.ts` with:
   - `isLoadingProjects`, `projectsError`, `sortOrder` state
   - `loadProjects()` async action with localStorage persistence
   - `updateProjectLastAccessed()` action with localStorage sync
   - `setSortOrder()` action for recency/name sorting
   - `getProjectSummary()` selector

3. **Task 3 - ProjectSelector Component**: Created searchable dropdown using:
   - shadcn/ui Popover + Command pattern
   - Project items showing name, path, MCP/Agent counts, relative time
   - Keyboard navigation support
   - Loading and empty states

4. **Task 4 - Quick Project Switching**: Integrated in ProjectSelector:
   - `setActiveProject()` called on selection
   - `updateProjectLastAccessed()` called to track recency
   - Leverages existing cache for instant switching

5. **Task 5 - App Integration**: Added ProjectSelector to project tab UI
   - Placed next to ScopeIndicator in project tab
   - `onProjectSelect` callback triggers scope switch

6. **Task 6 - Testing**: Comprehensive test coverage:
   - 19 unit tests for `projectDetection.ts`
   - 13 unit tests for `ProjectSelector.tsx`
   - 9 store tests for multi-project navigation
   - All 282 tests passing

### File List

**New Files:**
- `src/components/ProjectSelector.tsx` - Main component
- `src/components/ProjectSelector.test.tsx` - Component tests

**Modified Files:**
- `src/lib/projectDetection.ts` - Added discovery functions
- `src/lib/projectDetection.test.ts` - Extended tests
- `src/stores/projectsStore.ts` - Added store state and actions
- `src/stores/stores.test.ts` - Added store tests
- `src/types/project.ts` - Extended Project interface
- `src/test/setup.ts` - Added ResizeObserver and scrollIntoView mocks
- `src/App.tsx` - Integrated ProjectSelector
