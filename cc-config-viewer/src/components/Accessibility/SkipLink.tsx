import React from 'react'
import { useTranslation } from 'react-i18next'

interface SkipLinkProps {
  targetId: string
  className?: string
}

export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, className }) => {
  const { t } = useTranslation()

  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement> | React.KeyboardEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleSkip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleSkip(e)
        }
      }}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg ${className || ''}`}
    >
      {t('nav.skipToContent')}
    </a>
  )
}

export default SkipLink
