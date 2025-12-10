export * from './project'
export * from './config'
export * from './mcp'
export * from './agent'
export * from './capability'
export * from './comparison'
export * from './health'
export * from './export'

export interface AppError {
  type: 'filesystem' | 'permission' | 'parse' | 'network' | 'export' | 'clipboard'
  message: string
  code?: string
  details?: any
}
