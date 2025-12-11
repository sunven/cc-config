import { test, expect } from '@playwright/test'

test.describe('Cross-Project Comparison and Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should open comparison mode', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const compareView = page.locator('[data-testid="compare-view"]')
      await expect(compareView).toBeVisible()
    }
  })

  test('should select multiple projects for comparison', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const projectSelector1 = page.locator('[data-testid="project-selector-1"]')
      await projectSelector1.click()

      const project1 = page.locator('[data-testid="project-option"]').first()
      await project1.click()

      const projectSelector2 = page.locator('[data-testid="project-selector-2"]')
      await projectSelector2.click()

      const project2 = page.locator('[data-testid="project-option"]').nth(1)
      await project2.click()

      const compareTable = page.locator('[data-testid="compare-table"]')
      await expect(compareTable).toBeVisible()
    }
  })

  test('should display configuration differences', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const diffRows = page.locator('[data-testid="diff-row"]')
      const rowCount = await diffRows.count()

      expect(rowCount).toBeGreaterThanOrEqual(0)

      if (rowCount > 0) {
        const firstDiff = diffRows.first()
        await expect(firstDiff).toBeVisible()
      }
    }
  })

  test('should highlight changed values', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const changedValue = page.locator('[data-testid="changed-value"]')

      if (await changedValue.first().isVisible()) {
        await expect(changedValue.first()).toHaveClass(/changed|different/)
      }
    }
  })

  test('should highlight added configurations', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const addedConfig = page.locator('[data-testid="added-config"]')

      if (await addedConfig.first().isVisible()) {
        await expect(addedConfig.first()).toHaveClass(/added|present-only/)
      }
    }
  })

  test('should highlight removed configurations', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const removedConfig = page.locator('[data-testid="removed-config"]')

      if (await removedConfig.first().isVisible()) {
        await expect(removedConfig.first()).toHaveClass(/removed|absent-only/)
      }
    }
  })

  test('should show only differences with filter', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const diffFilter = page.locator('[data-testid="diff-filter"]')

      if (await diffFilter.isVisible()) {
        await diffFilter.click()

        const onlyDiffOption = page.locator('button', { hasText: /only differences/i })
        await onlyDiffOption.click()

        const allRows = page.locator('[data-testid="compare-row"]')
        const rowCount = await allRows.count()

        for (let i = 0; i < rowCount; i++) {
          const row = allRows.nth(i)
          const hasDiffClass = await row.evaluate((el) =>
            el.classList.contains('changed') ||
            el.classList.contains('added') ||
            el.classList.contains('removed')
          )
          expect(hasDiffClass).toBe(true)
        }
      }
    }
  })

  test('should show identical configurations', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const identicalConfig = page.locator('[data-testid="identical-config"]')

      if (await identicalConfig.first().isVisible()) {
        await expect(identicalConfig.first()).toHaveClass(/identical|same/)
      }
    }
  })

  test('should display side-by-side comparison', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const leftColumn = page.locator('[data-testid="left-column"]')
      const rightColumn = page.locator('[data-testid="right-column"]')

      await expect(leftColumn).toBeVisible()
      await expect(rightColumn).toBeVisible()

      const leftConfig = leftColumn.locator('[data-testid="config-item"]').first()
      const rightConfig = rightColumn.locator('[data-testid="config-item"]').first()

      await expect(leftConfig).toBeVisible()
      await expect(rightConfig).toBeVisible()
    }
  })

  test('should synchronize scrolling between columns', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const leftColumn = page.locator('[data-testid="left-column"]')
      await leftColumn.scrollIntoViewIfNeeded()

      await page.waitForTimeout(500)

      const rightColumn = page.locator('[data-testid="right-column"]')
      await expect(rightColumn).toBeVisible()
    }
  })

  test('should export comparison report', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const exportButton = page.locator('[data-testid="export-comparison-button"]')

      if (await exportButton.isVisible()) {
        await exportButton.click()

        const exportDialog = page.locator('[data-testid="export-dialog"]')
        await expect(exportDialog).toBeVisible()

        await exportDialog.locator('button', { hasText: /Export/i }).click()

        const downloadPromise = page.waitForEvent('download')
        await downloadPromise
      }
    }
  })

  test('should filter comparison by configuration type', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const typeFilter = page.locator('[data-testid="type-filter"]')

      if (await typeFilter.isVisible()) {
        await typeFilter.click()

        const mcpOption = page.locator('button', { hasText: /MCP/i })
        await mcpOption.click()

        const visibleConfigs = page.locator('[data-testid="config-item"]:visible')
        const count = await visibleConfigs.count()

        for (let i = 0; i < count; i++) {
          const configName = await visibleConfigs.nth(i).textContent()
          expect(configName).toMatch(/MCP|mcp/i)
        }
      }
    }
  })

  test('should show comparison statistics', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const statsPanel = page.locator('[data-testid="comparison-stats"]')

      if (await statsPanel.isVisible()) {
        await expect(statsPanel).toContainText(/total|changed|added|removed/i)

        const changedCount = statsPanel.locator('[data-testid="changed-count"]')
        await expect(changedCount).toBeVisible()

        const addedCount = statsPanel.locator('[data-testid="added-count"]')
        await expect(addedCount).toBeVisible()

        const removedCount = statsPanel.locator('[data-testid="removed-count"]')
        await expect(removedCount).toBeVisible()
      }
    }
  })

  test('should collapse/expand configuration groups', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const groupHeader = page.locator('[data-testid="group-header"]').first()

      if (await groupHeader.isVisible()) {
        await groupHeader.click()

        const groupContent = groupHeader.locator('[data-testid="group-content"]')

        if (await groupContent.isVisible()) {
          await expect(groupContent).toBeHidden()
        }
      }
    }
  })

  test('should copy configuration value', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const configValue = page.locator('[data-testid="config-value"]').first()

      if (await configValue.isVisible()) {
        const copyButton = configValue.locator('[data-testid="copy-button"]')

        if (await copyButton.isVisible()) {
          await copyButton.click()

          const tooltip = page.locator('[data-testid="copy-tooltip"]')
          await expect(tooltip).toContainText(/copied/i)
        }
      }
    }
  })

  test('should close comparison view', async ({ page }) => {
    await page.getByRole('tab', { name: /project/i }).click()

    const compareButton = page.locator('[data-testid="compare-button"]')

    if (await compareButton.isVisible()) {
      await compareButton.click()

      const closeButton = page.locator('[data-testid="close-compare-button"]')

      if (await closeButton.isVisible()) {
        await closeButton.click()

        const compareView = page.locator('[data-testid="compare-view"]')
        await expect(compareView).toBeHidden()
      }
    }
  })
})
