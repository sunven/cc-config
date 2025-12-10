/**
 * Loading message localization
 *
 * This module provides centralized loading messages for consistent user experience
 * across the cc-config application.
 */

/// Loading messages for different operations
export const LOADING_MESSAGES = {
  // File operations
  SCANNING_FILES: 'Scanning configuration files...',
  READING_FILE: (fileName: string) => `Reading ${fileName}...`,
  WRITING_FILE: (fileName: string) => `Writing ${fileName}...`,
  DELETING_FILE: (fileName: string) => `Deleting ${fileName}...`,
  COPYING_FILE: (fileName: string) => `Copying ${fileName}...`,
  MOVING_FILE: (fileName: string) => `Moving ${fileName}...`,

  // Configuration operations
  LOADING_CONFIG: 'Loading configuration...',
  LOADING_USER_CONFIG: 'Loading user configuration...',
  LOADING_PROJECT_CONFIG: 'Loading project configuration...',
  PARSING_CONFIG: 'Parsing configuration...',
  VALIDATING_CONFIG: 'Validating configuration...',
  UPDATING_CONFIG: 'Updating configuration...',
  SAVING_CONFIG: 'Saving configuration...',

  // Project operations
  LOADING_PROJECTS: 'Loading projects...',
  DISCOVERING_PROJECTS: 'Discovering projects...',
  LOADING_PROJECT_LIST: 'Loading project list...',
  LOADING_PROJECT_DETAILS: 'Loading project details...',

  // Scope operations
  SWITCHING_SCOPE: 'Switching scope...',
  LOADING_USER_SCOPE: 'Loading user scope...',
  LOADING_PROJECT_SCOPE: 'Loading project scope...',
  MERGING_SCOPES: 'Merging scopes...',

  // Inheritance operations
  CALCULATING_INHERITANCE: 'Calculating inheritance chain...',
  RESOLVING_INHERITANCE: 'Resolving inheritance...',
  BUILDING_INHERITANCE_PATH: 'Building inheritance path...',

  // Capability operations
  LOADING_CAPABILITIES: 'Loading capabilities...',
  LOADING_MCP_SERVERS: 'Loading MCP servers...',
  LOADING_SUB_AGENTS: 'Loading sub-agents...',
  FETCHING_CAPABILITY_DETAILS: 'Fetching capability details...',

  // Export operations
  PREPARING_EXPORT: 'Preparing export...',
  GENERATING_EXPORT: 'Generating export...',
  WRITING_EXPORT_FILE: 'Writing export file...',
  COMPLETING_EXPORT: 'Completing export...',

  // Comparison operations
  COMPARING_PROJECTS: 'Comparing projects...',
  ANALYZING_DIFFERENCES: 'Analyzing differences...',
  CALCULATING_DIFFS: 'Calculating differences...',

  // Health operations
  CHECKING_PROJECT_HEALTH: 'Checking project health...',
  ANALYZING_HEALTH_METRICS: 'Analyzing health metrics...',
  GENERATING_HEALTH_REPORT: 'Generating health report...',

  // Error recovery
  RETRYING_OPERATION: 'Retrying operation...',
  RECOVERING_FROM_ERROR: 'Recovering from error...',
  RESETTING_STATE: 'Resetting state...',

  // General operations
  INITIALIZING: 'Initializing...',
  LOADING: 'Loading...',
  PROCESSING: 'Processing...',
  WORKING: 'Working...',
  PLEASE_WAIT: 'Please wait...',
  LOADING_DATA: 'Loading data...',
  FETCHING_DATA: 'Fetching data...',
  SYNCHRONIZING: 'Synchronizing...',
} as const

/// Type for all loading messages
export type LoadingMessageKey = keyof typeof LOADING_MESSAGES

/// Type for parameterized loading messages
export type LoadingMessage = typeof LOADING_MESSAGES[LoadingMessageKey] extends (arg: infer T) => any
  ? (arg: T) => string
  : string

/// Helper function to get loading message
export function getLoadingMessage(
  key: LoadingMessageKey,
  ...args: any[]
): string {
  const message = LOADING_MESSAGES[key]

  if (typeof message === 'function') {
    return message(...args)
  }

  return message
}

/// Helper function to check if a message key is valid
export function isValidLoadingMessageKey(key: string): key is LoadingMessageKey {
  return key in LOADING_MESSAGES
}

/// Helper function to get all loading message keys
export function getAllLoadingMessageKeys(): LoadingMessageKey[] {
  return Object.keys(LOADING_MESSAGES) as LoadingMessageKey[]
}

/// Helper function to get loading messages by category
export const LOADING_MESSAGE_CATEGORIES = {
  FILE_OPERATIONS: [
    'SCANNING_FILES',
    'READING_FILE',
    'WRITING_FILE',
    'DELETING_FILE',
    'COPYING_FILE',
    'MOVING_FILE',
  ] as LoadingMessageKey[],

  CONFIG_OPERATIONS: [
    'LOADING_CONFIG',
    'LOADING_USER_CONFIG',
    'LOADING_PROJECT_CONFIG',
    'PARSING_CONFIG',
    'VALIDATING_CONFIG',
    'UPDATING_CONFIG',
    'SAVING_CONFIG',
  ] as LoadingMessageKey[],

  PROJECT_OPERATIONS: [
    'LOADING_PROJECTS',
    'DISCOVERING_PROJECTS',
    'LOADING_PROJECT_LIST',
    'LOADING_PROJECT_DETAILS',
  ] as LoadingMessageKey[],

  SCOPE_OPERATIONS: [
    'SWITCHING_SCOPE',
    'LOADING_USER_SCOPE',
    'LOADING_PROJECT_SCOPE',
    'MERGING_SCOPES',
  ] as LoadingMessageKey[],

  INHERITANCE_OPERATIONS: [
    'CALCULATING_INHERITANCE',
    'RESOLVING_INHERITANCE',
    'BUILDING_INHERITANCE_PATH',
  ] as LoadingMessageKey[],

  CAPABILITY_OPERATIONS: [
    'LOADING_CAPABILITIES',
    'LOADING_MCP_SERVERS',
    'LOADING_SUB_AGENTS',
    'FETCHING_CAPABILITY_DETAILS',
  ] as LoadingMessageKey[],

  EXPORT_OPERATIONS: [
    'PREPARING_EXPORT',
    'GENERATING_EXPORT',
    'WRITING_EXPORT_FILE',
    'COMPLETING_EXPORT',
  ] as LoadingMessageKey[],

  COMPARISON_OPERATIONS: [
    'COMPARING_PROJECTS',
    'ANALYZING_DIFFERENCES',
    'CALCULATING_DIFFS',
  ] as LoadingMessageKey[],

  HEALTH_OPERATIONS: [
    'CHECKING_PROJECT_HEALTH',
    'ANALYZING_HEALTH_METRICS',
    'GENERATING_HEALTH_REPORT',
  ] as LoadingMessageKey[],

  ERROR_RECOVERY: [
    'RETRYING_OPERATION',
    'RECOVERING_FROM_ERROR',
    'RESETTING_STATE',
  ] as LoadingMessageKey[],

  GENERAL: [
    'INITIALIZING',
    'LOADING',
    'PROCESSING',
    'WORKING',
    'PLEASE_WAIT',
    'LOADING_DATA',
    'FETCHING_DATA',
    'SYNCHRONIZING',
  ] as LoadingMessageKey[],
}

/// Helper function to get messages by category
export function getMessagesByCategory(category: keyof typeof LOADING_MESSAGE_CATEGORIES): string[] {
  const keys = LOADING_MESSAGE_CATEGORIES[category]
  return keys.map((key) => getLoadingMessage(key))
}
