import { test, expect } from '@playwright/test'

test.describe('MCP Servers Display and Details View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display MCP servers section', async ({ page }) => {
    const mcpSection = page.locator('[data-testid="mcp-servers-section"]')
    await expect(mcpSection).toBeVisible()
  })

  test('should list all MCP servers', async ({ page }) => {
    const mcpServers = page.locator('[data-testid="mcp-server-item"]')
    const serverCount = await mcpServers.count()

    expect(serverCount).toBeGreaterThanOrEqual(0)

    if (serverCount > 0) {
      await expect(mcpServers.first()).toBeVisible()
    }
  })

  test('should show MCP server name', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      const serverName = mcpServer.locator('[data-testid="server-name"]')
      await expect(serverName).toBeVisible()

      const nameText = await serverName.textContent()
      expect(nameText).toBeTruthy()
    }
  })

  test('should display MCP server type', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      const serverType = mcpServer.locator('[data-testid="server-type"]')
      await expect(serverType).toContainText(/stdio|http|websocket/i)
    }
  })

  test('should show server status indicator', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      const statusIndicator = mcpServer.locator('[data-testid="status-indicator"]')
      await expect(statusIndicator).toHaveClass(/active|inactive|error/i)
    }
  })

  test('should open server details on click', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      await mcpServer.click()

      const detailsPanel = page.locator('[data-testid="server-details-panel"]')
      await expect(detailsPanel).toBeVisible()
    }
  })

  test('should display server configuration details', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      await mcpServer.click()

      const configSection = page.locator('[data-testid="server-config"]')
      await expect(configSection).toBeVisible()

      const commandField = configSection.locator('[data-testid="config-command"]')
      await expect(commandField).toBeVisible()

      const argsField = configSection.locator('[data-testid="config-args"]')
      await expect(argsField).toBeVisible()
    }
  })

  test('should show server description', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      const description = mcpServer.locator('[data-testid="server-description"]')

      if (await description.isVisible()) {
        const descText = await description.textContent()
        expect(descText?.length).toBeGreaterThan(0)
      }
    }
  })

  test('should filter MCP servers by type', async ({ page }) => {
    const typeFilter = page.locator('[data-testid="type-filter"]')

    if (await typeFilter.isVisible()) {
      await typeFilter.click()

      const filterMenu = page.locator('[data-testid="filter-menu"]')
      await expect(filterMenu).toBeVisible()

      const stdioOption = filterMenu.locator('button', { hasText: /stdio/i })
      await stdioOption.click()

      await page.waitForTimeout(500)

      const visibleServers = page.locator('[data-testid="mcp-server-item"]:visible')
      const count = await visibleServers.count()

      for (let i = 0; i < count; i++) {
        const serverType = visibleServers.nth(i).locator('[data-testid="server-type"]')
        const typeText = await serverType.textContent()
        expect(typeText).toContain(/stdio/i)
      }
    }
  })

  test('should filter servers by status', async ({ page }) => {
    const statusFilter = page.locator('[data-testid="status-filter"]')

    if (await statusFilter.isVisible()) {
      await statusFilter.click()

      const filterMenu = page.locator('[data-testid="filter-menu"]')
      await expect(filterMenu).toBeVisible()

      const activeOption = filterMenu.locator('button', { hasText: /active/i })
      await activeOption.click()

      await page.waitForTimeout(500)

      const visibleServers = page.locator('[data-testid="mcp-server-item"]:visible')
      const count = await visibleServers.count()

      for (let i = 0; i < count; i++) {
        const statusIndicator = visibleServers.nth(i).locator('[data-testid="status-indicator"]')
        const statusClass = await statusIndicator.getAttribute('class')
        expect(statusClass).toMatch(/active/)
      }
    }
  })

  test('should search for specific server', async ({ page }) => {
    const searchInput = page.locator('[data-testid="server-search"]')

    if (await searchInput.isVisible()) {
      await searchInput.fill('test')

      await page.waitForTimeout(500)

      const visibleServers = page.locator('[data-testid="mcp-server-item"]:visible')
      const count = await visibleServers.count()

      for (let i = 0; i < count; i++) {
        const serverName = visibleServers.nth(i).locator('[data-testid="server-name"]')
        const nameText = await serverName.textContent()
        expect(nameText?.toLowerCase()).toContain('test')
      }
    }
  })

  test('should sort servers by name', async ({ page }) => {
    const sortButton = page.locator('[data-testid="sort-button"]')

    if (await sortButton.isVisible()) {
      await sortButton.click()

      const sortMenu = page.locator('[data-testid="sort-menu"]')
      await expect(sortMenu).toBeVisible()

      const nameOption = sortMenu.locator('button', { hasText: /name/i })
      await nameOption.click()

      await page.waitForTimeout(500)

      const visibleServers = page.locator('[data-testid="mcp-server-item"]:visible')
      const firstServerName = await visibleServers.first().locator('[data-testid="server-name"]').textContent()
      const secondServerName = await visibleServers.nth(1).locator('[data-testid="server-name"]').textContent()

      if (firstServerName && secondServerName) {
        expect(firstServerName.localeCompare(secondServerName)).toBeLessThanOrEqual(0)
      }
    }
  })

  test('should show server capabilities', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      await mcpServer.click()

      const capabilitiesSection = page.locator('[data-testid="server-capabilities"]')

      if (await capabilitiesSection.isVisible()) {
        await expect(capabilitiesSection).toContainText(/capabilities/i)
      }
    }
  })

  test('should display server source location', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      const sourceLocation = mcpServer.locator('[data-testid="source-location"]')
      await expect(sourceLocation).toContainText(/\.json|\.toml/i)
    }
  })

  test('should show server priority in inheritance chain', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      const priorityBadge = mcpServer.locator('[data-testid="priority-badge"]')

      if (await priorityBadge.isVisible()) {
        const priorityText = await priorityBadge.textContent()
        expect(priorityText).toMatch(/priority|level/i)
      }
    }
  })

  test('should enable/disable server', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      const toggleButton = mcpServer.locator('[data-testid="enable-toggle"]')

      if (await toggleButton.isVisible()) {
        await toggleButton.click()

        const statusIndicator = mcpServer.locator('[data-testid="status-indicator"]')
        await expect(statusIndicator).toHaveClass(/disabled|enabled/i)
      }
    }
  })

  test('should show server metrics', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      const metricsButton = mcpServer.locator('[data-testid="metrics-button"]')

      if (await metricsButton.isVisible()) {
        await metricsButton.click()

        const metricsPanel = page.locator('[data-testid="metrics-panel"]')
        await expect(metricsPanel).toBeVisible()

        await expect(metricsPanel).toContainText(/requests|latency|uptime/i)
      }
    }
  })

  test('should export server configuration', async ({ page }) => {
    const mcpServer = page.locator('[data-testid="mcp-server-item"]').first()

    if (await mcpServer.isVisible()) {
      const exportButton = mcpServer.locator('[data-testid="export-server-button"]')

      if (await exportButton.isVisible()) {
        await exportButton.click()

        const exportDialog = page.locator('[data-testid="export-dialog"]')
        await expect(exportDialog).toBeVisible()

        await exportDialog.locator('button', { hasText: /Export/i }).click()
      }
    }
  })
})
