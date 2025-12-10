/**
 * Unit tests for ErrorDisplay component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { act, renderHook } from '@testing-library/react'
import { ErrorDisplay, ErrorToast, ErrorBadge } from './ErrorDisplay'
import { useErrorStore } from '../stores/errorStore'
import { createFilesystemError, createPermissionError } from '../lib/errorTypes'

// Clear store before each test
beforeEach(() => {
  const { result } = renderHook(() => useErrorStore())
  act(() => {
    result.current.clearErrors()
  })
})

describe('ErrorDisplay', () => {
  test('should not render when there are no errors', () => {
    const { container } = render(<ErrorDisplay />)
    expect(container.firstChild).toBeNull()
  })

  test('should render errors from store', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createFilesystemError('/test/path', 'read', 'File not found', 'FS001'))
    })

    render(<ErrorDisplay />)

    expect(screen.getByText('文件未找到')).toBeInTheDocument()
  })

  test('should display error message and suggestions', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createFilesystemError('/test/path', 'read', 'Error', 'FS001'))
    })

    render(<ErrorDisplay />)

    expect(screen.getByText('建议:')).toBeInTheDocument()
    expect(screen.getByText('检查文件路径是否正确')).toBeInTheDocument()
  })

  test('should limit displayed errors to maxErrors', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      for (let i = 0; i < 10; i++) {
        store.current.addError(createFilesystemError(`/path${i}`, 'read', 'Error', 'FS001'))
      }
    })

    render(<ErrorDisplay maxErrors={3} />)

    // Should show 3 errors + message about hidden errors
    expect(screen.getByText(/还有 7 个错误未显示/)).toBeInTheDocument()
  })

  test('should dismiss error when X button clicked', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createFilesystemError('/test', 'read', 'Error', 'FS001'))
    })

    render(<ErrorDisplay />)

    const dismissButtons = screen.getAllByLabelText('Dismiss error')
    fireEvent.click(dismissButtons[0])

    // Error should be removed from store
    expect(store.current.errors.length).toBe(0)
  })

  test('should show clear all button when multiple errors exist', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'))
      store.current.addError(createFilesystemError('/path2', 'read', 'Error', 'FS001'))
    })

    render(<ErrorDisplay showDismissAll={true} />)

    expect(screen.getByText(/清除全部/)).toBeInTheDocument()
  })

  test('should clear all errors when clear all button clicked', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'))
      store.current.addError(createFilesystemError('/path2', 'read', 'Error', 'FS001'))
    })

    render(<ErrorDisplay showDismissAll={true} />)

    fireEvent.click(screen.getByText(/清除全部/))

    expect(store.current.errors.length).toBe(0)
  })

  test('should show retry button for recoverable errors', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createFilesystemError('/test', 'read', 'Error', 'FS001'))
    })

    render(<ErrorDisplay />)

    expect(screen.getByText('重试')).toBeInTheDocument()
  })

  test('should not show retry button for non-recoverable errors', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createPermissionError('/test', 'read', 'FS002'))
    })

    render(<ErrorDisplay />)

    expect(screen.queryByText('重试')).not.toBeInTheDocument()
  })

  test('should display error code when available', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createFilesystemError('/test', 'read', 'Error', 'FS001'))
    })

    render(<ErrorDisplay />)

    expect(screen.getByText(/Error code: FS001/)).toBeInTheDocument()
  })
})

describe('ErrorToast', () => {
  test('should render toast with error information', () => {
    const mockError = {
      type: 'filesystem' as const,
      path: '/test',
      operation: 'read',
      details: 'Error',
      message: 'File read error: Error',
      code: 'FS001',
      recoverable: true,
      timestamp: Date.now(),
      id: 'error_123',
    }

    render(<ErrorToast error={mockError} onDismiss={() => {}} />)

    expect(screen.getByText('文件未找到')).toBeInTheDocument()
  })

  test('should call onDismiss when X button clicked', () => {
    const mockDismiss = vi.fn()
    const mockError = {
      type: 'filesystem' as const,
      path: '/test',
      operation: 'read',
      details: 'Error',
      message: 'File read error: Error',
      code: 'FS001',
      recoverable: true,
      timestamp: Date.now(),
      id: 'error_123',
    }

    render(<ErrorToast error={mockError} onDismiss={mockDismiss} />)

    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)

    expect(mockDismiss).toHaveBeenCalled()
  })
})

describe('ErrorBadge', () => {
  test('should not render when there are no errors', () => {
    const { container } = render(<ErrorBadge />)
    expect(container.firstChild).toBeNull()
  })

  test('should render error count', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'))
      store.current.addError(createFilesystemError('/path2', 'read', 'Error', 'FS001'))
    })

    render(<ErrorBadge />)

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  test('should call onClick when clicked', () => {
    const mockClick = vi.fn()
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createFilesystemError('/test', 'read', 'Error', 'FS001'))
    })

    render(<ErrorBadge onClick={mockClick} />)

    fireEvent.click(screen.getByRole('button'))

    expect(mockClick).toHaveBeenCalled()
  })

  test('should use destructive color when critical errors exist', () => {
    const { result: store } = renderHook(() => useErrorStore())

    act(() => {
      store.current.addError(createPermissionError('/test', 'read', 'FS002'))
    })

    render(<ErrorBadge />)

    const badge = screen.getByRole('button')
    expect(badge.className).toContain('text-destructive')
  })
})
