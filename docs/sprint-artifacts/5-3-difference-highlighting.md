# Story 5.3: difference-highlighting

Status: ready-for-dev

---

## 📋 STORY HEADER

**Epic:** 5 - Cross-Project Configuration Comparison
**Story ID:** 5.3
**Story Key:** 5-3-difference-highlighting
**Priority:** High
**Dependencies:** Epic 5.2 (Side-by-Side Comparison View) - COMPLETE
**Business Value:** Enable developers to clearly see and understand differences between project configurations
**Developer Impact:** Foundation for advanced comparison features like filtering and health dashboard

---

## Story

As a developer,
I want to clearly see what's different between projects,
So that I can quickly identify unique configurations or conflicts.

## 📝 STORY REQUIREMENTS

### User Story Statement
**As a** developer working with multiple projects
**I want** to see clearly highlighted differences in the side-by-side comparison view
**So that** I can quickly identify what's unique to each project or where conflicts exist

### Detailed Acceptance Criteria (BDD Format)

**Scenario 1: Difference Highlighting**
- **Given** I am in comparison view viewing two projects side-by-side
- **When** I examine the capabilities in both panels
- **Then** I should see clear visual highlighting:
  - Blue highlighting for capabilities only in Project A
  - Green highlighting for capabilities only in Project B
  - Yellow highlighting for capabilities with different values
  - No highlighting for identical capabilities (matched)

**Scenario 2: Summary Badge**
- **Given** there are differences between the two projects
- **When** I view the comparison header
- **Then** I should see a summary badge:
  - Displays "X differences found" (e.g., "5 differences found")
  - Updates automatically as comparison changes
  - Clickable to filter view to show only differences

**Scenario 3: Filter Controls**
- **Given** there are both matching and differing capabilities
- **When** I want to focus on differences only
- **Then** I should be able to:
  - Toggle "Show only differences" filter
  - Show/hide each highlighting type (Blue/Green/Yellow)
  - Reset filter to show all capabilities
  - Filter state persists during comparison session

**Scenario 4: Difference Detection Algorithm**
- **Given** I have two projects with various capability configurations
- **When** the comparison engine calculates differences
- **Then** it should correctly identify:
  - Capabilities present in one project but not the other
  - Capabilities with different configuration values
  - Capabilities with identical values (no highlighting)
  - Handle nested JSON configurations with deep comparison

**Scenario 5: Performance Requirements**
- **Given** I have two projects with 100+ capabilities each
- **When** difference calculation is triggered
- **Then** it should complete within performance targets:
  - Difference calculation < 100ms (extending Epic 5.2's 0.05ms achievement)
  - Highlighting render < 200ms
  - Filter operations < 50ms
  - Memory usage < 30MB additional for highlighting data

### Technical Requirements

**Component Architecture:**
```typescript
interface DifferenceHighlighting {
  diffResults: DiffResult[]
  filters: {
    showOnlyDifferences: boolean
    showBlueOnly: boolean  // Only in A
    showGreenOnly: boolean // Only in B
    showYellowOnly: boolean // Different values
  }
  summary: {
    totalDifferences: number
    onlyInA: number
    onlyInB: number
    differentValues: number
  }
}

interface DiffResult {
  capabilityId: string
  leftValue?: Capability
  rightValue?: Capability
  status: 'match' | 'only-left' | 'only-right' | 'different'
  severity: 'low' | 'medium' | 'high'
  highlightClass: string // CSS class for coloring
}
```

**Performance Requirements:**
- Difference calculation: < 100ms (extending 5.2's 0.05ms performance)
- Highlighting render: < 200ms
- Filter operations: < 50ms
- Memory usage: < 30MB additional
- Real-time updates: < 100ms response

### Success Criteria
1. ✅ Visual difference highlighting with correct color coding (Blue/Green/Yellow)
2. ✅ Summary badge showing "X differences found"
3. ✅ Filter controls for show/hide differences
4. ✅ Accurate difference detection algorithm (builds on 5.2 comparisonEngine)
5. ✅ Performance benchmarks met
6. ✅ Integration with Epic 5.2 side-by-side comparison view
7. ✅ Testing coverage >80%
8. ✅ Accessibility (WCAG 2.1 AA) compliance

---

## ✅ TASKS/SUBTASKS

### Task 1: Rust Backend Enhancement - Extend comparison commands
**Priority:** High
**Status:** backlog
**AC:** Extend project_commands.rs with highlighting-specific utilities

#### Subtasks:
- [ ] 1.1: Add categorize_differences command to categorize diff results
- [ ] 1.2: Add calculate_summary_stats command for summary badge
- [ ] 1.3: Add filter_capabilities command for filter operations
- [ ] 1.4: Implement highlighting metadata in DiffResult struct
- [ ] 1.5: Write unit tests for highlighting calculations (80% coverage)

### Task 2: TypeScript Type Definitions - Extend comparison types
**Priority:** High
**Status:** backlog
**AC:** Add highlighting and filter types to comparison.ts

#### Subtasks:
- [ ] 2.1: Extend DiffResult interface with highlightClass and severity
- [ ] 2.2: Add DifferenceHighlighting interface with filters and summary
- [ ] 2.3: Add highlighting types to src/types/index.ts exports
- [ ] 2.4: Define highlightClass constants (bg-blue-100, etc.)

### Task 3: Zustand Store Extension - Add highlighting state to projectsStore
**Priority:** High
**Status:** backlog
**AC:** Extend projectsStore with highlighting and filter state

#### Subtasks:
- [ ] 3.1: Add highlighting interface to comparison state object
- [ ] 3.2: Implement setHighlightFilters action
- [ ] 3.3: Implement calculateSummaryStats action
- [ ] 3.4: Implement toggleDifferenceFilter action
- [ ] 3.5: Write tests for highlighting state management (80% coverage)

### Task 4: Highlighting Engine - Create highlightEngine.ts
**Priority:** High
**Status:** backlog
**AC:** Implement visual highlighting logic (extends comparisonEngine)

#### Subtasks:
- [ ] 4.1: Implement categorizeDifferences function (extends calculateDiff)
- [ ] 4.2: Implement calculateSummaryStats function
- [ ] 4.3: Assign highlight classes based on diff status
- [ ] 4.4: Optimize for performance (target <100ms)
- [ ] 4.5: Write unit tests (80% coverage)

### Task 5: React Components - Enhance existing comparison components
**Priority:** High
**Status:** backlog
**AC:** Add highlighting to ProjectComparison and ComparisonPanel

#### Subtasks:
- [ ] 5.1: Enhance ProjectComparison.tsx with DifferenceHighlight component
- [ ] 5.2: Create DifferenceHighlight.tsx for visual diff highlighting
- [ ] 5.3: Create FilterControls.tsx for show/hide differences
- [ ] 5.4: Create SummaryBadge.tsx for difference count
- [ ] 5.5: Apply CSS classes for Blue/Green/Yellow highlighting

### Task 6: Custom Hooks - Create highlighting and filtering hooks
**Priority:** High
**Status:** backlog
**AC:** Implement highlighting logic hooks

#### Subtasks:
- [ ] 6.1: Create useDifferenceHighlighting.ts hook
- [ ] 6.2: Create useHighlightFilter.ts hook
- [ ] 6.3: Create useSummaryStats.ts hook
- [ ] 6.4: Implement filter state persistence
- [ ] 6.5: Write hook tests (80% coverage)

### Task 7: Tauri Integration - Extend tauriApi.ts
**Priority:** High
**Status:** backlog
**AC:** Add highlighting command wrappers

#### Subtasks:
- [ ] 7.1: Add categorizeDifferences wrapper to tauriApi.ts
- [ ] 7.2: Add calculateSummaryStats wrapper to tauriApi.ts
- [ ] 7.3: Add filterCapabilites wrapper to tauriApi.ts
- [ ] 7.4: Update event listeners for highlighting updates
- [ ] 7.5: Test Tauri integration and error propagation

### Task 8: CSS Styling - Implement highlighting color schemes
**Priority:** Medium
**Status:** backlog
**AC:** Add highlighting CSS classes and themes

#### Subtasks:
- [ ] 8.1: Define Blue highlighting (only in A): bg-blue-100 text-blue-800
- [ ] 8.2: Define Green highlighting (only in B): bg-green-100 text-green-800
- [ ] 8.3: Define Yellow highlighting (different values): bg-yellow-100 text-yellow-800
- [ ] 8.4: Add transition animations for highlighting changes
- [ ] 8.5: Ensure WCAG 2.1 AA color contrast compliance

### Task 9: Component Testing - Write comprehensive tests
**Priority:** High
**Status:** backlog
**AC:** Achieve 80% test coverage for highlighting features

#### Subtasks:
- [ ] 9.1: Write DifferenceHighlight.test.tsx tests
- [ ] 9.2: Write FilterControls.test.tsx tests
- [ ] 9.3: Write SummaryBadge.test.tsx tests
- [ ] 9.4: Write useDifferenceHighlighting.test.ts tests
- [ ] 9.5: Run all tests, achieve 80%+ coverage

### Task 10: Performance Validation - Verify benchmarks
**Priority:** High
**Status:** backlog
**AC:** Meet all performance requirements

#### Subtasks:
- [ ] 10.1: Measure difference calculation time (<100ms)
- [ ] 10.2: Measure highlighting render time (<200ms)
- [ ] 10.3: Measure filter operations (<50ms)
- [ ] 10.4: Measure memory usage (<30MB additional)
- [ ] 10.5: Document performance test results

### Task 11: Integration Testing - End-to-end validation
**Priority:** High
**Status:** backlog
**AC:** Verify integration with Epic 5.2 and all acceptance criteria

#### Subtasks:
- [ ] 11.1: Test integration with ProjectComparison from Epic 5.2
- [ ] 11.2: Test complete user journey from comparison to filtering
- [ ] 11.3: Validate all 5 BDD acceptance criteria scenarios
- [ ] 11.4: Test accessibility (WCAG 2.1 AA) compliance
- [ ] 11.5: Test with large datasets (100+ capabilities)

### Task 12: Documentation - Update documentation and completion
**Priority:** Medium
**Status:** backlog
**AC:** Document implementation and mark story complete

#### Subtasks:
- [ ] 12.1: Update File List section with all modified/added files
- [ ] 12.2: Add completion notes to Dev Agent Record
- [ ] 12.3: Update Change Log with implementation summary
- [ ] 12.4: Mark Status: "ready-for-dev"
- [ ] 12.5: Update sprint-status.yaml to "drafted"

---

## 📝 DEV AGENT RECORD

### Implementation Strategy

**Primary Objective:** Build visual difference highlighting system that extends the side-by-side comparison view from Epic 5.2, providing clear visual cues for differences and filtering controls for focus.

**Key Implementation Phases:**
1. **Extend Epic 5.2 Foundation:** Build on completed comparisonEngine and ProjectComparison components
2. **Highlighting Engine:** Create highlightEngine.ts extending comparison algorithm
3. **Visual Components:** Add DifferenceHighlight, FilterControls, SummaryBadge components
4. **State Management:** Extend projectsStore with highlighting filters and summary state
5. **Performance:** Maintain and extend Epic 5.2's exceptional performance (0.05ms diff calculation)

### Cross-Story Intelligence

**From Epic 5.2 Learnings (Recent Completion - 2025-12-09):**
- ✅ **Side-by-side comparison complete** - ProjectComparison, ComparisonPanel, DifferenceHighlight components built
- ✅ **ComparisonEngine optimized** - Achieved 0.05ms for 100 capabilities (4000x faster than 200ms target)
- ✅ **projectsStore extended** - Functional setState patterns established with comparison state
- ✅ **Tauri integration pattern** - project_commands.rs extended with compare_projects, calculate_diff commands
- ✅ **Test coverage achieved** - 674 frontend tests passed, 29/29 Rust tests passed
- ✅ **Performance exceeded** - Memory usage 0.11MB (target: <50MB), CPU <5% during comparison

**Architectural Patterns Established (Epic 5.2):**
- Zustand functional state updates: `setState((prev) => ({...prev, comparison: {...}}))`
- Tauri event system: `comparison-updated` event pattern for real-time updates
- TypeScript interfaces: DiffResult, ComparisonView, Capability types defined
- Component organization: ProjectComparison.tsx with split-screen layout
- Test patterns: Same-directory test files with 80%+ coverage requirement
- Performance optimization: O(n) HashMap algorithm for diff calculation

**Files to Extend from Epic 5.2 (Reference for patterns):**
- src/lib/comparisonEngine.ts - EXTEND with highlighting logic
- src/stores/projectsStore.ts - EXTEND with highlighting state (from Epic 5.2 extension)
- src/components/ProjectComparison.tsx - ADD DifferenceHighlight component
- src-tauri/src/commands/project_commands.rs - EXTEND with highlighting commands
- src/types/comparison.ts - EXTEND with highlighting types

### Dev Agent Guardrails

⚠️ **CRITICAL REQUIREMENTS - DO NOT DEVIATE:**

#### 🔧 Technical Requirements

**MANDATORY Technology Stack:**
- **Tauri v2** - Rust backend with highlighting utilities (extends Epic 5.2)
- **React 18** - Frontend UI framework
- **TypeScript (strict mode)** - Type safety throughout
- **Zustand v4+** - State management (extend existing projectsStore)
- **shadcn/ui** - UI component library (extend Epic 5.2 installation)
  - Existing: Card, Badge, Button, Input, Tabs, Tooltip, ScrollArea, Separator
  - REQUIRED: No additional components needed - use existing shadcn/ui
- **Tailwind CSS** - Styling (v3+)

**MANDATORY Naming Conventions:**
- **Components:** PascalCase, e.g., `DifferenceHighlight.tsx`, `FilterControls.tsx`, `SummaryBadge.tsx`
- **Tauri Commands:** snake_case, e.g., `categorize_differences`, `calculate_summary_stats`
- **Zustand Stores:** camelCase + Store suffix, e.g., `useProjectsStore` (EXTEND existing)
- **TypeScript Interfaces:** PascalCase, no prefix/suffix
- **CSS Classes:** Tailwind utility classes, e.g., `bg-blue-100 text-blue-800`

**MANDATORY State Updates (Epic 5.2 pattern):**
```typescript
// ✅ CORRECT - Functional update extending comparison state
setState((prev) => ({
  ...prev,
  comparison: {
    ...prev.comparison,
    highlighting: {
      diffResults: categorizedDiffs,
      filters: newFilters,
      summary: calculatedStats
    }
  }
}))

// ❌ WRONG - Direct update (violates Epic 5.2 pattern)
setState({ ...state, highlighting: newHighlighting })
```

**MANDATORY Highlighting Algorithm (extends Epic 5.2):**
```typescript
// Extend existing comparisonEngine.ts calculateDiff function
function categorizeDifferences(diffResults: DiffResult[]): DiffResult[] {
  return diffResults.map(diff => ({
    ...diff,
    highlightClass: getHighlightClass(diff.status),
    severity: calculateSeverity(diff)
  }))
}

function getHighlightClass(status: string): string {
  switch (status) {
    case 'only-left': return 'bg-blue-100 text-blue-800'     // Only in A
    case 'only-right': return 'bg-green-100 text-green-800'  // Only in B
    case 'different': return 'bg-yellow-100 text-yellow-800' // Different values
    case 'match': return ''                                    // No highlighting
  }
}
```

---

#### 🏗️ Architecture Compliance

**FOLLOW STRICTLY from docs/architecture.md and Epic 5.2 implementation:**

**1. Project Structure Extension (Extending Epic 5.2 structure)**
```
src/
├── components/
│   ├── ui/                          # shadcn/ui components (DO NOT MODIFY)
│   ├── ProjectComparison.tsx        # FROM EPIC 5.2 - EXTEND with highlighting
│   ├── ComparisonPanel.tsx          # FROM EPIC 5.2 - reuse as-is
│   ├── DifferenceHighlight.tsx      # NEW - Visual highlighting
│   ├── FilterControls.tsx           # NEW - Filter toggle controls
│   ├── SummaryBadge.tsx             # NEW - Difference count badge
│   └── ProjectList.tsx              # FROM EPIC 5.1 - reuse
├── hooks/
│   ├── useProjectComparison.ts      # FROM EPIC 5.2 - extend if needed
│   ├── useScrollSync.ts             # FROM EPIC 5.2 - reuse
│   ├── useDifferenceHighlighting.ts # NEW - Highlighting logic
│   ├── useHighlightFilter.ts        # NEW - Filter operations
│   └── useSummaryStats.ts           # NEW - Summary calculations
├── stores/
│   ├── projectsStore.ts             # EXTEND from Epic 5.2
│   └── uiStore.ts                   # FROM Epic 5.1 - reuse
├── lib/
│   ├── comparisonEngine.ts          # EXTEND from Epic 5.2
│   ├── highlightEngine.ts           # NEW - Highlighting logic
│   ├── tauriApi.ts                  # EXTEND from Epic 5.2
│   ├── projectScanner.ts            # FROM Epic 5.1 - reuse
│   └── configParser.ts              # REUSE existing
└── types/
    ├── comparison.ts                # EXTEND from Epic 5.2
    ├── project.ts                   # FROM Epic 5.1
    └── index.ts                     # Reexport types

src-tauri/src/
├── commands/
│   ├── mod.rs                       # FROM Epic 5.2
│   └── project_commands.rs          # EXTEND from Epic 5.2
├── config/
│   ├── mod.rs                       # FROM Epic 5.1
│   ├── reader.rs                    # FROM Epic 5.1 - reuse
│   └── watcher.rs                   # FROM Epic 5.1 - reuse
└── types/
    └── mod.rs                       # FROM Epic 5.1
```

**2. Communication Patterns (Extending Epic 5.2 pattern)**

**Tauri Commands (snake_case) - EXTEND project_commands.rs:**
```rust
// src-tauri/src/commands/project_commands.rs
// FROM EPIC 5.2: compare_projects, calculate_diff
// NEW for Epic 5.3:
#[tauri::command]
async fn categorize_differences(
    diff_results: Vec<DiffResult>
) -> Result<Vec<DiffResult>, AppError>

#[tauri::command]
async fn calculate_summary_stats(
    diff_results: Vec<DiffResult>
) -> Result<SummaryStats, AppError>

#[tauri::command]
async fn filter_capabilities(
    capabilities: Vec<Capability>,
    filters: HighlightFilters
) -> Result<Vec<Capability>, AppError>
```

**Tauri Events (kebab-case) - EXTEND existing pattern:**
```typescript
// FROM EPIC 5.2: 'comparison-updated'
// NEW for Epic 5.3:
await listen('highlighting-updated', (event) => {
  // Update projectsStore highlighting state
  setState((prev) => ({
    ...prev,
    comparison: {
      ...prev.comparison,
      highlighting: { ...prev.comparison.highlighting, ...event.payload }
    }
  }))
});
```

**3. API Boundaries (Extending Epic 5.2 boundary)**

**project_commands.rs is the SINGLE boundary for all project operations:**
- FROM EPIC 5.2: list_projects, scan_projects, compare_projects, calculate_diff
- NEW: categorize_differences, calculate_summary_stats, filter_capabilities

**4. State Management (Extend Epic 5.2 projectsStore)**

```typescript
// src/stores/projectsStore.ts - EXTEND existing from Epic 5.2
interface ProjectsState {
  // FROM EPIC 5.1
  projects: DiscoveredProject[]
  activeProject: DiscoveredProject | null

  // FROM EPIC 5.2
  comparison: {
    leftProject: DiscoveredProject | null
    rightProject: DiscoveredProject | null
    isComparing: boolean
    diffResults: DiffResult[]
    comparisonMode: 'capabilities' | 'settings' | 'all'

    // NEW for Epic 5.3 - highlighting state
    highlighting: {
      diffResults: DiffResult[]  // Extended with highlightClass
      filters: HighlightFilters
      summary: SummaryStats
    }
  }

  // Actions
  setComparisonProjects: (left: DiscoveredProject, right: DiscoveredProject) => void
  calculateDiff: () => Promise<void>

  // NEW actions for Epic 5.3
  setHighlightFilters: (filters: Partial<HighlightFilters>) => void
  calculateSummaryStats: () => Promise<void>
  toggleDifferenceFilter: () => void
}
```

**5. Component Communication (Epic 5.2 pattern)**

**Component Props Interface:**
```typescript
// ProjectComparison.tsx - EXTEND from Epic 5.2
interface ProjectComparisonProps {
  leftProject: DiscoveredProject
  rightProject: DiscoveredProject
  // NEW props for highlighting
  highlighting?: DifferenceHighlighting
  onFilterChange?: (filters: HighlightFilters) => void
}

// DifferenceHighlight.tsx - NEW component
interface DifferenceHighlightProps {
  diffResult: DiffResult
  highlightClass: string
}

// FilterControls.tsx - NEW component
interface FilterControlsProps {
  filters: HighlightFilters
  summary: SummaryStats
  onFilterChange: (filters: HighlightFilters) => void
}
```

---

#### 📚 Library & Framework Requirements

**Version Requirements (from architecture analysis and Epic 5.2):**

1. **Tauri v2**
   - Extend filesystem API for highlighting metadata (from Epic 5.2)
   - Use comparison utilities from Epic 5.2
   - Extend tauri.conf.json permissions if needed (from Epic 5.2)
   - Required scope: `filesystem:scope` with path restrictions

2. **React 18**
   - Use concurrent features where appropriate (from Epic 5.2)
   - Implement proper useEffect cleanup for highlighting filters
   - Follow React 18 best practices from Epic 5.2

3. **TypeScript (strict mode)**
   - All files must be `.ts` or `.tsx`
   - No `any` types without explicit justification
   - Strict null checks enabled
   - Extend shared types between frontend and Rust (Epic 5.2 pattern)

4. **Zustand v4+**
   - Use functional setState: `setState((prev) => ({...}))`
   - EXTEND existing projectsStore (DO NOT create new store)
   - Subscribe to Tauri events for real-time highlighting updates

5. **shadcn/ui**
   - Epic 5.2 components: Card, Badge, Button, Input, Tabs, Tooltip, ScrollArea, Separator
   - No additional components required - use existing shadcn/ui components
   - Customize theme in tailwind.config.js (from Epic 5.2)

---

#### 📁 File Structure Requirements

**MANDATORY File Organization (Extending Epic 5.2):**

**Frontend (src/):**
```
src/
├── components/
│   ├── ui/                          # shadcn/ui - DO NOT MODIFY
│   ├── ProjectComparison.tsx        # EXTEND from Epic 5.2
│   ├── ComparisonPanel.tsx          # FROM Epic 5.2 - reuse as-is
│   ├── DifferenceHighlight.tsx      # NEW - Visual highlighting component
│   ├── FilterControls.tsx           # NEW - Filter toggle controls
│   ├── SummaryBadge.tsx             # NEW - Difference count badge
│   └── ProjectList.tsx              # FROM Epic 5.1 - reuse as-is
├── stores/
│   ├── projectsStore.ts             # EXTEND from Epic 5.2
│   └── uiStore.ts                   # FROM Epic 5.1 - reuse as-is
├── hooks/
│   ├── useProjectComparison.ts      # FROM Epic 5.2 - extend if needed
│   ├── useScrollSync.ts             # FROM Epic 5.2 - reuse as-is
│   ├── useDifferenceHighlighting.ts # NEW - Highlighting logic hook
│   ├── useHighlightFilter.ts        # NEW - Filter operations hook
│   └── useSummaryStats.ts           # NEW - Summary calculations hook
├── lib/
│   ├── comparisonEngine.ts          # EXTEND from Epic 5.2
│   ├── highlightEngine.ts           # NEW - Highlighting engine
│   ├── tauriApi.ts                  # EXTEND from Epic 5.2
│   ├── projectScanner.ts            # FROM Epic 5.1 - reuse as-is
│   └── configParser.ts              # REUSE existing
└── types/
    ├── comparison.ts                # EXTEND from Epic 5.2
    ├── project.ts                   # FROM Epic 5.1
    └── index.ts                     # Reexport all types
```

**Backend (src-tauri/src/):**
```
src-tauri/src/
├── commands/
│   ├── mod.rs                       # FROM Epic 5.2
│   └── project_commands.rs          # EXTEND from Epic 5.2
├── config/
│   ├── mod.rs                       # FROM Epic 5.1
│   ├── reader.rs                    # FROM Epic 5.1 - reuse as-is
│   └── watcher.rs                   # FROM Epic 5.1 - reuse as-is
└── types/
    └── mod.rs                       # FROM Epic 5.1
```

**Test Files (Same Directory as Source - Epic 5.2 pattern):**
```
src/lib/comparisonEngine.ts
src/lib/comparisonEngine.test.ts         # EXTEND with highlighting tests

src/lib/highlightEngine.ts               # NEW
src/lib/highlightEngine.test.ts          # NEW

src/hooks/useDifferenceHighlighting.ts   # NEW
src/hooks/useDifferenceHighlighting.test.ts # NEW

src-tauri/src/commands/project_commands.rs
# Add highlighting tests in same file (Epic 5.2 pattern)
```

---

#### 🧪 Testing Requirements

**MANDATORY Testing Standards (from docs/architecture.md#Testing Standards and Epic 5.2):**

**1. Testing Framework Setup**
- **Frontend:** Jest + Testing Library (already configured from Epic 5.2)
- **Backend:** Native Rust tests (cargo test)
- **Coverage:** Minimum 80% line coverage
- **Test Organization:** Same directory as source (Epic 5.2 pattern)

**2. Required Test Coverage**

**Zustand Store Tests (projectsStore.test.ts - EXTEND Epic 5.2 tests):**
```typescript
// FROM EPIC 5.2:
// Test comparison state management
// Test calculateDiff functionality
// Test functional state updates

// NEW for Epic 5.3:
// Test setHighlightFilters functionality
// Test calculateSummaryStats async operation
// Test toggleDifferenceFilter action
// Test highlighting state updates with functional setState
```

**Component Tests (NEW):**
```typescript
// DifferenceHighlight.test.tsx
// Test rendering with different highlight classes
// Test highlighting colors: Blue, Green, Yellow
// Test no highlighting for matched capabilities
// Test accessibility (ARIA labels for colors)

// FilterControls.test.tsx
// Test render filter toggles
// Test show only differences toggle
// Test individual filter toggles (Blue/Green/Yellow)
// Test summary badge display
// Test filter state persistence

// SummaryBadge.test.tsx
// Test rendering with "X differences found" format
// Test count updates when differences change
// Test click to filter only differences
// Test color-coded counts (only-in-A, only-in-B, different-values)
```

**HighlightEngine Tests (highlightEngine.test.ts - NEW):**
```typescript
// Test categorizeDifferences with various scenarios
// Test calculateSummaryStats accuracy
// Test getHighlightClass function
// Test calculateSeverity function
// Test edge cases (empty results, null values)
```

**Hook Tests (NEW):**
```typescript
// useDifferenceHighlighting.test.ts
// Test highlighting initialization
// Test filter state management
// Test summary stats calculation

// useHighlightFilter.test.ts
// Test filter toggle operations
// Test filter combinations
// Test error handling
```

**Rust Backend Tests (project_commands.rs - EXTEND Epic 5.2):**
```rust
#[cfg(test)]
mod tests {
    // FROM EPIC 5.2:
    // Test compare_projects command
    // Test calculate_diff command

    // NEW for Epic 5.3:
    // Test categorize_differences command
    // Test calculate_summary_stats command
    // Test filter_capabilities command
    // Test highlighting with large datasets
}
```

**3. Performance Testing (extending Epic 5.2 benchmarks)**
- Difference categorization: < 100ms (build on 5.2's 0.05ms)
- Highlighting render: < 200ms
- Filter operations: < 50ms
- Memory usage: < 30MB additional for highlighting

**4. Integration Testing (Epic 5.2 pattern)**
- Test integration with Epic 5.2 ProjectComparison component
- Test Tauri command integration (categorize_differences)
- Test state management integration (projectsStore highlighting state)
- Test error handling propagation
- Test with Epic 5.2's 100+ capability datasets

**5. Accessibility Testing (Epic 5.2 standard)**
- WCAG 2.1 AA compliance (maintain Epic 5.2 standard)
- Color contrast for highlighting (Blue, Green, Yellow)
- Screen reader support for difference indicators
- Keyboard navigation in filter controls
- Summary badge announcement

---

## 📊 ARCHITECTURE INTELLIGENCE

### Technical Stack (from architecture analysis)
- **Tauri v2** - Rust backend with highlighting utilities (extends Epic 5.2)
- **React 18** - Frontend UI framework
- **TypeScript (strict mode)** - Type safety throughout
- **Zustand v4+** - State management (extend existing projectsStore from Epic 5.2)
- **shadcn/ui** - UI component library (extend Epic 5.2 installation)
- **Tailwind CSS** - Styling with custom theme

### Code Structure Patterns (Epic 5.2 + extensions)
- **Frontend Components:** PascalCase, colocated tests, extend Epic 5.2 components
- **Backend Commands:** snake_case in project_commands.rs (extend Epic 5.2)
- **Type Definitions:** Shared between frontend and Rust (extend Epic 5.2)
- **State Management:** Functional setState pattern (Epic 5.2 standard)
- **API Integration:** Tauri commands with error handling (Epic 5.2 pattern)

### Project Structure (Epic 5.2 + extensions)
```
src/
├── components/  # UI components with shadcn/ui (extend Epic 5.2)
├── hooks/       # Custom hooks for logic reuse (add highlighting hooks)
├── stores/      # Zustand stores (extend projectsStore from Epic 5.2)
├── lib/         # Utilities (extend comparisonEngine, add highlightEngine)
└── types/       # TypeScript definitions (extend comparison.ts)

src-tauri/src/
├── commands/    # Tauri commands (extend project_commands.rs)
├── config/      # File system operations (reuse from Epic 5.1)
└── types/       # Rust type definitions
```

### Communication Patterns (Epic 5.2 extension)
- **Tauri Commands:** Async Rust functions (extend Epic 5.2 compare_projects, calculate_diff)
- **Tauri Events:** Real-time updates (extend 'comparison-updated', add 'highlighting-updated')
- **Frontend State:** Zustand with functional updates (extend comparison state)
- **Component Props:** Type-safe interfaces (extend ProjectComparisonProps)

### Testing Standards (Epic 5.2 standard)
- **Frontend:** Jest + Testing Library (configured)
- **Backend:** Native Rust cargo test
- **Coverage:** 80% minimum (Epic 5.2 standard)
- **Organization:** Tests colocated with source (Epic 5.2 pattern)

### Integration Points
- **Epic 5.2:** ProjectComparison and comparisonEngine integration
- **Epic 5.1:** ProjectList and projectsStore patterns
- **Epic 3:** Source identification for config tracking
- **Epic 4:** Capability panel integration patterns

---

## 🚀 Latest Technical Information

### Architecture-Specified Versions (Epic 5.2 + Current)
- **Tauri v2:** Latest stable with filesystem and comparison APIs (Epic 5.2)
- **React 18:** Latest with concurrent features support
- **TypeScript:** Strict mode (version per project config)
- **Zustand v4+:** Latest with middleware support
- **shadcn/ui:** Latest stable with Radix UI + Tailwind (Epic 5.2)
- **Tailwind CSS v3+:** Latest with shadcn/ui preset

### Key Implementation Notes (Epic 5.2 + Architecture)
1. **Comparison Foundation:** Epic 5.2 already implemented comparisonEngine - extend it
2. **Performance Target:** Extend Epic 5.2's 0.05ms benchmark for difference calculation
3. **Color Coding:** Blue (only in A), Green (only in B), Yellow (different values)
4. **State Extension:** Extend projectsStore comparison state with highlighting
5. **Component Enhancement:** Enhance ProjectComparison with DifferenceHighlight component

### Git Intelligence Summary
**Recent Commits (Epic 5.2 Completion - 2025-12-09):**
- `bbe3240 feat(ProjectComparison): Implement project comparison functionality`
- `1032d04 feat(ProjectDiscovery): Enhance project detection and listing functionality`
- `f575620 feat(ProjectDiscovery): Enhance project discovery with new methods and error handling`

**Established Patterns from Epic 5.2:**
- O(n) HashMap-based diff calculation (0.05ms for 100 capabilities)
- Functional Zustand state updates with comparison state extension
- Tauri command wrapper pattern (tauriApi.ts extension)
- Component test patterns (80%+ coverage, colocated tests)
- Split-screen comparison layout with synchronized scrolling

**Learning Points for Story 5-3:**
- ✅ Build on Epic 5.2's exceptional performance (0.05ms diff calc)
- ✅ Extend projectsStore comparison state instead of creating new store
- ✅ Enhance existing ProjectComparison component, don't replace
- ✅ Follow Epic 5.2 test organization and coverage standards
- ✅ Maintain color consistency with Epic 3 source indicators

### Migration Considerations
- **Extend Epic 5.2:** Build on completed side-by-side comparison foundation
- **No Breaking Changes:** Maintain compatibility with Epic 5.2 implementation
- **Gradual Enhancement:** Add highlighting features incrementally
- **Pattern Consistency:** Follow all established Epic 5.2 patterns

---

## 📚 Project Context Reference

**Architecture Document:** [docs/architecture.md](docs/architecture.md)
- Full project structure defined with 70+ files
- Component boundaries established
- Integration points mapped

**Epic 5.2 Reference:** [docs/sprint-artifacts/5-2-side-by-side-comparison-view.md](docs/sprint-artifacts/5-2-side-by-side-comparison-view.md)
- Completed implementation with 0.05ms diff calculation
- Established comparison patterns to extend
- Reference components and stores for integration

**Epic 5 Context:** [docs/epics.md#Epic-5](docs/epics.md#Epic-5)
- Complete Epic 5 breakdown with stories 5.1-5.5
- Story 5-3 detailed requirements and acceptance criteria
- Technical implementation guidance

**PRD Reference:** [docs/prd.md](docs/prd.md)
- FR21-25: Cross-Project Configuration Comparison
- User journey: "李明 - 快速掌握项目配置"
- Innovation areas: unified capability panel, spatial metaphor

**Sprint Status:** [docs/sprint-artifacts/sprint-status.yaml](docs/sprint-artifacts/sprint-status.yaml)
- Epic 5 status: in-progress
- Story 5-1 status: done
- Story 5-2 status: done
- Story 5-3 status: ready-for-dev (this story)

---

### 🎯 Story Completion Status

**Implementation Status:** ✅ READY FOR DEV

**Story Context Quality:** ULTIMATE
- ✅ Complete epic analysis with cross-story context from Epic 5.2
- ✅ Detailed BDD acceptance criteria (5 scenarios)
- ✅ Technical requirements with performance benchmarks (extends 5.2's 0.05ms)
- ✅ Architecture compliance with strict guardrails from Epic 5.2
- ✅ Library/framework version requirements
- ✅ File structure and naming conventions (extending Epic 5.2)
- ✅ Testing standards and coverage requirements (Epic 5.2 standard: 80%+)
- ✅ Integration patterns from Epic 5.2 completion
- ✅ Git intelligence and performance learnings

**Developer Readiness:**
This story provides comprehensive implementation guidance with:
- Detailed guardrails preventing common LLM mistakes
- Clear extension strategy from Epic 5.2 comparison foundation
- Established architectural decisions and patterns
- Performance benchmarks building on Epic 5.2's exceptional results
- Testing strategy with 80% coverage requirement (Epic 5.2 standard)
- Color coding system aligned with Epic 3 source indicators

**Next Steps:**
1. Review this comprehensive story context
2. Optionally run `*validate-create-story` for quality competition
3. Execute `dev-story` for implementation
4. Run `code-review` when complete