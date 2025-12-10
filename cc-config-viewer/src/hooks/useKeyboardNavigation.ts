import { useEffect, useRef } from 'react'
import { keyboardNavigation } from '@/lib/accessibility'

interface UseListKeyboardNavigationOptions {
  items: HTMLElement[]
  onSelect: (index: number) => void
  onActivate?: (index: number) => void
  orientation?: 'horizontal' | 'vertical'
  loop?: boolean
}

export const useListKeyboardNavigation = ({
  items,
  onSelect,
  onActivate,
  orientation = 'vertical',
  loop = true,
}: UseListKeyboardNavigationOptions) => {
  const currentIndex = useRef(0)

  const handleKeyDown = (e: KeyboardEvent) => {
    // Handle arrow keys
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault()

      let nextIndex = currentIndex.current

      switch (e.key) {
        case 'ArrowDown':
          nextIndex = Math.min(currentIndex.current + 1, items.length - 1)
          break
        case 'ArrowUp':
          nextIndex = Math.max(currentIndex.current - 1, 0)
          break
        case 'Home':
          nextIndex = 0
          break
        case 'End':
          nextIndex = items.length - 1
          break
      }

      if (loop || (nextIndex >= 0 && nextIndex < items.length)) {
        currentIndex.current = nextIndex
        onSelect(nextIndex)
      }
    }

    // Handle activation
    if ((e.key === 'Enter' || e.key === ' ') && onActivate) {
      e.preventDefault()
      onActivate(currentIndex.current)
    }
  }

  useEffect(() => {
    const container = items[0]?.parentElement
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [items])

  return {
    getItemProps: (index: number) => ({
      tabIndex: index === currentIndex.current ? 0 : -1,
      'aria-selected': index === currentIndex.current,
    }),
    focusItem: (index: number) => {
      currentIndex.current = index
      items[index]?.focus()
    },
  }
}

interface UseDialogKeyboardNavigationOptions {
  onClose: () => void
  trapFocus?: boolean
}

export const useDialogKeyboardNavigation = ({
  onClose,
  trapFocus = true,
}: UseDialogKeyboardNavigationOptions) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Store the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus the dialog
    if (dialogRef.current) {
      dialogRef.current.focus()
    }

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    // Handle focus trap
    let cleanup: (() => void) | undefined

    if (trapFocus && dialogRef.current) {
      cleanup = keyboardNavigation.trapFocus(dialogRef.current)
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      cleanup?.()

      // Restore focus
      previousFocusRef.current?.focus()
    }
  }, [onClose, trapFocus])

  return {
    dialogProps: {
      ref: dialogRef,
      role: 'dialog',
      'aria-modal': true,
      tabIndex: -1,
    },
  }
}

interface UseMenuKeyboardNavigationOptions {
  items: HTMLElement[]
  onSelect: (index: number) => void
  onClose: () => void
}

export const useMenuKeyboardNavigation = ({
  items,
  onSelect,
  onClose,
}: UseMenuKeyboardNavigationOptions) => {
  const currentIndex = useRef(0)

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        currentIndex.current = Math.min(currentIndex.current + 1, items.length - 1)
        items[currentIndex.current]?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        currentIndex.current = Math.max(currentIndex.current - 1, 0)
        items[currentIndex.current]?.focus()
        break
      case 'Home':
        e.preventDefault()
        currentIndex.current = 0
        items[currentIndex.current]?.focus()
        break
      case 'End':
        e.preventDefault()
        currentIndex.current = items.length - 1
        items[currentIndex.current]?.focus()
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(currentIndex.current)
        onClose()
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  useEffect(() => {
    const menu = items[0]?.parentElement
    if (!menu) return

    menu.addEventListener('keydown', handleKeyDown)
    items[0]?.focus()

    return () => {
      menu.removeEventListener('keydown', handleKeyDown)
    }
  }, [items])

  return {
    getItemProps: (index: number) => ({
      role: 'menuitemradio',
      'aria-checked': index === currentIndex.current,
      tabIndex: index === currentIndex.current ? 0 : -1,
    }),
  }
}

interface UseRovingTabIndexOptions {
  items: HTMLElement[]
  orientation?: 'horizontal' | 'vertical' | 'both'
  loop?: boolean
}

export const useRovingTabIndex = ({
  items,
  orientation = 'vertical',
  loop = true,
}: UseRovingTabIndexOptions) => {
  const currentIndex = useRef(0)

  const focusItem = (index: number) => {
    if (index >= 0 && index < items.length) {
      currentIndex.current = index
      items[index].focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    let nextIndex = currentIndex.current

    if (orientation === 'vertical' || orientation === 'both') {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          nextIndex = loop
            ? (currentIndex.current + 1) % items.length
            : Math.min(currentIndex.current + 1, items.length - 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          nextIndex = loop
            ? (currentIndex.current - 1 + items.length) % items.length
            : Math.max(currentIndex.current - 1, 0)
          break
      }
    }

    if (orientation === 'horizontal' || orientation === 'both') {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          nextIndex = loop
            ? (currentIndex.current + 1) % items.length
            : Math.min(currentIndex.current + 1, items.length - 1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          nextIndex = loop
            ? (currentIndex.current - 1 + items.length) % items.length
            : Math.max(currentIndex.current - 1, 0)
          break
      }
    }

    if (nextIndex !== currentIndex.current) {
      focusItem(nextIndex)
    }
  }

  useEffect(() => {
    const container = items[0]?.parentElement
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [items, orientation, loop])

  return {
    getItemProps: (index: number) => ({
      tabIndex: index === currentIndex.current ? 0 : -1,
    }),
    focusItem,
  }
}
