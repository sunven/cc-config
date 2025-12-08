# Story 3.4: Source Trace Functionality

Status: Ready for Review

## Story

As a **developer**,
I want to **trace any configuration item back to its source file**,
so that **I can find where it was originally defined and make changes if needed**.

## Acceptance Criteria

1. **[AC1]** Right-click or click "Trace Source" on any configuration item
2. **[AC2]** Display file path where configuration is defined (e.g., ~/.claude.json line 23)
3. **[AC3]** Show line number reference when possible
4. **[AC4]** Provide option to open file in external editor
5. **[AC5]** Show notification if file cannot be found
6. **[AC6]** Offer "Copy file path to clipboard" option
7. **[AC7]** Integrate with existing color-coded source indicators (Story 3.1)
8. **[AC8]** Support for inheritance path visualization (Story 3.3)
9. **[AC9]** Maintain performance <100ms for trace operations

## Tasks / Subtasks

### Phase 1: Core Source Tracing Infrastructure
- [x] Task 1: Implement source location tracking
  - [x] Subtask 1.1: Create Tauri command `get_source_location` in source_commands.rs
  - [x] Subtask 1.2: Parse configuration files to find exact source lines
  - [x] Subtask 1.3: Build source location database during config loading

- [x] Task 2: Create SourceTraceContext component
  - [x] Subtask 2.1: Add right-click context menu to ConfigList items
  - [x] Subtask 2.2: Implement "Trace Source" action button
  - [x] Subtask 2.3: Create tooltip with file path and line number

- [x] Task 3: Integrate with existing source tracking
  - [x] Subtask 3.1: Extend sourceTracker utility from Story 3.3
  - [x] Subtask 3.2: Store source location metadata in configStore
  - [x] Subtask 3.3: Connect with InheritancePathVisualizer for enhanced context

### Phase 2: External Editor Integration
- [x] Task 4: Implement external editor opening
  - [x] Subtask 4.1: Use Tauri shell API for editor integration
  - [x] Subtask 4.2: Support VS Code, Vim, and system default editors
  - [x] Subtask 4.3: Handle editor opening errors gracefully

- [x] Task 5: Clipboard and file path operations
  - [x] Subtask 5.1: Implement copy-to-clipboard functionality
  - [x] Subtask 5.2: Show "Copied!" confirmation feedback
  - [x] Subtask 5.3: Support both absolute and relative paths

### Phase 3: Error Handling and User Experience
- [x] Task 6: Handle missing or inaccessible files
  - [x] Subtask 6.1: Detect file deletion or move scenarios
  - [x] Subtask 6.2: Show helpful error messages with recovery suggestions
  - [x] Subtask 6.3: Provide "Refresh configuration" option

- [x] Task 7: Performance optimization and testing
  - [x] Subtask 7.1: Lazy load source location data
  - [x] Subtask 7.2: Cache frequently accessed source locations
  - [x] Subtask 7.3: Write comprehensive unit and integration tests

## Dev Notes

### Architecture Patterns and Constraints

**Component Architecture:**
- **SourceTraceContext**: Context menu component for trace actions
- **SourceLocationTooltip**: Tooltip showing file path and line number
- **SourceTracker**: Extended utility from Story 3.3 for location tracking
- **ExternalEditorLauncher**: Utility for opening files in editors

**State Management:**
- Extends `configStore` with `sourceLocations` state
- Uses Zustand selectors for optimized re-rendering
- Integrates with existing `sourceTracker` from Story 3.3
- Maintains compatibility with `inheritanceChain` state

**Performance Requirements:**
- Source location lookup: <50ms response time
- External editor opening: <100ms
- Memory overhead: <10MB for source location cache
- No blocking operations on UI thread

**Tauri Integration:**
- Command: `get_source_location` for tracing functionality
- Shell API for external editor launching
- fs API for file path resolution
- IPC for Rust-JavaScript communication

### Technical Implementation Guidelines

**React + TypeScript Standards:**
- Strict TypeScript interfaces for all data structures
- Functional components with hooks pattern
- Error boundaries for graceful error handling
- Accessibility compliance (WCAG 2.1 AA)

**Tauri Commands Pattern:**
```rust
#[tauri::command]
async fn get_source_location(
    config_item: String,
    search_paths: Vec<String>
) -> Result<SourceLocation, AppError>
```

**Integration Requirements:**
- Must extend `sourceTracker` from Story 3.3, not create new system
- Connect with `InheritancePathVisualizer` for context
- Use existing color palette: Blue (#3B82F6), Green (#10B981), Gray (#6B7280)
- Follow established component patterns from Story 3.3

**Visual Design System:**
- Use shadcn/ui components for consistency
- Context menu: DropdownMenu component
- Tooltip: Tooltip component with enhanced positioning
- Notifications: Toast component for confirmations
- Dark/light theme support
- Consistent with Stories 3.1 and 3.3

### Project Structure Alignment

**Required File Locations:**
```
src/
├── components/trace/
│   ├── SourceTraceContext.tsx
│   ├── SourceLocationTooltip.tsx
│   └── index.ts
├── utils/
│   ├── sourceTracker.ts (extend from Story 3.3)
│   └── externalEditorLauncher.ts (new)
├── stores/
│   └── configStore.ts (extend with sourceLocations)
└── types/
    └── trace.ts (new)

src-tauri/src/commands/
└── source_commands.rs (new)
```

**Naming Conventions:**
- Components: PascalCase with descriptive names
- Utilities: camelCase with functional names
- Tauri commands: snake_case
- Types: PascalCase with descriptive prefixes

### Testing Standards

**Unit Test Requirements:**
- Minimum 80% code coverage
- Test all source location scenarios
- Mock Tauri APIs for isolated testing
- Use Vitest + Testing Library
- Test error handling paths

**Integration Test Scenarios:**
- Source tracing from ConfigList items
- External editor launching workflow
- Clipboard operations
- Error handling for missing files

**E2E Test Coverage:**
- Complete source trace workflow
- Integration with Stories 3.1 and 3.3
- Performance validation

### References

- [Source: docs/epics.md#Epic-3](docs/epics.md#Epic-3) - Complete Epic 3 context
- [Source: docs/PRD.md#FR10](docs/PRD.md#FR10) - Trace creation location requirement
- [Source: docs/architecture.md](docs/architecture.md) - Architecture decisions
- [Source: docs/sprint-artifacts/3-3-inheritance-path-visualization.md](docs/sprint-artifacts/3-3-inheritance-path-visualization.md) - Previous story patterns
- [Source: docs/sprint-artifacts/3-1-color-coded-source-indicators.md](docs/sprint-artifacts/3-1-color-coded-source-indicators.md) - Color system

### Previous Story Learnings

**From Story 3-3 (Inheritance Path Visualization):**
- `sourceTracker` utility is well-designed and should be extended for location tracking
- Component architecture in `src/components/inheritance/` is modular and maintainable
- State management pattern with configStore works smoothly, extend with sourceLocations
- Color palette and TypeScript interfaces are stable
- Integration with existing components is seamless when following established patterns
- Testing patterns with Vitest + Testing Library are effective
- Performance optimization with React.memo and useMemo is critical

**Key Learnings to Apply:**
1. **Extend, Don't Replace**: Build on existing `sourceTracker` from Story 3.3
2. **Follow Component Patterns**: Create trace components following inheritance/ directory pattern
3. **Maintain State Consistency**: Extend configStore following the established pattern
4. **Color System Consistency**: Reuse Blue/Green/Gray palette from Stories 3.1 and 3.3
5. **Testing Strategy**: Write tests first (TDD approach) following Story 3.3 methodology
6. **Performance First**: Use memoization and selectors from the start

### Implementation Guardrails

**CRITICAL - Must Follow:**
- ❌ DO NOT create new source tracking system - extend `sourceTracker` from Story 3.3
- ❌ DO NOT modify existing Stories 3.1, 3.2, or 3.3 functionality
- ❌ DO NOT break integration with InheritancePathVisualizer (Story 3.3)
- ❌ DO NOT change established color palette or TypeScript interfaces

**REQUIRED - Must Implement:**
- ✅ Integration with SourceIndicator component (Story 3.1)
- ✅ Extension of sourceTracker utility (Story 3.3)
- ✅ Use of existing configStore pattern with sourceLocations
- ✅ Tauri commands for source location and external editor
- ✅ TypeScript interfaces for all data structures
- ✅ Unit tests with 80%+ coverage
- ✅ Performance <100ms for all trace operations
- ✅ Accessibility compliance (WCAG 2.1 AA)

**Best Practices - Should Follow:**
- Performance optimization with React.memo and useMemo
- Error boundaries for graceful error handling
- Responsive design with Tailwind CSS
- Dark/light theme support
- Toast notifications for user feedback
- Virtual scrolling for large lists (if needed)
- Debouncing for rapid trace operations

**Architecture Constraints:**
- Must work with Tauri v2 fs and shell APIs
- Cannot access arbitrary file paths (security)
- Must respect Tauri permission model
- File changes must trigger source location cache updates

## Dev Agent Record

### Context Reference

- **Epic Context**: docs/epics.md#Epic-3
- **Requirements**: docs/PRD.md#FR10 - Trace configuration creation location
- **Architecture**: docs/architecture.md - Tauri + React + TypeScript stack
- **Previous Stories**:
  - docs/sprint-artifacts/3-1-color-coded-source-indicators.md - Color system
  - docs/sprint-artifacts/3-2-inheritance-chain-calculation.md - Inheritance logic
  - docs/sprint-artifacts/3-3-inheritance-path-visualization.md - Patterns and learnings
- **Current Story**: 3-4-source-trace-functionality

### Technical Context

**Technology Stack:**
- Tauri v2.0+ for desktop application framework
- React 18+ with TypeScript (strict mode)
- Zustand v4+ for state management
- shadcn/ui for UI components (Radix UI + Tailwind)
- Vitest + Testing Library for testing

**Key Integration Points:**
1. **Story 3.1 (Source Indicators)**: Reuse color palette and component patterns
2. **Story 3.2 (Inheritance Chain)**: Integrate with inheritanceCalculator
3. **Story 3.3 (Path Visualization)**: Extend sourceTracker utility and component patterns

**Performance Targets:**
- Source location lookup: <50ms
- External editor opening: <100ms
- UI response time: <100ms
- Memory overhead: <10MB for source cache
- File watching update: <500ms

### Agent Model Used

Claude Code (Anthropic) - MiniMax Model

### Debug Log References

- [TODO: Add debug logs during implementation]
- Log source location lookups for performance monitoring
- Track external editor launch success/failure rates
- Monitor source cache hit/miss ratios

### Implementation Notes

**Date Implemented:** 2025-12-08

**Implementation Approach:**
- Follow red-green-refactor cycle for all components
- Create comprehensive test suite before implementation
- Integrate with existing configStore and sourceTracker from Story 3.3
- Reuse SourceIndicator component for visual consistency

**Key Technical Decisions:**
1. **Component Architecture**: Create modular trace components in `src/components/trace/`
2. **State Management**: Extend configStore with sourceLocations following Story 3.3 pattern
3. **Testing Strategy**: Write failing tests first (RED), then implement minimal code (GREEN)
4. **Color System**: Reuse established palette from Stories 3.1 and 3.3
5. **Rust Backend**: Implemented three Tauri commands: get_source_location, open_in_editor, copy_to_clipboard
6. **Caching Strategy**: 10-minute cache validity for source locations to optimize performance

**Files Created:**
- `src-tauri/src/commands/source.rs` - Tauri commands for source tracing
- `src/components/trace/SourceTraceContext.tsx` - Context menu for trace actions
- `src/components/trace/SourceLocationTooltip.tsx` - Tooltip with file path
- `src/components/trace/index.ts` - Component exports
- `src/utils/externalEditorLauncher.ts` - Editor launching utility
- `src/utils/sourceTracker.ts` - Source tracking with caching
- `src/types/trace.ts` - TypeScript interfaces
- `src/utils/externalEditorLauncher.test.ts` - Utility tests
- `src/utils/sourceTracker.test.ts` - SourceTracker tests
- `src/components/trace/SourceLocationTooltip.test.tsx` - Tooltip component tests
- `src/components/trace/SourceTraceContext.test.tsx` - Context menu tests

**Modified:**
- `src-tauri/src/commands/mod.rs` - Added source module
- `src-tauri/src/lib.rs` - Registered new Tauri commands

**Integration Points:**
1. **Story 3.1 (Source Indicators)**:
   - Reuses color palette and TypeScript interfaces
   - Visual consistency with existing indicators
   - Enhanced tooltips build on source identification

2. **Story 3.3 (Inheritance Path Visualization)**:
   - Extends sourceTracker utility for location tracking
   - Uses established component patterns
   - Integrates with inheritanceChain state

3. **Future Stories (3.5)**:
   - Provides foundation for inheritance chain summary
   - Enables advanced source analysis features
   - API ready for statistics and insights

### Completion Notes List

- [x] Source location tracking fully implemented with Tauri commands
- [x] Right-click context menu added to all configuration items
- [x] File path and line number display with interactive tooltips
- [x] External editor integration using Tauri shell API (Tauri-compatible)
- [x] Copy-to-clipboard functionality with user feedback (Tauri API implemented)
- [x] Seamless integration with Stories 3.1 and 3.3 (IntegratedSourceTrace component)
- [x] Comprehensive test suite with 80%+ coverage
- [x] Performance optimized with memoization and caching (AC9 <100ms validated)
- [x] Performance benchmarks added for AC9 compliance
- [x] Error handling for missing or inaccessible files
- [x] Accessibility compliant (WCAG 2.1 AA standards)
- [x] Dark/light theme support
- [x] Toast notifications for user feedback
- [x] configStore extended with sourceLocations state
- [x] Code review completed with ALL HIGH/MEDIUM issues fixed
- [x] Integration tests added for complete workflow validation
- [x] All tests passing

### File List

**Created:**
- `cc-config-viewer/src/components/trace/SourceTraceContext.tsx` - Context menu component with Tauri clipboard integration
- `cc-config-viewer/src/components/trace/SourceLocationTooltip.tsx` - Tooltip component
- `cc-config-viewer/src/components/trace/SourceTraceContext.test.tsx` - Component tests
- `cc-config-viewer/src/components/trace/SourceLocationTooltip.test.tsx` - Tooltip tests
- `cc-config-viewer/src/components/trace/IntegratedSourceTrace.tsx` - Integration component (Stories 3.1/3.3)
- `cc-config-viewer/src/components/trace/integration.test.tsx` - Integration tests
- `cc-config-viewer/src/components/trace/index.ts` - Component exports
- `cc-config-viewer/src/utils/externalEditorLauncher.ts` - Editor launcher utility (Tauri-compatible)
- `cc-config-viewer/src/utils/externalEditorLauncher.test.ts` - Utility tests
- `cc-config-viewer/src/utils/sourceTracker.ts` - Extended tracker with performance monitoring
- `cc-config-viewer/src/utils/sourceTracker.test.ts` - Updated tests
- `cc-config-viewer/src/utils/performanceBenchmark.test.ts` - Performance benchmarks (AC9)
- `cc-config-viewer/src/types/trace.ts` - TypeScript interfaces
- `cc-config-viewer/src-tauri/src/commands/source.rs` - Tauri commands (fixed clipboard)

**Modified:**
- `cc-config-viewer/src/stores/configStore.ts` - ✅ Extended with sourceLocations state
- `cc-config-viewer/src/stores/configStore.test.ts` - Update tests
- `cc-config-viewer/src-tauri/src/commands/mod.rs` - ✅ Added source module
- `cc-config-viewer/src-tauri/src/lib.rs` - ✅ Registered Tauri commands

**Documentation:**
- `docs/sprint-artifacts/3-4-source-trace-functionality.md` - This story file
- `docs/sprint-artifacts/sprint-status.yaml` - Update status to "done"

---

**Status**: Ready for Development
**Sprint**: Epic 3 - Configuration Source Identification
**Dependencies**:
- Epic 3.1 (Color-Coded Source Indicators) - Complete
- Epic 3.2 (Inheritance Chain Calculation) - Complete
- Epic 3.3 (Inheritance Path Visualization) - Complete
**Next Steps**: Run `dev-story` for implementation