# Memory Stability Verification

## Task 7.5: Verify Stable Memory After 1+ Hour Use

## Overview

This document outlines the verification process to ensure the application's memory usage remains stable during extended use (1+ hours), confirming that WeakRef implementation and other memory optimizations are working correctly.

## Memory Stability Requirements

### Target Metrics
- **Memory Usage**: < 200 MB after 1 hour of use
- **Memory Growth**: < 10 MB growth from start to end of session
- **Memory Leaks**: 0 detectable memory leaks
- **Cache Eviction**: WeakRef caches properly evict unused entries

## Verification Checklist

### Pre-Verification Setup

#### 1. Environment Preparation
- [ ] Close all other applications to free memory
- [ ] Ensure system has at least 4GB free RAM
- [ ] Use Chrome/Edge/Firefox with performance monitoring enabled
- [ ] Enable performance.memory API (if using Chrome, launch with `--enable-precise-memory-info`)

#### 2. Application Build
- [ ] Build application in production mode
- [ ] Verify TypeScript compilation with no errors
- [ ] Check bundle size is within limits (< 10MB)

### Memory Monitoring Tools

#### Browser DevTools (Primary Method)
1. **Open DevTools**
   - F12 → Performance tab
   - Or F12 → Memory tab

2. **Performance Tab Monitoring**
   ```
   Performance Tab:
   - Click "Record"
   - Set duration to 10-15 minutes
   - Check "Web Vitals" checkbox
   - Record memory usage over time
   ```

3. **Memory Tab Monitoring**
   ```
   Memory Tab:
   - Click "Take heap snapshot"
   - Perform typical user actions
   - Take another snapshot
   - Compare snapshots for growth
   ```

#### Memory Monitor Hook (Automated)
The application includes `useMemoryMonitor.ts` hook that:
- [ ] Tracks memory every 30 seconds
- [ ] Logs warnings at 150 MB
- [ ] Logs critical alerts at 200 MB
- [ ] Exports memory reports

Access memory report:
```javascript
// In browser console
import { exportMemoryReport } from './src/hooks/useMemoryMonitor'
const report = exportMemoryReport()
console.table(report)
```

### Testing Scenarios

#### Scenario 1: Normal Usage (30 minutes)
- [ ] **Start**: Note initial memory usage
- [ ] **Action 1**: Load user configs (switch to user scope)
- [ ] **Action 2**: Switch to project scope 10 times
- [ ] **Action 3**: Navigate between all tabs 20 times
- [ ] **Action 4**: Open and close modals 5 times
- [ ] **Action 5**: Use filter/search features
- [ ] **Check**: Memory should not grow > 10 MB

**Expected Results**:
```
Initial Memory:    ~120 MB
After 30 min:      ~125 MB
Growth:            5 MB (acceptable)
Peak Memory:       < 150 MB
```

#### Scenario 2: Intensive Usage (60 minutes)
- [ ] **Start**: Note initial memory usage
- [ ] **Loop for 60 minutes**:
  - Switch scopes every 30 seconds
  - Open/close capability details
  - Use search and filters
  - Trigger config file changes (if possible)
  - Switch between all tabs
- [ ] **Check**: Memory should stabilize (no continuous growth)

**Expected Results**:
```
Initial Memory:    ~120 MB
After 60 min:      ~130 MB
Growth:            10 MB (acceptable)
Stabilization:     Memory stops growing after ~20 min
```

#### Scenario 3: Stress Test (Multiple Projects)
- [ ] **Start**: Note initial memory usage
- [ ] **Action**: Open 5 different project configurations
- [ ] **Loop for 30 minutes**:
  - Switch between projects every 20 seconds
  - Load configs for each project
  - View capabilities and agents
  - Export data (if applicable)
- [ ] **Check**: Memory should stabilize with multiple project caches

**Expected Results**:
```
Initial Memory:    ~120 MB
After 30 min:      ~135 MB
Growth:            15 MB (acceptable)
Cache Entries:     Project cache should have 5 entries max
GC Events:         WeakRef should clean up unused entries
```

#### Scenario 4: Memory Leak Detection
- [ ] **Setup**: Take initial heap snapshot
- [ ] **Action**: Perform normal usage for 10 minutes
- [ ] **Action**: Take another heap snapshot
- [ ] **Action**: Compare snapshots

**What to Look For**:
```
Heap Comparison:
- Detached DOM nodes: 0
- Event listeners: No growth
- Cached objects: Should fluctuate (WeakRef working)
- Memory growth: Linear (BAD) vs Stabilized (GOOD)
```

### Memory Profiling Metrics

#### Key Metrics to Track

1. **JavaScript Heap Size**
   ```
   Current: [MB]
   Used: [MB]
   Total: [MB]
   Limit: [MB]
   ```

2. **Cache Performance**
   ```
   Inheritance Chain Cache:
   - Hit Rate: [X%]
   - Entries: [N]
   - GC'd Entries: [N]

   Config Store Cache:
   - User Cache Hit Rate: [X%]
   - Project Cache Hit Rate: [X%]
   - Project Cache Entries: [N]
   ```

3. **Event Listeners**
   ```
   Total Event Listeners: [N]
   Should remain stable (no growth)
   ```

#### Memory Timeline

Create a timeline chart:
```
Time    | Memory (MB) | Notes
--------|-------------|--------------------
0 min   | 120         | App started
10 min  | 125         | Normal usage
20 min  | 128         | Multiple scope switches
30 min  | 130         | Stabilized?
40 min  | 132         | Continued usage
50 min  | 132         | Same (stable!)
60 min  | 132         | Stable (success!)
```

### Success Criteria

#### ✅ Pass Criteria
- [ ] Memory grows less than 10 MB over 1 hour
- [ ] Memory stabilizes (plateaus) after ~20-30 minutes
- [ ] No continuous linear growth
- [ ] Memory stays under 200 MB threshold
- [ ] No detectable memory leaks
- [ ] WeakRef caches properly evict entries
- [ ] All event listeners properly cleaned up
- [ ] Performance remains responsive

#### ❌ Fail Criteria
- [ ] Memory grows > 20 MB over 1 hour
- [ ] Continuous linear growth
- [ ] Memory exceeds 250 MB
- [ ] Application becomes sluggish
- [ ] Detected memory leaks in heap snapshots
- [ ] Cache entries never get garbage collected

### Automated Monitoring

#### Console Logging
The application includes automatic memory logging:

```typescript
// In browser console
// Memory is logged every 30 seconds
// Watch for messages like:
// [MemoryMonitor] Current: 125 MB | Growth: 5 MB | Status: OK
```

#### Memory Report Export
```javascript
// Generate comprehensive memory report
import { exportMemoryReport } from './src/hooks/useMemoryMonitor'

const report = exportMemoryReport()
/*
{
  measurements: [...],
  maxMemory: 150,
  averageMemory: 130,
  totalGrowth: 10,
  warnings: [],
  criticalAlerts: []
}
*/
```

### Troubleshooting

#### If Memory Grows Continuously

1. **Check Event Listeners**
   ```javascript
   // In DevTools console
   getEventListeners(document)
   // Verify no unexpected growth
   ```

2. **Check Cache Entries**
   ```javascript
   // In DevTools console
   // Check cache sizes
   console.log('Inheritance cache:', inheritanceChainCache.length)
   console.log('Config store cache:', Object.keys(projectConfigsCache).length)
   ```

3. **Force Garbage Collection**
   ```javascript
   // In DevTools console (Chrome)
   if (window.gc) window.gc()
   // Check if memory decreases
   ```

4. **Check for Detached DOM Nodes**
   ```javascript
   // In DevTools → Memory tab
   // Take heap snapshot
   // Search for "Detached"
   // Should show 0 detached nodes
   ```

#### If Memory Exceeds Threshold

1. **Identify Leaking Component**
   - Use DevTools Performance tab
   - Record while performing actions
   - Look for memory spikes

2. **Check Cache Configuration**
   - Verify TTL settings are appropriate
   - Check max cache sizes
   - Ensure WeakRef is working

3. **Review Event Cleanup**
   - Verify all useEffect hooks have cleanup
   - Check setInterval/clearInterval pairs
   - Verify event listeners removed

### Reporting Template

#### Memory Stability Report
```
Date: [YYYY-MM-DD]
Browser: [Chrome/Firefox/Safari]
Duration: [XX minutes]

Initial Memory: [XX] MB
Final Memory: [XX] MB
Total Growth: [XX] MB
Peak Memory: [XX] MB

Cache Performance:
- Inheritance Cache: [XX] entries
- User Cache: [XX] hits ([XX]%)
- Project Cache: [XX] hits ([XX]%)

Event Listeners:
- Initial: [XX]
- Final: [XX]
- Growth: [XX]

Result: ✅ PASS / ❌ FAIL

Notes:
- Memory behavior: [Stable/Growing]
- Performance: [Good/Slow]
- Issues found: [None/Description]
```

### Long-Term Verification

#### Extended Testing (Optional)
For production readiness, consider:
- [ ] 24-hour stress test
- [ ] Multiple days of normal usage
- [ ] Testing with large config files
- [ ] Testing with slow memory systems
- [ ] Testing on low-end devices

## Conclusion

**Memory Stability Verification** ensures the application:
1. Uses memory efficiently
2. Doesn't leak memory over time
3. Provides consistent performance
4. Scales well with extended use

The WeakRef implementation, event listener cleanup, and other memory optimizations should result in stable, predictable memory usage even during extended use.

## Manual Verification Procedure

### Quick Check (15 minutes)
1. Open DevTools → Performance
2. Record memory while using app normally
3. Check for continuous growth
4. Verify memory stabilizes

### Full Verification (60 minutes)
1. Follow Scenario 2 (Intensive Usage)
2. Monitor with DevTools + useMemoryMonitor hook
3. Take heap snapshots at start and end
4. Generate and review memory report

### Success Metrics
- Memory growth: < 10 MB over 1 hour
- Memory stabilizes: After 20-30 minutes
- Peak memory: < 200 MB
- Memory leaks: 0 detected

**Task 7.5 Status**: Ready for manual verification in production environment.
