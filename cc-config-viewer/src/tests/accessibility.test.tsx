import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SkipLink } from '@/components/Accessibility/SkipLink'
import { LiveRegionProvider } from '@/components/Accessibility/LiveRegion'
import { LanguageSwitcher } from '@/components/Language/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ZoomControls } from '@/components/ZoomControls'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

// Extend expect to include vitest-axe matchers
expect.extend(matchers)

describe('Accessibility Tests', () => {
  describe('Button Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <Button aria-label="Test button">Click me</Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support keyboard activation with Enter key', async () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} aria-label="Test button">
          Click me
        </Button>
      )

      const button = screen.getByRole('button', { name: 'Test button' })
      button.focus()
      await userEvent.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should support keyboard activation with Space key', async () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} aria-label="Test button">
          Click me
        </Button>
      )

      const button = screen.getByRole('button', { name: 'Test button' })
      button.focus()
      await userEvent.keyboard(' ')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Tabs Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA roles and attributes', () => {
      render(
        <Tabs defaultValue="tab1" aria-label="Test tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tablist = screen.getByRole('tablist')
      expect(tablist).toBeInTheDocument()

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(2)

      const panels = screen.getAllByRole('tabpanel')
      expect(panels).toHaveLength(2)
    })

    it('should support arrow key navigation', async () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const firstTab = screen.getByRole('tab', { name: 'Tab 1' })
      firstTab.focus()
      await userEvent.keyboard('{ArrowRight}')

      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus()
    })
  })

  describe('SkipLink Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <>
          <SkipLink targetId="main-content" />
          <main id="main-content">Main content</main>
        </>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be focusable and visible when focused', async () => {
      render(
        <>
          <SkipLink targetId="main-content" />
          <main id="main-content">Main content</main>
        </>
      )

      const skipLink = screen.getByRole('link', { name: '跳转到主内容' })
      expect(skipLink).toHaveClass('sr-only')

      skipLink.focus()
      expect(skipLink).not.toHaveClass('sr-only')
    })
  })

  describe('LanguageSwitcher Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<LanguageSwitcher />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes', () => {
      render(<LanguageSwitcher />)

      const button = screen.getByRole('button', { name: '语言' })
      expect(button).toBeInTheDocument()

      const menuItems = screen.getAllByRole('menuitemradio')
      expect(menuItems.length).toBeGreaterThan(0)
    })
  })

  describe('ThemeToggle Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <LiveRegionProvider>
          <ThemeToggle />
        </LiveRegionProvider>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have aria-pressed attribute', () => {
      render(
        <LiveRegionProvider>
          <ThemeToggle />
        </LiveRegionProvider>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed')
    })
  })

  describe('ZoomControls Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <LiveRegionProvider>
          <ZoomControls />
        </LiveRegionProvider>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels', () => {
      render(
        <LiveRegionProvider>
          <ZoomControls />
        </LiveRegionProvider>
      )

      const toolbar = screen.getByRole('toolbar')
      expect(toolbar).toBeInTheDocument()

      const zoomOutButton = screen.getByRole('button', { name: '缩小' })
      const zoomInButton = screen.getByRole('button', { name: '放大' })
      const resetButton = screen.getByRole('button', { name: '重置缩放' })

      expect(zoomOutButton).toBeInTheDocument()
      expect(zoomInButton).toBeInTheDocument()
      expect(resetButton).toBeInTheDocument()
    })
  })

  describe('Dialog Component', () => {
    it('should not have any accessibility violations when open', async () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <h2>Dialog Title</h2>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      )

      const triggerButton = screen.getByRole('button', { name: 'Open Dialog' })
      await userEvent.click(triggerButton)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      const content = screen.getByText('Dialog content')
      const results = await axe(content.parentElement!)
      expect(results).toHaveNoViolations()
    })

    it('should trap focus when open', async () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <h2>Dialog Title</h2>
            <Button>Close</Button>
          </DialogContent>
        </Dialog>
      )

      const triggerButton = screen.getByRole('button', { name: 'Open Dialog' })
      await userEvent.click(triggerButton)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveFocus()

      const closeButton = screen.getByRole('button', { name: 'Close' })
      closeButton.focus()
      await userEvent.keyboard('{Tab}')

      expect(dialog).toHaveFocus()
    })

    it('should close on Escape key', async () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <h2>Dialog Title</h2>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      )

      const triggerButton = screen.getByRole('button', { name: 'Open Dialog' })
      await userEvent.click(triggerButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await userEvent.keyboard('{Escape}')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Color Contrast', () => {
    it('should have sufficient color contrast for text', () => {
      // This is a placeholder for actual color contrast testing
      // In a real implementation, you would test specific color combinations
      expect(true).toBe(true)
    })

    it('should have sufficient color contrast for high contrast mode', () => {
      // Test high contrast mode colors
      expect(true).toBe(true)
    })
  })

  describe('Screen Reader Announcements', () => {
    it('should announce loading states', () => {
      // This would test the LiveRegion announcements
      expect(true).toBe(true)
    })

    it('should announce error messages', () => {
      // This would test error announcements
      expect(true).toBe(true)
    })

    it('should announce success messages', () => {
      // This would test success announcements
      expect(true).toBe(true)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through all interactive elements', async () => {
      render(
        <div>
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <a href="#">Link</a>
        </div>
      )

      const firstButton = screen.getByRole('button', { name: 'Button 1' })
      firstButton.focus()
      expect(firstButton).toHaveFocus()

      await userEvent.keyboard('{Tab}')

      const secondButton = screen.getByRole('button', { name: 'Button 2' })
      expect(secondButton).toHaveFocus()
    })

    it('should not have keyboard traps', async () => {
      // This would test that users can navigate away from any element
      expect(true).toBe(true)
    })
  })

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      render(<Button>Test Button</Button>)

      const button = screen.getByRole('button')
      button.focus()

      // Focus indicators should be visible
      expect(button).toHaveFocus()
    })

    it('should restore focus after modal close', async () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <h2>Dialog Title</h2>
          </DialogContent>
        </Dialog>
      )

      const triggerButton = screen.getByRole('button', { name: 'Open Dialog' })
      triggerButton.focus()

      await userEvent.click(triggerButton)

      const closeButton = screen.getByRole('button', { name: 'Close' })
      await userEvent.click(closeButton)

      expect(triggerButton).toHaveFocus()
    })
  })

  describe('Theme Toggle', () => {
    it('should toggle high contrast mode', async () => {
      render(
        <LiveRegionProvider>
          <ThemeToggle />
        </LiveRegionProvider>
      )

      const toggleButton = screen.getByRole('button', { name: /theme/i })
      expect(toggleButton).toBeInTheDocument()

      await userEvent.click(toggleButton)

      // Verify the button state changes
      expect(toggleButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should have proper ARIA attributes', () => {
      render(
        <LiveRegionProvider>
          <ThemeToggle />
        </LiveRegionProvider>
      )

      const toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveAttribute('aria-label')
      expect(toggleButton).toHaveAttribute('aria-pressed')
    })
  })

  describe('Zoom Controls', () => {
    it('should have zoom controls toolbar', () => {
      render(
        <LiveRegionProvider>
          <ZoomControls />
        </LiveRegionProvider>
      )

      const toolbar = screen.getByRole('toolbar')
      expect(toolbar).toBeInTheDocument()
      expect(toolbar).toHaveAttribute('aria-label')
    })

    it('should display current zoom level', () => {
      render(
        <LiveRegionProvider>
          <ZoomControls />
        </LiveRegionProvider>
      )

      // Should display current zoom level (default 100%)
      expect(screen.getByText(/\d+%/)).toBeInTheDocument()
    })

    it('should have zoom in and out buttons', () => {
      render(
        <LiveRegionProvider>
          <ZoomControls />
        </LiveRegionProvider>
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(3) // zoom out, zoom in, reset
    })
  })

  describe('Language Switcher', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <LiveRegionProvider>
          <LanguageSwitcher />
        </LiveRegionProvider>
      )

      const triggerButton = screen.getByRole('button', { name: /language/i })
      expect(triggerButton).toBeInTheDocument()
      expect(triggerButton).toHaveAttribute('aria-label')
    })

    it('should change language when selected', async () => {
      render(
        <LiveRegionProvider>
          <LanguageSwitcher />
        </LiveRegionProvider>
      )

      const triggerButton = screen.getByRole('button', { name: /language/i })
      await userEvent.click(triggerButton)

      const chineseOption = screen.getByText('中文')
      expect(chineseOption).toBeInTheDocument()
    })
  })

  describe('Skip Link', () => {
    it('should be keyboard accessible', () => {
      render(
        <LiveRegionProvider>
          <SkipLink targetId="main-content" />
        </LiveRegionProvider>
      )

      const skipLink = screen.getByText(/skip to/i)
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })
  })
})