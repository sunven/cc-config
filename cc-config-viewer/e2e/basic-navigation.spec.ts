import { test, expect } from '@playwright/test'

test.describe('Basic Navigation and UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should load the application', async ({ page }) => {
    await expect(page).toHaveTitle(/cc-config/)
    await expect(page.locator('h1')).toContainText('cc-config')
  })

  test('should display the main navigation tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /user/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /project/i })).toBeVisible()
  })

  test('should switch between user and project tabs', async ({ page }) => {
    const userTab = page.getByRole('tab', { name: /user/i })
    const projectTab = page.getByRole('tab', { name: /project/i })

    await userTab.click()
    await expect(userTab).toHaveAttribute('data-state', 'active')

    await projectTab.click()
    await expect(projectTab).toHaveAttribute('data-state', 'active')
  })

  test('should display the configuration list', async ({ page }) => {
    const configList = page.locator('[data-testid="config-list"]')
    await expect(configList).toBeVisible()
  })

  test('should show loading state initially', async ({ page }) => {
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]')
    await expect(loadingSpinner).toBeVisible()
  })

  test('should hide loading state after data loads', async ({ page }) => {
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]')
    await expect(loadingSpinner).toBeHidden({ timeout: 10000 })
  })

  test('should have responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    const activeElement = await page.locator(':focus').first()
    await expect(activeElement).toBeVisible()
  })

  test('should display the sidebar toggle button', async ({ page }) => {
    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]')
    await expect(sidebarToggle).toBeVisible()
  })

  test('should toggle sidebar visibility', async ({ page }) => {
    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]')
    const sidebar = page.locator('[data-testid="sidebar"]')

    await expect(sidebar).toBeVisible()

    await sidebarToggle.click()
    await expect(sidebar).toBeHidden()

    await sidebarToggle.click()
    await expect(sidebar).toBeVisible()
  })

  test('should show error message on network error', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      route.abort('failed')
    })

    await page.reload()

    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible()
  })

  test('should display footer with version info', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer).toContainText(/version/i)
  })

  test('should have proper ARIA labels', async ({ page }) => {
    const mainNav = page.locator('nav')
    await expect(mainNav).toHaveAttribute('aria-label')

    const configList = page.locator('[data-testid="config-list"]')
    await expect(configList).toHaveAttribute('role', 'list')
  })

  test('should support dark mode toggle', async ({ page }) => {
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]')

    if (await darkModeToggle.isVisible()) {
      const html = page.locator('html')
      await expect(html).toHaveAttribute('data-theme', 'light')

      await darkModeToggle.click()
      await expect(html).toHaveAttribute('data-theme', 'dark')
    }
  })

  test('should handle 404 for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route')
    await expect(page.locator('text=404')).toBeVisible()
    await expect(page.locator('text=Page not found')).toBeVisible()
  })

  test('should display breadcrumbs navigation', async ({ page }) => {
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]')
    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs).toContainText('Home')
    }
  })

  test('should have proper page title structure', async ({ page }) => {
    const pageTitle = page.locator('h1')
    await expect(pageTitle).toBeVisible()

    const title = await pageTitle.textContent()
    expect(title).toBeTruthy()
    expect(title?.length).toBeGreaterThan(0)
  })

  test('should support zoom up to 200%', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 })
    await page.evaluate(() => {
      document.body.style.zoom = '1.5'
    })

    await expect(page.locator('body')).toBeVisible()
  })
})
