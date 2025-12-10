/**
 * TypeScript error interfaces for comprehensive error handling
 *
 * This module defines the error types that correspond to the Rust AppError enum
 * defined in Story 6.1 specifications.
 */

/// Error type discriminator for TypeScript error handling
export type ErrorType = 'filesystem' | 'permission' | 'parse' | 'network';

/// AppError interface representing all possible errors in the application
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  recoverable: boolean;
}

/// Filesystem error details
export interface FilesystemError extends Omit<AppError, 'type'> {
  type: 'filesystem';
  path: string;
  operation: string;
  details: string;
}

/// Permission error details
export interface PermissionError extends Omit<AppError, 'type'> {
  type: 'permission';
  path: string;
  required_permission: string;
}

/// Parse error details
export interface ParseError extends Omit<AppError, 'type'> {
  type: 'parse';
  file_type: string;
  line_number?: number;
  details: string;
}

/// Network error details
export interface NetworkError extends Omit<AppError, 'type'> {
  type: 'network';
  endpoint: string;
  status_code?: number;
}

/// Error code constants for programmatic error handling
export const ErrorCodes = {
  // File System Errors
  FS001: 'FS001',
  FS002: 'FS002',
  FS003: 'FS003',
  FS004: 'FS004',

  // Parse Errors
  PR001: 'PR001',
  PR002: 'PR002',
  PR003: 'PR003',
  PR004: 'PR004',

  // Network Errors
  NT001: 'NT001',
  NT002: 'NT002',
  NT003: 'NT003',
} as const;

/// Type guard to check if an error is a FilesystemError
export function isFilesystemError(error: AppError): error is FilesystemError {
  return error.type === 'filesystem';
}

/// Type guard to check if an error is a PermissionError
export function isPermissionError(error: AppError): error is PermissionError {
  return error.type === 'permission';
}

/// Type guard to check if an error is a ParseError
export function isParseError(error: AppError): error is ParseError {
  return error.type === 'parse';
}

/// Type guard to check if an error is a NetworkError
export function isNetworkError(error: AppError): error is NetworkError {
  return error.type === 'network';
}

/// Helper function to create a FilesystemError
export function createFilesystemError(
  path: string,
  operation: string,
  details: string,
  code?: string
): FilesystemError {
  return {
    type: 'filesystem',
    path,
    operation,
    details,
    message: `File ${operation} error: ${details}`,
    code: code || ErrorCodes.FS001,
    recoverable: true,
  };
}

/// Helper function to create a PermissionError
export function createPermissionError(
  path: string,
  required_permission: string,
  code?: string
): PermissionError {
  return {
    type: 'permission',
    path,
    required_permission,
    message: `Permission denied: ${required_permission} access required for ${path}`,
    code: code || ErrorCodes.FS002,
    recoverable: false,
  };
}

/// Helper function to create a ParseError
export function createParseError(
  file_type: string,
  details: string,
  line_number?: number,
  code?: string
): ParseError {
  return {
    type: 'parse',
    file_type,
    details,
    line_number,
    message: line_number
      ? `${file_type} parse error at line ${line_number}: ${details}`
      : `${file_type} parse error: ${details}`,
    code: code || ErrorCodes.PR001,
    recoverable: true,
  };
}

/// Helper function to create a NetworkError
export function createNetworkError(
  endpoint: string,
  status_code?: number,
  code?: string
): NetworkError {
  return {
    type: 'network',
    endpoint,
    status_code,
    message: status_code
      ? `Network error: ${endpoint} returned status ${status_code}`
      : `Network error: unable to reach ${endpoint}`,
    code: code || ErrorCodes.NT001,
    recoverable: status_code === undefined || status_code >= 500,
  };
}

/// Convert a Rust AppError to TypeScript AppError
export function fromRustError(rustError: any): AppError {
  // Parse the JSON error from Rust
  const error = typeof rustError === 'string' ? JSON.parse(rustError) : rustError;

  if (error.Filesystem) {
    return createFilesystemError(
      error.Filesystem.path,
      error.Filesystem.operation,
      error.Filesystem.details,
      'FS001'
    );
  }

  if (error.Permission) {
    return createPermissionError(
      error.Permission.path,
      error.Permission.required_permission,
      'FS002'
    );
  }

  if (error.Parse) {
    return createParseError(
      error.Parse.file_type,
      error.Parse.details,
      error.Parse.line_number,
      'PR001'
    );
  }

  if (error.Network) {
    return createNetworkError(
      error.Network.endpoint,
      error.Network.status_code,
      'NT001'
    );
  }

  // Default fallback
  return {
    type: 'filesystem',
    message: 'Unknown error occurred',
    recoverable: false,
  };
}

/// Check if an error is recoverable (can be retried)
export function isRecoverableError(error: AppError): boolean {
  return error.recoverable;
}

/// Get the error severity level
export function getErrorSeverity(error: AppError): 'low' | 'medium' | 'high' {
  if (isPermissionError(error)) {
    return 'high';
  }

  if (isNetworkError(error)) {
    const status = error.status_code;
    if (status === undefined) return 'medium';
    if (status >= 500) return 'high';
    if (status >= 400) return 'medium';
    return 'low';
  }

  if (isParseError(error)) {
    return error.line_number ? 'medium' : 'low';
  }

  return 'medium';
}
