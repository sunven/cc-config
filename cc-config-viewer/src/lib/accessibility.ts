/**
 * Accessibility utilities and helpers
 */

import { type ClassValue, clsx } from 'clsx'

/**
 * Generate unique IDs for ARIA attributes
 */
let idCounter = 0
export const generateId = (prefix = 'a11y'): string => `${prefix}-${++idCounter}`

/**
 * Check if color contrast meets WCAG AA standards (4.5:1 for normal text)
 */
export const checkColorContrast = (foreground: string, background: string): boolean => {
  // This is a simplified check - in production, use a proper contrast calculator
  const getLuminance = (color: string): number => {
    const rgb = parseInt(color.slice(1), 16)
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = (rgb >> 0) & 0xff
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  const contrast = (lighter + 0.05) / (darker + 0.05)

  return contrast >= 4.5
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within a container (e.g., modal dialog)
   */
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus()
            e.preventDefault()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  },

  /**
   * Restore focus to previous element
   */
  restoreFocus: (element: HTMLElement | null) => {
    element?.focus()
  },

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-disabled'))
  },
}

/**
 * ARIA live region utilities for announcing dynamic content
 */
export const liveRegion = {
  /**
   * Create a live region for polite announcements
   */
  createPoliteRegion: (): HTMLElement => {
    const region = document.createElement('div')
    region.setAttribute('aria-live', 'polite')
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    region.id = generateId('live-polite')
    document.body.appendChild(region)
    return region
  },

  /**
   * Create a live region for assertive announcements
   */
  createAssertiveRegion: (): HTMLElement => {
    const region = document.createElement('div')
    region.setAttribute('aria-live', 'assertive')
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    region.id = generateId('live-assertive')
    document.body.appendChild(region)
    return region
  },

  /**
   * Announce message to live region
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = document.getElementById(`live-${priority}`)
    if (region) {
      region.textContent = message
      // Clear after announcement to allow re-announcement of same message
      setTimeout(() => {
        region.textContent = ''
      }, 1000)
    }
  },
}

/**
 * Keyboard navigation helpers
 */
export const keyboardNavigation = {
  /**
   * Arrow key navigation for lists
   */
  handleArrowKeys: (
    e: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onSelect: (index: number) => void
  ) => {
    let nextIndex = currentIndex

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        nextIndex = Math.min(currentIndex + 1, items.length - 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        nextIndex = Math.max(currentIndex - 1, 0)
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = items.length - 1
        break
    }

    if (nextIndex !== currentIndex) {
      onSelect(nextIndex)
    }
  },

  /**
   * Handle Enter and Space key activation
   */
  handleActivation: (e: KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      callback()
    }
  },
}

/**
 * Screen reader utilities
 */
export const screenReader = {
  /**
   * Add screen reader only text
   */
  srOnly: (...inputs: ClassValue[]) => clsx('sr-only', inputs),

  /**
   * Announce page changes
   */
  announcePageChange: (pageName: string) => {
    liveRegion.announce(`Navigated to ${pageName}`, 'polite')
  },

  /**
   * Announce state changes
   */
  announceStateChange: (message: string) => {
    liveRegion.announce(message, 'polite')
  },

  /**
   * Announce errors
   */
  announceError: (message: string) => {
    liveRegion.announce(`Error: ${message}`, 'assertive')
  },

  /**
   * Announce success
   */
  announceSuccess: (message: string) => {
    liveRegion.announce(message, 'polite')
  },
}

/**
 * Semantic HTML helpers
 */
export const semantic = {
  /**
   * Get appropriate heading level based on nesting
   */
  getHeadingLevel: (parentLevel: number): number => Math.min(parentLevel + 1, 6),

  /**
   * Generate landmark region label
   */
  generateLandmarkLabel: (type: string, name: string): string => `${type} ${name}`,
}

/**
 * Form accessibility helpers
 */
export const form = {
  /**
   * Associate label with input
   */
  associateLabel: (labelId: string, inputId: string) => {
    const label = document.getElementById(labelId)
    const input = document.getElementById(inputId)
    if (label && input) {
      label.setAttribute('for', inputId)
      input.setAttribute('aria-labelledby', labelId)
    }
  },

  /**
   * Add error message association
   */
  addErrorAssociation: (inputId: string, errorId: string) => {
    const input = document.getElementById(inputId)
    const error = document.getElementById(errorId)
    if (input && error) {
      input.setAttribute('aria-describedby', errorId)
      error.setAttribute('role', 'alert')
    }
  },
}

/**
 * High contrast mode utilities
 */
export const highContrast = {
  /**
   * Check if high contrast mode is enabled
   */
  isEnabled: (): boolean => {
    return window.matchMedia('(prefers-contrast: high)').matches
  },

  /**
   * Listen for high contrast mode changes
   */
  onChange: (callback: (enabled: boolean) => void) => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    const handler = (e: MediaQueryListEvent) => callback(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  },
}

/**
 * Reduce motion utilities
 */
export const reduceMotion = {
  /**
   * Check if reduced motion is preferred
   */
  isEnabled: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  /**
   * Listen for reduced motion preference changes
   */
  onChange: (callback: (enabled: boolean) => void) => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => callback(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  },
}

/**
 * WCAG compliance checkers
 */
export const wcag = {
  /**
   * Check WCAG 2.1 AA compliance for color contrast
   */
  checkContrast: (foreground: string, background: string): {
    ratio: number
    passesAA: boolean
    passesAAA: boolean
  } => {
    // Simplified implementation - use proper contrast calculator in production
    const getLuminance = (color: string): number => {
      const rgb = parseInt(color.slice(1), 16)
      const r = (rgb >> 16) & 0xff
      const g = (rgb >> 8) & 0xff
      const b = (rgb >> 0) & 0xff
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }

    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    const ratio = (lighter + 0.05) / (darker + 0.05)

    return {
      ratio,
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7,
    }
  },
}
