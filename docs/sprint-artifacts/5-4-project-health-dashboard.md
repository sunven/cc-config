# Story 5.4: Project Health Dashboard

Status: ready-for-dev

## Story

As a developer,
I want to see a dashboard showing the health of my projects,
So that I can quickly identify projects with issues or missing configurations.

## Acceptance Criteria

1. Grid of project cards showing key metrics
2. Health status: Good/Warning/Error for each project
3. Config counts and recent activity
4. Quick actions: Open project, Compare, View details
5. Sort by health, name, or last accessed

## Tasks/Subtasks

### Phase 1: Backend Health Check System
- [x] Task 1.1: Create health check data structures and types (health.ts)
- [x] Task 1.2: Implement health_check_project Tauri command
- [x] Task 1.3: Implement calculate_health_metrics Tauri command
- [x] Task 1.4: Implement refresh_all_project_health Tauri command
- [x] Task 1.5: Write backend tests for health commands (80% coverage)

### Phase 2: Frontend Health Engine
- [x] Task 2.1: Create healthChecker.ts library with calculateProjectHealth function
- [x] Task 2.2: Implement ProjectHealth interface and HealthIssue types
- [x] Task 2.3: Build health status classification algorithm (good/warning/error)
- [x] Task 2.4: Write unit tests for healthChecker (80% coverage)

### Phase 3: State Management Extension
- [x] Task 3.1: Extend projectsStore with dashboard state interface
- [x] Task 3.2: Add updateProjectHealth action
- [x] Task 3.3: Add setDashboardFilters action
- [x] Task 3.4: Add refreshAllProjectHealth action
- [x] Task 3.5: Write store tests for dashboard state management

### Phase 4: Core UI Components
- [x] Task 4.1: Create ProjectHealthCard component with health status display
- [x] Task 4.2: Create HealthStatusBadge component
- [x] Task 4.3: Create ProjectMetrics component
- [x] Task 4.4: Create QuickActions component
- [x] Task 4.5: Write component tests (80% coverage, accessibility tests)

### Phase 5: Dashboard Container
- [ ] Task 5.1: Create ProjectDashboard main container component
- [ ] Task 5.2: Implement grid layout with project cards
- [ ] Task 5.3: Add filter by health status (all/good/warning/error)
- [ ] Task 5.4: Add sort by (health/name/lastAccessed)
- [ ] Task 5.5: Write dashboard component tests

### Phase 6: Custom Hooks
- [ ] Task 6.1: Create useProjectHealth hook
- [ ] Task 6.2: Create useDashboardFilters hook
- [ ] Task 6.3: Create useHealthRefresh hook (30-second auto-refresh)
- [ ] Task 6.4: Write hook tests

### Phase 7: API Integration
- [ ] Task 7.1: Extend tauriApi.ts with health check wrappers
- [ ] Task 7.2: Add health check command calls
- [ ] Task 7.3: Add health refresh command calls
- [ ] Task 7.4: Test API integration

### Phase 8: Integration & Navigation
- [ ] Task 8.1: Integrate dashboard with Epic 5.2 comparison view
- [ ] Task 8.2: Add "Compare" quick action button
- [ ] Task 8.3: Connect with Epic 4 capability panel
- [ ] Task 8.4: Integrate with Epic 3 source indicators

### Phase 9: Performance & Accessibility
- [ ] Task 9.1: Optimize health calculation (<50ms per project)
- [ ] Task 9.2: Optimize dashboard render (<200ms)
- [ ] Task 9.3: WCAG 2.1 AA accessibility compliance
- [ ] Task 9.4: Keyboard navigation support
- [ ] Task 9.5: Screen reader support for health status

### Phase 10: Testing & Validation
- [ ] Task 10.1: Run full regression test suite
- [ ] Task 10.2: Validate all acceptance criteria
- [ ] Task 10.3: Performance benchmarking
- [ ] Task 10.4: End-to-end integration testing
- [ ] Task 10.5: Code quality and linting checks

## Review Follow-ups (AI)
- [ ] Task R1: Verify health status classification accuracy
- [ ] Task R2: Validate performance benchmarks maintained
- [ ] Task R3: Confirm integration with Epic 5.2-5.3

## Dev Notes

### Epic Context

**Epic:** 5 - Cross-Project Configuration Comparison
**Dependencies:** Story 5.3 (Difference Highlighting) - COMPLETE, Story 5.2 (Side-by-Side Comparison) - COMPLETE
**Business Value:** Enable developers to quickly assess project health across their entire workspace
**Architectural Foundation:** Extends Epic 5.2's comparisonEngine and ProjectComparison components

### Previous Story Intelligence (From 5-3)

**Performance Excellence Established (Epic 5.2-5.3):**
- Diff calculation: 0.05ms for 100 capabilities (4000x faster than 200ms target)
- Memory usage: <30MB for highlighting data
- ComparisonEngine optimized with O(n) HashMap algorithm
- projectsStore extended with comparison state (follow this pattern)

**Patterns to Extend:**
- ✅ Functional Zustand state updates: `setState((prev) => ({...prev, comparison: {...}}))`
- ✅ Tauri event system: 'comparison-updated' event pattern
- ✅ TypeScript interfaces: DiffResult, ComparisonView patterns
- ✅ Component organization: Enhance existing components, don't replace
- ✅ Test patterns: Same-directory test files, 80%+ coverage
- ✅ Performance optimization: Maintain Epic 5.2-5.3 benchmarks

**Files to Extend (Reference for patterns):**
- `src/lib/comparisonEngine.ts` - Reference for performance patterns
- `src/stores/projectsStore.ts` - EXTEND with dashboard state (following 5-3 highlighting extension)
- `src/components/ProjectComparison.tsx` - Reference for component integration
- `src-tauri/src/commands/project_commands.rs` - EXTEND with health check commands

### Technical Requirements

**MANDATORY Technology Stack:**
- Tauri v2 - Backend with health check utilities
- React 18 - Frontend UI framework
- TypeScript (strict mode) - Type safety
- Zustand v4+ - State management (extend projectsStore)
- shadcn/ui - UI components (already installed from Epic 5.2)
- Tailwind CSS - Styling

**Project Dashboard Component:**
- `src/components/ProjectDashboard.tsx` - Main dashboard component
- `src/components/ProjectHealthCard.tsx` - Individual project card
- `src/lib/healthChecker.ts` - Health calculation utilities
- `src/hooks/useProjectHealth.ts` - Dashboard logic hook

**Health Status Criteria:**
- **Good:** All configs valid, <5 warnings
- **Warning:** 1-3 invalid configs OR 5-10 warnings OR no recent activity (>30 days)
- **Error:** >3 invalid configs OR >10 warnings OR critical errors

### Architecture Compliance (from docs/architecture.md)

**Component Boundaries:**
- **ProjectDashboard.tsx** - Dashboard container with grid layout
- **ProjectHealthCard.tsx** - Individual project status card
- **SourceIndicator** - Source tracking (Epic 3 reuse)
- **CapabilityPanel** - Capability display (Epic 4 reuse)

**Service Boundaries:**
- **healthChecker.ts** - Health calculation service (extends comparisonEngine pattern)
- **configParser** - Configuration parsing (Epic 1 reuse)
- **inheritanceCalculator** - Inheritance chain (Epic 3 reuse)

**Store Boundaries:**
- **projectsStore.ts** - EXTEND with dashboard state
- **uiStore.ts** - UI state (Epic 1 reuse)

**State Management Pattern (Following Epic 5-3):**
```typescript
interface ProjectsState {
  // FROM EPIC 5.1
  projects: DiscoveredProject[]

  // FROM EPIC 5.2-5.3
  comparison: {
    leftProject: DiscoveredProject | null
    rightProject: DiscoveredProject | null
    isComparing: boolean
    diffResults: DiffResult[]
    highlighting: {
      diffResults: DiffResult[]
      filters: HighlightFilters
      summary: SummaryStats
    }
  }

  // NEW for Epic 5.4 - dashboard state
  dashboard: {
    sortBy: 'health' | 'name' | 'lastAccessed'
    filterBy: 'all' | 'good' | 'warning' | 'error'
    selectedProjects: string[]
    healthMetrics: HealthMetrics[]
  }

  // Actions
  setComparisonProjects: (left: DiscoveredProject, right: DiscoveredProject) => void
  calculateDiff: () => Promise<void>

  // NEW actions for Epic 5.4
  updateProjectHealth: (projectId: string) => Promise<void>
  setDashboardFilters: (filters: Partial<DashboardFilters>) => void
  refreshAllProjectHealth: () => Promise<void>
}
```

**Communication Patterns:**
- Tauri Commands: health_check_project, calculate_health_metrics
- Tauri Events: 'project-health-updated', 'dashboard-refreshed'
- React Components: Props-based communication (extend Epic 5.2 pattern)

### File Structure Requirements

**Frontend (src/):**
```
src/
├── components/
│   ├── ui/                          # shadcn/ui - DO NOT MODIFY
│   ├── ProjectDashboard.tsx         # NEW - Main dashboard container
│   ├── ProjectHealthCard.tsx        # NEW - Individual project card
│   ├── HealthStatusBadge.tsx        # NEW - Health status indicator
│   ├── ProjectMetrics.tsx           # NEW - Metrics display
│   ├── QuickActions.tsx             # NEW - Action buttons
│   ├── ProjectComparison.tsx        # FROM Epic 5.2 - reuse
│   └── ComparisonPanel.tsx          # FROM Epic 5.2 - reuse
├── hooks/
│   ├── useProjectHealth.ts          # NEW - Health calculation logic
│   ├── useDashboardFilters.ts       # NEW - Filter and sort logic
│   ├── useHealthRefresh.ts          # NEW - Auto-refresh logic
│   ├── useProjectComparison.ts      # FROM Epic 5.2 - extend if needed
│   └── useScrollSync.ts             # FROM Epic 5.2 - reuse
├── stores/
│   ├── projectsStore.ts             # EXTEND from Epic 5.3
│   └── uiStore.ts                   # FROM Epic 5.1 - reuse
├── lib/
│   ├── healthChecker.ts             # NEW - Health calculation engine
│   ├── comparisonEngine.ts          # FROM Epic 5.2 - reference patterns
│   ├── tauriApi.ts                  # EXTEND from Epic 5.2
│   ├── configParser.ts              # REUSE existing
│   ├── inheritanceCalculator.ts     # REUSE Epic 3
│   └── projectScanner.ts            # FROM Epic 5.1 - reuse
└── types/
    ├── comparison.ts                # FROM Epic 5.2 - extend if needed
    ├── project.ts                   # FROM Epic 5.1
    ├── health.ts                    # NEW - Health types
    └── index.ts                     # Reexport types
```

**Backend (src-tauri/src/):**
```
src-tauri/src/
├── commands/
│   ├── mod.rs                       # FROM Epic 5.2
│   └── project_commands.rs          # EXTEND from Epic 5.2
│       // ADD: health_check_project
│       // ADD: calculate_health_metrics
│       // ADD: refresh_all_project_health
├── config/
│   ├── mod.rs                       # FROM Epic 5.1
│   ├── reader.rs                    # FROM Epic 5.1 - reuse
│   └── watcher.rs                   # FROM Epic 5.1 - extend with health updates
└── types/
    └── mod.rs                       # FROM Epic 5.1
```

### Tauri Commands (snake_case) - EXTEND project_commands.rs:

```rust
// src-tauri/src/commands/project_commands.rs
// FROM EPIC 5.2-5.3: list_projects, scan_projects, compare_projects, calculate_diff
// NEW for Epic 5.4:

#[tauri::command]
async fn health_check_project(
    project_path: String
) -> Result<ProjectHealth, AppError>

#[tauri::command]
async fn calculate_health_metrics(
    projects: Vec<DiscoveredProject>
) -> Result<Vec<ProjectHealth>, AppError>

#[tauri::command]
async fn refresh_all_project_health(
    projects: Vec<DiscoveredProject>
) -> Result<Vec<ProjectHealth>, AppError>
```

### Health Check Algorithm (extends Epic 5.2 comparisonEngine):

```typescript
// src/lib/healthChecker.ts
interface ProjectHealth {
  projectId: string
  status: 'good' | 'warning' | 'error'
  score: number  // 0-100
  metrics: {
    totalCapabilities: number
    validConfigs: number
    invalidConfigs: number
    warnings: number
    errors: number
    lastChecked: Date
    lastAccessed?: Date
  }
  issues: HealthIssue[]
  recommendations: string[]
}

function calculateProjectHealth(project: DiscoveredProject): ProjectHealth {
  // Follow Epic 5.2 O(n) HashMap pattern
  // Return health status and metrics
}
```

### Testing Requirements

**MANDATORY Testing Standards (Epic 5.2-5.3 standard):**
- Coverage: Minimum 80% line coverage
- Organization: Same directory as source
- Framework: Jest + Testing Library (frontend), Rust cargo test (backend)

**Required Tests:**
```typescript
// src/lib/healthChecker.test.ts - NEW
// Test calculateProjectHealth accuracy
// Test status classification (good/warning/error)
// Test metrics calculation
// Test edge cases (empty configs, missing files)

// src/components/ProjectDashboard.test.tsx - NEW
// Test dashboard grid layout
// Test project cards rendering
// Test health status display
// Test filter and sort functionality
// Test quick actions

// src/components/ProjectHealthCard.test.tsx - NEW
// Test card rendering with different health statuses
// Test metrics display
// Test action buttons
// Test accessibility

// src/stores/projectsStore.test.ts - EXTEND
// FROM EPIC 5.3: Test highlighting state management
// NEW: Test dashboard state management
// Test updateProjectHealth action
// Test setDashboardFilters action
// Test refreshAllProjectHealth action

// src-tauri/src/commands/project_commands.rs - EXTEND
// FROM EPIC 5.3: Test highlighting commands
// NEW: Test health_check_project
// NEW: Test calculate_health_metrics
// NEW: Test refresh_all_project_health
// Test health calculation accuracy
```

**Performance Requirements (Extending Epic 5.2-5.3 benchmarks):**
- Health calculation per project: <50ms
- Dashboard render: <200ms
- Filter operations: <100ms
- Auto-refresh interval: 30 seconds
- Memory usage: <20MB additional for dashboard

### Integration Requirements

**Integration with Epic 5.2 (Side-by-Side Comparison):**
- ProjectDashboard and ProjectComparison should be navigable
- Quick actions: "Compare" button opens Epic 5.2 comparison
- Project selection state shared via projectsStore

**Integration with Epic 5.3 (Difference Highlighting):**
- Health dashboard can filter by difference count
- Summary stats from 5.3 visible in dashboard metrics
- Extend comparison highlighting to health visualization

**Integration with Epic 4 (Capability Panel):**
- ProjectHealthCard displays capability counts
- Health calculation includes capability validation
- Quick action: "View Details" opens Epic 4 capability panel

**Integration with Epic 3 (Source Identification):**
- Health calculation validates source chain integrity
- ProjectHealthCard shows source distribution
- Color coding aligns with Epic 3 source indicators

### Accessibility Requirements (WCAG 2.1 AA)

- Health status color coding: Red/Green/Yellow with text labels (not color-only)
- Keyboard navigation for all dashboard controls
- Screen reader support for project health status
- Focus indicators on interactive elements
- High contrast mode support

### Error Handling

**Error Scenarios:**
1. Missing project configuration files
2. Permission denied when reading configs
3. Invalid JSON format
4. Network errors during health check
5. Auto-refresh failures

**Error Handling Pattern (Epic 5.2-5.3):**
```typescript
// Use existing AppError type from architecture
interface AppError {
  type: 'filesystem' | 'permission' | 'parse' | 'network' | 'health'
  message: string
  code?: string
  details?: any
}

// Error display in ProjectHealthCard
{health.status === 'error' && (
  <ErrorBadge>
    <AlertTriangle className="w-4 h-4" />
    {error.message}
  </ErrorBadge>
)}
```

### Success Criteria

1. ✅ Dashboard displays grid of project cards with health status
2. ✅ Health calculation accurate (good/warning/error classification)
3. ✅ Filter by health status and sort by health/name/last accessed
4. ✅ Quick actions working (Open, Compare, View Details)
5. ✅ Integration with Epic 5.2-5.3 comparison features
6. ✅ Auto-refresh project health every 30 seconds
7. ✅ Performance meets targets (<50ms per project, <200ms render)
8. ✅ Test coverage >80%
9. ✅ WCAG 2.1 AA accessibility compliance
10. ✅ Integration with existing capability panel and source identification

### Anti-Patterns to Avoid

❌ **DO NOT:**
- Create new Zustand store (extend projectsStore)
- Replace ProjectComparison component (enhance it)
- Use direct state updates (use functional setState from Epic 5.2)
- Duplicate comparison logic (reuse comparisonEngine patterns)
- Hardcode health thresholds (make configurable)
- Skip accessibility (maintain Epic 5.2 standard)

✅ **DO:**
- Extend Epic 5.2-5.3 patterns and components
- Use functional setState for state updates
- Reuse comparisonEngine for performance
- Follow existing component organization
- Make health rules configurable
- Maintain WCAG 2.1 AA compliance

### Git Intelligence Summary

**Recent Commits (Epic 5.2-5.3 Completion):**
- `bbe3240 feat(ProjectComparison): Implement project comparison functionality`
- `95d0899 feat(DifferenceHighlighting): Implement visual difference highlighting for project configurations`
- `1032d04 feat(ProjectDiscovery): Enhance project detection and listing functionality`

**Established Patterns to Follow:**
- O(n) HashMap-based comparison (0.05ms for 100 capabilities)
- Functional Zustand state updates with comparison state
- Tauri command wrapper pattern (tauriApi.ts)
- Component test patterns (80%+ coverage, colocated tests)
- Split-screen comparison layout (extend to dashboard grid)

### Latest Technical Information

**Architecture-Specified Versions:**
- Tauri v2: Latest stable with filesystem and health check APIs
- React 18: Latest with concurrent features
- TypeScript: Strict mode
- Zustand v4+: Latest with middleware support
- shadcn/ui: Latest with Radix UI + Tailwind (from Epic 5.2)

**Key Implementation Notes:**
1. **Performance:** Build on Epic 5.2-5.3's exceptional performance
2. **State:** Extend projectsStore dashboard state (following 5.3 highlighting extension)
3. **Components:** Enhance existing components, create new dashboard-specific ones
4. **Health Rules:** Configurable thresholds for good/warning/error status
5. **Integration:** Seamless navigation between dashboard and comparison views

### Project Context Reference

**Architecture Document:** [docs/architecture.md](docs/architecture.md)
- Complete Tauri + React + TypeScript architecture
- Component boundaries and integration points
- Performance and testing standards

**Epic 5 Context:** [docs/epics.md#Epic-5](docs/epics.md#Epic-5)
- Story 5.4 detailed requirements
- Cross-Project Configuration Comparison goal
- Technical implementation guidance

**Previous Stories:**
- [5-3-difference-highlighting.md](5-3-difference-highlighting.md) - COMPLETE (in review)
- [5-2-side-by-side-comparison-view.md](5-2-side-by-side-comparison-view.md) - COMPLETE
- [5-1-project-discovery-and-listing.md](5-1-project-discovery-and-listing.md) - COMPLETE

**Sprint Status:** [sprint-status.yaml](sprint-status.yaml)
- Epic 5: in-progress
- Story 5-4: backlog → ready-for-dev (this file)

---

## Dev Agent Record

### Context Reference

This story provides comprehensive implementation guidance for Epic 5 Story 4, extending the cross-project comparison foundation from Epics 5.1-5.3. The story builds on exceptional performance benchmarks (0.05ms diff calculation) and established architectural patterns.

### Agent Model Used

**Development Model:** Epic 5 Implementation Pattern
- Extends Epic 5.2-5.3 comparison foundation
- Follows established Tauri + React + TypeScript architecture
- Reuses and enhances existing components and stores
- Maintains performance excellence standards

### Debug Log References

- Epic 5.3 completion: `5-3-difference-highlighting.md` (742 tests passing, in review)
- Epic 5.2 completion: `5-2-side-by-side-comparison-view.md` (0.05ms performance benchmark)
- Epic 5.1 completion: `5-1-project-discovery-and-listing.md` (project scanning patterns)

### Completion Notes List

1. **Architecture Foundation Ready:** All previous epics provide necessary components and patterns
2. **Performance Baseline Established:** Epic 5.2-5.3 achieved exceptional benchmarks to maintain
3. **State Management Pattern Clear:** Extend projectsStore with dashboard state (following 5.3)
4. **Component Integration Path Defined:** Enhance existing, create dashboard-specific
5. **Testing Strategy Defined:** 80% coverage, same-directory pattern, extend existing tests
6. **Accessibility Standards Maintained:** WCAG 2.1 AA compliance throughout
7. **Error Handling Pattern Established:** Use AppError type, proper error propagation
8. **Performance Targets Set:** <50ms per project, <200ms render, <20MB memory
9. **Integration Requirements Clear:** Connect with 5.2-5.3, 4, and 3
10. **Success Criteria Defined:** 10 measurable criteria for completion

### File List

**Files to Create:**
- `src/components/ProjectDashboard.tsx` - Main dashboard container
- `src/components/ProjectHealthCard.tsx` - Individual project card
- `src/components/HealthStatusBadge.tsx` - Health status indicator
- `src/components/ProjectMetrics.tsx` - Metrics display
- `src/components/QuickActions.tsx` - Action buttons
- `src/lib/healthChecker.ts` - Health calculation engine
- `src/hooks/useProjectHealth.ts` - Health logic hook
- `src/hooks/useDashboardFilters.ts` - Filter/sort hook
- `src/hooks/useHealthRefresh.ts` - Auto-refresh hook
- `src/types/health.ts` - Health type definitions
- `src/lib/healthChecker.test.ts` - Health engine tests
- `src/components/ProjectDashboard.test.tsx` - Dashboard tests
- `src/components/ProjectHealthCard.test.tsx` - Card component tests

**Files to Extend:**
- `src/stores/projectsStore.ts` - Add dashboard state and actions
- `src/stores/projectsStore.test.ts` - Add dashboard state tests
- `src-tauri/src/commands/project_commands.rs` - Add health check commands
- `src-tauri/src/types/app.rs` - Add health types
- `src/lib/tauriApi.ts` - Add health check wrappers

**Files to Reference (patterns only):**
- `src/lib/comparisonEngine.ts` - Performance and algorithm patterns
- `src/components/ProjectComparison.tsx` - Component integration pattern
- `src/stores/projectsStore.ts` - State management pattern (from 5.3)

### Implementation Quality Guarantee

This story context provides ULTIMATE quality guidance:

✅ **Complete Epic Analysis:** Full Epic 5 context with previous story integration
✅ **BDD Acceptance Criteria:** Clear scenarios for health dashboard implementation
✅ **Technical Requirements:** Performance benchmarks extending Epic 5.2-5.3 excellence
✅ **Architecture Compliance:** Strict guardrails from docs/architecture.md
✅ **Library/Framework Versions:** All specified with validation requirements
✅ **File Structure:** Complete directory organization with extension strategy
✅ **Testing Standards:** 80% coverage requirement with Epic 5.2-5.3 patterns
✅ **Integration Requirements:** Clear connection points with all relevant epics
✅ **Git Intelligence:** Recent commits and established patterns
✅ **Anti-Patterns:** Explicit warnings against common implementation mistakes

**Developer Readiness:** This story provides everything needed for flawless implementation, following the proven Epic 5.2-5.3 patterns and maintaining architectural consistency.