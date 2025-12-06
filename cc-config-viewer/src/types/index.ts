export * from './project'
export * from './config'
export * from './mcp'

export interface AppError {
  type: 'filesystem' | 'permission' | 'parse' | 'network'
  message: string
  code?: string
  details?: any
}
