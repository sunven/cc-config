# End-to-End (E2E) Tests

This directory contains Playwright-based end-to-end tests for the cc-config-viewer application.

## Test Structure

```
e2e/
├── basic-navigation.spec.ts      # Basic UI and navigation tests
├── user-scope.spec.ts            # User-level scope tests
├── project-scope.spec.ts         # Project-level scope tests
├── mcp-servers.spec.ts           # MCP servers display tests
├── sub-agents.spec.ts            # Sub agents tests
├── cross-project-comparison.spec.ts # Cross-project comparison tests
├── error-scenarios.spec.ts       # Error handling tests
└── accessibility.spec.ts         # WCAG 2.1 AA compliance tests
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (with browser visible)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test basic-navigation.spec.ts
```

### Run tests for specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests on mobile
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Test Configuration

The Playwright configuration is defined in `playwright.config.ts`. It includes:

- **Base URL**: `http://localhost:1420`
- **Browsers**: Chromium, Firefox, Webkit, Mobile Chrome, Mobile Safari
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML (default)
- **Artifacts**: Screenshots and videos on failure
- **Web Server**: Automatically starts `npm run dev`

## Writing Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should do something', async ({ page }) => {
    await page.click('[data-testid="element"]')
    await expect(page.locator('[data-testid="result"]')).toBeVisible()
  })
})
```

### Best Practices

1. **Use `data-testid` attributes** for selecting elements
2. **Always wait for page load state** before interacting
3. **Use `expect()` assertions** for verifying conditions
4. **Clean up after tests** if you modify state
5. **Use semantic queries** when possible (getByRole, getByText)
6. **Test accessibility** by including keyboard navigation

### Selectors Priority

1. `getByRole` - Most semantic and accessible
2. `getByText` - Good for visible text
3. `data-testid` - Most reliable for testing
4. CSS/XPath - Last resort

## Continuous Integration

Tests are configured to run in CI with:
- Parallel execution disabled
- 2 retries for flaky tests
- Screenshots and videos retained on failure
- HTML report generated

## Debugging Tests

### Visual Debugging
```bash
npm run test:e2e:ui
```

### Headed Mode
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Trace Viewer
After test run, open the trace:
```bash
npx playwright show-trace trace.zip
```

## Coverage Areas

### ✅ Implemented Tests

1. **Basic Navigation** (basic-navigation.spec.ts)
   - Application loading
   - Tab switching
   - Sidebar toggle
   - Keyboard navigation
   - Responsive layout
   - Error handling

2. **User Scope** (user-scope.spec.ts)
   - User   - MCP servers display
   - Sub agents display
   - Search and filter
   - Export functionality

3. **Project-level configurations
 Scope** (project-scope.spec.ts)
   - Project selection
   - Project-level configurations
   - Inheritance display
   - Comparison with user scope

4. **MCP Servers** (mcp-servers.spec.ts)
   - Server list display
   - Server details
   - Filtering by type/status
   - Search functionality
   - Configuration export

5. **Sub Agents** (sub-agents.spec.ts)
   - Agent list display
   - Permission display
   - Status filtering
   - Search functionality

6. **Cross-Project Comparison** (cross-project-comparison.spec.ts)
   - Multi-project selection
   - Difference highlighting
   - Side-by-side comparison
   - Filter by configuration type

7. **Error Scenarios** (error-scenarios.spec.ts)
   - Network errors
   - Timeout errors
   - Permission errors
   - Invalid JSON
   - Recovery mechanisms

8. **Accessibility** (accessibility.spec.ts)
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Focus indicators
   - Color contrast
   - Semantic HTML

## Test Data

Tests use mock data and routes to simulate:
- Valid configurations
- Invalid configurations
- Network failures
- Various project states
- Error conditions

## Reporting

### HTML Report
After test run, open `playwright-report/index.html` in a browser to view detailed results.

### Screenshots
Failed test screenshots are saved in `test-results/`.

### Videos
Failed test videos are saved in `test-results/`.

## Dependencies

- `@playwright/test` - Test runner
- Playwright browsers (Chromium, Firefox, Webkit)

## Troubleshooting

### Tests timing out
- Increase timeout in test or configuration
- Check if web server is starting correctly

### Element not found
- Verify `data-testid` attributes exist
- Check if element is in viewport
- Ensure proper wait conditions

### Tests flaky
- Add proper wait conditions
- Increase retry count
- Check for race conditions

## Future Enhancements

- [ ] Add visual regression tests
- [ ] Add performance tests
- [ ] Add API integration tests
- [ ] Add multi-window tests
- [ ] Add file upload tests
- [ ] Add animation tests
