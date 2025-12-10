import React from 'react'
import { Button } from '@/components/ui/button'
import { useZoom } from '@/hooks/useZoom'
import { useTranslation } from 'react-i18next'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

export const ZoomControls: React.FC = () => {
  const { t } = useTranslation()
  const { zoomLevel, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } = useZoom()

  return (
    <div className="flex items-center gap-1" role="toolbar" aria-label={t('button.zoomIn')}>
      <Button
        variant="outline"
        size="icon"
        onClick={zoomOut}
        disabled={!canZoomOut}
        aria-label={t('button.zoomOut')}
        title={t('button.zoomOut')}
      >
        <ZoomOut className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{t('button.zoomOut')}</span>
      </Button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="min-w-[3rem] text-center text-sm font-medium"
      >
        {zoomLevel}%
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={zoomIn}
        disabled={!canZoomIn}
        aria-label={t('button.zoomIn')}
        title={t('button.zoomIn')}
      >
        <ZoomIn className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{t('button.zoomIn')}</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={resetZoom}
        disabled={zoomLevel === 100}
        aria-label={t('button.resetZoom')}
        title={t('button.resetZoom')}
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{t('button.resetZoom')}</span>
      </Button>
    </div>
  )
}

export default ZoomControls
