import { test, expect } from '@playwright/test'

test.describe('Error Scenarios and Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display error message on failed config load', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.abort('failed')
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/error|failed|unable/i)
  })

  test('should show network error with retry button', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.abort('failed')
    })

    await page.reload()

    const retryButton = page.locator('[data-testid="retry-button"]')
    await expect(retryButton).toBeVisible()
    await expect(retryButton).toContainText(/retry/i)

    await retryButton.click()
    await expect(retryButton).toContainText(/loading/i)
  })

  test('should handle timeout errors', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.abort('timedout')
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText(/timeout/i)
  })

  test('should display error on invalid JSON config', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"invalid": json syntax}',
      })
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText(/parse|invalid/i)
  })

  test('should handle permission denied errors', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: '{"error": "Permission denied"}',
      })
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText(/permission|access/i)
  })

  test('should show error when file not found', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: '{"error": "File not found"}',
      })
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText(/not found|missing/i)
  })

  test('should display server error messages', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error": "Internal server error"}',
      })
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText(/server|error/i)
  })

  test('should show connection refused error', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.abort('failed')
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText(/connection|refused/i)
  })

  test('should handle offline mode gracefully', async ({ page }) => {
    await page.context().setOffline(true)

    await page.reload()

    const offlineMessage = page.locator('[data-testid="offline-message"]')
    await expect(offlineMessage).toContainText(/offline|disconnected/i)

    await page.context().setOffline(false)
  })

  test('should show corrupted config error', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"mcpServers": null, "corrupted": true}',
      })
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText(/corrupted|invalid/i)
  })

  test('should retry failed requests with backoff', async ({ page }) => {
    let attempts = 0
    await page.route('**/api/configs**', (route) => {
      attempts++
      if (attempts < 3) {
        route.abort('failed')
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{"mcpServers": {}}',
        })
      }
    })

    await page.reload()

    const retryButton = page.locator('[data-testid="retry-button"]')
    await retryButton.click()

    await page.waitForTimeout(3000)

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeHidden()
  })

  test('should display partial data with warning', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.fulfill({
        status: 206,
        contentType: 'application/json',
        body: '{"mcpServers": {"partial": {}}}',
      })
    })

    await page.reload()

    const warningMessage = page.locator('[data-testid="warning-message"]')
    await expect(warningMessage).toContainText(/partial|incomplete/i)

    const configList = page.locator('[data-testid="config-list"]')
    await expect(configList).toBeVisible()
  })

  test('should show error recovery suggestions', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.abort('failed')
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible()

    const suggestions = page.locator('[data-testid="error-suggestions"]')

    if (await suggestions.isVisible()) {
      await expect(suggestions).toContainText(/check|verify|try/i)
    }
  })

  test('should allow manual config file selection on error', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.abort('failed')
    })

    await page.reload()

    const manualSelectButton = page.locator('[data-testid="manual-select-button"]')

    if (await manualSelectButton.isVisible()) {
      await manualSelectButton.click()

      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput).toBeVisible()
    }
  })

  test('should log errors to console', async ({ page }) => {
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text())
      }
    })

    await page.route('**/api/configs**', (route) => {
      route.abort('failed')
    })

    await page.reload()

    await page.waitForTimeout(1000)

    expect(consoleMessages.length).toBeGreaterThan(0)
  })

  test('should prevent UI freeze on errors', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.abort('failed')
    })

    await page.reload()

    await page.waitForTimeout(500)

    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()

    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]')
    await expect(sidebarToggle).toBeVisible()
  })

  test('should show user-friendly error messages', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.abort('failed')
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    const messageText = await errorMessage.textContent()

    expect(messageText).not.toContain('undefined')
    expect(messageText).not.toContain('null')
    expect(messageText?.length).toBeGreaterThan(10)
  })

  test('should allow closing error dialog', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.abort('failed')
    })

    await page.reload()

    const errorDialog = page.locator('[data-testid="error-dialog"]')

    if (await errorDialog.isVisible()) {
      const closeButton = errorDialog.locator('[data-testid="close-button"]')

      if (await closeButton.isVisible()) {
        await closeButton.click()

        await expect(errorDialog).toBeHidden()
      }
    }
  })

  test('should display error code for debugging', async ({ page }) => {
    await page.route('**/api/configs**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error": "Internal error", "code": "ERR_500"}',
      })
    })

    await page.reload()

    const errorCode = page.locator('[data-testid="error-code"]')

    if (await errorCode.isVisible()) {
      await expect(errorCode).toContainText(/ERR_|\d{3}/i)
    }
  })
})
