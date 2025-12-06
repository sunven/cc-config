import { useState } from 'react'
import type { AppError } from '../types'

export function useErrorHandler() {
  const [errors, setErrors] = useState<AppError[]>([])

  function handleError(error: unknown) {
    const appError: AppError = {
      type: 'network',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    }

    setErrors((prev) => [...prev, appError])
    console.error('App Error:', appError)
  }

  function clearError(index: number) {
    setErrors((prev) => prev.filter((_, i) => i !== index))
  }

  function clearAllErrors() {
    setErrors([])
  }

  return {
    errors,
    handleError,
    clearError,
    clearAllErrors,
  }
}
