import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
]

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    // Announce language change to screen readers
    const announcement = `Language changed to ${languages.find(l => l.code === lng)?.name}`
    const region = document.getElementById('live-region-polite')
    if (region) {
      region.textContent = announcement
    }
  }

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t('button.language')}
          title={t('button.language')}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('button.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={t('button.language')}>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            aria-selected={i18n.language === language.code}
            role="menuitemradio"
          >
            <span aria-hidden="true" className="mr-2">
              {language.flag}
            </span>
            {language.name}
            {i18n.language === language.code && (
              <span className="sr-only" aria-live="polite">
                ({t('a11y.selected')})
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageSwitcher
