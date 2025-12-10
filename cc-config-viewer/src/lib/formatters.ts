import i18n from './i18n'

/**
 * Format a date according to the current locale
 */
export const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
  const locale = i18n.language || 'en'
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj)
}

/**
 * Format a time according to the current locale
 */
export const formatTime = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
  const locale = i18n.language || 'en'
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj)
}

/**
 * Format a date and time according to the current locale
 */
export const formatDateTime = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
  const locale = i18n.language || 'en'
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj)
}

/**
 * Format a number according to the current locale
 */
export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  const locale = i18n.language || 'en'

  const defaultOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2,
  }

  return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(value)
}

/**
 * Format currency according to the current locale
 */
export const formatCurrency = (
  value: number,
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string => {
  const locale = i18n.language || 'en'

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }

  return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(value)
}

/**
 * Format a percentage according to the current locale
 */
export const formatPercent = (value: number, options?: Intl.NumberFormatOptions): string => {
  const locale = i18n.language || 'en'

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'percent',
    maximumFractionDigits: 2,
  }

  return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(value / 100)
}

/**
 * Format a file size in bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  const locale = i18n.language || 'en'

  if (bytes === 0) {
    return '0 B'
  }

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  const value = bytes / Math.pow(k, i)

  return `${formatNumber(value, { maximumFractionDigits: 2 })} ${sizes[i]}`
}

/**
 * Format a duration in milliseconds to human readable format
 */
export const formatDuration = (milliseconds: number): string => {
  const locale = i18n.language || 'en'

  if (milliseconds < 1000) {
    return `${milliseconds} ms`
  }

  const seconds = milliseconds / 1000

  if (seconds < 60) {
    return `${formatNumber(seconds, { maximumFractionDigits: 2 })} s`
  }

  const minutes = seconds / 60

  if (minutes < 60) {
    return `${formatNumber(minutes, { maximumFractionDigits: 2 })} min`
  }

  const hours = minutes / 60

  if (hours < 24) {
    return `${formatNumber(hours, { maximumFractionDigits: 2 })} h`
  }

  const days = hours / 24

  return `${formatNumber(days, { maximumFractionDigits: 2 })} days`
}

/**
 * Get the current locale
 */
export const getCurrentLocale = (): string => {
  return i18n.language || 'en'
}

/**
 * Check if the current locale is right-to-left
 */
export const isRTL = (): boolean => {
  const locale = getCurrentLocale()
  const rtlLocales = ['ar', 'he', 'fa', 'ur']
  return rtlLocales.some(l => locale.startsWith(l))
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  const locale = i18n.language || 'en'
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const now = new Date()

  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute')
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour')
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return rtf.format(-diffInDays, 'day')
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, 'month')
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return rtf.format(-diffInYears, 'year')
}
