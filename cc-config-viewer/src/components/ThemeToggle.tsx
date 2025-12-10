import React from 'react'
import { Button } from '@/components/ui/button'
import { useAccessibility } from '@/hooks/useAccessibility'
import { useTranslation } from 'react-i18next'
import { Palette } from 'lucide-react'

export const ThemeToggle: React.FC = () => {
  const { t } = useTranslation()
  const { isHighContrast, toggleHighContrast } = useAccessibility()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleHighContrast}
      aria-label={isHighContrast ? t('button.highContrast') : t('button.theme')}
      title={isHighContrast ? t('button.highContrast') : t('button.theme')}
      aria-pressed={isHighContrast}
    >
      <Palette className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">
        {isHighContrast ? t('button.highContrast') : t('button.theme')}
      </span>
    </Button>
  )
}

export default ThemeToggle
