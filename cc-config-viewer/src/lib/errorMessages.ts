/**
 * Error message localization for comprehensive error handling
 *
 * This module provides localized error messages for all error types
 * with actionable suggestions in Chinese (default language).
 */

import {
  AppError,
  FilesystemError,
  PermissionError,
  ParseError,
  NetworkError,
  isFilesystemError,
  isPermissionError,
  isParseError,
  isNetworkError,
} from './errorTypes';

/// Localized error messages interface
interface LocalizedMessages {
  [key: string]: {
    title: string;
    message: string;
    suggestions: string[];
  };
}

/// Error message catalog with Chinese translations
const ERROR_MESSAGES: LocalizedMessages = {
  // Filesystem Errors
  'FS001': {
    title: '文件未找到',
    message: '无法读取文件 "{path}"',
    suggestions: [
      '检查文件路径是否正确',
      '确认文件是否存在',
      '验证文件权限设置'
    ]
  },
  'FS002': {
    title: '权限不足',
    message: '没有权限访问 "{path}"',
    suggestions: [
      '检查文件和目录权限',
      '使用管理员权限运行应用',
      '联系系统管理员获取访问权限'
    ]
  },
  'FS003': {
    title: '文件格式无效',
    message: '文件 "{path}" 的格式不正确',
    suggestions: [
      '检查文件编码格式',
      '验证文件完整性',
      '尝试重新创建文件'
    ]
  },
  'FS004': {
    title: '文件过大',
    message: '文件 "{path}" 超过大小限制',
    suggestions: [
      '压缩文件内容',
      '分割为大文件为多个小文件',
      '增加文件大小限制设置'
    ]
  },

  // Parse Errors
  'PR001': {
    title: 'JSON 解析错误',
    message: 'JSON 文件格式错误{line}',
    suggestions: [
      '检查 JSON 语法是否正确',
      '使用 JSON 验证工具检查',
      '确保没有多余的逗号或括号'
    ]
  },
  'PR002': {
    title: 'Markdown 解析错误',
    message: 'Markdown 文件格式错误{line}',
    suggestions: [
      '检查 Markdown 语法',
      '验证标题和列表格式',
      '确保所有代码块正确闭合'
    ]
  },
  'PR003': {
    title: '缺少必需字段',
    message: '配置文件缺少必需字段：{field}',
    suggestions: [
      '查看配置文件模板',
      '添加缺失的必需字段',
      '验证字段名称拼写'
    ]
  },
  'PR004': {
    title: '配置值无效',
    message: '配置值 "{value}" 无效{line}',
    suggestions: [
      '检查值的数据类型',
      '验证值是否在允许范围内',
      '参考配置文档获取有效值'
    ]
  },

  // Network Errors
  'NT001': {
    title: '连接超时',
    message: '无法连接到 {endpoint}',
    suggestions: [
      '检查网络连接',
      '验证服务器地址是否正确',
      '稍后重试'
    ]
  },
  'NT002': {
    title: '服务器响应无效',
    message: '服务器返回无效响应{status}',
    suggestions: [
      '检查服务器状态',
      '验证请求格式',
      '联系服务器管理员'
    ]
  },
  'NT003': {
    title: '服务不可用',
    message: '服务 "{service}" 当前不可用',
    suggestions: [
      '检查服务状态页面',
      '稍后重试',
      '联系服务提供商'
    ]
  },

  // Generic Errors
  'GENERIC_FILESYSTEM': {
    title: '文件系统错误',
    message: '文件操作失败：{details}',
    suggestions: [
      '检查文件路径和权限',
      '确保有足够的磁盘空间',
      '重启应用后重试'
    ]
  },
  'GENERIC_PERMISSION': {
    title: '权限错误',
    message: '没有执行此操作的权限：{details}',
    suggestions: [
      '以管理员身份运行',
      '检查用户权限设置',
      '联系系统管理员'
    ]
  },
  'GENERIC_PARSE': {
    title: '解析错误',
    message: '无法解析数据：{details}',
    suggestions: [
      '检查数据格式',
      '验证文件编码',
      '查看解析错误详情'
    ]
  },
  'GENERIC_NETWORK': {
    title: '网络错误',
    message: '网络操作失败：{details}',
    suggestions: [
      '检查网络连接',
      '验证服务器地址',
      '检查防火墙设置'
    ]
  }
};

/// Get localized error message
export function getErrorMessage(error: AppError): {
  title: string;
  message: string;
  suggestions: string[];
} {
  // Use error code if available, otherwise use generic message based on type
  const code = error.code || `GENERIC_${error.type.toUpperCase()}`;
  const messageTemplate = ERROR_MESSAGES[code];

  if (!messageTemplate) {
    // Fallback to generic message
    return {
      title: '未知错误',
      message: error.message || '发生了一个未知错误',
      suggestions: [
        '刷新页面重试',
        '重启应用',
        '联系技术支持'
      ]
    };
  }

  // Replace placeholders in message
  let message = messageTemplate.message;
  let title = messageTemplate.title;

  // Extract details based on error type
  if (isFilesystemError(error)) {
    message = message.replace('{path}', error.path);
    message = message.replace('{operation}', error.operation);
    message = message.replace('{details}', error.details);
  } else if (isPermissionError(error)) {
    message = message.replace('{path}', error.path);
    message = message.replace('{required_permission}', error.required_permission);
  } else if (isParseError(error)) {
    message = message.replace('{file_type}', error.file_type);
    message = message.replace('{details}', error.details);
    if (error.line_number) {
      message = message.replace('{line}', `（第 ${error.line_number} 行）`);
    } else {
      message = message.replace('{line}', '');
    }
  } else if (isNetworkError(error)) {
    message = message.replace('{endpoint}', error.endpoint);
    if (error.status_code) {
      message = message.replace('{status}', `（状态码：${error.status_code}）`);
    } else {
      message = message.replace('{status}', '');
    }
  }

  // Replace generic placeholders
  message = message.replace('{details}', error.message || '未知详情');

  return {
    title,
    message,
    suggestions: messageTemplate.suggestions
  };
}

/// Get error title only
export function getErrorTitle(error: AppError): string {
  const code = error.code || `GENERIC_${error.type.toUpperCase()}`;
  const messageTemplate = ERROR_MESSAGES[code];
  return messageTemplate?.title || '未知错误';
}

/// Get actionable suggestions for error recovery
export function getErrorSuggestions(error: AppError): string[] {
  const code = error.code || `GENERIC_${error.type.toUpperCase()}`;
  const messageTemplate = ERROR_MESSAGES[code];
  return messageTemplate?.suggestions || [
    '刷新页面重试',
    '重启应用',
    '联系技术支持'
  ];
}

/// Format error for display in UI
export function formatErrorForDisplay(error: AppError): {
  title: string;
  message: string;
  code?: string;
  suggestions: string[];
  severity: 'low' | 'medium' | 'high';
} {
  const localized = getErrorMessage(error);
  const severity = getErrorSeverity(error);

  return {
    title: localized.title,
    message: localized.message,
    code: error.code,
    suggestions: localized.suggestions,
    severity
  };
}

/// Check if error can be retried
export function canRetryError(error: AppError): boolean {
  return error.recoverable === true;
}

/// Get retry suggestion
export function getRetrySuggestion(error: AppError): string | null {
  if (!canRetryError(error)) {
    return null;
  }

  const suggestions = getErrorSuggestions(error);

  // Look for retry-related suggestions
  const retrySuggestion = suggestions.find(s =>
    s.includes('重试') || s.includes('retry') || s.includes('稍后')
  );

  return retrySuggestion || '请稍后重试';
}

/// Helper to get error severity
function getErrorSeverity(error: AppError): 'low' | 'medium' | 'high' {
  if (error.type === 'permission') {
    return 'high';
  }

  if (error.type === 'network') {
    const networkError = error as NetworkError;
    const status = networkError.status_code;
    if (status === undefined) return 'medium';
    if (status >= 500) return 'high';
    if (status >= 400) return 'medium';
    return 'low';
  }

  if (error.type === 'parse') {
    const parseError = error as ParseError;
    return parseError.line_number ? 'medium' : 'low';
  }

  return 'medium';
}

/// Validate error code exists
export function isValidErrorCode(code: string): boolean {
  return code in ERROR_MESSAGES;
}

/// Get all available error codes
export function getAllErrorCodes(): string[] {
  return Object.keys(ERROR_MESSAGES);
}

/// Get error code description
export function getErrorCodeDescription(code: string): string | null {
  const message = ERROR_MESSAGES[code];
  if (!message) {
    return null;
  }

  return `${message.title}: ${message.message}`;
}
