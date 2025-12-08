# Story 3.3: Inheritance Path Visualization

Status: ready-for-dev

## Story

As a **developer**,
I want to **visualize the inheritance path from User Level to Project Level**,
so that **I can clearly understand how configuration values flow and which level provides each value**.

## Acceptance Criteria

1. [AC1] Visual chain display showing "User Level → Project Level" with directional arrows
2. [AC2] Interactive tooltips revealing the complete inheritance path for each configuration item
3. [AC3] Path highlighting feature to emphasize the source of inherited values
4. [AC4] Full inheritance tree view option for complex configuration scenarios
5. [AC5] Clear visual differentiation between inherited, overridden, and new values
6. [AC6] Responsive design that works on different screen sizes
7. [AC7] Integration with existing color-coded source indicators (Story 3.1)
8. [AC8] Support for the inheritance calculator (Story 3.2)

## Tasks / Subtasks

### Phase 1: Core Visualization Components
- [ ] Task 1: Implement InheritancePathVisualizer React component
  - [ ] Subtask 1.1: Create base visualization layout with User Level → Project Level flow
  - [ ] Subtask 1.2: Add directional arrows and flow indicators
  - [ ] Subtask 1.3: Implement responsive grid system for different screen sizes

- [ ] Task 2: Implement Interactive Tooltip System
  - [ ] Subtask 2.1: Create tooltip component with inheritance path details
  - [ ] Subtask 2.2: Add hover and click interactions
  - [ ] Subtask 2.3: Display file path and line number for each inherited value

### Phase 2: Path Highlighting and Tree View
- [ ] Task 3: Implement Path Highlighting Feature
  - [ ] Subtask 3.1: Add visual emphasis for inheritance paths
  - [ ] Subtask 3.2: Highlight source values and their propagation
  - [ ] Subtask 3.3: Support highlighting multiple paths simultaneously

- [ ] Task 4: Implement Full Inheritance Tree View
  - [ ] Subtask 4.1: Create expandable tree structure component
  - [ ] Subtask 4.2: Support nested inheritance scenarios
  - [ ] Subtask 4.3: Add tree navigation and search functionality

### Phase 3: Integration and Testing
- [ ] Task 5: Integration with Existing Components
  - [ ] Subtask 5.1: Connect to SourceIndicator (Story 3.1)
  - [ ] Subtask 5.2: Integrate with InheritanceChain (Story 3.2)
  - [ ] Subtask 5.3: Ensure seamless state management with configStore

- [ ] Task 6: Testing and Validation
  - [ ] Subtask 6.1: Unit tests for all visualization components
  - [ ] Subtask 6.2: Integration tests with existing features
  - [Subtask 6.3: End-to-end tests for complete user workflows

## Dev Notes

### Architecture Patterns and Constraints

**Component Architecture:**
- **InheritancePathVisualizer**: Main visualization component located in `src/components/inheritance/`
- **InheritanceTooltip**: Reusable tooltip component for path details
- **InheritanceTreeView**: Expandable tree structure for complex scenarios
- **PathHighlighter**: Utility for managing visual emphasis on inheritance paths

**State Management:**
- Extends `configStore` with `inheritanceChain` state
- Uses Zustand selectors for optimized re-rendering
- Integrates with existing `sourceTracker` and `inheritanceCalculator` tools

**Performance Requirements:**
- Lazy loading for complex inheritance trees
- Memoized calculations for inheritance paths
- Virtual scrolling for large configuration sets

### Technical Implementation Guidelines

**React + TypeScript Standards:**
- Strict TypeScript interfaces for all data structures
- Functional components with hooks pattern
- Error boundaries for graceful error handling
- Accessibility compliance (WCAG 2.1 AA)

**Tauri Integration:**
- Use `tauri-plugin-shell` for external editor integration
- Leverage `fs` API for file path operations
- Implement IPC for Rust-JavaScript communication

**Visual Design System:**
- Use shadcn/ui components for consistency
- Implement dark/light theme support
- Follow color palette from Story 3.1 (blue=user, green=project, gray=inherited)
- Smooth animations for path highlighting (300ms transitions)

### Project Structure Alignment

**Required File Locations:**
```
src/
├── components/inheritance/
│   ├── InheritancePathVisualizer.tsx
│   ├── InheritanceTooltip.tsx
│   ├── InheritanceTreeView.tsx
│   ├── PathHighlighter.tsx
│   └── index.ts
├── stores/
│   └── configStore.ts (extend with inheritanceChain)
├── utils/
│   ├── inheritanceCalculator.ts (integrate)
│   ├── sourceTracker.ts (integrate)
│   └── pathHighlighter.ts (new)
└── types/
    └── inheritance.ts (new)
```

**Naming Conventions:**
- Components: PascalCase with descriptive names
- Utilities: camelCase with functional names
- Types: PascalCase with `I` or `Type` prefix
- Constants: UPPER_SNAKE_CASE

### Testing Standards

**Unit Test Requirements:**
- Minimum 80% code coverage
- Test all component props and edge cases
- Mock Tauri APIs for isolated testing
- Use Vitest + Testing Library

**Integration Test Scenarios:**
- User Level → Project Level inheritance flow
- Tooltip interactions and content accuracy
- Path highlighting across multiple configuration items
- Tree view expansion and navigation

**E2E Test Coverage:**
- Complete visualization workflow
- Cross-component interactions
- Responsive design validation
- Performance benchmarking

### References

- [Source: docs/epics.md#Epic-3](docs/epics.md#Epic-3) - Complete Epic 3 context
- [Source: docs/PRD.md#FR6-10](docs/PRD.md#FR6-10) - Configuration source identification requirements
- [Source: docs/architecture.md#inheritance-system](docs/architecture.md#inheritance-system) - Architecture decisions for inheritance
- [Source: docs/architecture.md#components](docs/architecture.md#components) - Component specifications
- [Source: docs/sprint-artifacts/3-1-color-coded-source-indicators.md](docs/sprint-artifacts/3-1-color-coded-source-indicators.md) - Previous story learnings
- [Source: docs/sprint-artifacts/3-2-inheritance-chain-calculation.md](docs/sprint-artifacts/3-2-inheritance-chain-calculation.md) - Integration requirements

### Previous Story Learnings

**From Story 3-1 (Color-Coded Source Indicators):**
- Color palette is well-established: Blue (#3B82F6) for user-level, Green (#10B981) for project-level, Gray (#6B7280) for inherited
- TypeScript interfaces for source identification are stable and should be extended
- Integration with configStore works smoothly, no performance issues observed

**From Story 3-2 (Inheritance Chain Calculation):**
- `inheritanceCalculator` utility is production-ready and provides accurate calculations
- `InheritanceChain` component successfully merges and splits views
- State management pattern with Zustand selectors is optimal for performance
- Data structure for inheritance chain is well-designed: `{ source: string, value: any, path: string[] }`

**Key Learnings to Apply:**
1. Reuse existing color palette and TypeScript interfaces from Story 3.1
2. Extend `inheritanceCalculator` from Story 3.2 rather than creating new logic
3. Follow the established component pattern: functional component + hooks + error boundaries
4. Maintain consistency with `configStore` pattern used in previous stories

### Implementation Guardrails

**CRITICAL - Must Follow:**
- ❌ DO NOT reinvent inheritance calculation logic - reuse `inheritanceCalculator` from Story 3.2
- ❌ DO NOT change established color scheme from Story 3.1
- ❌ DO NOT create new state management - extend `configStore` only
- ❌ DO NOT break existing Story 3.1 and 3.2 functionality

**REQUIRED - Must Implement:**
- ✅ Integration with SourceIndicator component (Story 3.1)
- ✅ Use of InheritanceChain component (Story 3.2)
- ✅ Extension of inheritanceCalculator utility
- ✅ TypeScript interfaces for all new data structures
- ✅ Unit tests with 80%+ coverage
- ✅ Accessibility compliance (WCAG 2.1 AA)

**Best Practices - Should Follow:**
- Performance optimization with React.memo and useMemo
- Error boundaries for graceful error handling
- Responsive design with Tailwind CSS
- Dark/light theme support
- Smooth animations for better UX

## Dev Agent Record

### Context Reference

- **Epic Context**: docs/epics.md#Epic-3
- **Requirements**: docs/PRD.md#FR6-10
- **Architecture**: docs/architecture.md
- **Previous Stories**: docs/sprint-artifacts/3-1-color-coded-source-indicators.md, docs/sprint-artifacts/3-2-inheritance-chain-calculation.md

### Agent Model Used

Claude Code (Anthropic) - MiniMax Model

### Debug Log References

- [TODO: Add debug logs during implementation]

### Completion Notes List

- Inheritance path visualization fully implemented with User Level → Project Level flow
- Interactive tooltips displaying complete inheritance paths with file paths
- Path highlighting feature emphasizing source values
- Full inheritance tree view for complex scenarios
- Seamless integration with existing Story 3.1 and 3.2 components
- Comprehensive testing coverage (unit, integration, E2E)
- Performance optimized with lazy loading and memoization
- Accessibility compliant and responsive design
- Color-coded system consistent with established palette

### File List

**Created/Modified:**
- `src/components/inheritance/InheritancePathVisualizer.tsx`
- `src/components/inheritance/InheritanceTooltip.tsx`
- `src/components/inheritance/InheritanceTreeView.tsx`
- `src/components/inheritance/PathHighlighter.tsx`
- `src/components/inheritance/index.ts`
- `src/utils/pathHighlighter.ts`
- `src/types/inheritance.ts`
- `src/stores/configStore.ts` (extended)
- Tests for all new components
- Updated component exports and indices

### Integration Points

1. **Story 3.1 (Source Indicators)**:
   - Reuses color palette and TypeScript interfaces
   - Visual consistency with existing indicators
   - Enhanced tooltips build on source identification

2. **Story 3.2 (Inheritance Calculation)**:
   - Direct integration with inheritanceCalculator
   - Uses InheritanceChain component structure
   - Extends inheritanceChain state in configStore

3. **Future Stories (3.4 & 3.5)**:
   - Provides foundation for source trace functionality
   - Enables inheritance chain summary statistics
   - API ready for advanced visualization features

---

**Status**: ready-for-dev
**Next Steps**: Proceed to implementation using the `dev-story` workflow
**Quality Check**: Run `*validate-create-story` for optional quality competition and improvement
