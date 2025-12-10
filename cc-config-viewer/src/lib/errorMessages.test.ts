/**
 * Unit tests for errorMessages module
 */

import {
  getErrorMessage,
  getErrorTitle,
  getErrorSuggestions,
  formatErrorForDisplay,
  canRetryError,
  getRetrySuggestion,
  isValidErrorCode,
  getAllErrorCodes,
  getErrorCodeDescription,
} from './errorMessages';
import {
  createFilesystemError,
  createPermissionError,
  createParseError,
  createNetworkError,
} from './errorTypes';

describe('getErrorMessage', () => {
  test('should return localized message for filesystem error with code', () => {
    const error = createFilesystemError('/test/path', 'read', 'No such file', 'FS001');
    const result = getErrorMessage(error);

    expect(result.title).toBe('文件未找到');
    expect(result.message).toContain('/test/path');
    expect(result.suggestions).toContain('检查文件路径是否正确');
  });

  test('should return localized message for permission error', () => {
    const error = createPermissionError('/restricted/file', 'read', 'FS002');
    const result = getErrorMessage(error);

    expect(result.title).toBe('权限不足');
    expect(result.message).toContain('/restricted/file');
    expect(result.message).toContain('权限');
    expect(result.suggestions).toContain('检查文件和目录权限');
  });

  test('should return localized message for parse error with line number', () => {
    const error = createParseError('JSON', 'Invalid syntax', 42, 'PR001');
    const result = getErrorMessage(error);

    expect(result.title).toBe('JSON 解析错误');
    expect(result.message).toContain('第 42 行');
    expect(result.message).toContain('JSON 文件格式错误');
    expect(result.suggestions).toContain('检查 JSON 语法是否正确');
  });

  test('should return localized message for parse error without line number', () => {
    const error = createParseError('YAML', 'Invalid format', undefined, 'PR002');
    const result = getErrorMessage(error);

    expect(result.title).toBe('Markdown 解析错误');
    expect(result.message).not.toContain('第');
    expect(result.suggestions).toContain('检查 Markdown 语法');
  });

  test('should return localized message for network error with status code', () => {
    const error = createNetworkError('https://api.example.com', 404, 'NT001');
    const result = getErrorMessage(error);

    expect(result.title).toBe('连接超时');
    expect(result.message).toContain('https://api.example.com');
    expect(result.suggestions).toContain('检查网络连接');
  });

  test('should return localized message for network error without status code', () => {
    const error = createNetworkError('https://api.example.com', undefined, 'NT001');
    const result = getErrorMessage(error);

    expect(result.message).toContain('https://api.example.com');
    expect(result.message).not.toContain('状态码');
  });

  test('should return fallback message for unknown error code', () => {
    const error = createFilesystemError('/test', 'read', 'error', 'UNKNOWN');
    const result = getErrorMessage(error);

    expect(result.title).toBe('未知错误');
    expect(result.suggestions).toContain('刷新页面重试');
  });

  test('should return fallback message for error without code', () => {
    const error = createFilesystemError('/test', 'read', 'error');
    const result = getErrorMessage(error);

    expect(result.title).toBe('文件未找到');
    expect(result.message).toContain('/test');
    expect(result.suggestions).toContain('检查文件路径是否正确');
  });
});

describe('getErrorTitle', () => {
  test('should return error title for known error code', () => {
    const error = createFilesystemError('/test', 'read', 'error', 'FS001');
    const title = getErrorTitle(error);

    expect(title).toBe('文件未找到');
  });

  test('should return generic title for unknown error code', () => {
    const error = createFilesystemError('/test', 'read', 'error', 'UNKNOWN');
    const title = getErrorTitle(error);

    expect(title).toBe('未知错误');
  });
});

describe('getErrorSuggestions', () => {
  test('should return suggestions for known error code', () => {
    const error = createPermissionError('/test', 'read', 'FS002');
    const suggestions = getErrorSuggestions(error);

    expect(suggestions).toContain('检查文件和目录权限');
    expect(suggestions).toContain('使用管理员权限运行应用');
  });

  test('should return default suggestions for unknown error code', () => {
    const error = createFilesystemError('/test', 'read', 'error', 'UNKNOWN');
    const suggestions = getErrorSuggestions(error);

    expect(suggestions).toContain('刷新页面重试');
    expect(suggestions).toContain('重启应用');
  });
});

describe('formatErrorForDisplay', () => {
  test('should format error with all details', () => {
    const error = createFilesystemError('/test/path', 'read', 'error', 'FS001');
    const formatted = formatErrorForDisplay(error);

    expect(formatted.title).toBe('文件未找到');
    expect(formatted.message).toContain('/test/path');
    expect(formatted.code).toBe('FS001');
    expect(formatted.severity).toBe('medium');
    expect(formatted.suggestions).toBeInstanceOf(Array);
  });

  test('should include severity level', () => {
    const permissionError = createPermissionError('/test', 'read', 'FS002');
    const formatted = formatErrorForDisplay(permissionError);

    expect(formatted.severity).toBe('high');

    const networkError = createNetworkError('https://api.com', 200, 'NT001');
    const networkFormatted = formatErrorForDisplay(networkError);

    expect(networkFormatted.severity).toBe('low');
  });
});

describe('canRetryError', () => {
  test('should return true for recoverable errors', () => {
    const recoverableError = createFilesystemError('/test', 'read', 'error', 'FS001');
    expect(canRetryError(recoverableError)).toBe(true);

    const parseError = createParseError('JSON', 'error', 42, 'PR001');
    expect(canRetryError(parseError)).toBe(true);
  });

  test('should return false for non-recoverable errors', () => {
    const permissionError = createPermissionError('/test', 'read', 'FS002');
    expect(canRetryError(permissionError)).toBe(false);

    const network404Error = createNetworkError('https://api.com', 404, 'NT001');
    expect(canRetryError(network404Error)).toBe(false);
  });

  test('should return true for network error without status code', () => {
    const networkError = createNetworkError('https://api.com', undefined, 'NT001');
    expect(canRetryError(networkError)).toBe(true);
  });
});

describe('getRetrySuggestion', () => {
  test('should return retry suggestion for recoverable errors', () => {
    const error = createFilesystemError('/test', 'read', 'error', 'FS001');
    const suggestion = getRetrySuggestion(error);

    expect(suggestion).toBeTruthy();
    expect(suggestion).toContain('重试');
  });

  test('should return null for non-recoverable errors', () => {
    const error = createPermissionError('/test', 'read', 'FS002');
    const suggestion = getRetrySuggestion(error);

    expect(suggestion).toBeNull();
  });

  test('should provide default suggestion if no specific retry suggestion exists', () => {
    const error = createParseError('JSON', 'error', 42, 'PR001');
    const suggestion = getRetrySuggestion(error);

    expect(suggestion).toBe('请稍后重试');
  });
});

describe('isValidErrorCode', () => {
  test('should return true for valid error codes', () => {
    expect(isValidErrorCode('FS001')).toBe(true);
    expect(isValidErrorCode('PR001')).toBe(true);
    expect(isValidErrorCode('NT001')).toBe(true);
  });

  test('should return false for invalid error codes', () => {
    expect(isValidErrorCode('INVALID')).toBe(false);
    expect(isValidErrorCode('FS999')).toBe(false);
    expect(isValidErrorCode('')).toBe(false);
  });
});

describe('getAllErrorCodes', () => {
  test('should return array of error codes', () => {
    const codes = getAllErrorCodes();

    expect(codes).toBeInstanceOf(Array);
    expect(codes.length).toBeGreaterThan(0);
    expect(codes).toContain('FS001');
    expect(codes).toContain('PR001');
    expect(codes).toContain('NT001');
  });

  test('should not contain duplicates', () => {
    const codes = getAllErrorCodes();
    const uniqueCodes = new Set(codes);

    expect(codes.length).toBe(uniqueCodes.size);
  });
});

describe('getErrorCodeDescription', () => {
  test('should return description for valid error code', () => {
    const description = getErrorCodeDescription('FS001');

    expect(description).toBeTruthy();
    expect(description).toContain('文件未找到');
    expect(description).toContain('无法读取文件');
  });

  test('should return null for invalid error code', () => {
    expect(getErrorCodeDescription('INVALID')).toBeNull();
    expect(getErrorCodeDescription('')).toBeNull();
  });

  test('should include both title and message in description', () => {
    const description = getErrorCodeDescription('PR001');

    expect(description).toContain('JSON 解析错误');
    expect(description).toContain('JSON 文件格式错误');
  });
});

describe('Message Placeholder Replacement', () => {
  test('should replace {path} placeholder in filesystem errors', () => {
    const error = createFilesystemError('/custom/path', 'write', 'error', 'FS001');
    const result = getErrorMessage(error);

    expect(result.message).toContain('/custom/path');
  });

  test('should replace {operation} placeholder in filesystem errors', () => {
    const error = createFilesystemError('/test', 'delete', 'error', 'FS001');
    const result = getErrorMessage(error);

    expect(result.message).toContain('无法读取文件');
  });

  test('should replace {file_type} placeholder in parse errors', () => {
    const error = createParseError('CustomFormat', 'error', undefined, 'PR001');
    const result = getErrorMessage(error);

    expect(result.message).toContain('JSON 文件格式错误');
  });

  test('should replace {endpoint} placeholder in network errors', () => {
    const error = createNetworkError('https://custom.endpoint.com', 500, 'NT001');
    const result = getErrorMessage(error);

    expect(result.message).toContain('https://custom.endpoint.com');
  });

  test('should replace {line} placeholder with formatted line number', () => {
    const error = createParseError('JSON', 'error', 123, 'PR001');
    const result = getErrorMessage(error);

    expect(result.message).toContain('第 123 行');
  });

  test('should handle missing placeholders gracefully', () => {
    const error = createFilesystemError('/test', 'read', 'error');
    const result = getErrorMessage(error);

    expect(result.message).toBeTruthy();
    expect(result.suggestions).toBeInstanceOf(Array);
  });
});
