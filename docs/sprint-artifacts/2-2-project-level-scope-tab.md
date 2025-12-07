# Story 2.2: Project-Level Scope Tab

Status: done

## Story

As a developer,
I want to see a dynamic "Project Name" tab that shows project-specific configuration,
So that I can see what additional capabilities this project has beyond my global config.

## Acceptance Criteria

**Given** the user-level tab is implemented
**When** I have a project with .mcp.json or .claude/agents/
**Then** I see:
- Dynamic tab labeled with project name (e.g., "my-awesome-app")
- Tab shows project-specific MCP servers from .mcp.json
- Tab shows project-specific Agents from .claude/agents/*.md
- Project tab appears alongside User Level tab
- Tab shows both inherited and project-specific items

**And** I can switch between User Level and Project tab seamlessly

## Tasks / Subtasks

- [x] Task 1: Implement Project tab discovery and display (AC: #1-#4)
  - [x] Subtask 1.1: Enhance ProjectTab component to accept project prop
  - [x] Subtask 1.2: Detect project from current working directory or user selection
  - [x] Subtask 1.3: Dynamically generate tab with project name
  - [x] Subtask 1.4: Update App.tsx to conditionally render project tab
- [x] Task 2: Implement project configuration reading (AC: #4)
  - [x] Subtask 2.1: Extend read_config command to support .mcp.json path
  - [x] Subtask 2.2: Implement .claude/agents/*.md file discovery
  - [x] Subtask 2.3: Frontend invoke project config reading
  - [x] Subtask 2.4: Parse project-specific MCP servers and Agents
- [x] Task 3: Implement configuration merging and inheritance (AC: #5)
  - [x] Subtask 3.1: Merge user config as base with project overrides
  - [x] Subtask 3.2: Add green color coding for project-specific items
  - [x] Subtask 3.3: Show inherited items with "from User" indicator
  - [x] Subtask 3.4: Store merged config in configStore
- [x] Task 4: Project state management (AC: #6)
  - [x] Subtask 4.1: Use projectsStore.activeProject for current project
  - [x] Subtask 4.2: Update uiStore.currentScope to support 'project'
  - [x] Subtask 4.3: Sync project selection with tab switching
- [x] Task 5: Testing and performance validation
  - [x] Subtask 5.1: Unit tests for project config merging
  - [x] Subtask 5.2: Integration tests for project detection
  - [x] Subtask 5.3: Performance tests for tab switching (<100ms)
  - [x] Subtask 5.4: Test inheritance visualization

## Dev Notes

### Architecture Context

**From Architecture Document (docs/architecture.md):**

**Technical Stack (Unchanged from 2.1):**
- Tauri v2 for file system access
- React 18 + TypeScript strict mode
- Zustand v4+ for state management
- shadcn/ui for UI components
- Vite for build

**State Management Structure:**
- `projectsStore.ts`: activeProject, projects[], setActiveProject()
- `uiStore.ts`: currentScope: 'user' | 'project' | 'local'
- `configStore.ts`: configs[], inheritanceChain, updateConfigs()

**UI Components:**
- Reuse ProjectTab.tsx from Story 2.1 with project prop
- shadcn/ui Tabs component (dynamic tab generation)
- shadcn/ui Badge for source indicators
- Color coding: Green for project-level (bg-green-100 text-green-800)

**Tauri Commands:**
- Existing: `read_config(path: String)`
- Usage: invoke('read_config', { path: './.mcp.json' })
- Error handling: AppError::Filesystem, AppError::Parse

**File System Access:**
- Read .mcp.json from project root
- Read .claude/agents/*.md files for project agents
- Use Tauri fs API with project-level permissions

### Project Structure Alignment

**Files to Modify:**

```
src/
├── components/
│   └── ProjectTab.tsx            # UPDATE - Accept project prop
├── stores/
│   ├── projectsStore.ts          # ALREADY EXISTS - Use activeProject
│   ├── uiStore.ts                # UPDATE - Support 'project' scope
│   └── configStore.ts            # UPDATE - Merge user + project configs
├── lib/
│   ├── configParser.ts           # UPDATE - Add mergeConfigs function
│   └── tauriApi.ts               # REUSE - No changes needed
└── App.tsx                       # UPDATE - Conditionally render project tab

src-tauri/src/
├── commands/
│   └── config.rs                 # ALREADY EXISTS - Reuse read_config
└── types/
    └── app.rs                    # ALREADY EXISTS - Reuse types
```

**No New Files Required** - All components from 2.1 are reusable!

### Previous Story Intelligence (Story 2.1)

**Key Learnings from 2.1:**

✅ **What Worked Well:**
1. **Component Reusability:** ProjectTab.tsx designed to be flexible
2. **Store Pattern:** Zustand stores with clear separation of concerns
3. **Type Safety:** Strict TypeScript prevented runtime errors
4. **Testing Approach:** Performance tests validated <100ms requirement
5. **Color Coding:** Badge components worked perfectly for visual distinction

⚠️ **Issues Encountered:**
1. **Type Inconsistency:** extractMcpServers/extractSubAgents had hardcoded 'user' type
   - **Fixed in 2.1 review:** Now accept source parameter
   - **Lesson:** Always parameterize source types for reusability
2. **Mock Testing Complexity:** Performance tests had async timing issues
   - **Lesson:** Separate performance assertions from mock validation

**📁 Files Created in 2.1 (Reuse these):**
- cc-config-viewer/src/components/ProjectTab.tsx ✅
- cc-config-viewer/src/components/ConfigList.tsx ✅
- cc-config-viewer/src/lib/configParser.ts ✅ (now with correct type handling)
- cc-config-viewer/src/lib/tauriApi.ts ✅
- cc-config-viewer/src/types/config.ts ✅
- cc-config-viewer/src-tauri/src/commands/config.rs ✅ (read_config, parse_config)

**📊 Testing Patterns Established:**
- Unit tests: components + lib functions
- Integration tests: store interactions
- Performance tests: <100ms tab switching
- All tests using vitest + @testing-library/react

### Git Intelligence Summary

**Recent Commit Analysis (ca1b631):**

**Pattern:** feat: 实现基本应用外壳，集成错误边界，添加单元测试

**Files Modified:**
- App.tsx, App.test.tsx ← Main integration point
- ErrorBoundary.tsx, ErrorBoundary.test.tsx ← Error handling pattern
- sprint-status.yaml ← Status tracking

**Code Conventions Observed:**
1. **Commit Messages:** Chinese language, conventional commits格式 (feat:, fix:, docs:)
2. **Testing:** Every component has .test.tsx counterpart
3. **Error Handling:** Comprehensive ErrorBoundary wrapping
4. **File Organization:** By-type (components/, stores/, lib/)

**For Story 2.2:**
- Follow同样的commit message convention (Chinese)
- Continue comprehensive test coverage pattern
- Maintain ErrorBoundary usage in App.tsx

### Technical Requirements

**1. Project Detection Logic:**

```typescript
// Pseudo-code for project detection
async function detectCurrentProject(): Promise<Project | null> {
  // Option 1: Check if CWD has .mcp.json
  const mcpPath = path.join(process.cwd(), '.mcp.json')
  if (await exists(mcpPath)) {
    return {
      id: hash(process.cwd()),
      name: path.basename(process.cwd()),
      path: process.cwd(),
      configPath: mcpPath
    }
  }

  // Option 2: Check if CWD has .claude/agents/
  const agentsPath = path.join(process.cwd(), '.claude', 'agents')
  if (await exists(agentsPath)) {
    return {
      id: hash(process.cwd()),
      name: path.basename(process.cwd()),
      path: process.cwd(),
      configPath: agentsPath
    }
  }

  return null // No project detected
}
```

**2. Configuration Merging Algorithm:**

```typescript
// From configParser.ts - NEW function to add
export function mergeConfigs(
  userConfig: Record<string, any>,
  projectConfig: Record<string, any>,
  source: 'user' | 'project'
): ConfigEntry[] {
  const merged: ConfigEntry[] = []

  // Extract all user entries
  const userEntries = extractAllEntries(userConfig, 'user')

  // Extract all project entries
  const projectEntries = extractAllEntries(projectConfig, 'project')

  // Create a map for O(1) lookup
  const projectKeys = new Set(projectEntries.map(e => e.key))

  // Add user entries with inheritance indicator
  userEntries.forEach(entry => {
    if (!projectKeys.has(entry.key)) {
      merged.push({
        ...entry,
        inherited: true // Inherited from user level
      })
    }
  })

  // Add project entries (overrides)
  projectEntries.forEach(entry => {
    const userEntry = userEntries.find(e => e.key === entry.key)
    merged.push({
      ...entry,
      overridden: !!userEntry // Marks if it overrides user config
    })
  })

  return merged
}
```

**3. Color Coding Requirements:**

- **User-level items:** `bg-blue-100 text-blue-800` (继承自全局)
- **Project-level items:** `bg-green-100 text-green-800` (项目特定)
- **Inherited indicator:** Show "from User" text or icon for inherited items

**4. Tab Rendering Logic:**

```typescript
// In App.tsx
function App() {
  const { activeProject } = useProjectsStore()
  const { currentScope, setCurrentScope } = useUiStore()

  return (
    <Tabs value={currentScope} onValueChange={setCurrentScope}>
      <TabsList>
        <TabsTrigger value="user">用户级</TabsTrigger>
        {activeProject && (
          <TabsTrigger value="project">
            {activeProject.name}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="user">
        <ProjectTab scope="user" />
      </TabsContent>

      {activeProject && (
        <TabsContent value="project">
          <ProjectTab scope="project" project={activeProject} />
        </TabsContent>
      )}
    </Tabs>
  )
}
```

### Architecture Compliance

**From Architecture Document - Key Constraints:**

**Performance Requirements (NFR-P1):**
- Tab switching response time: **<100ms** ✅ Already validated in 2.1
- Project detection should not block UI: Use async loading
- Configuration caching: Store merged config in Zustand to avoid re-parsing

**Memory Requirements (NFR-P2):**
- Memory usage: <100MB for single project
- Cache strategy: Keep user config + current project config only
- Clear unused project configs when switching

**Code Organization (Architecture 3.7.2):**
- By-type grouping: components/, stores/, lib/
- PascalCase for components: ProjectTab.tsx
- camelCase for functions: mergeConfigs(), detectCurrentProject()

**Error Handling (Architecture 3.2):**
- Use existing AppError type from types/app.rs
- Handle missing .mcp.json gracefully (project tab hidden)
- Handle permission errors with user-friendly messages

**Testing Standards (Architecture 5.1):**
- Unit test coverage: >80%
- Performance tests: Verify <100ms tab switching
- Integration tests: Test config merging logic

### Library & Framework Requirements

**Zustand v4+ State Management:**
- Use `projectsStore` for project state (already exists)
- Update `uiStore.currentScope` to include 'project' value
- Update `configStore` to handle merged configurations

**React 18 Patterns:**
- Use React.memo for ProjectTab to prevent unnecessary re-renders
- Use useEffect for project detection on mount
- Use conditional rendering for project tab ({activeProject && ...})

**shadcn/ui Components:**
- Tabs: `<Tabs value={currentScope} onValueChange={...}>`
- TabsList, TabsTrigger, TabsContent (from 2.1)
- Badge: Reuse for source indicators with green colors

**TypeScript Strict Mode:**
- Type project prop as `Project | undefined` in ProjectTab
- Type mergeConfigs return as `ConfigEntry[]`
- Use discriminated unions for source types

**Tauri v2 Commands:**
- Reuse `read_config` command (no changes needed)
- No new Rust code required (all logic in frontend)

### File Structure Requirements

**Component Updates:**

**ProjectTab.tsx:**
```typescript
interface ProjectTabProps {
  scope: 'user' | 'project' | 'local'
  project?: Project // NEW - Optional project prop
}

export const ProjectTab = React.memo<ProjectTabProps>(({ scope, project }) => {
  const { configs, updateConfigs } = useConfigStore()
  const { currentScope } = useUiStore()

  useEffect(() => {
    if (scope === currentScope) {
      if (scope === 'user') {
        // Load user config (existing logic from 2.1)
        updateConfigs()
      } else if (scope === 'project' && project) {
        // NEW - Load and merge project config
        loadProjectConfig(project)
      }
    }
  }, [scope, project, currentScope])

  // ... rest of component
})
```

**configStore.ts:**
```typescript
interface ConfigStore {
  configs: ConfigEntry[]
  userConfigs: ConfigEntry[] // NEW - Cache user configs
  projectConfigs: ConfigEntry[] // NEW - Cache project configs
  inheritanceChain: InheritanceChain
  isLoading: boolean
  error: string | null
  updateConfigs: () => Promise<void>
  updateProjectConfigs: (project: Project) => Promise<void> // NEW
  clearConfigs: () => void
}
```

**App.tsx Structure:**
```typescript
function App() {
  const { activeProject, setActiveProject } = useProjectsStore()
  const { currentScope, setCurrentScope } = useUiStore()

  // NEW - Project detection on mount
  useEffect(() => {
    detectCurrentProject().then(project => {
      if (project) {
        setActiveProject(project)
      }
    })
  }, [])

  return (
    <ErrorBoundary>
      <div className="container">
        <h1>cc-config</h1>

        <Tabs value={currentScope} onValueChange={setCurrentScope}>
          <TabsList>
            <TabsTrigger value="user">用户级</TabsTrigger>
            {activeProject && (
              <TabsTrigger value="project">
                {activeProject.name}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="user">
            <ProjectTab scope="user" />
          </TabsContent>

          {activeProject && (
            <TabsContent value="project">
              <ProjectTab scope="project" project={activeProject} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}
```

### Testing Requirements

**Unit Tests (NEW for 2.2):**

**configParser.test.ts:**
```typescript
describe('mergeConfigs', () => {
  it('merges user and project configs correctly', () => {
    const userConfig = {
      mcpServers: { server1: { type: 'stdio' } }
    }
    const projectConfig = {
      mcpServers: { server2: { type: 'http' } }
    }

    const merged = mergeConfigs(userConfig, projectConfig, 'project')

    expect(merged).toHaveLength(2)
    expect(merged[0].inherited).toBe(true) // server1 from user
    expect(merged[1].overridden).toBe(false) // server2 project-specific
  })

  it('marks overridden user configs', () => {
    const userConfig = {
      setting1: 'user-value'
    }
    const projectConfig = {
      setting1: 'project-value'
    }

    const merged = mergeConfigs(userConfig, projectConfig, 'project')

    expect(merged).toHaveLength(1)
    expect(merged[0].value).toBe('project-value')
    expect(merged[0].overridden).toBe(true)
  })
})
```

**App.test.tsx:**
```typescript
describe('App with project detection', () => {
  it('renders project tab when project detected', async () => {
    // Mock project detection
    vi.mocked(detectCurrentProject).mockResolvedValue({
      id: '123',
      name: 'test-project',
      path: '/test',
      configPath: '/test/.mcp.json'
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'test-project' })).toBeInTheDocument()
    })
  })

  it('does not render project tab when no project detected', async () => {
    vi.mocked(detectCurrentProject).mockResolvedValue(null)

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByRole('tab', { name: /project/i })).not.toBeInTheDocument()
    })
  })
})
```

**Performance Tests (Revalidate from 2.1):**
```typescript
describe('Project tab switching performance', () => {
  it('switches to project tab within 100ms', () => {
    render(<App />)

    const projectTab = screen.getByRole('tab', { name: 'test-project' })

    const start = performance.now()
    fireEvent.click(projectTab)
    const end = performance.now()

    expect(end - start).toBeLessThan(100)
  })
})
```

### Previous Story Intelligence

**From Story 2.1 Code Review:**

**✅ Fixes Applied (Use these patterns):**
1. **Type Consistency:** extractMcpServers/extractSubAgents now accept source parameter
2. **Performance Tests:** Separate mock validation from timing assertions
3. **Integration Tests:** Comprehensive store interaction tests added

**⚠️ Known Issues (Avoid these):**
1. **ProjectTab Component:** Currently not used in App.tsx - THIS STORY FIXES IT
2. **Error Handling:** No Toast notifications yet (Epic 6 feature)

**📊 Test Coverage from 2.1:**
- Total tests: 93 passed
- Performance tests: 4 added
- Integration tests: 4 added
- Unit tests: Comprehensive

### Project Context Reference

**Project Context File:** `**/project-context.md`

**Key Principles from Project:**
1. **Spatial Metaphor:** Tab = Scope (核心设计理念)
2. **Color Coding:** User=Blue, Project=Green, Local=Yellow
3. **Inheritance Visualization:** Clear indicators for inherited vs overridden
4. **Performance First:** <100ms tab switching is non-negotiable
5. **Type Safety:** TypeScript strict mode prevents runtime errors

**Cross-Story Dependencies:**
- ✅ Story 2.1: User-Level Scope Tab (COMPLETE) - Provides foundation
- ⏭️ Story 2.3: Current Scope Indicator (NEXT) - Will use this story's tab structure
- 📋 Story 2.4: Scope Switching Performance (FUTURE) - Will validate performance
- 📋 Story 2.5: Multi-Project Navigation (FUTURE) - Will extend project selection

### References

**Source Documents:**
- [Epic Definition: docs/epics.md#Story-2.2 (lines 662-700)]
- [Architecture: docs/architecture.md#State-Management]
- [Previous Story: docs/sprint-artifacts/2-1-user-level-scope-tab.md]
- [PRD: docs/prd.md#FR2-FR5 (Project-level configuration)]

**Architecture Sections:**
- [State Management: docs/architecture.md#Zustand-Stores]
- [UI Components: docs/architecture.md#shadcn-ui]
- [Performance: docs/architecture.md#NFR-Performance]

## Dev Agent Record

### Context Reference

<!-- Story context will be generated here if needed -->

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

<!-- To be filled during development -->

### Completion Notes List

<!-- To be filled during development -->

### File List

**Files to Modify:**
- cc-config-viewer/src/App.tsx
- cc-config-viewer/src/App.test.tsx
- cc-config-viewer/src/components/ProjectTab.tsx
- cc-config-viewer/src/stores/uiStore.ts
- cc-config-viewer/src/stores/configStore.ts
- cc-config-viewer/src/lib/configParser.ts
- cc-config-viewer/src/lib/configParser.test.ts
- docs/sprint-artifacts/sprint-status.yaml

**No New Files Required** - All components reused from Story 2.1!

### Change Log

- **2025-12-07**: Story 2.2 created, ready-for-dev status
- **Context Analysis**: Complete epic + architecture + previous story analysis
- **Intelligence Gathering**: Git patterns, testing conventions, code patterns analyzed
- **Developer Guide**: Comprehensive implementation guide with code samples provided
