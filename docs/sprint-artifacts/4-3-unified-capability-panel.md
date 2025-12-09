# Story 4.3: Unified Capability Panel

Status: Ready for Review

## Story

As a developer working with Claude Code configuration,
I want to see MCP servers and Sub Agents in a single unified view,
So that I don't have to switch between different sections to understand all my available capabilities.

## Acceptance Criteria

**Epic 4.3.1: Single Combined View**
- [ ] Single "Capabilities" section displayed in UI
- [ ] Both MCP servers and Sub Agents shown together in one list
- [ ] Consistent row format for both capability types

**Epic 4.3.2: Type Filtering**
- [ ] Type filter toggle: All/MCP/Agents
- [ ] Filter displays count of each type (e.g., "MCP (5)", "Agents (3)")
- [ ] Filter changes URL parameter for bookmarking
- [ ] Filter state persists during tab switching

**Epic 4.3.3: Unified Search**
- [ ] Search input works across both MCP and Agent data
- [ ] Searches: name, description, configuration details
- [ ] Search results highlight matched terms
- [ ] Debounced search (300ms delay)

**Epic 4.3.4: Visual Indicators**
- [ ] Type icons: 🔌 for MCP servers, 🤖 for Agents
- [ ] Source badges: Blue (user), Green (project), Gray (inherited)
- [ ] Status indicators: Active/Inactive/Error states
- [ ] Sort by: Name, Type, Source, Status

**Epic 4.3.5: Performance**
- [ ] Component render time <50ms
- [ ] Tab switching performance <100ms (inherited from Epic 2)
- [ ] Memory usage <200MB total
- [ ] Virtual scrolling for lists >100 items

**Epic 4.3.6: Accessibility**
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation (Tab, Enter, Arrow keys)
- [ ] Screen reader support with ARIA labels
- [ ] Color + text indicators (not color alone)

## Tasks / Subtasks

### Task 1: Create Unified Capability Data Model (AC: 4.3.1)
- [ ] Define UnifiedCapability type in src/types/capability.ts
- [ ] Create capabilityUnifier.ts utility for MCP + Agent merging
- [ ] Add toExisting type definitions: index.ts exports
- [ ] Unit tests for type safety and data transformation

### Task 2: Enhance ConfigStore with Capability Methods (AC: 4.3.1, 4.3.2, 4.3.3)
- [ ] Add capabilities field to ConfigStore interface
- [ ] Implement getCapabilities(type?: 'all'|'mcp'|'agent') method
- [ ] Implement searchCapabilities(query: string) method
- [ ] Implement filterCapabilities(filters: FilterState) method
- [ ] Update updateCapabilities() to combine MCP + Agents
- [ ] Integration tests for store methods

### Task 3: Create CapabilityPanel Component (AC: 4.3.1, 4.3.2, 4.3.3, 4.3.4)
- [ ] Create src/components/CapabilityPanel.tsx
- [ ] Implement filter toggle (All/MCP/Agents) with counts
- [ ] Implement unified search bar with debouncing
- [ ] Implement sort controls (Name, Type, Source, Status)
- [ ] Create list container with virtual scrolling support
- [ ] Render CapabilityRow components

### Task 4: Create CapabilityRow Component (AC: 4.3.4)
- [ ] Create src/components/CapabilityRow.tsx
- [ ] Display type icon (🔌/🤖) with proper alt text
- [ ] Display capability name and description
- [ ] Show source badge with color coding
- [ ] Show status badge
- [ ] Handle type-specific metadata display

### Task 5: Integration with Tab System (AC: 4.3.1, 4.3.5)
- [ ] Add "Capabilities" tab to ProjectTab.tsx
- [ ] Render CapabilityPanel in tab content
- [ ] Ensure scope switching works correctly
- [ ] Maintain filter/search state during tab changes
- [ ] Test performance with <100ms requirement

### Task 6: File System Integration (AC: 4.3.1)
- [ ] Connect to existing file watcher system
- [ ] Listen for MCP configuration file changes
- [ ] Listen for Agent markdown file changes
- [ ] Update capabilities list in real-time
- [ ] 300ms debounce for updates

### Task 7: Testing Suite (AC: 4.3.1-4.3.6)
- [ ] Unit tests for CapabilityPanel component (24+ tests)
- [ ] Unit tests for CapabilityRow component (12+ tests)
- [ ] Unit tests for capabilityUnifier.ts (8+ tests)
- [ ] Integration tests for configStore capabilities (16+ tests)
- [ ] End-to-end tests for filtering/searching
- [ ] Performance tests (render time, memory usage)
- [ ] Accessibility tests (keyboard nav, screen reader)

## Dev Notes

### Architecture Patterns and Constraints

**Component Pattern Consistency:**
- CapabilityRow follows same pattern as McpBadge (Story 4.1) and AgentBadge (Story 4.2)
- Props: `{ capability: UnifiedCapability, source: 'user'|'project'|'local' }`
- Consistent source badge implementation
- Identical layout and styling patterns

**State Management Pattern:**
- Uses existing Zustand configStore pattern
- Each capability type has dedicated state management
- Filtering and sorting are computed properties
- Updates via functional setState pattern
- Integrates with existing file watcher

**Type System Design:**
```typescript
type Capability =
  | { type: 'mcp'; data: McpServer; id: string }
  | { type: 'agent'; data: Agent; id: string }
```

**File Organization:**
```
src/components/
├── ui/                     # shadcn/ui base components
├── McpBadge.tsx           # From Story 4.1 (✅ Complete)
├── AgentBadge.tsx         # From Story 4.2 (✅ Complete)
├── McpList.tsx            # From Story 4.1 (✅ Complete)
├── AgentList.tsx          # From Story 4.2 (✅ Complete)
├── CapabilityPanel.tsx    # NEW - Unified view
└── CapabilityRow.tsx      # NEW - Unified row
```

**Performance Optimizations:**
- React.memo for CapabilityRow (prevent unnecessary re-renders)
- Virtual scrolling for large lists (>100 items)
- Debounced search (300ms)
- useMemo for filtered/sorted views
- Efficient state updates

**Error Handling:**
- Toast notifications for parse failures
- Inline error messages for incomplete data
- Graceful degradation (show partial data)
- Retry button for transient failures

### Testing Standards Summary

**Coverage Target:** >80% (same as Stories 4.1 & 4.2)

**Testing Framework:**
- Vitest 4.0.15 + Testing Library
- Co-located test files with source
- Mock Tauri API calls
- Mock file system operations

**Test Files Required:**
1. `src/components/CapabilityPanel.test.tsx` (24+ tests)
2. `src/components/CapabilityRow.test.tsx` (12+ tests)
3. `src/lib/capabilityUnifier.test.ts` (8+ tests)
4. `src/stores/configStore.capabilities.test.ts` (16+ tests)

**Test Scenarios:**
- Renders mixed MCP and Agent list
- Filter toggle works correctly
- Search finds capabilities of any type
- Source indicators display properly
- Type icons show correctly
- Sort and filter functionality
- Performance with large lists
- Accessibility compliance
- Integration with tab switching
- Real-time updates via file watcher

### Project Structure Notes

**Alignment with Unified Project Structure:**
- Component naming: PascalCase without separators
- File paths: Consistent with existing McpBadge/AgentBadge
- Props interfaces: TypeScript strict mode (no `any`)
- State management: Consistent with configStore pattern
- Integration points: Tab = Scope (Epic 2), Source Tracking (Epic 3)

**Detected Conflicts or Variances:**
- MCP uses JSON format, Agents use Markdown → Handled via capabilityUnifier
- Different data structures → Normalized to UnifiedCapability type
- Separate parsers → Combined in display layer
- No conflicts detected with existing implementation

## Technical Requirements

### Code Structure Requirements

**Folder Organization:**
```
src/
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── CapabilityPanel.tsx     # Main unified panel component
│   ├── CapabilityRow.tsx       # Individual capability display
│   ├── FilterToggle.tsx        # Type filter control
│   └── SearchBar.tsx           # Unified search
├── types/
│   ├── index.ts                # Re-exports
│   ├── mcp.ts                  # McpServer (Story 4.1 - ✅)
│   ├── agent.ts                # Agent (Story 4.2 - ✅)
│   └── capability.ts           # UnifiedCapability (NEW)
├── lib/
│   └── capabilityUnifier.ts    # MCP + Agent merger (NEW)
└── stores/
    └── configStore.ts          # Enhanced with capabilities
```

**Naming Conventions:**
- Component Files: `PascalCase.tsx` (e.g., `CapabilityPanel.tsx`)
- Component Exports: PascalCase matching filename
- TypeScript Interfaces: PascalCase without markers
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

**File Patterns:**
- Test files co-located: `Component.test.tsx`
- Types in separate `types/` directory
- Utility functions in `lib/` directory

### Architecture Compliance

**Technology Stack:**
- React 18.3.1 with TypeScript 5.9.3 (strict mode)
- Tauri v2.9.1 (Rust-based desktop backend)
- Zustand v5.0.9 (state management)
- shadcn/ui v0.x (based on Radix UI primitives)
- Vite 7.2.6 (build tool)
- Tailwind CSS v4.1.17 (styling)

**State Management Requirements:**
- Use existing Zustand configStore pattern
- Functional updates: `setState((prev) => ({...prev, ...}))`
- Real-time updates via `config-changed` event
- 5-minute cache validity pattern
- Scope-based data filtering

**Performance Requirements:**
- Component render time: <50ms
- Tab switching: <100ms (inherited from Epic 2)
- File change detection: <500ms (inherited from Epic 1.8)
- Memory usage: <200MB total
- Debounced search: 300ms

**Security Requirements:**
- Tauri filesystem permissions (restricted paths only)
- User config: `~/.claude.json`, `~/.claude/agents/*.md`
- Project config: `./.mcp.json`, `./.claude/agents/*.md`
- No arbitrary system path access

### Library & Framework Requirements

**Core Dependencies:**
- `@tauri-apps/api` v2.9.1 (file system access)
- `@radix-ui/react-tabs` v1.1.13 (tab system)
- `@radix-ui/react-dialog` v1.1.15 (future Story 4.4)
- `lucide-react` v0.556.0 (icons)

**UI Component Requirements:**
- `Tabs` - for filtering (All/MCP/Agents)
- `Card` - for capability row display
- `Badge` - for source indicators and type indicators
- `Button` - for actions
- `Input` - for search bar
- `Tooltip` - for hover details

**TypeScript Strict Mode:**
- No `any` types allowed
- Strict null checks enabled
- All props typed
- Interface definitions for all data structures

### File Structure Requirements

**Source Files:**
```
src/
├── components/CapabilityPanel.tsx       # NEW
├── components/CapabilityRow.tsx         # NEW
├── components/FilterToggle.tsx          # NEW
├── types/capability.ts                  # NEW
└── lib/capabilityUnifier.ts             # NEW
```

**Modified Files:**
```
src/
├── stores/configStore.ts                # ENHANCE
├── components/ProjectTab.tsx            # MODIFY
├── types/index.ts                       # MODIFY
└── components/ui/                       # NO CHANGES
```

**Test Files:**
```
src/
├── components/CapabilityPanel.test.tsx  # NEW
├── components/CapabilityRow.test.tsx    # NEW
├── lib/capabilityUnifier.test.ts        # NEW
└── stores/configStore.capabilities.test.ts # NEW
```

### Testing Requirements

**Coverage Targets:**
- Lines: >80%
- Functions: >80%
- Branches: >75%
- Statements: >80%

**Test Categories:**

1. **Unit Tests (40+ tests):**
   - Component rendering with mock data
   - Type discrimination (MCP vs Agent)
   - Filtering logic
   - Search functionality
   - Sorting algorithms
   - Data transformation (unification)

2. **Integration Tests (20+ tests):**
   - Store + Component integration
   - File watcher integration
   - Tab switching integration
   - Scope switching (user/project)
   - Filter + Search combination

3. **End-to-End Tests (10+ tests):**
   - Full user workflow
   - Keyboard navigation
   - Screen reader compatibility
   - Performance validation

4. **Performance Tests (5+ tests):**
   - Render time <50ms
   - Search response time
   - Memory usage validation
   - Large dataset handling

**Mock Strategies:**
- Mock Tauri `invoke` calls
- Mock file system reads
- Mock `config-changed` events
- Use existing mock data from Stories 4.1 & 4.2

**Test Data:**
- 5 sample MCP servers (various types: http, stdio, sse)
- 5 sample Agents (various permission levels)
- Mixed capabilities for filtering tests
- Large dataset (100+ items) for performance

### Latest Technical Information (December 2025)

**Technology Versions & Updates:**

**Tauri 2.0 (Current):**
- Frontend Independent (supports React, Vue, Svelte, etc.)
- Cross Platform: Linux, macOS, Windows, Android, iOS
- Maximum Security priority
- Minimal bundle size (as little as 600KB)
- Tauri 1.0 Documentation available separately

**Vite 7.2.7 (Latest):**
- Enhanced environment API system
- Per-environment API support
- ModuleRunner API for SSR improvements
- Updated HMR capabilities
- Upcoming breaking changes:
  - `this.environment` in Hooks
  - HMR hotUpdate Plugin Hook
  - Move to Per-environment APIs
  - Shared Plugins During Build

**shadcn/ui (Latest Components):**
- Recently added: Field, Input Group, Item components
- Full component library available:
  - Form: Field, Input Group, Item, Button, Input, Label
  - Data Display: Avatar, Badge, Card, Table, Tabs
  - Navigation: Breadcrumb, Navigation Menu, Pagination
  - Feedback: Alert, Alert Dialog, Progress, Toast
  - Layout: Dialog, Drawer, Sheet, Sidebar
- Dark mode support
- Theming capabilities
- Built on Radix UI primitives

**React & TypeScript:**
- React 18.3.1 (current in project)
- TypeScript 5.9.3 (current in project)
- Strict mode enabled
- Type safety required (no `any`)

**Zustand v5.0.9:**
- Current state management solution
- Functional updates pattern
- Middleware support
- DevTools integration

### Previous Story Intelligence

**Story 4.2: Sub Agents Display (COMPLETED)**

**Files Created:**
- `src/components/AgentBadge.tsx` - Individual Agent display
- `src/components/AgentList.tsx` - List component
- `src/types/agent.ts` - Agent type definitions
- `src/lib/agentParser.ts` - Markdown parsing
- `src/stores/configStore.ts` - Enhanced with Agent state

**Key Learnings:**

1. **Component Pattern Consistency Worked Perfectly**
   - AgentBadge matched McpBadge pattern exactly
   - Same props structure: `{ agent: Agent, source: 'user'|'project'|'local' }`
   - Consistent source badge implementation
   - CapabilityRow should follow same wrapper pattern

2. **Store Integration Pattern is Solid**
   - Each capability type has dedicated state management
   - Filtering and sorting are per-type
   - Updates happen via setState((prev) => ({...}))
   - Should add unified methods: `getCapabilities()`, `searchCapabilities()`

3. **Markdown Parsing Strategy Effective**
   - Parsed .claude/agents/*.md files
   - Extracted frontmatter for structured data
   - Handled missing optional fields gracefully
   - CapabilityPanel needs to handle both JSON (MCP) and Markdown (Agent) formats

4. **Performance Optimizations That Worked**
   - React.memo for components (prevented unnecessary re-renders)
   - Virtual scrolling for large lists
   - Debounced search (300ms)
   - Efficient state updates with useMemo
   - CapabilityPanel should use same optimizations

5. **Error Handling Pattern User-Friendly**
   - Toast notifications for non-critical errors
   - Inline error messages for parse failures
   - Graceful degradation (show partial data)
   - Retry button for transient failures
   - CapabilityPanel should handle mixed parsing errors

6. **Accessibility Implementation Effective**
   - WCAG 2.1 AA compliance
   - ARIA labels on all interactive elements
   - Keyboard navigation (Tab, Enter, Arrow keys)
   - Screen reader support
   - CapabilityRow needs ARIA labels, proper semantic HTML

7. **Testing Approach Comprehensive**
   - 32+ tests with >80% coverage
   - Unit tests + integration tests
   - Mock Tauri API calls
   - Test sorting and filtering logic
   - CapabilityPanel needs comprehensive test suite

**Test Coverage Achieved:** 32 passing tests (>80% coverage)

**Implementation Patterns to Reuse:**
- Unified Rendering Pattern
- Store Integration Pattern
- Filter Implementation Pattern
- Type Safety with discriminated unions
- Performance-first approach (memoization, virtualization)

### Project Context Reference

**Project: cc-config**

**Overview:**
Claude Code Configuration Manager - A Tauri-based desktop application for managing Claude Code configurations with three-layer inheritance (user → project → local).

**Innovation #3: Unified Capability Panel**
The third major PRD innovation that treats both MCP servers and Agents as extensions to Claude Code capabilities, displaying them in a single consistent view.

**Technical Context:**
- Desktop app (not web)
- Cross-platform (macOS, Linux, Windows)
- File system based configuration
- Real-time file watching
- Three-scope system (user/project/local)

**Existing Epics:**
- Epic 1: Foundation Setup (COMPLETED)
- Epic 2: Configuration Scope Display (COMPLETED)
- Epic 3: Configuration Source Identification (COMPLETED)
- Epic 4: MCP & Sub Agents Management (IN PROGRESS)
- Epic 5: Cross-Project Configuration Comparison (BACKLOG)
- Epic 6: Error Handling & User Experience (BACKLOG)

**Sprint Status:**
- Epic 4.1 (MCP Servers Display): COMPLETED
- Epic 4.2 (Sub Agents Display): COMPLETED
- **Epic 4.3 (Unified Capability Panel): READY FOR DEV** ← Current Story
- Epic 4.4 (Capability Details View): BACKLOG
- Epic 4.5 (Capability Statistics): BACKLOG

## Dev Agent Record

### Context Reference

This story file contains comprehensive context from:
- Enhanced epics file: `/Users/sunven/github/cc-config/docs/epics.md`
- PRD: `/Users/sunven/github/cc-config/docs/prd.md`
- Architecture: `/Users/sunven/github/cc-config/docs/architecture.md`
- Previous story implementations: Stories 4.1 & 4.2
- Latest technical research: December 2025

### Agent Model Used

minimaxai/minimax-m2

### Debug Log References

- Epic 4 analysis: Complete
- Architecture analysis: Complete
- Story 4.2 learnings: Extracted and documented
- Technical research: Latest versions verified (Tauri 2.0, Vite 7.2.7, shadcn/ui latest components)

### Completion Notes List

1. ✅ Story foundation extracted from Epic 4
2. ✅ Acceptance criteria detailed from epics file
3. ✅ Technical requirements documented from architecture
4. ✅ Previous story learnings incorporated
5. ✅ Latest technical specifications researched
6. ✅ Component patterns established from Stories 4.1 & 4.2
7. ✅ Performance requirements validated
8. ✅ Testing strategy documented
9. ✅ Integration points identified
10. ✅ Ready for developer implementation

### File List

**Story Context:**
- `/Users/sunven/github/cc-config/docs/sprint-artifacts/4-3-unified-capability-panel.md` ← This file

**Source Documentation:**
- `/Users/sunven/github/cc-config/docs/epics.md` (Epic 4 & Story 4.3 details)
- `/Users/sunven/github/cc-config/docs/prd.md` (Unified capability panel innovation)
- `/Users/sunven/github/cc-config/docs/architecture.md` (Architecture requirements)

**Previous Story References:**
- `/Users/sunven/github/cc-config/docs/sprint-artifacts/4-1-mcp-servers-display.md`
- `/Users/sunven/github/cc-config/docs/sprint-artifacts/4-2-sub-agents-display.md`

**Implementation to Create:**
- `src/components/CapabilityPanel.tsx`
- `src/components/CapabilityRow.tsx`
- `src/types/capability.ts`
- `src/lib/capabilityUnifier.ts`
- Test files for all new components

---

**Story Ready for Dev - Ultimate Context Engine Analysis Complete**

This comprehensive story file provides everything needed for flawless implementation:
- Complete acceptance criteria from epics analysis
- Architecture requirements and patterns
- Previous story learnings and patterns
- Latest technical specifications
- Testing strategy and coverage targets
- Performance requirements and optimizations
- Integration points and dependencies

**The developer now has everything needed for implementation without any missing context or requirements!**