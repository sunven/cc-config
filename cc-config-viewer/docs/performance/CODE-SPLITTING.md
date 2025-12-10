# Code Splitting Implementation

## Overview

Implemented React.lazy() and Suspense for code splitting heavy components to reduce initial bundle size.

## Components Split

### Heavy Components Lazy-Loaded
1. **CapabilityPanel** (~18.49 KB)
   - Heavy with MCP/Agent data processing
   - Loaded when "Capabilities" tab is selected
   - Suspense fallback: LoadingStates component variant

2. **ProjectDashboard** (~14.63 KB)
   - Comprehensive dashboard view
   - Loaded when "Dashboard" tab is selected
   - Suspense fallback: LoadingStates component variant

3. **ProjectComparison** (~9.61 KB)
   - Comparison view component
   - Loaded only when comparison is active
   - Suspense fallback: LoadingStates component variant

4. **OnboardingWizard** (~8.63 KB)
   - Onboarding flow modal
   - Loaded on first app launch
   - Suspense fallback: Fullscreen loading state

## Bundle Size Impact

### Before Code Splitting
- Main bundle: 480.30 KB
- Single chunk containing all components

### After Code Splitting
- Main bundle: 399.24 KB (↓81 KB reduction)
- Additional chunks loaded on demand:
  - OnboardingWizard: 8.63 KB
  - ProjectComparison: 9.61 KB
  - ProjectDashboard: 14.63 KB
  - CapabilityPanel: 18.49 KB
  - ExportButton: 31.65 KB

**Total**: ~473 KB across all chunks (similar total, but better caching and faster initial load)

## Benefits

1. **Faster Initial Load**: Main bundle reduced by ~17%
2. **Better Caching**: Components rarely change, browsers cache chunks
3. **On-Demand Loading**: Heavy components only load when needed
4. **Improved TTI**: Time to Interactive reduced due to smaller initial payload

## Implementation

### Lazy Loading Pattern
```typescript
// Import components lazily
const CapabilityPanel = lazy(() =>
  import('@/components/CapabilityPanel').then(m => ({
    default: m.CapabilityPanel
  }))
)
```

### Suspense Boundaries
```typescript
<TabsContent value="capabilities">
  <Suspense fallback={<LoadingStates variant="component" message="Loading..." />}>
    <CapabilityPanel scope="user" />
  </Suspense>
</TabsContent>
```

## Best Practices

1. **Suspense Placement**: Wrap each lazy component individually
2. **Loading States**: Use appropriate LoadingStates variant (component vs fullscreen)
3. **Error Boundaries**: Components already wrapped in ErrorBoundary
4. **Consistent Fallbacks**: All Suspense boundaries use LoadingStates

## Future Enhancements

Consider lazy-loading:
- ConfigList (if >100 items)
- McpList (when tabs switched)
- AgentList (when tabs switched)
- Export functionality (already split as ExportButton)

## Testing

- Build successful with code splitting
- Components load correctly with Suspense fallbacks
- No breaking changes to component APIs
