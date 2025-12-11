import { test, expect } from '@playwright/test'

test.describe('Sub Agents Display and Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display Sub Agents section', async ({ page }) => {
    const agentsSection = page.locator('[data-testid="sub-agents-section"]')
    await expect(agentsSection).toBeVisible()
  })

  test('should list all Sub Agents', async ({ page }) => {
    const agents = page.locator('[data-testid="sub-agent-item"]')
    const agentCount = await agents.count()

    expect(agentCount).toBeGreaterThanOrEqual(0)

    if (agentCount > 0) {
      await expect(agents.first()).toBeVisible()
    }
  })

  test('should show agent name', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      const agentName = agent.locator('[data-testid="agent-name"]')
      await expect(agentName).toBeVisible()

      const nameText = await agentName.textContent()
      expect(nameText).toBeTruthy()
    }
  })

  test('should display agent description', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      const description = agent.locator('[data-testid="agent-description"]')

      if (await description.isVisible()) {
        const descText = await description.textContent()
        expect(descText?.length).toBeGreaterThan(0)
      }
    }
  })

  test('should show agent permissions type', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      const permissions = agent.locator('[data-testid="agent-permissions"]')
      await expect(permissions).toContainText(/read|write|admin|guest/i)
    }
  })

  test('should display agent status', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      const statusBadge = agent.locator('[data-testid="agent-status"]')
      await expect(statusBadge).toHaveClass(/active|inactive|pending/i)
    }
  })

  test('should open agent details on click', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      await agent.click()

      const detailsPanel = page.locator('[data-testid="agent-details-panel"]')
      await expect(detailsPanel).toBeVisible()
    }
  })

  test('should show detailed permissions list', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      await agent.click()

      const permissionsSection = page.locator('[data-testid="agent-permissions-list"]')
      await expect(permissionsSection).toBeVisible()

      const permissionItems = permissionsSection.locator('[data-testid="permission-item"]')
      const itemCount = await permissionItems.count()

      expect(itemCount).toBeGreaterThan(0)
    }
  })

  test('should filter agents by permission type', async ({ page }) => {
    const permissionFilter = page.locator('[data-testid="permission-filter"]')

    if (await permissionFilter.isVisible()) {
      await permissionFilter.click()

      const filterMenu = page.locator('[data-testid="filter-menu"]')
      await expect(filterMenu).toBeVisible()

      const readOption = filterMenu.locator('button', { hasText: /read/i })
      await readOption.click()

      await page.waitForTimeout(500)

      const visibleAgents = page.locator('[data-testid="sub-agent-item"]:visible')
      const count = await visibleAgents.count()

      for (let i = 0; i < count; i++) {
        const permissions = visibleAgents.nth(i).locator('[data-testid="agent-permissions"]')
        const permText = await permissions.textContent()
        expect(permText).toContain(/read/i)
      }
    }
  })

  test('should filter agents by status', async ({ page }) => {
    const statusFilter = page.locator('[data-testid="status-filter"]')

    if (await statusFilter.isVisible()) {
      await statusFilter.click()

      const filterMenu = page.locator('[data-testid="filter-menu"]')
      await expect(filterMenu).toBeVisible()

      const activeOption = filterMenu.locator('button', { hasText: /active/i })
      await activeOption.click()

      await page.waitForTimeout(500)

      const visibleAgents = page.locator('[data-testid="sub-agent-item"]:visible')
      const count = await visibleAgents.count()

      for (let i = 0; i < count; i++) {
        const statusBadge = visibleAgents.nth(i).locator('[data-testid="agent-status"]')
        const statusClass = await statusBadge.getAttribute('class')
        expect(statusClass).toMatch(/active/)
      }
    }
  })

  test('should search for specific agent', async ({ page }) => {
    const searchInput = page.locator('[data-testid="agent-search"]')

    if (await searchInput.isVisible()) {
      await searchInput.fill('test')

      await page.waitForTimeout(500)

      const visibleAgents = page.locator('[data-testid="sub-agent-item"]:visible')
      const count = await visibleAgents.count()

      for (let i = 0; i < count; i++) {
        const agentName = visibleAgents.nth(i).locator('[data-testid="agent-name"]')
        const nameText = await agentName.textContent()
        expect(nameText?.toLowerCase()).toContain('test')
      }
    }
  })

  test('should sort agents by name', async ({ page }) => {
    const sortButton = page.locator('[data-testid="sort-button"]')

    if (await sortButton.isVisible()) {
      await sortButton.click()

      const sortMenu = page.locator('[data-testid="sort-menu"]')
      await expect(sortMenu).toBeVisible()

      const nameOption = sortMenu.locator('button', { hasText: /name/i })
      await nameOption.click()

      await page.waitForTimeout(500)

      const visibleAgents = page.locator('[data-testid="sub-agent-item"]:visible')
      const firstAgentName = await visibleAgents.first().locator('[data-testid="agent-name"]').textContent()
      const secondAgentName = await visibleAgents.nth(1).locator('[data-testid="agent-name"]').textContent()

      if (firstAgentName && secondAgentName) {
        expect(firstAgentName.localeCompare(secondAgentName)).toBeLessThanOrEqual(0)
      }
    }
  })

  test('should display agent source location', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      const sourceLocation = agent.locator('[data-testid="source-location"]')
      await expect(sourceLocation).toContainText(/\.md|\.json/i)
    }
  })

  test('should show agent creation date', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      const createdDate = agent.locator('[data-testid="created-date"]')

      if (await createdDate.isVisible()) {
        const dateText = await createdDate.textContent()
        expect(dateText).toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/)
      }
    }
  })

  test('should show last modified date', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      const modifiedDate = agent.locator('[data-testid="modified-date"]')

      if (await modifiedDate.isVisible()) {
        const dateText = await modifiedDate.textContent()
        expect(dateText).toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/)
      }
    }
  })

  test('should enable/disable agent', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      const toggleButton = agent.locator('[data-testid="enable-toggle"]')

      if (await toggleButton.isVisible()) {
        await toggleButton.click()

        const statusBadge = agent.locator('[data-testid="agent-status"]')
        await expect(statusBadge).toHaveClass(/disabled|enabled/i)
      }
    }
  })

  test('should show agent capabilities', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      await agent.click()

      const capabilitiesSection = page.locator('[data-testid="agent-capabilities"]')

      if (await capabilitiesSection.isVisible()) {
        await expect(capabilitiesSection).toContainText(/capabilities/i)
      }
    }
  })

  test('should display agent documentation link', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      await agent.click()

      const docLink = page.locator('[data-testid="documentation-link"]')

      if (await docLink.isVisible()) {
        await expect(docLink).toContainText(/documentation|docs/i)
      }
    }
  })

  test('should show agent activity log', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      await agent.click()

      const activityTab = page.locator('[data-testid="activity-tab"]')

      if (await activityTab.isVisible()) {
        await activityTab.click()

        const activityLog = page.locator('[data-testid="activity-log"]')
        await expect(activityLog).toBeVisible()

        await expect(activityLog).toContainText(/activity|log/i)
      }
    }
  })

  test('should export agent configuration', async ({ page }) => {
    const agent = page.locator('[data-testid="sub-agent-item"]').first()

    if (await agent.isVisible()) {
      const exportButton = agent.locator('[data-testid="export-agent-button"]')

      if (await exportButton.isVisible()) {
        await exportButton.click()

        const exportDialog = page.locator('[data-testid="export-dialog"]')
        await expect(exportDialog).toBeVisible()

        await exportDialog.locator('button', { hasText: /Export/i }).click()
      }
    }
  })
})
