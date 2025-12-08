# Story 2.1: User-Level Scope Tab

Status: done

## Story

As a developer,
I want to see a "User Level" tab that displays my global Claude Code configuration,
So that I can understand what capabilities are available across all my projects.

## Acceptance Criteria

**Given** the foundation is complete
**When** I view the application
**Then** I see:
- First tab labeled "User Level" (or "用户级" in Chinese)
- Tab is active by default when app starts
- Tab displays global configuration from ~/.claude.json
- Tab shows all user-level MCP servers and Agents
- Tab inherits to all projects unless overridden

**And** the tab switch is instantaneous (<100ms response time)

## Tasks / Subtasks

- [x] Task 1: Implement User Level tab component (AC: #1-#3)
  - [x] Subtask 1.1: Create ProjectTab component with User Level support
  - [x] Subtask 1.2: Integrate shadcn/ui Tabs component
  - [x] Subtask 1.3: Configure uiStore.currentScope = 'user'
- [x] Task 2: Connect to Tauri backend for file reading (AC: #3)
  - [x] Subtask 2.1: Implement read_config command for ~/.claude.json
  - [x] Subtask 2.2: Frontend invoke('read-config', { path: '~/.claude.json' })
  - [x] Subtask 2.3: Parse MCP servers and Sub Agents from user config
- [x] Task 3: Display configuration with source indicators (AC: #4)
  - [x] Subtask 3.1: Create configuration list display
  - [x] Subtask 3.2: Add blue color coding for user-level items
  - [x] Subtask 3.3: Show inheritance indicator
- [x] Task 4: Performance optimization (AC: #5)
  - [x] Subtask 4.1: Cache configuration data in Zustand stores
  - [x] Subtask 4.2: Verify <100ms tab switch response time
  - [x] Subtask 4.3: Implement React.memo for tab components
- [x] Task 5: Testing and validation
  - [x] Subtask 5.1: Unit tests for ProjectTab component
  - [x] Subtask 5.2: Integration tests for file reading
  - [x] Subtask 5.3: Performance tests for tab switching

## Dev Notes

### Architecture Context

**From Architecture Document (docs/architecture.md):**

**Technical Stack:**
- Tauri v2 for backend (Rust) and frontend (React) communication
- React 18 + TypeScript (strict mode)
- Zustand v4+ for state management
- shadcn/ui (Radix UI + Tailwind CSS) for UI components
- Vite for build tooling

**State Management Structure:**
- uiStore.ts: currentScope: 'user' | 'project'
- configStore.ts: configs: ConfigData[], inheritanceChain: InheritanceMap
- Function updates: setState((prev) => ({...}))

**UI Components to Use:**
- shadcn/ui Tabs component (src/components/ui/tabs.tsx)
- shadcn/ui Badge component for source indicators
- Color coding: Blue for user-level (bg-blue-100 text-blue-800)

**Tauri Commands:**
- read_config: invoke('read-config', { path: '~/.claude.json' })
- Error handling: AppError type with filesystem, permission, parse variants

**File System Access:**
- Tauri v2 fs API with permissions
- Restricted paths: ~/.claude.json, ~/.claude/settings.json
- Watch API for real-time updates (will be used in Epic 1.8)

### Project Structure Alignment

**Required Files and Paths:**

```
src/
├── components/
│   ├── ui/
│   │   ├── tabs.tsx              # shadcn/ui Tabs (already exists)
│   │   └── badge.tsx             # shadcn/ui Badge (already exists)
│   └── ProjectTab.tsx            # NEW - Main tab component
├── stores/
│   ├── uiStore.ts                # UPDATE - currentScope field
│   └── configStore.ts            # UPDATE - configs array
├── lib/
│   ├── configParser.ts           # NEW - Parse ~/.claude.json
│   └── tauriApi.ts               # NEW - Tauri API wrapper
└── types/
    ├── config.ts                 # NEW - ConfigData types
    └── index.ts                  # UPDATE - Export types

src-tauri/src/
├── commands/
│   └── config_commands.rs        # UPDATE - read_config command
├── config/
│   └── reader.rs                 # NEW - File reading logic
└── types/
    └── error.rs                  # NEW - AppError type
```

**Naming Conventions (Architecture Section 3.7.1):**
- Components: PascalCase (ProjectTab.tsx, ConfigList.tsx)
- Tauri commands: snake_case (read_config, parse_config)
- TypeScript interfaces: PascalCase without markers
- JSON fields: camelCase
- Zustand stores: lowercase + Store suffix (useProjectsStore, useUiStore)

### Component Implementation Details

**ProjectTab.tsx Requirements:**
```typescript
interface ProjectTabProps {
  scope: 'user' | 'project'
  projectName?: string  // Only for project scope
}

export const ProjectTab = ({ scope, projectName }: ProjectTabProps) => {
  const { currentScope, setCurrentScope } = useUiStore()
  const { configs, updateConfigs } = useConfigStore()

  // Tab is active when currentScope === scope
  // Display configuration list with source indicators
  // Blue badge for user-level, green for project-level
}
```

**uiStore.ts Structure:**
```typescript
interface UiStore {
  currentScope: 'user' | 'project'
  isLoading: boolean
  setCurrentScope: (scope: 'user' | 'project') => void
  setLoading: (loading: boolean) => void
}
```

**configStore.ts Structure:**
```typescript
interface ConfigStore {
  configs: ConfigData[]
  inheritanceChain: InheritanceMap
  updateConfigs: () => void
}
```

### Integration with Epic 1 Foundation

**Prerequisites (Epic 1 Complete):**
- ✅ Project initialized with create-tauri-app
- ✅ Dependencies installed: Zustand, shadcn/ui
- ✅ Tauri permissions configured
- ✅ Project structure implemented
- ✅ Basic application shell with tabs structure
- ✅ Zustand stores structure defined
- ✅ File system access module (Epic 1.7)
- ✅ Error boundary component

**Dependencies on Previous Stories:**
- Story 1.5: Basic application shell provides App.tsx with tab structure
- Story 1.6: Zustand stores (uiStore, configStore) provide state management
- Story 1.7: File system access provides read_config command

### Technical Requirements

**Performance Requirements (NFR from Architecture):**
- Tab switching response time: <100ms
- Initial load time: <3 seconds (from Epic 1)
- Memory usage: <200MB
- No visible loading indicators for cached content

**Error Handling (Layered Error Handling Pattern):**
- Rust layer: FileSystemError, PermissionDenied
- TypeScript layer: ParseError, NetworkError
- UI layer: Toast notifications for non-critical, Dialog for critical

**Color Coding System (PRD + Architecture):**
- User-level: Blue (#3b82f6) - bg-blue-100 text-blue-800
- Project-level: Green (#10b981) - bg-green-100 text-green-800
- Inherited: Gray (#6b7280) - bg-gray-100 text-gray-800

### Testing Requirements

**Unit Tests Required:**
1. ProjectTab.tsx renders correctly with user scope
2. Tab switching updates uiStore.currentScope
3. Configuration parsing handles valid ~/.claude.json
4. Configuration parsing handles invalid ~/.claude.json
5. Source indicators display correct colors
6. Performance: Tab switch <100ms

**Integration Tests Required:**
1. Frontend invokes Tauri read_config command
2. File reading from ~/.claude.json works
3. Configuration updates trigger UI re-render
4. Error handling for missing ~/.claude.json

**Test File Locations (Architecture Pattern):**
```
src/components/ProjectTab.tsx
src/components/ProjectTab.test.tsx    # Test file in same directory

src/stores/uiStore.ts
src/stores/uiStore.test.ts           # Test file in same directory

src/lib/configParser.ts
src/lib/configParser.test.ts         # Test file in same directory
```

**Testing Framework:**
- Jest + Testing Library for frontend tests
- Rust native tests for backend commands

### Library and Framework Requirements

**Exact Versions (from Architecture):**
- Tauri v2: Required for watcher API (Epic 1.8) and v2 fs API
- React 18: Latest stable with concurrent features
- TypeScript: Strict mode enabled (tsconfig.json)
- Zustand: v4+ with new API pattern
- shadcn/ui: Latest, Radix UI primitives + Tailwind
- Vite: Latest for fast HMR and optimized builds

**Installation Commands:**
```bash
npm install zustand
npm install @radix-ui/react-tabs @radix-ui/react-tooltip
npm install class-variance-authority clsx tailwind-merge
npx shadcn@latest init
npx shadcn@latest add tabs badge card tooltip
```

**Why These Versions:**
- Zustand v4+: Required for current API pattern with TypeScript
- Tauri v2: Required for watcher API in Epic 1.8
- React 18: TypeScript strict mode compatibility
- shadcn/ui: WCAG 2.1 AA accessibility compliance

### References

**Source Documents:**
- [docs/epics.md#Epic 2] - Story 2.1 requirements and context
- [docs/architecture.md#Frontend Architecture] - State management and UI patterns
- [docs/architecture.md#Implementation Patterns] - Naming and structure conventions
- [docs/architecture.md#Project Structure] - Complete directory structure
- [docs/epics.md#Epic 1] - Foundation prerequisites and completed work

**Epic Dependencies:**
- Epic 1.5: Basic application shell provides App.tsx foundation
- Epic 1.6: Zustand stores provide state management infrastructure
- Epic 1.7: File system access provides backend commands

**Future Stories Context:**
- Story 2.2: Project-Level Scope Tab builds on this implementation
- Story 2.3: Current Scope Indicator enhances tab visibility
- Epic 3: Configuration Source Identification adds inheritance features

## Dev Agent Record

### Context Reference

This story implements the **Tab = Scope spatial metaphor** - the primary UX innovation from the PRD. It establishes the foundation for understanding configuration hierarchies through intuitive tab navigation.

### Agent Model Used

Claude Code (minimax-m2)

### Debug Log References

### Completion Notes List

- Story created with comprehensive developer context
- All architecture requirements extracted and documented
- Implementation patterns and guardrails specified
- Testing strategy defined with exact locations
- Performance requirements embedded
- Error handling approach documented

### File List

**Frontend - Created:**
- cc-config-viewer/src/components/ProjectTab.tsx
- cc-config-viewer/src/components/ProjectTab.test.tsx
- cc-config-viewer/src/components/ConfigList.tsx
- cc-config-viewer/src/components/ConfigList.test.tsx
- cc-config-viewer/src/lib/configParser.ts
- cc-config-viewer/src/lib/configParser.test.ts
- cc-config-viewer/src/lib/tauriApi.ts
- cc-config-viewer/src/types/config.ts
- cc-config-viewer/src/types/project.ts
- cc-config-viewer/src/types/mcp.ts
- cc-config-viewer/src/types/index.ts
- cc-config-viewer/src/hooks/useFileWatcher.test.ts (2025-12-08 Code Review)

**Frontend - Modified:**
- cc-config-viewer/src/App.tsx
- cc-config-viewer/src/App.test.tsx
- cc-config-viewer/src/stores/uiStore.ts
- cc-config-viewer/src/stores/configStore.ts
- cc-config-viewer/src/stores/configStore.test.ts (2025-12-08 Code Review - +10 tests)
- cc-config-viewer/src/stores/stores.test.ts (2025-12-08 Code Review - +9 tests)
- cc-config-viewer/src/components/McpBadge.test.tsx (2025-12-08 Code Review - +4 tests)
- cc-config-viewer/src/components/ConfigList.test.tsx (2025-12-08 Code Review - +10 tests)

**Backend - Created:**
- cc-config-viewer/src-tauri/src/commands/mod.rs
- cc-config-viewer/src-tauri/src/commands/config.rs
- cc-config-viewer/src-tauri/src/config/mod.rs
- cc-config-viewer/src-tauri/src/config/settings.rs
- cc-config-viewer/src-tauri/src/types/mod.rs
- cc-config-viewer/src-tauri/src/types/app.rs

**Backend - Modified:**
- cc-config-viewer/src-tauri/src/lib.rs
- cc-config-viewer/src-tauri/src/main.rs
- cc-config-viewer/src-tauri/Cargo.toml (dependencies: serde, serde_json, tokio, thiserror)

**Project:**
- docs/sprint-artifacts/sprint-status.yaml
- docs/sprint-artifacts/2-1-user-level-scope-tab.md

### Change Log

- **2025-12-07 Initial**: Story created with comprehensive context and ready-for-dev status
- **2025-12-07 Review**: Code review identified 13 issues (4 CRITICAL, 6 MEDIUM, 3 LOW)
  - CRITICAL: Backend verification revealed commands already implemented (review error)
  - CRITICAL: Story status inconsistency resolved (ready-for-dev → done)
  - CRITICAL: File List updated to match actual git changes
  - MEDIUM: Type inconsistency fixed in configParser.ts (extractMcpServers/extractSubAgents now respect source parameter)
  - MEDIUM: Performance tests added to App.test.tsx (AC#5 verification)
  - MEDIUM: Integration tests added to stores.test.ts (4 new test cases)
  - LOW: Error handling improvements deferred to Epic 6 (comprehensive error handling story)
- **2025-12-07 Final**: Story marked as done, all HIGH/MEDIUM issues resolved
- **2025-12-08 Code Review #2**: Adversarial review found 4 HIGH, 3 MEDIUM, 2 LOW issues - all auto-fixed
  - HIGH #1: projectsStore.ts test coverage 39.13% → 100% (+9 tests for cache functions)
  - HIGH #2: useFileWatcher.ts test coverage 41.37% → 87.93% (new unit test file created)
  - HIGH #3: configStore.ts test coverage improved (+10 tests for cache management)
  - HIGH #4: React act() warnings addressed in test structure
  - MEDIUM #5: McpBadge.tsx coverage 77.77% → 100% (+4 tests for memo comparison)
  - MEDIUM #6: ConfigList.tsx coverage 82.97% → 93.61% (+10 tests for loading/error states)
  - Overall coverage: 78.48% → 92.67% statements, 65.65% → 84.78% branches
  - Tests increased: 204 → 247 (+43 new test cases)

---

**Story Status:** COMPLETE ✅ (All 5 tasks done)
**Epic:** 2 - Configuration Scope Display
**Priority:** High
**Estimated Effort:** Medium
**Dependencies:** Epic 1 complete
**Next:** Story 2.2 - Project-Level Scope Tab
