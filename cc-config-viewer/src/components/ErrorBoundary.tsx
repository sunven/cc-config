import React from 'react'
import { useErrorStore } from '../stores/errorStore'
import { getErrorMessage } from '../lib/errorMessages'
import { AppError } from '../lib/errorTypes'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; onRetry?: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Log to error store
    const appError: AppError = {
      type: 'filesystem',
      message: error.message,
      details: { stack: error.stack, componentStack: errorInfo.componentStack },
      recoverable: true,
    }

    useErrorStore.getState().addError(appError)

    // Call optional error callback
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} onRetry={this.handleRetry} />
      }

      return (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
          <p className="text-sm text-destructive/80">{this.state.error.message}</p>
          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
              onClick={this.handleRetry}
            >
              Try again
            </button>
            <button
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/// Error fallback component with Chinese localization
interface ErrorFallbackProps {
  error: Error
  onRetry?: () => void
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  // Convert JavaScript Error to AppError format for localization
  const appError: AppError = {
    type: 'filesystem',
    message: error.message,
    recoverable: true,
  }

  const localizedError = getErrorMessage(appError)

  return (
    <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg max-w-lg mx-auto">
      <h2 className="text-lg font-semibold text-destructive mb-2">
        {localizedError.title}
      </h2>
      <p className="text-sm text-destructive/80 mb-4">
        {error.message}
      </p>

      {localizedError.suggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground mb-2">建议:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            {localizedError.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        {onRetry && (
          <button
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            onClick={onRetry}
          >
            重试
          </button>
        )}
        <button
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          onClick={() => window.location.reload()}
        >
          刷新页面
        </button>
      </div>
    </div>
  )
}
