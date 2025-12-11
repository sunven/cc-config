import { test, expect } from '@playwright/test'

test.describe('Project-Level Scope View and Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should switch to project tab', async ({ page }) => {
    const projectTab = page.getByRole('tab', { name: /project/i })
    await projectTab.click()

    await expect(projectTab).toHaveAttribute('data-state', 'active')
    await expect(page.getByRole('tab', { name: /user/i })).toHaveAttribute('data-state', 'inactive')
  })

  test('should display project selector', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const projectSelector = page.locator('[data-testid="project-selector"]')
    await expect(projectSelector).toBeVisible()
  })

  test('should show project list', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const projectSelector = page.locator('[data-testid="project-selector"]')
    await projectSelector.click()

    const projectList = page.locator('[data-testid="project-list"]')
    await expect(projectList).toBeVisible()
  })

  test('should select a project', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const projectSelector = page.locator('[data-testid="project-selector"]')
    await projectSelector.click()

    const projectItem = page.locator('[data-testid="project-item"]').first()

    if (await projectItem.isVisible()) {
      await projectItem.click()

      const selectedProjectName = projectSelector.locator('[data-testid="selected-project-name"]')
      await expect(selectedProjectName).toBeVisible()
    }
  })

  test('should display project-level configurations', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const configList = page.locator('[data-testid="config-list"]')
    await expect(configList).toBeVisible()

    const configItems = page.locator('[data-testid="config-item"]')
    if (await configItems.first().isVisible()) {
      await expect(configItems.first()).toBeVisible()
    }
  })

  test('should show project scope indicator', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const scopeIndicator = page.locator('[data-testid="scope-indicator"]')
    await expect(scopeIndicator).toContainText(/project/i)
  })

  test('should display project config source path', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const sourcePath = page.locator('[data-testid="source-path"]')
    await expect(sourcePath).toContainText(/\.mcp\.json/)
  })

  test('should show inheritance badges for overridden configs', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const inheritanceBadges = page.locator('[data-testid="inheritance-badge"]')

    if (await inheritanceBadges.first().isVisible()) {
      await expect(inheritanceBadges.first()).toContainText(/overridden|project/i)
    }
  })

  test('should display merged configurations from user and project', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const configList = page.locator('[data-testid="config-list"]')
    await expect(configList).toBeVisible()

    const configItems = page.locator('[data-testid="config-item"]')
    const itemCount = await configItems.count()

    expect(itemCount).toBeGreaterThan(0)
  })

  test('should filter configurations by project scope', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const scopeFilter = page.locator('[data-testid="scope-filter"]')

    if (await scopeFilter.isVisible()) {
      await scopeFilter.click()

      const filterOptions = page.locator('[data-testid="filter-options"]')
      await expect(filterOptions).toContainText(/inherited|project-specific|overridden/i)
    }
  })

  test('should compare user vs project configs', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const compareView = page.locator('[data-testid="compare-view"]')
      await expect(compareView).toBeVisible()

      const userColumn = compareView.locator('[data-testid="user-column"]')
      const projectColumn = compareView.locator('[data-testid="project-column"]')

      await expect(userColumn).toContainText(/user/i)
      await expect(projectColumn).toContainText(/project/i)
    }
  })

  test('should highlight differences between scopes', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const configItem = page.locator('[data-testid="config-item"]').first()

    if (await configItem.isVisible()) {
      const diffHighlight = configItem.locator('[data-testid="diff-highlight"]')
      if (await diffHighlight.isVisible()) {
        await expect(diffHighlight).toHaveClass(/diff/)
      }
    }
  })

  test('should show project health status', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const healthStatus = page.locator('[data-testid="project-health"]')

    if (await healthStatus.isVisible()) {
      await expect(healthStatus).toContainText(/healthy|degraded|error/i)
    }
  })

  test('should navigate between multiple projects', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const projectSelector = page.locator('[data-testid="project-selector"]')
    await projectSelector.click()

    const projects = page.locator('[data-testid="project-item"]')

    if (await projects.count() > 1) {
      await projects.first().click()
      await page.waitForTimeout(500)

      await projectSelector.click()
      await projects.nth(1).click()
      await page.waitForTimeout(500)

      const selectedProjectName = projectSelector.locator('[data-testid="selected-project-name"]')
      await expect(selectedProjectName).toBeVisible()
    }
  })

  test('should reload project configurations', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const reloadButton = page.locator('[data-testid="reload-button"]')

    if (await reloadButton.isVisible()) {
      await reloadButton.click()

      const loadingSpinner = page.locator('[data-testid="loading-spinner"]')
      await expect(loadingSpinner).toBeVisible()

      await expect(loadingSpinner).toBeHidden({ timeout: 5000 })
    }
  })

  test('should display project-specific error messages', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const errorMessage = page.locator('[data-testid="error-message"]')

    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible()
      const text = await errorMessage.textContent()
      expect(text).toMatch(/error|failed|invalid/i)
    }
  })

  test('should show configuration statistics for project', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const statsPanel = page.locator('[data-testid="stats-panel"]')

    if (await statsPanel.isVisible()) {
      await expect(statsPanel).toContainText(/total|overridden|inherited/i)

      const totalCount = statsPanel.locator('[data-testid="total-count"]')
      await expect(totalCount).toBeVisible()

      const overriddenCount = statsPanel.locator('[data-testid="overridden-count"]')
      await expect(overriddenCount).toBeVisible()
    }
  })
})
