export * from './project'
export * from './config'
export * from './mcp'
export * from './agent'
export * from './capability'

export interface AppError {
  type: 'filesystem' | 'permission' | 'parse' | 'network'
  message: string
  code?: string
  details?: any
}
