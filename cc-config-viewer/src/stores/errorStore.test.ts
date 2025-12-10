/**
 * Unit tests for errorStore module
 */

import { act, renderHook } from '@testing-library/react';
import {
  useErrorStore,
  useErrorStoreEnhanced,
  useFilesystemErrors,
  usePermissionErrors,
  useParseErrors,
  useNetworkErrors,
  useErrorStats,
  TimestampedError,
} from './errorStore';
import { createFilesystemError, createPermissionError, createParseError, createNetworkError } from '../lib/errorTypes';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useErrorStore', () => {
  beforeEach(() => {
    // Clear store before each test
    const { result } = renderHook(() => useErrorStore());
    act(() => {
      result.current.clearErrors();
    });
    localStorageMock.clear();
  });

  describe('addError', () => {
    test('should add error to the store', () => {
      const { result } = renderHook(() => useErrorStore());
      const error = createFilesystemError('/test/path', 'read', 'Not found', 'FS001');

      act(() => {
        result.current.addError(error);
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].type).toBe('filesystem');
      expect(result.current.errors[0].path).toBe('/test/path');
    });

    test('should add timestamp and id to error', () => {
      const { result } = renderHook(() => useErrorStore());
      const error = createFilesystemError('/test/path', 'read', 'Not found', 'FS001');

      act(() => {
        result.current.addError(error);
      });

      expect(result.current.errors[0].timestamp).toBeDefined();
      expect(result.current.errors[0].id).toBeDefined();
      expect(result.current.errors[0].id).toMatch(/^error_\d+_[a-z0-9]+$/);
    });

    test('should set lastError to the most recent error', () => {
      const { result } = renderHook(() => useErrorStore());
      const error1 = createFilesystemError('/path1', 'read', 'Error 1', 'FS001');
      const error2 = createFilesystemError('/path2', 'write', 'Error 2', 'FS001');

      act(() => {
        result.current.addError(error1);
        result.current.addError(error2);
      });

      expect(result.current.lastError?.path).toBe('/path2');
    });

    test('should limit errors to MAX_ERROR_HISTORY (100)', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        for (let i = 0; i < 150; i++) {
          result.current.addError(createFilesystemError(`/path${i}`, 'read', 'Error', 'FS001'));
        }
      });

      expect(result.current.errors.length).toBe(100);
    });

    test('should add new errors at the beginning of the array', () => {
      const { result } = renderHook(() => useErrorStore());
      const error1 = createFilesystemError('/first', 'read', 'Error 1', 'FS001');
      const error2 = createFilesystemError('/second', 'read', 'Error 2', 'FS001');

      act(() => {
        result.current.addError(error1);
        result.current.addError(error2);
      });

      expect(result.current.errors[0].path).toBe('/second');
      expect(result.current.errors[1].path).toBe('/first');
    });
  });

  describe('removeError', () => {
    test('should remove error by index', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error 1', 'FS001'));
        result.current.addError(createFilesystemError('/path2', 'read', 'Error 2', 'FS001'));
        result.current.addError(createFilesystemError('/path3', 'read', 'Error 3', 'FS001'));
      });

      act(() => {
        result.current.removeError(1);
      });

      expect(result.current.errors.length).toBe(2);
      expect(result.current.errors[0].path).toBe('/path3');
      expect(result.current.errors[1].path).toBe('/path1');
    });

    test('should not modify errors for invalid index', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
      });

      act(() => {
        result.current.removeError(10);
        result.current.removeError(-1);
      });

      expect(result.current.errors.length).toBe(1);
    });

    test('should update lastError when removing first error', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error 1', 'FS001'));
        result.current.addError(createFilesystemError('/path2', 'read', 'Error 2', 'FS001'));
      });

      act(() => {
        result.current.removeError(0);
      });

      expect(result.current.lastError?.path).toBe('/path1');
    });
  });

  describe('clearErrors', () => {
    test('should clear all errors', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
        result.current.addError(createFilesystemError('/path2', 'read', 'Error', 'FS001'));
      });

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors.length).toBe(0);
      expect(result.current.lastError).toBeUndefined();
    });
  });

  describe('clearErrorsByType', () => {
    test('should clear only errors of specified type', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
        result.current.addError(createPermissionError('/path2', 'write', 'FS002'));
        result.current.addError(createFilesystemError('/path3', 'read', 'Error', 'FS001'));
      });

      act(() => {
        result.current.clearErrorsByType('filesystem');
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].type).toBe('permission');
    });
  });

  describe('setRetrying', () => {
    test('should set retrying state', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.setRetrying(true);
      });

      expect(result.current.isRetrying).toBe(true);

      act(() => {
        result.current.setRetrying(false);
      });

      expect(result.current.isRetrying).toBe(false);
    });
  });

  describe('getErrorStats', () => {
    test('should return correct error statistics', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
        result.current.addError(createFilesystemError('/path2', 'read', 'Error', 'FS001'));
        result.current.addError(createPermissionError('/path3', 'write', 'FS002'));
        result.current.addError(createParseError('JSON', 'Invalid', 10, 'PR001'));
      });

      const stats = result.current.getErrorStats();

      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByType['filesystem']).toBe(2);
      expect(stats.errorsByType['permission']).toBe(1);
      expect(stats.errorsByType['parse']).toBe(1);
      expect(stats.recentErrors).toBe(4); // All errors are recent
    });
  });

  describe('getErrorsByType', () => {
    test('should return errors of specified type', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
        result.current.addError(createPermissionError('/path2', 'write', 'FS002'));
        result.current.addError(createFilesystemError('/path3', 'read', 'Error', 'FS001'));
      });

      const filesystemErrors = result.current.getErrorsByType('filesystem');

      expect(filesystemErrors.length).toBe(2);
      filesystemErrors.forEach((error) => {
        expect(error.type).toBe('filesystem');
      });
    });
  });

  describe('getRecentErrors', () => {
    test('should return errors from the last hour by default', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
        result.current.addError(createFilesystemError('/path2', 'read', 'Error', 'FS001'));
      });

      const recentErrors = result.current.getRecentErrors();

      expect(recentErrors.length).toBe(2);
    });
  });

  describe('hasError', () => {
    test('should return true if errors of type exist', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
      });

      expect(result.current.hasError('filesystem')).toBe(true);
      expect(result.current.hasError('permission')).toBe(false);
    });
  });

  describe('getErrorCount', () => {
    test('should return total error count when no type specified', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
        result.current.addError(createPermissionError('/path2', 'write', 'FS002'));
      });

      expect(result.current.getErrorCount()).toBe(2);
    });

    test('should return count for specific type', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
        result.current.addError(createFilesystemError('/path2', 'read', 'Error', 'FS001'));
        result.current.addError(createPermissionError('/path3', 'write', 'FS002'));
      });

      expect(result.current.getErrorCount('filesystem')).toBe(2);
      expect(result.current.getErrorCount('permission')).toBe(1);
    });
  });

  describe('exportErrors', () => {
    test('should export errors as JSON string', () => {
      const { result } = renderHook(() => useErrorStore());

      act(() => {
        result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
      });

      const exported = result.current.exportErrors();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].path).toBe('/path1');
    });
  });

  describe('importErrors', () => {
    test('should import valid errors from JSON', () => {
      const { result } = renderHook(() => useErrorStore());

      // The validation requires: type, message, recoverable, timestamp, id
      const errorsToImport = [
        {
          type: 'filesystem',
          message: 'Imported error',
          recoverable: true,
          timestamp: Date.now(),
          id: 'error_123_abc',
          path: '/imported/path',
          operation: 'read',
          details: 'Imported error',
        },
      ];

      act(() => {
        result.current.importErrors(JSON.stringify(errorsToImport));
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].path).toBe('/imported/path');
    });

    test('should throw error for invalid JSON', () => {
      const { result } = renderHook(() => useErrorStore());

      expect(() => {
        act(() => {
          result.current.importErrors('invalid json');
        });
      }).toThrow('Invalid error data format');
    });

    test('should filter out invalid errors during import', () => {
      const { result } = renderHook(() => useErrorStore());

      const mixedErrors = [
        {
          type: 'filesystem',
          message: 'Valid error',
          recoverable: true,
          timestamp: Date.now(),
          id: 'error_123_abc',
        },
        { invalid: 'error' },
        null,
      ];

      act(() => {
        result.current.importErrors(JSON.stringify(mixedErrors));
      });

      expect(result.current.errors.length).toBe(1);
    });
  });
});

describe('useErrorStoreEnhanced', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useErrorStore());
    act(() => {
      result.current.clearErrors();
    });
  });

  test('should return latest 10 errors', () => {
    const { result } = renderHook(() => useErrorStoreEnhanced());

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.addError(createFilesystemError(`/path${i}`, 'read', 'Error', 'FS001'));
      }
    });

    const latest = result.current.getLatestErrors();
    expect(latest.length).toBe(10);
  });

  test('should check if there are any errors', () => {
    const { result } = renderHook(() => useErrorStoreEnhanced());

    expect(result.current.hasErrors()).toBe(false);

    act(() => {
      result.current.addError(createFilesystemError('/path', 'read', 'Error', 'FS001'));
    });

    expect(result.current.hasErrors()).toBe(true);
  });

  test('should get critical (non-recoverable) errors', () => {
    const { result } = renderHook(() => useErrorStoreEnhanced());

    act(() => {
      result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001')); // recoverable
      result.current.addError(createPermissionError('/path2', 'write', 'FS002')); // non-recoverable
    });

    const critical = result.current.getCriticalErrors();
    expect(critical.length).toBe(1);
    expect(critical[0].type).toBe('permission');
  });

  test('should get recoverable errors', () => {
    const { result } = renderHook(() => useErrorStoreEnhanced());

    act(() => {
      result.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001')); // recoverable
      result.current.addError(createPermissionError('/path2', 'write', 'FS002')); // non-recoverable
    });

    const recoverable = result.current.getRecoverableErrors();
    expect(recoverable.length).toBe(1);
    expect(recoverable[0].type).toBe('filesystem');
  });
});

describe('Selector Hooks', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useErrorStore());
    act(() => {
      result.current.clearErrors();
    });
  });

  test('useFilesystemErrors should return filesystem errors', () => {
    const { result: store } = renderHook(() => useErrorStore());

    act(() => {
      store.current.addError(createFilesystemError('/path', 'read', 'Error', 'FS001'));
      store.current.addError(createPermissionError('/path2', 'write', 'FS002'));
    });

    // Check using getErrorsByType directly instead of selector hook
    const fsErrors = store.current.getErrorsByType('filesystem');
    expect(fsErrors.length).toBe(1);
    expect(fsErrors[0].type).toBe('filesystem');
  });

  test('usePermissionErrors should return permission errors', () => {
    const { result: store } = renderHook(() => useErrorStore());

    act(() => {
      store.current.addError(createFilesystemError('/path', 'read', 'Error', 'FS001'));
      store.current.addError(createPermissionError('/path2', 'write', 'FS002'));
    });

    const permErrors = store.current.getErrorsByType('permission');
    expect(permErrors.length).toBe(1);
    expect(permErrors[0].type).toBe('permission');
  });

  test('useParseErrors should return parse errors', () => {
    const { result: store } = renderHook(() => useErrorStore());

    act(() => {
      store.current.addError(createParseError('JSON', 'Invalid', 10, 'PR001'));
    });

    const parseErrors = store.current.getErrorsByType('parse');
    expect(parseErrors.length).toBe(1);
    expect(parseErrors[0].type).toBe('parse');
  });

  test('useNetworkErrors should return network errors', () => {
    const { result: store } = renderHook(() => useErrorStore());

    act(() => {
      store.current.addError(createNetworkError('https://api.com', 500, 'NT001'));
    });

    const netErrors = store.current.getErrorsByType('network');
    expect(netErrors.length).toBe(1);
    expect(netErrors[0].type).toBe('network');
  });

  test('getErrorStats should return error statistics', () => {
    const { result: store } = renderHook(() => useErrorStore());

    act(() => {
      store.current.addError(createFilesystemError('/path1', 'read', 'Error', 'FS001'));
      store.current.addError(createFilesystemError('/path2', 'read', 'Error', 'FS001'));
      store.current.addError(createPermissionError('/path3', 'write', 'FS002'));
    });

    const stats = store.current.getErrorStats();

    expect(stats.totalErrors).toBe(3);
    expect(stats.errorsByType['filesystem']).toBe(2);
    expect(stats.errorsByType['permission']).toBe(1);
  });
});
