import { useState, useEffect, useCallback } from 'react'

type ZoomLevel = 50 | 75 | 100 | 125 | 150 | 200

const ZOOM_LEVELS: ZoomLevel[] = [50, 75, 100, 125, 150, 200]

const ZOOM_STORAGE_KEY = 'cc-config-zoom-level'

export const useZoom = () => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(() => {
    const saved = localStorage.getItem(ZOOM_STORAGE_KEY)
    return (saved as ZoomLevel) || 100
  })

  useEffect(() => {
    localStorage.setItem(ZOOM_STORAGE_KEY, zoomLevel.toString())
    document.documentElement.style.fontSize = `${zoomLevel}%`
  }, [zoomLevel])

  const zoomIn = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel)
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoomLevel(ZOOM_LEVELS[currentIndex + 1])
    }
  }, [zoomLevel])

  const zoomOut = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel)
    if (currentIndex > 0) {
      setZoomLevel(ZOOM_LEVELS[currentIndex - 1])
    }
  }, [zoomLevel])

  const resetZoom = useCallback(() => {
    setZoomLevel(100)
  }, [])

  const setZoom = useCallback((level: ZoomLevel) => {
    if (ZOOM_LEVELS.includes(level)) {
      setZoomLevel(level)
    }
  }, [])

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    canZoomIn: zoomLevel < 200,
    canZoomOut: zoomLevel > 50,
  }
}
