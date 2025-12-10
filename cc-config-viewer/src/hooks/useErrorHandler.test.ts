/**
 * Unit tests for useErrorHandler hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useErrorHandler, useAsyncWithRetry, useErrorBoundaryHandler } from './useErrorHandler';
import { useErrorStore } from '../stores/errorStore';
import { createFilesystemError, createPermissionError } from '../lib/errorTypes';

// Clear store before each test
beforeEach(() => {
  const { result } = renderHook(() => useErrorStore());
  act(() => {
    result.current.clearErrors();
  });
});

describe('useErrorHandler', () => {
  describe('handleError', () => {
    test('should handle AppError directly', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = createFilesystemError('/test/path', 'read', 'Not found', 'FS001');

      act(() => {
        result.current.handleError(error);
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].type).toBe('filesystem');
    });

    test('should handle JavaScript Error objects', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test error message');

      act(() => {
        result.current.handleError(error);
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].message).toBe('Test error message');
    });

    test('should handle string errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('Simple string error');
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].message).toBe('Simple string error');
    });

    test('should handle unknown error types', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(null);
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].message).toBe('An unknown error occurred');
    });

    test('should add context to error message', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Original error');

      act(() => {
        result.current.handleError(error, 'Loading config');
      });

      expect(result.current.errors[0].message).toContain('Loading config');
      expect(result.current.errors[0].message).toContain('Original error');
    });

    test('should return the AppError', () => {
      const { result } = renderHook(() => useErrorHandler());

      let returnedError: unknown;
      act(() => {
        returnedError = result.current.handleError(new Error('Test'));
      });

      expect(returnedError).toBeDefined();
      expect((returnedError as { type: string }).type).toBe('filesystem');
    });
  });

  describe('handleRustError', () => {
    test('should handle Rust Filesystem error', () => {
      const { result } = renderHook(() => useErrorHandler());
      const rustError = {
        Filesystem: {
          path: '/rust/path',
          operation: 'write',
          details: 'Permission denied',
        },
      };

      act(() => {
        result.current.handleRustError(rustError);
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].type).toBe('filesystem');
    });

    test('should handle Rust error as JSON string', () => {
      const { result } = renderHook(() => useErrorHandler());
      const rustErrorString = JSON.stringify({
        Parse: {
          file_type: 'JSON',
          line_number: 10,
          details: 'Unexpected token',
        },
      });

      act(() => {
        result.current.handleRustError(rustErrorString);
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].type).toBe('parse');
    });
  });

  describe('clearError', () => {
    test('should clear error by index', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(new Error('Error 1'));
        result.current.handleError(new Error('Error 2'));
      });

      act(() => {
        result.current.clearError(0);
      });

      expect(result.current.errors.length).toBe(1);
    });
  });

  describe('clearAllErrors', () => {
    test('should clear all errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(new Error('Error 1'));
        result.current.handleError(new Error('Error 2'));
      });

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.errors.length).toBe(0);
    });
  });

  describe('dismissErrorsByType', () => {
    test('should clear errors of specific type', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
        result.current.handleError(createPermissionError('/path2', 'write', 'FS002'));
      });

      act(() => {
        result.current.dismissErrorsByType('filesystem');
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].type).toBe('permission');
    });
  });

  describe('utility functions', () => {
    test('getFormattedError should return formatted message', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = createFilesystemError('/test/path', 'read', 'Not found', 'FS001');

      const formatted = result.current.getFormattedError(error);

      expect(formatted.title).toBe('文件未找到');
      expect(formatted.message).toContain('/test/path');
      expect(formatted.suggestions).toBeInstanceOf(Array);
    });

    test('canRetry should check if error is recoverable', () => {
      const { result } = renderHook(() => useErrorHandler());

      const recoverableError = createFilesystemError('/path', 'read', 'Error', 'FS001');
      expect(result.current.canRetry(recoverableError)).toBe(true);

      const nonRecoverableError = createPermissionError('/path', 'read', 'FS002');
      expect(result.current.canRetry(nonRecoverableError)).toBe(false);
    });

    test('getRetryHint should return retry suggestion', () => {
      const { result } = renderHook(() => useErrorHandler());

      const recoverableError = createFilesystemError('/path', 'read', 'Error', 'FS001');
      const hint = result.current.getRetryHint(recoverableError);

      expect(hint).toBeTruthy();
    });
  });

  describe('state properties', () => {
    test('hasErrors should reflect error state', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.hasErrors).toBe(false);

      act(() => {
        result.current.handleError(new Error('Test'));
      });

      expect(result.current.hasErrors).toBe(true);
    });

    test('lastError should be the most recent error', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(new Error('First'));
        result.current.handleError(new Error('Second'));
      });

      expect(result.current.lastError?.message).toContain('Second');
    });
  });
});

describe('useAsyncWithRetry', () => {
  test('should execute successful async function', async () => {
    const successFn = vi.fn().mockResolvedValue('success');

    const { result } = renderHook(() => useAsyncWithRetry(successFn));

    let executeResult: string | undefined;
    await act(async () => {
      executeResult = await result.current.execute();
    });

    expect(executeResult).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  test('should retry on recoverable error', async () => {
    let callCount = 0;
    const failThenSucceedFn = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 2) {
        throw createFilesystemError('/path', 'read', 'Temp error', 'FS001');
      }
      return Promise.resolve('success after retry');
    });

    const { result } = renderHook(() =>
      useAsyncWithRetry(failThenSucceedFn, {
        initialDelayMs: 10,
        maxRetries: 3,
      })
    );

    let executeResult: string | undefined;
    await act(async () => {
      executeResult = await result.current.execute();
    });

    expect(executeResult).toBe('success after retry');
    expect(failThenSucceedFn).toHaveBeenCalledTimes(2);
  });

  test('should not retry on non-recoverable error', async () => {
    const failFn = vi.fn().mockRejectedValue(createPermissionError('/path', 'write', 'FS002'));

    const { result } = renderHook(() =>
      useAsyncWithRetry(failFn, {
        initialDelayMs: 10,
        maxRetries: 3,
      })
    );

    await act(async () => {
      await result.current.execute();
    });

    // Should only be called once since permission errors are not recoverable
    expect(failFn).toHaveBeenCalledTimes(1);
  });

  test('should stop after max retries', async () => {
    const alwaysFailFn = vi
      .fn()
      .mockRejectedValue(createFilesystemError('/path', 'read', 'Error', 'FS001'));

    const { result } = renderHook(() =>
      useAsyncWithRetry(alwaysFailFn, {
        initialDelayMs: 10,
        maxRetries: 2,
      })
    );

    await act(async () => {
      await result.current.execute();
    });

    // Initial call + 2 retries = 3 calls
    expect(alwaysFailFn).toHaveBeenCalledTimes(3);
  });

  test('reset should stop retrying', async () => {
    const { result } = renderHook(() =>
      useAsyncWithRetry(() => Promise.resolve('test'), {
        initialDelayMs: 10,
      })
    );

    act(() => {
      result.current.reset();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useErrorBoundaryHandler', () => {
  test('wrapAsync should catch and handle errors', async () => {
    const { result: errorHandler } = renderHook(() => useErrorHandler());
    const { result } = renderHook(() => useErrorBoundaryHandler());

    const failingFn = async () => {
      throw new Error('Async error');
    };

    const wrappedFn = result.current.wrapAsync(failingFn);

    await act(async () => {
      const returnValue = await wrappedFn();
      expect(returnValue).toBeUndefined();
    });

    expect(errorHandler.current.errors.length).toBeGreaterThan(0);
  });

  test('wrapAsync should return result on success', async () => {
    const { result } = renderHook(() => useErrorBoundaryHandler());

    const successFn = async () => 'success value';
    const wrappedFn = result.current.wrapAsync(successFn);

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await wrappedFn();
    });

    expect(returnValue).toBe('success value');
  });

  test('wrapSync should catch and handle errors', () => {
    const { result: errorHandler } = renderHook(() => useErrorHandler());
    const { result } = renderHook(() => useErrorBoundaryHandler());

    const failingFn = () => {
      throw new Error('Sync error');
    };

    const wrappedFn = result.current.wrapSync(failingFn);

    act(() => {
      const returnValue = wrappedFn();
      expect(returnValue).toBeUndefined();
    });

    expect(errorHandler.current.errors.length).toBeGreaterThan(0);
  });

  test('wrapSync should return result on success', () => {
    const { result } = renderHook(() => useErrorBoundaryHandler());

    const successFn = () => 'sync value';
    const wrappedFn = result.current.wrapSync(successFn);

    let returnValue: string | undefined;
    act(() => {
      returnValue = wrappedFn();
    });

    expect(returnValue).toBe('sync value');
  });

  test('wrapAsync should pass arguments correctly', async () => {
    const { result } = renderHook(() => useErrorBoundaryHandler());

    const addFn = async (a: number, b: number) => a + b;
    const wrappedFn = result.current.wrapAsync(addFn);

    let returnValue: number | undefined;
    await act(async () => {
      returnValue = await wrappedFn(5, 3);
    });

    expect(returnValue).toBe(8);
  });
});
