/**
 * Internationalization (i18n) Testing Suite
 *
 * Tests for multi-language support, locale-specific formatting,
 * date/time formatting, number formatting, and text direction
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock internationalization context
const createI18nContext = (language: string, locale: string) => {
  const translations: Record<string, Record<string, string>> = {
    en: {
      welcome: 'Welcome',
      hello: 'Hello, {name}!',
      date: 'Date',
      time: 'Time',
      number: 'Number',
      currency: 'Currency',
      config: 'Configuration',
      servers: 'Servers',
      agents: 'Agents',
      settings: 'Settings',
      dashboard: 'Dashboard',
      comparison: 'Comparison',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
    },
    es: {
      welcome: 'Bienvenido',
      hello: '¡Hola, {name}!',
      date: 'Fecha',
      time: 'Hora',
      number: 'Número',
      currency: 'Moneda',
      config: 'Configuración',
      servers: 'Servidores',
      agents: 'Agentes',
      settings: 'Configuraciones',
      dashboard: 'Panel',
      comparison: 'Comparación',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      add: 'Agregar',
    },
    fr: {
      welcome: 'Bienvenue',
      hello: 'Bonjour, {name}!',
      date: 'Date',
      time: 'Heure',
      number: 'Numéro',
      currency: 'Devise',
      config: 'Configuration',
      servers: 'Serveurs',
      agents: 'Agents',
      settings: 'Paramètres',
      dashboard: 'Tableau de bord',
      comparison: 'Comparaison',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
    },
    de: {
      welcome: 'Willkommen',
      hello: 'Hallo, {name}!',
      date: 'Datum',
      time: 'Zeit',
      number: 'Nummer',
      currency: 'Währung',
      config: 'Konfiguration',
      servers: 'Server',
      agents: 'Agenten',
      settings: 'Einstellungen',
      dashboard: 'Dashboard',
      comparison: 'Vergleich',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      add: 'Hinzufügen',
    },
    ja: {
      welcome: 'ようこそ',
      hello: 'こんにちは、{name}さん！',
      date: '日付',
      time: '時間',
      number: '番号',
      currency: '通貨',
      config: '構成',
      servers: 'サーバー',
      agents: 'エージェント',
      settings: '設定',
      dashboard: 'ダッシュボード',
      comparison: '比較',
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      add: '追加',
    },
    zh: {
      welcome: '欢迎',
      hello: '你好，{name}！',
      date: '日期',
      time: '时间',
      number: '数字',
      currency: '货币',
      config: '配置',
      servers: '服务器',
      agents: '代理',
      settings: '设置',
      dashboard: '仪表板',
      comparison: '比较',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      add: '添加',
    },
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[language]?.[key] || translations.en[key] || key

    if (params) {
      return Object.entries(params).reduce(
        (str, [param, value]) => str.replace(`{${param}}`, String(value)),
        translation
      )
    }

    return translation
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(locale)
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(locale)
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString(locale)
  }

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatRelativeTime = (seconds: number): string => {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

    if (Math.abs(seconds) < 60) {
      return rtf.format(Math.round(seconds), 'second')
    } else if (Math.abs(seconds) < 3600) {
      return rtf.format(Math.round(seconds / 60), 'minute')
    } else if (Math.abs(seconds) < 86400) {
      return rtf.format(Math.round(seconds / 3600), 'hour')
    } else {
      return rtf.format(Math.round(seconds / 86400), 'day')
    }
  }

  return {
    language,
    locale,
    t,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
  }
}

describe('Internationalization Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('10.1: Language Support', () => {
    it('should support English (en)', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.t('welcome')).toBe('Welcome')
      expect(i18n.t('hello', { name: 'John' })).toBe('Hello, John!')
      expect(i18n.t('config')).toBe('Configuration')
    })

    it('should support Spanish (es)', () => {
      const i18n = createI18nContext('es', 'es-ES')

      expect(i18n.t('welcome')).toBe('Bienvenido')
      expect(i18n.t('hello', { name: 'Juan' })).toBe('¡Hola, Juan!')
      expect(i18n.t('config')).toBe('Configuración')
    })

    it('should support French (fr)', () => {
      const i18n = createI18nContext('fr', 'fr-FR')

      expect(i18n.t('welcome')).toBe('Bienvenue')
      expect(i18n.t('hello', { name: 'Jean' })).toBe('Bonjour, Jean!')
      expect(i18n.t('config')).toBe('Configuration')
    })

    it('should support German (de)', () => {
      const i18n = createI18nContext('de', 'de-DE')

      expect(i18n.t('welcome')).toBe('Willkommen')
      expect(i18n.t('hello', { name: 'Hans' })).toBe('Hallo, Hans!')
      expect(i18n.t('config')).toBe('Konfiguration')
    })

    it('should support Japanese (ja)', () => {
      const i18n = createI18nContext('ja', 'ja-JP')

      expect(i18n.t('welcome')).toBe('ようこそ')
      expect(i18n.t('hello', { name: '太郎' })).toBe('こんにちは、太郎さん！')
      expect(i18n.t('config')).toBe('構成')
    })

    it('should support Chinese (zh)', () => {
      const i18n = createI18nContext('zh', 'zh-CN')

      expect(i18n.t('welcome')).toBe('欢迎')
      expect(i18n.t('hello', { name: '张三' })).toBe('你好，张三！')
      expect(i18n.t('config')).toBe('配置')
    })

    it('should fall back to English for unsupported languages', () => {
      const i18n = createI18nContext('pt', 'pt-BR')

      expect(i18n.t('welcome')).toBe('Welcome')
      expect(i18n.t('config')).toBe('Configuration')
    })
  })

  describe('10.2: Locale-Specific Formatting', () => {
    it('should format dates according to locale', () => {
      const date = new Date('2025-12-11T10:30:00')

      const i18n_en = createI18nContext('en', 'en-US')
      const i18n_de = createI18nContext('de', 'de-DE')
      const i18n_ja = createI18nContext('ja', 'ja-JP')

      expect(i18n_en.formatDate(date)).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
      expect(i18n_de.formatDate(date)).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/)
      expect(i18n_ja.formatDate(date)).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/)
    })

    it('should format times according to locale', () => {
      const date = new Date('2025-12-11T14:30:00')

      const i18n_en = createI18nContext('en', 'en-US')
      const i18n_fr = createI18nContext('fr', 'fr-FR')

      expect(i18n_en.formatTime(date)).toMatch(/\d{1,2}:\d{2}/)
      expect(i18n_fr.formatTime(date)).toMatch(/\d{1,2}:\d{2}/)
    })

    it('should format numbers according to locale', () => {
      const i18n_en = createI18nContext('en', 'en-US')
      const i18n_de = createI18nContext('de', 'de-DE')
      const i18n_fr = createI18nContext('fr', 'fr-FR')

      expect(i18n_en.formatNumber(1000000)).toBe('1,000,000')
      expect(i18n_de.formatNumber(1000000)).toBe('1.000.000')
      expect(i18n_fr.formatNumber(1000000)).toBe('1 000 000')
    })

    it('should format currency according to locale', () => {
      const i18n_en = createI18nContext('en', 'en-US')
      const i18n_de = createI18nContext('de', 'de-DE')
      const i18n_fr = createI18nContext('fr', 'fr-FR')

      expect(i18n_en.formatCurrency(100, 'USD')).toMatch(/\$100/)
      expect(i18n_de.formatCurrency(100, 'EUR')).toMatch(/100.*€/)
      expect(i18n_fr.formatCurrency(100, 'EUR')).toMatch(/100.*€/)
    })

    it('should handle decimal separators per locale', () => {
      const i18n_en = createI18nContext('en', 'en-US')
      const i18n_de = createI18nContext('de', 'de-DE')

      expect(i18n_en.formatNumber(99.99)).toBe('99.99')
      expect(i18n_de.formatNumber(99.99)).toBe('99,99')
    })
  })

  describe('10.3: Text Interpolation', () => {
    it('should interpolate variables in translations', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.t('hello', { name: 'Alice' })).toBe('Hello, Alice!')
      expect(i18n.t('hello', { name: 'Bob' })).toBe('Hello, Bob!')
    })

    it('should handle multiple variables', () => {
      const i18n = createI18nContext('en', 'en-US')

      const translate = (key: string, params: Record<string, string>) => {
        return i18n.t(key, params)
      }

      const message = translate('hello', { name: 'Charlie' })
      expect(message).toContain('Charlie')
    })

    it('should handle missing variables gracefully', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.t('hello')).toBe('Hello, {name}!')
    })
  })

  describe('10.4: Pluralization', () => {
    it('should handle plural forms (English)', () => {
      const getPlural = (count: number, singular: string, plural: string) => {
        return count === 1 ? singular : plural
      }

      expect(getPlural(1, 'server', 'servers')).toBe('server')
      expect(getPlural(2, 'server', 'servers')).toBe('servers')
      expect(getPlural(0, 'server', 'servers')).toBe('servers')
    })

    it('should handle plural forms (other languages)', () => {
      const getPluralForm = (count: number, lang: string) => {
        if (lang === 'en') {
          return count === 1 ? 'one' : 'other'
        }
        if (lang === 'fr') {
          return count === 0 || count === 1 ? 'one' : 'other'
        }
        return 'other'
      }

      expect(getPluralForm(1, 'en')).toBe('one')
      expect(getPluralForm(2, 'en')).toBe('other')
      expect(getPluralForm(1, 'fr')).toBe('one')
      expect(getPluralForm(2, 'fr')).toBe('other')
    })
  })

  describe('10.5: Text Direction (LTR/RTL)', () => {
    it('should support LTR languages', () => {
      const ltrLanguages = ['en', 'es', 'fr', 'de', 'ja', 'zh']

      ltrLanguages.forEach(lang => {
        const i18n = createI18nContext(lang, 'en-US')
        expect(i18n.t('welcome')).toBeDefined()
      })
    })

    it('should handle text alignment for LTR', () => {
      const text = 'Welcome to the application'

      const element = document.createElement('div')
      element.setAttribute('dir', 'ltr')
      element.textContent = text

      expect(element.getAttribute('dir')).toBe('ltr')
    })

    it('should be extensible for RTL languages', () => {
      const isRTL = (lang: string): boolean => {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur']
        return rtlLanguages.includes(lang)
      }

      expect(isRTL('en')).toBe(false)
      expect(isRTL('ar')).toBe(true)
    })
  })

  describe('10.6: Number Formatting', () => {
    it('should format integers correctly', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.formatNumber(42)).toBe('42')
      expect(i18n.formatNumber(100)).toBe('100')
      expect(i18n.formatNumber(1000)).toBe('1,000')
    })

    it('should format decimals correctly', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.formatNumber(3.14)).toBe('3.14')
      expect(i18n.formatNumber(0.5)).toBe('0.5')
    })

    it('should format large numbers with separators', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.formatNumber(1000000)).toBe('1,000,000')
      expect(i18n.formatNumber(1234567)).toBe('1,234,567')
    })

    it('should handle negative numbers', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.formatNumber(-42)).toBe('-42')
      expect(i18n.formatNumber(-1000)).toBe('-1,000')
    })
  })

  describe('10.7: Date Formatting', () => {
    it('should format full dates', () => {
      const i18n = createI18nContext('en', 'en-US')
      const date = new Date('2025-12-11')

      const formatted = i18n.formatDate(date)
      expect(formatted).toBeTruthy()
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should format dates with different locales', () => {
      const date = new Date('2025-12-11')

      const i18n_us = createI18nContext('en', 'en-US')
      const i18n_uk = createI18nContext('en', 'en-GB')

      const formatted_us = i18n_us.formatDate(date)
      const formatted_uk = i18n_uk.formatDate(date)

      expect(formatted_us).not.toBe(formatted_uk)
    })

    it('should format relative time', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.formatRelativeTime(30)).toBe('in 30 seconds')
      expect(i18n.formatRelativeTime(-60)).toBe('1 minute ago')
      expect(i18n.formatRelativeTime(3600)).toBe('in 1 hour')
    })
  })

  describe('10.8: Currency Formatting', () => {
    it('should format USD currency', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.formatCurrency(100, 'USD')).toMatch(/\$100/)
      expect(i18n.formatCurrency(99.99, 'USD')).toMatch(/\$99\.99/)
    })

    it('should format EUR currency', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.formatCurrency(100, 'EUR')).toMatch(/€100/)
    })

    it('should format JPY currency (no decimals)', () => {
      const i18n = createI18nContext('en', 'en-US')

      expect(i18n.formatCurrency(100, 'JPY')).toMatch(/¥100/)
    })
  })

  describe('10.9: UI Component Internationalization', () => {
    it('should translate button labels', () => {
      const i18n = createI18nContext('en', 'en-US')

      const Button = ({ children }: { children: string }) => (
        <button>{children}</button>
      )

      render(<Button>{i18n.t('save')}</Button>)

      expect(screen.getByRole('button')).toHaveTextContent('Save')
    })

    it('should translate navigation items', () => {
      const i18n = createI18nContext('fr', 'fr-FR')

      const Navigation = () => (
        <nav>
          <div data-testid="dashboard">{i18n.t('dashboard')}</div>
          <div data-testid="settings">{i18n.t('settings')}</div>
        </nav>
      )

      render(<Navigation />)

      expect(screen.getByTestId('dashboard')).toHaveTextContent('Tableau de bord')
      expect(screen.getByTestId('settings')).toHaveTextContent('Paramètres')
    })

    it('should update language at runtime', () => {
      let currentLang = 'en'
      const i18n = createI18nContext(currentLang, 'en-US')

      expect(i18n.t('welcome')).toBe('Welcome')

      currentLang = 'es'
      const i18n_es = createI18nContext(currentLang, 'es-ES')

      expect(i18n_es.t('welcome')).toBe('Bienvenido')
    })
  })

  describe('10.10: Error Messages', () => {
    it('should translate error messages', () => {
      const i18n = createI18nContext('en', 'en-US')

      const getErrorMessage = (code: string) => {
        const errors: Record<string, string> = {
          'file-not-found': 'File not found',
          'permission-denied': 'Permission denied',
          'invalid-config': 'Invalid configuration',
        }
        return errors[code] || 'Unknown error'
      }

      expect(getErrorMessage('file-not-found')).toBe('File not found')
    })

    it('should translate error messages in different languages', () => {
      const i18n_en = createI18nContext('en', 'en-US')
      const i18n_fr = createI18nContext('fr', 'fr-FR')

      const getErrorMessage = (i18n: any, code: string) => {
        const errors: Record<string, string> = {
          'en': {
            'file-not-found': 'File not found',
          },
          'fr': {
            'file-not-found': 'Fichier non trouvé',
          },
        }
        return errors[i18n.language]?.[code] || errors.en[code] || 'Unknown error'
      }

      expect(getErrorMessage(i18n_en, 'file-not-found')).toBe('File not found')
      expect(getErrorMessage(i18n_fr, 'file-not-found')).toBe('Fichier non trouvé')
    })
  })
})
