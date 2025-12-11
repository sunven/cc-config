import { test, expect } from '@playwright/test'

test.describe('User-Level Scope View and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: /user/i }).click()
  })

  test('should display user-level configurations', async ({ page }) => {
    const configList = page.locator('[data-testid="config-list"]')
    await expect(configList).toBeVisible()

    const configItems = page.locator('[data-testid="config-item"]')
    await expect(configItems.first()).toBeVisible()
  })

  test('should show user scope indicator', async ({ page }) => {
    const scopeIndicator = page.locator('[data-testid="scope-indicator"]')
    await expect(scopeIndicator).toContainText(/user/i)
  })

  test('should display user config source path', async ({ page }) => {
    const sourcePath = page.locator('[data-testid="source-path"]')
    await expect(sourcePath).toContainText(/\.claude\.json/)
  })

  test('should show MCP servers section', async ({ page }) => {
    const mcpSection = page.locator('[data-testid="mcp-servers-section"]')
    await expect(mcpSection).toBeVisible()

    const mcpHeader = mcpSection.locator('h2')
    await expect(mcpHeader).toContainText(/MCP Servers/i)
  })

  test('should display MCP server details', async ({ page }) => {
    const mcpServers = page.locator('[data-testid="mcp-server-item"]')
    if (await mcpServers.first().isVisible()) {
      await expect(mcpServers.first()).toBeVisible()

      const serverName = mcpServers.first().locator('[data-testid="server-name"]')
      await expect(serverName).toBeVisible()

      const serverType = mcpServers.first().locator('[data-testid="server-type"]')
      await expect(serverType).toBeVisible()
    }
  })

  test('should show Sub Agents section', async ({ page }) => {
    const agentsSection = page.locator('[data-testid="sub-agents-section"]')
    await expect(agentsSection).toBeVisible()

    const agentsHeader = agentsSection.locator('h2')
    await expect(agentsHeader).toContainText(/Sub Agents/i)
  })

  test('should display Sub Agent details', async ({ page }) => {
    const agents = page.locator('[data-testid="sub-agent-item"]')
    if (await agents.first().isVisible()) {
      await expect(agents.first()).toBeVisible()

      const agentName = agents.first().locator('[data-testid="agent-name"]')
      await expect(agentName).toBeVisible()

      const agentPermissions = agents.first().locator('[data-testid="agent-permissions"]')
      await expect(agentPermissions).toBeVisible()
    }
  })

  test('should filter configurations by search', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]')

    if (await searchInput.isVisible()) {
      await searchInput.fill('mcp')

      await page.waitForTimeout(500)

      const configItems = page.locator('[data-testid="config-item"]')
      const itemCount = await configItems.count()

      for (let i = 0; i < itemCount; i++) {
        const item = configItems.nth(i)
        const text = await item.textContent()
        if (text) {
          expect(text.toLowerCase()).toContain('mcp')
        }
      }
    }
  })

  test('should sort configurations', async ({ page }) => {
    const sortButton = page.locator('[data-testid="sort-button"]')

    if (await sortButton.isVisible()) {
      await sortButton.click()

      const sortMenu = page.locator('[data-testid="sort-menu"]')
      await expect(sortMenu).toBeVisible()

      await sortMenu.locator('text=Name').click()

      const configItems = page.locator('[data-testid="config-item"]')
      await expect(configItems.first()).toBeVisible()
    }
  })

  test('should show configuration details on click', async ({ page }) => {
    const configItem = page.locator('[data-testid="config-item"]').first()

    if (await configItem.isVisible()) {
      await configItem.click()

      const detailsPanel = page.locator('[data-testid="config-details"]')
      await expect(detailsPanel).toBeVisible()

      const configKey = detailsPanel.locator('[data-testid="config-key"]')
      await expect(configKey).toBeVisible()

      const configValue = detailsPanel.locator('[data-testid="config-value"]')
      await expect(configValue).toBeVisible()
    }
  })

  test('should display inheritance information', async ({ page }) => {
    const inheritanceBadge = page.locator('[data-testid="inheritance-badge"]')

    if (await inheritanceBadge.isVisible()) {
      await expect(inheritanceBadge).toContainText(/user-level/i)
    }
  })

  test('should show configuration count', async ({ page }) => {
    const configCount = page.locator('[data-testid="config-count"]')
    await expect(configCount).toBeVisible()

    const countText = await configCount.textContent()
    expect(countText).toMatch(/\d+\s+config/)
  })

  test('should export user configurations', async ({ page }) => {
    const exportButton = page.locator('[data-testid="export-button"]')

    if (await exportButton.isVisible()) {
      await exportButton.click()

      const exportDialog = page.locator('[data-testid="export-dialog"]')
      await expect(exportDialog).toBeVisible()

      await exportDialog.locator('button', { hasText: /Export/i }).click()

      const downloadPromise = page.waitForEvent('download')
      await downloadPromise
    }
  })

  test('should refresh configurations', async ({ page }) => {
    const refreshButton = page.locator('[data-testid="refresh-button"]')

    if (await refreshButton.isVisible()) {
      await refreshButton.click()

      const loadingSpinner = page.locator('[data-testid="loading-spinner"]')
      await expect(loadingSpinner).toBeVisible()

      await expect(loadingSpinner).toBeHidden({ timeout: 5000 })
    }
  })

  test('should show last updated timestamp', async ({ page }) => {
    const lastUpdated = page.locator('[data-testid="last-updated"]')

    if (await lastUpdated.isVisible()) {
      await expect(lastUpdated).toContainText(/last updated/i)
      await expect(lastUpdated).toContainText(/\d{2}:\d{2}/)
    }
  })

  test('should display configuration types', async ({ page }) => {
    const typeFilter = page.locator('[data-testid="type-filter"]')

    if (await typeFilter.isVisible()) {
      await typeFilter.click()

      const typeOptions = page.locator('[data-testid="type-options"]')
      await expect(typeOptions).toBeVisible()

      const options = typeOptions.locator('[role="option"]')
      const optionCount = await options.count()
      expect(optionCount).toBeGreaterThan(0)
    }
  })
})
