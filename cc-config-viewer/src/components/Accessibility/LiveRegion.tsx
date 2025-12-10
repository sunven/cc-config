import React, { createContext, useContext, useEffect, useState } from 'react'
import { generateId } from '@/lib/accessibility'

type LiveRegionPriority = 'polite' | 'assertive'

interface LiveRegionContextType {
  announce: (message: string, priority?: LiveRegionPriority) => void
}

const LiveRegionContext = createContext<LiveRegionContextType | undefined>(undefined)

export const useLiveRegion = () => {
  const context = useContext(LiveRegionContext)
  if (!context) {
    throw new Error('useLiveRegion must be used within LiveRegionProvider')
  }
  return context
}

interface LiveRegionProviderProps {
  children: React.ReactNode
}

export const LiveRegionProvider: React.FC<LiveRegionProviderProps> = ({ children }) => {
  const [politeRegion, setPoliteRegion] = useState<HTMLElement | null>(null)
  const [assertiveRegion, setAssertiveRegion] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Create polite live region
    let polite = document.getElementById('live-region-polite')
    if (!polite) {
      polite = document.createElement('div')
      polite.id = 'live-region-polite'
      polite.setAttribute('aria-live', 'polite')
      polite.setAttribute('aria-atomic', 'true')
      polite.className = 'sr-only'
      document.body.appendChild(polite)
    }
    setPoliteRegion(polite)

    // Create assertive live region
    let assertive = document.getElementById('live-region-assertive')
    if (!assertive) {
      assertive = document.createElement('div')
      assertive.id = 'live-region-assertive'
      assertive.setAttribute('aria-live', 'assertive')
      assertive.setAttribute('aria-atomic', 'true')
      assertive.className = 'sr-only'
      document.body.appendChild(assertive)
    }
    setAssertiveRegion(assertive)

    // Cleanup function
    return () => {
      // Don't remove regions on unmount as they might be used elsewhere
    }
  }, [])

  const announce = (message: string, priority: LiveRegionPriority = 'polite') => {
    const region = priority === 'assertive' ? assertiveRegion : politeRegion
    if (region) {
      region.textContent = message
      // Clear after a short delay to allow re-announcement of the same message
      setTimeout(() => {
        region.textContent = ''
      }, 1000)
    }
  }

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
    </LiveRegionContext.Provider>
  )
}

interface LiveRegionProps {
  message: string
  priority?: LiveRegionPriority
  atomic?: boolean
  className?: string
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  atomic = true,
  className,
}) => {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      className={className || 'sr-only'}
      role="status"
    >
      {message}
    </div>
  )
}

export default LiveRegion
