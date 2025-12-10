# Story 6.4: Performance Optimization

Status: ready-for-dev

## Story

As a developer,
I want the application to meet all performance requirements,
So that I can use it efficiently without waiting.

## Acceptance Criteria

1. [Startup time: <3 seconds from launch to interactive UI]
2. [Tab switching response: <100ms for all scope/project tabs]
3. [File change detection: <500ms from file modification to UI update]
4. [Memory usage: <200MB during normal operation]
5. [CPU usage: <1% when idle (no active operations)]
6. [Initial render: <50ms for main content area]
7. [Large configuration lists: Smooth scrolling with 100+ items]
8. [No memory leaks: Stable memory after extended use (1+ hour)]
9. [Bundle size: <10MB for application package]
10. [Performance monitoring: Dev tools for measuring key metrics]

## Tasks / Subtasks

- [ ] Task 1: Performance Monitoring Infrastructure
  - [ ] Subtask 1.1: Create performanceMonitor.ts utility for metric collection
  - [ ] Subtask 1.2: Implement startup time measurement (app launch to interactive)
  - [ ] Subtask 1.3: Add tab switching time measurement hooks
  - [ ] Subtask 1.4: Implement memory usage tracking utilities
  - [ ] Subtask 1.5: Add performance logging for development mode

- [ ] Task 2: React Component Optimization
  - [ ] Subtask 2.1: Apply React.memo to heavy components (ConfigList, CapabilityPanel)
  - [ ] Subtask 2.2: Implement useMemo for expensive calculations (inheritance chain)
  - [ ] Subtask 2.3: Add useCallback for event handlers in list components
  - [ ] Subtask 2.4: Optimize re-render patterns in ProjectTab and ConfigList
  - [ ] Subtask 2.5: Implement lazy loading for non-critical components

- [ ] Task 3: Virtual Scrolling for Large Lists
  - [ ] Subtask 3.1: Integrate virtualization library (react-window or similar)
  - [ ] Subtask 3.2: Implement virtualized ConfigList for 100+ items
  - [ ] Subtask 3.3: Implement virtualized CapabilityPanel for MCP/Agents
  - [ ] Subtask 3.4: Add scroll position restoration on tab switch
  - [ ] Subtask 3.5: Ensure accessibility with virtualized lists

- [ ] Task 4: State Management Optimization
  - [ ] Subtask 4.1: Optimize Zustand store selectors to prevent unnecessary re-renders
  - [ ] Subtask 4.2: Implement shallow comparison for store subscriptions
  - [ ] Subtask 4.3: Add config data caching strategy with invalidation
  - [ ] Subtask 4.4: Optimize inheritanceCalculator with memoization
  - [ ] Subtask 4.5: Reduce store update frequency with batching

- [ ] Task 5: File Watching Optimization
  - [ ] Subtask 5.1: Verify 300ms debouncing is applied correctly
  - [ ] Subtask 5.2: Optimize file change event processing in Rust
  - [ ] Subtask 5.3: Implement differential updates (only changed data)
  - [ ] Subtask 5.4: Add file watching performance metrics
  - [ ] Subtask 5.5: Ensure <500ms detection latency under load

- [ ] Task 6: Bundle Size Optimization
  - [ ] Subtask 6.1: Analyze current bundle size with vite-bundle-analyzer
  - [ ] Subtask 6.2: Implement code splitting for routes/features
  - [ ] Subtask 6.3: Tree-shake unused dependencies
  - [ ] Subtask 6.4: Optimize Tauri build configuration
  - [ ] Subtask 6.5: Verify final bundle <10MB

- [ ] Task 7: Memory Leak Prevention
  - [ ] Subtask 7.1: Audit event listeners and ensure cleanup on unmount
  - [ ] Subtask 7.2: Review Tauri event subscriptions lifecycle
  - [ ] Subtask 7.3: Implement memory profiling tests
  - [ ] Subtask 7.4: Add WeakRef for cache where appropriate
  - [ ] Subtask 7.5: Verify stable memory after 1+ hour use

- [ ] Task 8: Testing and Validation
  - [ ] Subtask 8.1: Create performance benchmarking test suite
  - [ ] Subtask 8.2: Write unit tests for memoization logic
  - [ ] Subtask 8.3: Implement startup time regression tests
  - [ ] Subtask 8.4: Add memory usage monitoring to CI
  - [ ] Subtask 8.5: Document performance baselines and thresholds

## Dev Notes

### Architecture Compliance

**Performance Requirements (Non-Negotiable from Architecture):**
- Startup time: <3 seconds (Architecture NFR)
- Tab switching: <100ms (Architecture NFR)
- Memory usage: <200MB (Architecture NFR, adjusted from <100MB in PRD)
- CPU idle: <1% (Architecture NFR)
- File detection: <500ms (Architecture section 3.4)

**State Management Optimization (Zustand):**
```typescript
// CORRECT: Selective subscription to prevent unnecessary re-renders
const projects = useProjectsStore((state) => state.projects)
const activeProject = useProjectsStore((state) => state.activeProject)

// INCORRECT: Subscribe to entire store
const store = useProjectsStore() // Triggers re-render on any change
```

**Component Memoization Pattern:**
```typescript
// Apply React.memo to list item components
export const ConfigItem = React.memo(({ config }: ConfigItemProps) => {
  return <div className="config-item">{config.name}</div>
})

// Use useMemo for expensive calculations
const inheritanceChain = useMemo(() =>
  calculateInheritance(configs),
  [configs]
)

// Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  setActiveConfig(id)
}, [setActiveConfig])
```

### Project Structure Notes

**Required File Additions:**
```
src/
├── lib/
│   ├── performanceMonitor.ts     # Performance measurement utilities
│   └── memoization.ts            # Memoization helpers
├── hooks/
│   └── useVirtualizedList.ts     # Virtual scrolling hook
└── components/
    └── VirtualizedList.tsx       # Generic virtualized list component
```

**Modified Files:**
- `src/components/ConfigList.tsx` - Add virtualization and memoization
- `src/components/CapabilityPanel.tsx` - Optimize with React.memo
- `src/stores/projectsStore.ts` - Optimize selectors
- `src/stores/configStore.ts` - Add caching and batching
- `src-tauri/src/config/watcher.rs` - Optimize event processing
- `vite.config.ts` - Add bundle analysis and optimization

### Library & Framework Requirements

**Core Stack (No Changes):**
- React 18 + TypeScript (strict mode enabled)
- Zustand v4+ for state management
- Tauri v2.0.0 for backend
- Vite for bundling

**Performance Libraries to Consider:**
```yaml
devDependencies:
  - "rollup-plugin-visualizer": "^5.x"  # Bundle analysis

dependencies:
  - "@tanstack/react-virtual": "^3.x"   # Virtual scrolling (optional)
```

**Native Browser APIs:**
- `performance.now()` for timing measurements
- `PerformanceObserver` for web vitals
- `requestIdleCallback` for deferred work

### Testing Requirements

**Performance Benchmarks (Automated):**
```typescript
describe('Performance Requirements', () => {
  test('startup time < 3 seconds', async () => {
    const startTime = performance.now()
    await launchApp()
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(3000)
  })

  test('tab switch < 100ms', async () => {
    const startTime = performance.now()
    await switchTab('project-1')
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(100)
  })

  test('memory usage < 200MB', async () => {
    const memory = await measureMemory()
    expect(memory.usedJSHeapSize / 1024 / 1024).toBeLessThan(200)
  })
})
```

**Memory Leak Tests:**
```typescript
test('no memory leak after tab switching', async () => {
  const initialMemory = await measureMemory()

  // Switch tabs 100 times
  for (let i = 0; i < 100; i++) {
    await switchTab('user')
    await switchTab('project-1')
  }

  // Force GC and measure
  await forceGC()
  const finalMemory = await measureMemory()

  // Memory should not grow significantly
  expect(finalMemory.usedJSHeapSize).toBeLessThan(initialMemory.usedJSHeapSize * 1.2)
})
```

### Integration Requirements

**With Story 6.1 (Comprehensive Error Handling):**
- Performance errors should use AppError type
- Don't sacrifice error handling for performance
- Error boundaries should not impact render performance

**With Story 6.2 (Loading States & Progress Indicators):**
- Loading states must not add significant overhead
- Debouncing (200ms) already applied - maintain consistency
- Skeleton screens should use CSS-only animations

**With Story 6.3 (First-Time User Experience):**
- Onboarding must not impact app startup time
- Lazy load onboarding components
- Keep onboarding memory footprint <5MB

**With Epic 5 Features (Export, Dashboard, Comparison):**
- Export operations should not block UI
- Dashboard health calculations should be memoized
- Comparison diff should use efficient algorithms

### Previous Story Intelligence

**From Story 6.3 (First-Time User Experience):**
- LocalStorage operations: <10ms target
- Onboarding memory: <5MB overhead
- App startup with onboarding: <3 seconds (same as overall requirement)

**From Story 6.2 (Loading States & Progress Indicators):**
- Debouncing pattern: 200ms for state transitions
- Loading indicators for >200ms operations
- No loading flash for <200ms operations

**From Story 2.4 (Scope Switching Performance):**
- Tab switch: <100ms requirement
- Content caching in Zustand stores
- React.memo for tab components
- Pre-loading configuration data

**From Architecture Document:**
- File watching debounce: 300ms
- Performance monitoring utilities needed
- Virtualization for large lists
- Memory profiling requirements

### Git Intelligence Summary

**Recent Work Patterns (Last 5 Commits):**
- 0942519: Export functionality (UI store + backend integration)
- 401478d: Export features
- 5e49101: Project health dashboard optimizations
- 65b5e08: Dashboard features
- f0cda62: Test fixes

**Key Insights:**
1. **Dashboard Optimizations:** Recent work shows focus on performance in dashboard
2. **UI Store Patterns:** Active use of Zustand stores - ensure selectors are optimized
3. **Testing Focus:** Strong emphasis on test quality - include performance tests

### Dev Agent Guardrails

**MUST Follow Rules:**

1. **React.memo for List Items:**
```typescript
// REQUIRED for any component rendered in a list
export const ConfigItem = React.memo(({ config }: Props) => {
  // Component implementation
})
```

2. **Zustand Selector Optimization:**
```typescript
// REQUIRED: Use selective subscriptions
const projects = useProjectsStore(state => state.projects)

// FORBIDDEN: Full store subscription in components
const { projects, activeProject, setActiveProject } = useProjectsStore()
```

3. **useMemo for Calculations:**
```typescript
// REQUIRED for inheritance chain, diff calculations, etc.
const result = useMemo(() =>
  expensiveCalculation(data),
  [data]
)
```

4. **useCallback for Event Handlers:**
```typescript
// REQUIRED for handlers passed to memoized components
const handleClick = useCallback((id: string) => {
  doSomething(id)
}, [doSomething])
```

5. **Performance Measurement:**
```typescript
// REQUIRED for any potentially slow operation
const startTime = performance.now()
await operation()
console.debug(`Operation took ${performance.now() - startTime}ms`)
```

**Anti-Patterns to Avoid:**

❌ **Anonymous Functions in JSX:**
```typescript
// BAD: Creates new function on every render
<ConfigItem onClick={() => handleClick(id)} />
```

✅ **Memoized Handler:**
```typescript
// GOOD: Stable function reference
const handleItemClick = useCallback((id) => handleClick(id), [handleClick])
<ConfigItem onClick={handleItemClick} />
```

❌ **Inline Object Creation:**
```typescript
// BAD: Creates new object on every render
<ConfigItem style={{ marginTop: 10 }} />
```

✅ **Memoized Style:**
```typescript
// GOOD: Stable reference
const style = useMemo(() => ({ marginTop: 10 }), [])
<ConfigItem style={style} />
```

❌ **Full Store Subscription:**
```typescript
// BAD: Re-renders on any store change
const store = useProjectsStore()
```

✅ **Selective Subscription:**
```typescript
// GOOD: Only re-renders when specific value changes
const projects = useProjectsStore(state => state.projects)
```

### Performance Optimization Checklist

**Phase 1: Measurement Infrastructure**
1. [ ] Create performanceMonitor.ts with timing utilities
2. [ ] Add startup time measurement
3. [ ] Implement tab switch timing hooks
4. [ ] Add memory usage tracking
5. [ ] Create development-mode performance logging

**Phase 2: React Optimization**
6. [ ] Apply React.memo to ConfigList items
7. [ ] Apply React.memo to CapabilityPanel items
8. [ ] Add useMemo to inheritanceCalculator results
9. [ ] Add useCallback to all list item handlers
10. [ ] Implement lazy loading for non-critical components

**Phase 3: Virtual Scrolling**
11. [ ] Evaluate virtualization library options
12. [ ] Implement virtualized ConfigList
13. [ ] Implement virtualized CapabilityPanel
14. [ ] Add scroll position persistence
15. [ ] Test accessibility with screen readers

**Phase 4: State Management**
16. [ ] Optimize Zustand selectors in all components
17. [ ] Add shallow comparison to store subscriptions
18. [ ] Implement config data caching
19. [ ] Add memoization to inheritance calculations
20. [ ] Implement store update batching

**Phase 5: Backend Optimization**
21. [ ] Verify 300ms debouncing in watcher
22. [ ] Optimize file change event processing
23. [ ] Implement differential updates
24. [ ] Add performance metrics to Rust code
25. [ ] Verify <500ms detection latency

**Phase 6: Bundle Optimization**
26. [ ] Analyze bundle with rollup-plugin-visualizer
27. [ ] Implement code splitting
28. [ ] Tree-shake unused code
29. [ ] Optimize Tauri build config
30. [ ] Verify <10MB bundle size

**Phase 7: Memory & Testing**
31. [ ] Audit event listener cleanup
32. [ ] Review Tauri subscription lifecycle
33. [ ] Create memory leak tests
34. [ ] Add performance benchmarks to CI
35. [ ] Document performance baselines

### Success Criteria Checklist

✅ Startup time: <3 seconds (measured from launch to interactive)
✅ Tab switching: <100ms (all scope/project tabs)
✅ File detection: <500ms (from modification to UI update)
✅ Memory usage: <200MB (normal operation)
✅ CPU idle: <1% (no active operations)
✅ Initial render: <50ms (main content area)
✅ Large lists: Smooth scrolling (100+ items)
✅ Memory stability: No leaks (1+ hour use)
✅ Bundle size: <10MB (application package)
✅ Performance monitoring: Dev tools available

### References

- [Architecture: Performance Requirements](docs/architecture.md#non-functional-requirements)
- [Story 2.4: Scope Switching Performance](docs/sprint-artifacts/2-4-scope-switching-performance.md)
- [Story 6.2: Loading States](docs/sprint-artifacts/6-2-loading-states-and-progress-indicators.md)
- [Story 6.3: First-Time User Experience](docs/sprint-artifacts/6-3-first-time-user-experience.md)
- [React Performance Documentation](https://react.dev/reference/react/memo)
- [Zustand Performance](https://docs.pmnd.rs/zustand/guides/prevent-rerenders-with-use-shallow)

## Dev Agent Record

### Context Reference

This story file contains comprehensive context from:
- Enhanced epics file: `/Users/sunven/github/cc-config/docs/epics.md`
- Architecture: `/Users/sunven/github/cc-config/docs/architecture.md`
- Previous story implementations: Stories 6.1, 6.2, 6.3, 2.4
- Latest technical research: December 2025
- Git history analysis: Last 5 commits showing optimization patterns

### Agent Model Used

MiniMax-M2

### Debug Log References

- Epic 6 analysis: Complete - Error Handling & User Experience focus
- Architecture analysis: Complete - Performance NFRs extracted
- Story 6.3 learnings: Extracted - Onboarding performance constraints
- Story 6.2 learnings: Extracted - Debouncing patterns
- Story 2.4 learnings: Extracted - Tab switching optimization patterns
- Git intelligence: Recent dashboard optimizations and test quality focus

### Completion Notes List

1. **Epic Context Analyzed** - Story 6-4 part of Epic 6: Error Handling & User Experience
2. **Architecture NFRs Extracted** - Startup <3s, Tab <100ms, Memory <200MB, CPU <1%
3. **Previous Story Intelligence** - Debouncing patterns, caching strategies, memoization
4. **React Optimization Patterns** - React.memo, useMemo, useCallback documented
5. **Zustand Optimization** - Selective subscriptions and shallow comparison
6. **Virtual Scrolling** - Required for 100+ item lists
7. **File Watching** - 300ms debounce, <500ms detection latency
8. **Bundle Optimization** - Target <10MB with code splitting
9. **Memory Leak Prevention** - Event listener cleanup and profiling
10. **Testing Strategy** - Performance benchmarks and regression tests

### File List

Created: `/Users/sunven/github/cc-config/docs/sprint-artifacts/6-4-performance-optimization.md`

---

**Status:** ready-for-dev
**Next Action:** Run dev-story workflow for implementation
**Quality Competition:** Optional validate-create-story for independent LLM review
