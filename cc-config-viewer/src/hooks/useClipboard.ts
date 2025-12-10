import { useState, useCallback } from 'react'

interface UseClipboardReturn {
  isCopied: boolean
  copyToClipboard: (text: string) => Promise<boolean>
}

/**
 * useClipboard Hook
 * Provides clipboard functionality with state management
 */
export function useClipboard(): UseClipboardReturn {
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available')
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)

      // Reset after 2 seconds
      setTimeout(() => setIsCopied(false), 2000)

      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }, [])

  return {
    isCopied,
    copyToClipboard,
  }
}
