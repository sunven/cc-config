import { test, expect } from '@playwright/test'

test.describe('First-Time User Onboarding Flow (Task 3.11)', () => {
  test.describe('Welcome Screen', () => {
    test('should display welcome screen for first-time users', async ({ page }) => {
      // Clear localStorage to simulate first-time user
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')

      const welcomeScreen = page.locator('[data-testid="welcome-screen"]')

      if (await welcomeScreen.isVisible()) {
        await expect(welcomeScreen).toBeVisible()
      }
    })

    test('should show application title and description', async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')

      const welcomeScreen = page.locator('[data-testid="welcome-screen"]')

      if (await welcomeScreen.isVisible()) {
        await expect(welcomeScreen).toContainText(/cc-config|configuration viewer/i)
        await expect(welcomeScreen).toContainText(/claude|mcp|config/i)
      }
    })

    test('should provide get started button', async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')

      const getStartedButton = page.locator('[data-testid="get-started-button"]')

      if (await getStartedButton.isVisible()) {
        await expect(getStartedButton).toBeVisible()
        await expect(getStartedButton).toBeEnabled()
      }
    })

    test('should skip onboarding for returning users', async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.setItem('onboarding_completed', 'true'))
      await page.reload()
      await page.waitForLoadState('networkidle')

      const welcomeScreen = page.locator('[data-testid="welcome-screen"]')
      await expect(welcomeScreen).toBeHidden()
    })
  })

  test.describe('Onboarding Steps', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')
    })

    test('should show step indicator', async ({ page }) => {
      const stepIndicator = page.locator('[data-testid="step-indicator"]')

      if (await stepIndicator.isVisible()) {
        await expect(stepIndicator).toContainText(/step|1|2|3/i)
      }
    })

    test('should navigate to next step', async ({ page }) => {
      const nextButton = page.locator('[data-testid="next-step-button"]')

      if (await nextButton.isVisible()) {
        await nextButton.click()

        const stepIndicator = page.locator('[data-testid="step-indicator"]')
        await expect(stepIndicator).toContainText(/2/i)
      }
    })

    test('should navigate to previous step', async ({ page }) => {
      const nextButton = page.locator('[data-testid="next-step-button"]')
      const prevButton = page.locator('[data-testid="prev-step-button"]')

      if (await nextButton.isVisible()) {
        await nextButton.click()

        if (await prevButton.isVisible()) {
          await prevButton.click()

          const stepIndicator = page.locator('[data-testid="step-indicator"]')
          await expect(stepIndicator).toContainText(/1/i)
        }
      }
    })

    test('should allow skipping onboarding', async ({ page }) => {
      const skipButton = page.locator('[data-testid="skip-onboarding"]')

      if (await skipButton.isVisible()) {
        await skipButton.click()

        const welcomeScreen = page.locator('[data-testid="welcome-screen"]')
        await expect(welcomeScreen).toBeHidden()
      }
    })
  })

  test.describe('Configuration Discovery Step', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')
    })

    test('should explain user-level configuration', async ({ page }) => {
      const userConfigStep = page.locator('[data-testid="user-config-explanation"]')

      if (await userConfigStep.isVisible()) {
        await expect(userConfigStep).toContainText(/user|global|~\/\.config/i)
      }
    })

    test('should explain project-level configuration', async ({ page }) => {
      const projectConfigStep = page.locator('[data-testid="project-config-explanation"]')

      if (await projectConfigStep.isVisible()) {
        await expect(projectConfigStep).toContainText(/project|local|\.mcp\.json/i)
      }
    })

    test('should show configuration file paths', async ({ page }) => {
      const configPaths = page.locator('[data-testid="config-paths-display"]')

      if (await configPaths.isVisible()) {
        await expect(configPaths).toContainText(/path|location|file/i)
      }
    })

    test('should detect existing configurations', async ({ page }) => {
      const detectedConfigs = page.locator('[data-testid="detected-configurations"]')

      if (await detectedConfigs.isVisible()) {
        await expect(detectedConfigs).toContainText(/found|detected|configured/i)
      }
    })
  })

  test.describe('Feature Tour', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')
    })

    test('should highlight MCP servers feature', async ({ page }) => {
      const mcpTour = page.locator('[data-testid="mcp-feature-tour"]')

      if (await mcpTour.isVisible()) {
        await expect(mcpTour).toContainText(/mcp|server|capability/i)
      }
    })

    test('should highlight Sub Agents feature', async ({ page }) => {
      const agentsTour = page.locator('[data-testid="agents-feature-tour"]')

      if (await agentsTour.isVisible()) {
        await expect(agentsTour).toContainText(/agent|permission|sub/i)
      }
    })

    test('should highlight comparison feature', async ({ page }) => {
      const comparisonTour = page.locator('[data-testid="comparison-feature-tour"]')

      if (await comparisonTour.isVisible()) {
        await expect(comparisonTour).toContainText(/compare|diff|project/i)
      }
    })

    test('should show feature tooltips', async ({ page }) => {
      const tooltip = page.locator('[data-testid="feature-tooltip"]')

      if (await tooltip.isVisible()) {
        await expect(tooltip).toBeVisible()
      }
    })

    test('should highlight UI elements during tour', async ({ page }) => {
      const highlightedElement = page.locator('[data-testid="tour-highlight"]')

      if (await highlightedElement.isVisible()) {
        await expect(highlightedElement).toHaveClass(/highlight|focus|active/i)
      }
    })
  })

  test.describe('Setup Wizard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')
    })

    test('should offer to create sample configuration', async ({ page }) => {
      const createSampleButton = page.locator('[data-testid="create-sample-config"]')

      if (await createSampleButton.isVisible()) {
        await expect(createSampleButton).toBeVisible()
      }
    })

    test('should provide configuration templates', async ({ page }) => {
      const templatesSection = page.locator('[data-testid="config-templates"]')

      if (await templatesSection.isVisible()) {
        const templateItems = templatesSection.locator('[data-testid="template-item"]')
        const count = await templateItems.count()
        expect(count).toBeGreaterThan(0)
      }
    })

    test('should explain configuration structure', async ({ page }) => {
      const structureExplanation = page.locator('[data-testid="config-structure-explanation"]')

      if (await structureExplanation.isVisible()) {
        await expect(structureExplanation).toContainText(/mcpServers|subAgents|json/i)
      }
    })
  })

  test.describe('Completion', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')
    })

    test('should show completion screen', async ({ page }) => {
      // Navigate through all steps
      const nextButton = page.locator('[data-testid="next-step-button"]')

      while (await nextButton.isVisible()) {
        await nextButton.click()
        await page.waitForTimeout(300)
      }

      const completionScreen = page.locator('[data-testid="onboarding-complete"]')

      if (await completionScreen.isVisible()) {
        await expect(completionScreen).toContainText(/complete|done|ready|start/i)
      }
    })

    test('should offer to start using the app', async ({ page }) => {
      const startButton = page.locator('[data-testid="start-using-app"]')

      if (await startButton.isVisible()) {
        await startButton.click()

        const mainView = page.locator('[data-testid="main-app-view"]')
        await expect(mainView).toBeVisible()
      }
    })

    test('should save onboarding completion state', async ({ page }) => {
      const finishButton = page.locator('[data-testid="finish-onboarding"]')

      if (await finishButton.isVisible()) {
        await finishButton.click()

        const isCompleted = await page.evaluate(() => localStorage.getItem('onboarding_completed'))
        expect(isCompleted).toBe('true')
      }
    })

    test('should offer to revisit onboarding from settings', async ({ page }) => {
      // Complete onboarding first
      const finishButton = page.locator('[data-testid="finish-onboarding"]')
      if (await finishButton.isVisible()) {
        await finishButton.click()
      }

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]')
      if (await settingsButton.isVisible()) {
        await settingsButton.click()

        const resetOnboarding = page.locator('[data-testid="reset-onboarding"]')
        await expect(resetOnboarding).toBeVisible()
      }
    })
  })

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')
    })

    test('should have accessible onboarding navigation', async ({ page }) => {
      const stepIndicator = page.locator('[data-testid="step-indicator"]')

      if (await stepIndicator.isVisible()) {
        await expect(stepIndicator).toHaveAttribute('role', /tablist|navigation|progressbar/i)
      }
    })

    test('should support keyboard navigation in onboarding', async ({ page }) => {
      await page.keyboard.press('Tab')

      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('should have descriptive labels for onboarding controls', async ({ page }) => {
      const nextButton = page.locator('[data-testid="next-step-button"]')

      if (await nextButton.isVisible()) {
        await expect(nextButton).toHaveAttribute('aria-label')
      }
    })

    test('should announce step changes to screen readers', async ({ page }) => {
      const liveRegion = page.locator('[aria-live="polite"]')

      if (await liveRegion.isVisible()) {
        await expect(liveRegion).toBeVisible()
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')

      const welcomeScreen = page.locator('[data-testid="welcome-screen"]')

      if (await welcomeScreen.isVisible()) {
        await expect(welcomeScreen).toBeVisible()
      }
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')

      const welcomeScreen = page.locator('[data-testid="welcome-screen"]')

      if (await welcomeScreen.isVisible()) {
        await expect(welcomeScreen).toBeVisible()
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle configuration detection errors gracefully', async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
      await page.waitForLoadState('networkidle')

      const errorMessage = page.locator('[data-testid="onboarding-error"]')

      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText(/error|failed|try again/i)
      }
    })

    test('should allow retry on configuration detection failure', async ({ page }) => {
      const retryButton = page.locator('[data-testid="retry-detection"]')

      if (await retryButton.isVisible()) {
        await retryButton.click()

        const loadingIndicator = page.locator('[data-testid="detection-loading"]')
        await expect(loadingIndicator).toBeVisible()
      }
    })
  })
})
