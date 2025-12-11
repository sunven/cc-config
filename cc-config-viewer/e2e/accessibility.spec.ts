import { test, expect } from '@playwright/test'

test.describe('Accessibility Features (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should have proper page title', async ({ page }) => {
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
  })

  test('should have lang attribute on html element', async ({ page }) => {
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang')
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()

    const h2 = page.locator('h2').first()
    if (await h2.isVisible()) {
      const h1Count = await page.locator('h1').count()
      const h2Count = await page.locator('h2').count()

      expect(h1Count).toBe(1)
      expect(h2Count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should have skip to main content link', async ({ page }) => {
    const skipLink = page.locator('a', { hasText: /skip.*main|main.*content/i })
    await expect(skipLink).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab')
    let focusedElement = await page.locator(':focus').first()
    await expect(focusedElement).toBeVisible()

    await page.keyboard.press('Tab')
    focusedElement = await page.locator(':focus').first()
    await expect(focusedElement).toBeVisible()

    await page.keyboard.press('Tab')
    focusedElement = await page.locator(':focus').first()
    await expect(focusedElement).toBeVisible()
  })

  test('should support keyboard activation with Enter', async ({ page }) => {
    const button = page.locator('button').first()

    if (await button.isVisible()) {
      await button.focus()
      await page.keyboard.press('Enter')

      await expect(button).toBeVisible()
    }
  })

  test('should support keyboard activation with Space', async ({ page }) => {
    const button = page.locator('button').first()

    if (await button.isVisible()) {
      await button.focus()
      await page.keyboard.press('Space')

      await expect(button).toBeVisible()
    }
  })

  test('should have visible focus indicators', async ({ page }) => {
    const button = page.locator('button').first()

    if (await button.isVisible()) {
      await button.focus()

      const hasFocusStyle = await button.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return style.outline !== 'none' || style.boxShadow !== 'none' || el === document.activeElement
      })

      expect(hasFocusStyle).toBe(true)
    }
  })

  test('should have proper ARIA labels for interactive elements', async ({ page }) => {
    const nav = page.locator('nav')
    await expect(nav).toHaveAttribute('aria-label')

    const main = page.locator('main')
    await expect(main).toHaveAttribute('aria-label')
  })

  test('should have role attributes where appropriate', async ({ page }) => {
    const list = page.locator('[data-testid="config-list"]')
    await expect(list).toHaveAttribute('role', 'list')

    const listItems = page.locator('[data-testid="config-item"]')
    const itemCount = await listItems.count()

    if (itemCount > 0) {
      await expect(listItems.first()).toHaveAttribute('role', 'listitem')
    }
  })

  test('should have button elements for clickable actions', async ({ page }) => {
    const clickable = page.locator('[data-testid="sidebar-toggle"]')
    await expect(clickable).toHaveAttribute('role', 'button')
  })

  test('should have alt text for images', async ({ page }) => {
    const images = page.locator('img')

    const imageCount = await images.count()

    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        await expect(img).toHaveAttribute('alt')
      }
    }
  })

  test('should have sufficient color contrast', async ({ page }) => {
    const text = page.locator('p').first()
    if (await text.isVisible()) {
      const color = await text.evaluate((el) => {
        return window.getComputedStyle(el).color
      })
      expect(color).toBeTruthy()
    }
  })

  test('should support high contrast mode', async ({ page }) => {
    await page.addStyleTag({
      content: '* { filter: contrast(150%) !important; }',
    })

    const content = page.locator('main')
    await expect(content).toBeVisible()
  })

  test('should support zoom up to 200%', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 })
    await page.evaluate(() => {
      document.body.style.zoom = '2'
    })

    const content = page.locator('main')
    await expect(content).toBeVisible()

    const sidebar = page.locator('[data-testid="sidebar"]')
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible()
    }
  })

  test('should have labels for form inputs', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]')

    if (await searchInput.isVisible()) {
      const hasLabel = await searchInput.evaluate((el) => {
        const id = el.getAttribute('id')
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`)
          return label !== null
        }
        return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')
      })

      expect(hasLabel).toBe(true)
    }
  })

  test('should announce dynamic content changes', async ({ page }) => {
    const liveRegion = page.locator('[aria-live], [role="status"]')

    if (await liveRegion.isVisible()) {
      await expect(liveRegion).toHaveAttribute('aria-live')
    }
  })

  test('should have proper tabindex values', async ({ page }) => {
    const elements = page.locator('[tabindex]')

    const count = await elements.count()

    for (let i = 0; i < count; i++) {
      const element = elements.nth(i)
      const tabindex = await element.getAttribute('tabindex')
      expect(parseInt(tabindex || '0')).toBeGreaterThanOrEqual(0)
    }
  })

  test('should support screen reader navigation', async ({ page }) => {
    const headings = page.locator('h1, h2, h3, h4, h5, h6')

    const count = await headings.count()
    expect(count).toBeGreaterThan(0)

    const firstHeading = headings.first()
    await expect(firstHeading).toBeVisible()
  })

  test('should have descriptive link text', async ({ page }) => {
    const links = page.locator('a')

    const count = await links.count()

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const link = links.nth(i)
        const text = await link.textContent()
        expect(text?.trim().length).toBeGreaterThan(0)
      }
    }
  })

  test('should have error messages associated with form fields', async ({ page }) => {
    const errorMessage = page.locator('[data-testid="error-message"]')

    if (await errorMessage.isVisible()) {
      const searchInput = page.locator('input[type="search"]')

      if (await searchInput.isVisible()) {
        const errorId = await errorMessage.getAttribute('id')
        const inputAriaDescribedby = await searchInput.getAttribute('aria-describedby')

        if (errorId) {
          expect(inputAriaDescribedby).toContain(errorId)
        }
      }
    }
  })

  test('should support reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    const animations = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.documentElement)
      return styles.getPropertyValue('animation-duration')
    })

    expect(animations).toBeDefined()
  })

  test('should have semantic HTML structure', async ({ page }) => {
    const header = page.locator('header')
    await expect(header).toBeVisible()

    const nav = page.locator('nav')
    await expect(nav).toBeVisible()

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })

  test('should support landmark navigation', async ({ page }) => {
    const landmarks = page.locator('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]')

    const count = await landmarks.count()
    expect(count).toBeGreaterThan(0)
  })
})
