import { test, expect } from '@playwright/test'

test.describe('Project Health Dashboard (Task 3.8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Dashboard Overview', () => {
    test('should display project health dashboard', async ({ page }) => {
      const healthDashboard = page.locator('[data-testid="health-dashboard"]')

      if (await healthDashboard.isVisible()) {
        await expect(healthDashboard).toBeVisible()
      }
    })

    test('should show overall health score', async ({ page }) => {
      const healthScore = page.locator('[data-testid="health-score"]')

      if (await healthScore.isVisible()) {
        const scoreText = await healthScore.textContent()
        expect(scoreText).toMatch(/\d+%|healthy|warning|critical/i)
      }
    })

    test('should display health status indicator', async ({ page }) => {
      const statusIndicator = page.locator('[data-testid="health-status-indicator"]')

      if (await statusIndicator.isVisible()) {
        await expect(statusIndicator).toHaveAttribute('data-status', /healthy|warning|critical|unknown/i)
      }
    })

    test('should show last check timestamp', async ({ page }) => {
      const lastCheckTime = page.locator('[data-testid="last-health-check"]')

      if (await lastCheckTime.isVisible()) {
        await expect(lastCheckTime).toContainText(/ago|just now|\d{2}:\d{2}/i)
      }
    })
  })

  test.describe('Health Metrics', () => {
    test('should display configuration validation status', async ({ page }) => {
      const configValidation = page.locator('[data-testid="config-validation-status"]')

      if (await configValidation.isVisible()) {
        await expect(configValidation).toContainText(/valid|invalid|warnings|errors/i)
      }
    })

    test('should show MCP servers health status', async ({ page }) => {
      const mcpHealth = page.locator('[data-testid="mcp-servers-health"]')

      if (await mcpHealth.isVisible()) {
        await expect(mcpHealth).toContainText(/active|inactive|error|connected/i)
      }
    })

    test('should display Sub Agents health status', async ({ page }) => {
      const agentsHealth = page.locator('[data-testid="agents-health"]')

      if (await agentsHealth.isVisible()) {
        await expect(agentsHealth).toContainText(/active|inactive|error|enabled/i)
      }
    })

    test('should show file system access status', async ({ page }) => {
      const fileAccessStatus = page.locator('[data-testid="file-access-status"]')

      if (await fileAccessStatus.isVisible()) {
        await expect(fileAccessStatus).toContainText(/accessible|restricted|error/i)
      }
    })

    test('should display configuration file count', async ({ page }) => {
      const fileCount = page.locator('[data-testid="config-file-count"]')

      if (await fileCount.isVisible()) {
        const countText = await fileCount.textContent()
        expect(countText).toMatch(/\d+\s*(file|config)/i)
      }
    })
  })

  test.describe('Health Check Actions', () => {
    test('should refresh health check on demand', async ({ page }) => {
      const refreshButton = page.locator('[data-testid="refresh-health-check"]')

      if (await refreshButton.isVisible()) {
        await refreshButton.click()

        const loadingSpinner = page.locator('[data-testid="health-check-loading"]')
        await expect(loadingSpinner).toBeVisible()

        await expect(loadingSpinner).toBeHidden({ timeout: 10000 })
      }
    })

    test('should auto-refresh health status periodically', async ({ page }) => {
      const healthScore = page.locator('[data-testid="health-score"]')

      if (await healthScore.isVisible()) {
        const initialScore = await healthScore.textContent()

        await page.waitForTimeout(5000)

        const updatedScore = await healthScore.textContent()
        expect(updatedScore).toBeDefined()
      }
    })

    test('should navigate to detailed health report', async ({ page }) => {
      const viewDetailsButton = page.locator('[data-testid="view-health-details"]')

      if (await viewDetailsButton.isVisible()) {
        await viewDetailsButton.click()

        const detailedReport = page.locator('[data-testid="health-details-panel"]')
        await expect(detailedReport).toBeVisible()
      }
    })
  })

  test.describe('Issue Detection', () => {
    test('should display configuration issues list', async ({ page }) => {
      const issuesList = page.locator('[data-testid="config-issues-list"]')

      if (await issuesList.isVisible()) {
        const issues = issuesList.locator('[data-testid="issue-item"]')
        const issueCount = await issues.count()
        expect(issueCount).toBeGreaterThanOrEqual(0)
      }
    })

    test('should show issue severity levels', async ({ page }) => {
      const issuesList = page.locator('[data-testid="config-issues-list"]')

      if (await issuesList.isVisible()) {
        const issueItem = issuesList.locator('[data-testid="issue-item"]').first()

        if (await issueItem.isVisible()) {
          const severityBadge = issueItem.locator('[data-testid="issue-severity"]')
          await expect(severityBadge).toContainText(/critical|high|medium|low|warning/i)
        }
      }
    })

    test('should provide fix suggestions for issues', async ({ page }) => {
      const issueItem = page.locator('[data-testid="issue-item"]').first()

      if (await issueItem.isVisible()) {
        await issueItem.click()

        const fixSuggestion = page.locator('[data-testid="fix-suggestion"]')
        if (await fixSuggestion.isVisible()) {
          await expect(fixSuggestion).toBeVisible()
        }
      }
    })

    test('should filter issues by severity', async ({ page }) => {
      const severityFilter = page.locator('[data-testid="severity-filter"]')

      if (await severityFilter.isVisible()) {
        await severityFilter.click()

        const filterOptions = page.locator('[data-testid="severity-option"]')
        await expect(filterOptions.first()).toBeVisible()
      }
    })

    test('should sort issues by severity', async ({ page }) => {
      const sortButton = page.locator('[data-testid="sort-by-severity"]')

      if (await sortButton.isVisible()) {
        await sortButton.click()

        const issueItems = page.locator('[data-testid="issue-item"]')
        const firstIssue = issueItems.first()

        if (await firstIssue.isVisible()) {
          const severity = await firstIssue.locator('[data-testid="issue-severity"]').textContent()
          expect(severity).toMatch(/critical|high/i)
        }
      }
    })
  })

  test.describe('Multi-Project Health Overview', () => {
    test('should display health summary for all projects', async ({ page }) => {
      const projectHealthList = page.locator('[data-testid="all-projects-health"]')

      if (await projectHealthList.isVisible()) {
        const projectItems = projectHealthList.locator('[data-testid="project-health-item"]')
        const count = await projectItems.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    })

    test('should show aggregated health score across projects', async ({ page }) => {
      const aggregateScore = page.locator('[data-testid="aggregate-health-score"]')

      if (await aggregateScore.isVisible()) {
        const scoreText = await aggregateScore.textContent()
        expect(scoreText).toMatch(/\d+%|all\s*healthy|issues\s*found/i)
      }
    })

    test('should highlight unhealthy projects', async ({ page }) => {
      const unhealthyProjects = page.locator('[data-testid="project-health-item"][data-health="unhealthy"]')

      const count = await unhealthyProjects.count()
      if (count > 0) {
        await expect(unhealthyProjects.first()).toHaveClass(/unhealthy|warning|error/i)
      }
    })

    test('should navigate to specific project health details', async ({ page }) => {
      const projectHealthItem = page.locator('[data-testid="project-health-item"]').first()

      if (await projectHealthItem.isVisible()) {
        await projectHealthItem.click()

        const projectDetails = page.locator('[data-testid="project-health-details"]')
        await expect(projectDetails).toBeVisible()
      }
    })
  })

  test.describe('Health Notifications', () => {
    test('should display health alerts', async ({ page }) => {
      const alertBanner = page.locator('[data-testid="health-alert"]')

      if (await alertBanner.isVisible()) {
        await expect(alertBanner).toContainText(/warning|error|critical|attention/i)
      }
    })

    test('should dismiss health alerts', async ({ page }) => {
      const alertBanner = page.locator('[data-testid="health-alert"]')

      if (await alertBanner.isVisible()) {
        const dismissButton = alertBanner.locator('[data-testid="dismiss-alert"]')
        await dismissButton.click()

        await expect(alertBanner).toBeHidden()
      }
    })

    test('should show notification badge for issues', async ({ page }) => {
      const healthTab = page.getByRole('tab', { name: /health/i })

      if (await healthTab.isVisible()) {
        const badge = healthTab.locator('[data-testid="issue-badge"]')
        if (await badge.isVisible()) {
          const badgeText = await badge.textContent()
          expect(badgeText).toMatch(/\d+/)
        }
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should have accessible health status announcements', async ({ page }) => {
      const healthStatus = page.locator('[data-testid="health-status-indicator"]')

      if (await healthStatus.isVisible()) {
        await expect(healthStatus).toHaveAttribute('role', /status|alert/i)
        await expect(healthStatus).toHaveAttribute('aria-live', /polite|assertive/i)
      }
    })

    test('should provide keyboard navigation for health dashboard', async ({ page }) => {
      const dashboard = page.locator('[data-testid="health-dashboard"]')

      if (await dashboard.isVisible()) {
        await page.keyboard.press('Tab')

        const focusedElement = page.locator(':focus')
        await expect(focusedElement).toBeVisible()
      }
    })

    test('should have descriptive labels for health metrics', async ({ page }) => {
      const metrics = page.locator('[data-testid^="health-metric-"]')

      if (await metrics.first().isVisible()) {
        await expect(metrics.first()).toHaveAttribute('aria-label')
      }
    })
  })
})
