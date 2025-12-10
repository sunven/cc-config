/**
 * Unit tests for errorTypes module
 */

import {
  AppError,
  ErrorType,
  FilesystemError,
  PermissionError,
  ParseError,
  NetworkError,
  ErrorCodes,
  isFilesystemError,
  isPermissionError,
  isParseError,
  isNetworkError,
  createFilesystemError,
  createPermissionError,
  createParseError,
  createNetworkError,
  fromRustError,
  isRecoverableError,
  getErrorSeverity,
} from './errorTypes';

describe('Error Type Guards', () => {
  test('isFilesystemError should return true for filesystem errors', () => {
    const error: FilesystemError = {
      type: 'filesystem',
      path: '/test/path',
      operation: 'read',
      details: 'File not found',
      code: ErrorCodes.FS001,
      recoverable: true,
    };

    expect(isFilesystemError(error)).toBe(true);
    expect(isFilesystemError({ ...error, type: 'permission' as ErrorType })).toBe(false);
  });

  test('isPermissionError should return true for permission errors', () => {
    const error: PermissionError = {
      type: 'permission',
      path: '/restricted/file',
      required_permission: 'read',
      code: ErrorCodes.FS002,
      recoverable: false,
    };

    expect(isPermissionError(error)).toBe(true);
    expect(isPermissionError({ ...error, type: 'filesystem' as ErrorType })).toBe(false);
  });

  test('isParseError should return true for parse errors', () => {
    const error: ParseError = {
      type: 'parse',
      file_type: 'JSON',
      line_number: 42,
      details: 'Invalid syntax',
      code: ErrorCodes.PR001,
      recoverable: true,
    };

    expect(isParseError(error)).toBe(true);
    expect(isParseError({ ...error, type: 'network' as ErrorType })).toBe(false);
  });

  test('isNetworkError should return true for network errors', () => {
    const error: NetworkError = {
      type: 'network',
      endpoint: 'https://api.example.com',
      status_code: 404,
      code: ErrorCodes.NT001,
      recoverable: false,
    };

    expect(isNetworkError(error)).toBe(true);
    expect(isNetworkError({ ...error, type: 'parse' as ErrorType })).toBe(false);
  });
});

describe('Error Creation Helpers', () => {
  test('createFilesystemError should create a valid filesystem error', () => {
    const error = createFilesystemError('/test/path', 'read', 'Not found', ErrorCodes.FS001);

    expect(error.type).toBe('filesystem');
    expect(error.path).toBe('/test/path');
    expect(error.operation).toBe('read');
    expect(error.details).toBe('Not found');
    expect(error.code).toBe(ErrorCodes.FS001);
    expect(error.recoverable).toBe(true);
  });

  test('createPermissionError should create a valid permission error', () => {
    const error = createPermissionError('/restricted/file', 'read', ErrorCodes.FS002);

    expect(error.type).toBe('permission');
    expect(error.path).toBe('/restricted/file');
    expect(error.required_permission).toBe('read');
    expect(error.code).toBe(ErrorCodes.FS002);
    expect(error.recoverable).toBe(false);
  });

  test('createParseError should create a valid parse error', () => {
    const error = createParseError('JSON', 'Invalid syntax', 42, ErrorCodes.PR001);

    expect(error.type).toBe('parse');
    expect(error.file_type).toBe('JSON');
    expect(error.line_number).toBe(42);
    expect(error.details).toBe('Invalid syntax');
    expect(error.code).toBe(ErrorCodes.PR001);
    expect(error.recoverable).toBe(true);
  });

  test('createParseError without line number should work', () => {
    const error = createParseError('YAML', 'Invalid format', undefined, ErrorCodes.PR002);

    expect(error.type).toBe('parse');
    expect(error.file_type).toBe('YAML');
    expect(error.line_number).toBeUndefined();
    expect(error.details).toBe('Invalid format');
    expect(error.code).toBe(ErrorCodes.PR002);
  });

  test('createNetworkError should create a valid network error', () => {
    const error = createNetworkError('https://api.example.com', 404, ErrorCodes.NT001);

    expect(error.type).toBe('network');
    expect(error.endpoint).toBe('https://api.example.com');
    expect(error.status_code).toBe(404);
    expect(error.code).toBe(ErrorCodes.NT001);
    expect(error.recoverable).toBe(false);
  });

  test('createNetworkError without status code should work', () => {
    const error = createNetworkError('https://api.example.com', undefined, ErrorCodes.NT001);

    expect(error.type).toBe('network');
    expect(error.endpoint).toBe('https://api.example.com');
    expect(error.status_code).toBeUndefined();
    expect(error.recoverable).toBe(true); // No status code means potentially recoverable
  });

  test('createNetworkError with 5xx status should be recoverable', () => {
    const error = createNetworkError('https://api.example.com', 500, ErrorCodes.NT002);

    expect(error.recoverable).toBe(true);
  });
});

describe('fromRustError', () => {
  test('should convert Filesystem variant from Rust', () => {
    const rustError = {
      Filesystem: {
        path: '/test/path',
        operation: 'read',
        details: 'File not found',
      },
    };

    const tsError = fromRustError(rustError);

    expect(isFilesystemError(tsError)).toBe(true);
    expect(tsError.path).toBe('/test/path');
    expect(tsError.operation).toBe('read');
    expect(tsError.details).toBe('File not found');
    expect(tsError.code).toBe('FS001');
  });

  test('should convert Permission variant from Rust', () => {
    const rustError = {
      Permission: {
        path: '/restricted/file',
        required_permission: 'read',
      },
    };

    const tsError = fromRustError(rustError);

    expect(isPermissionError(tsError)).toBe(true);
    expect(tsError.path).toBe('/restricted/file');
    expect(tsError.required_permission).toBe('read');
    expect(tsError.code).toBe('FS002');
  });

  test('should convert Parse variant from Rust', () => {
    const rustError = {
      Parse: {
        file_type: 'JSON',
        line_number: 42,
        details: 'Invalid syntax',
      },
    };

    const tsError = fromRustError(rustError);

    expect(isParseError(tsError)).toBe(true);
    expect(tsError.file_type).toBe('JSON');
    expect(tsError.line_number).toBe(42);
    expect(tsError.details).toBe('Invalid syntax');
    expect(tsError.code).toBe('PR001');
  });

  test('should convert Network variant from Rust', () => {
    const rustError = {
      Network: {
        endpoint: 'https://api.example.com',
        status_code: 404,
      },
    };

    const tsError = fromRustError(rustError);

    expect(isNetworkError(tsError)).toBe(true);
    expect(tsError.endpoint).toBe('https://api.example.com');
    expect(tsError.status_code).toBe(404);
    expect(tsError.code).toBe('NT001');
  });

  test('should handle JSON string input', () => {
    const rustErrorString = JSON.stringify({
      Filesystem: {
        path: '/test',
        operation: 'write',
        details: 'Permission denied',
      },
    });

    const tsError = fromRustError(rustErrorString);

    expect(isFilesystemError(tsError)).toBe(true);
    expect(tsError.path).toBe('/test');
  });

  test('should return fallback for unknown error type', () => {
    const unknownError = { Unknown: {} };
    const tsError = fromRustError(unknownError);

    expect(tsError.type).toBe('filesystem');
    expect(tsError.message).toBe('Unknown error occurred');
    expect(tsError.recoverable).toBe(false);
  });
});

describe('Error Utilities', () => {
  test('isRecoverableError should check recoverable flag', () => {
    const recoverableError = createFilesystemError('/test', 'read', 'error', ErrorCodes.FS001);
    expect(isRecoverableError(recoverableError)).toBe(true);

    const nonRecoverableError = createPermissionError('/test', 'read', ErrorCodes.FS002);
    expect(isRecoverableError(nonRecoverableError)).toBe(false);
  });

  test('getErrorSeverity should return correct severity levels', () => {
    const permissionError = createPermissionError('/test', 'read', ErrorCodes.FS002);
    expect(getErrorSeverity(permissionError)).toBe('high');

    const network500Error = createNetworkError('https://api.com', 500, ErrorCodes.NT002);
    expect(getErrorSeverity(network500Error)).toBe('high');

    const network404Error = createNetworkError('https://api.com', 404, ErrorCodes.NT001);
    expect(getErrorSeverity(network404Error)).toBe('medium');

    const network200Error = createNetworkError('https://api.com', 200, ErrorCodes.NT001);
    expect(getErrorSeverity(network200Error)).toBe('low');

    const parseWithLineError = createParseError('JSON', 'error', 42, ErrorCodes.PR001);
    expect(getErrorSeverity(parseWithLineError)).toBe('medium');

    const parseWithoutLineError = createParseError('JSON', 'error', undefined, ErrorCodes.PR001);
    expect(getErrorSeverity(parseWithoutLineError)).toBe('low');

    const filesystemError = createFilesystemError('/test', 'read', 'error', ErrorCodes.FS001);
    expect(getErrorSeverity(filesystemError)).toBe('medium');
  });
});

describe('Error Codes', () => {
  test('All error codes should be defined correctly', () => {
    expect(ErrorCodes.FS001).toBe('FS001');
    expect(ErrorCodes.FS002).toBe('FS002');
    expect(ErrorCodes.FS003).toBe('FS003');
    expect(ErrorCodes.FS004).toBe('FS004');

    expect(ErrorCodes.PR001).toBe('PR001');
    expect(ErrorCodes.PR002).toBe('PR002');
    expect(ErrorCodes.PR003).toBe('PR003');
    expect(ErrorCodes.PR004).toBe('PR004');

    expect(ErrorCodes.NT001).toBe('NT001');
    expect(ErrorCodes.NT002).toBe('NT002');
    expect(ErrorCodes.NT003).toBe('NT003');
  });
});

describe('AppError Interface', () => {
  test('AppError should have correct type and properties', () => {
    const error: AppError = {
      type: 'filesystem',
      message: 'Test error',
      code: 'FS001',
      details: { path: '/test' },
      recoverable: true,
    };

    expect(error.type).toBe('filesystem');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('FS001');
    expect(error.details).toEqual({ path: '/test' });
    expect(error.recoverable).toBe(true);
  });

  test('AppError should work with optional properties', () => {
    const error: AppError = {
      type: 'parse',
      message: 'Test error',
      recoverable: true,
    };

    expect(error.type).toBe('parse');
    expect(error.message).toBe('Test error');
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
    expect(error.recoverable).toBe(true);
  });
});
