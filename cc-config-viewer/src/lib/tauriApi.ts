import { invoke } from '@tauri-apps/api/core'
import type { AppError } from '../types'

export async function readConfig(path: string): Promise<string> {
  try {
    return await invoke<string>('read_config', { path })
  } catch (error) {
    throw {
      type: 'filesystem',
      message: `Failed to read config: ${error}`,
      details: error,
    } as AppError
  }
}

export async function parseConfig(content: string): Promise<any> {
  try {
    return await invoke<any>('parse_config', { content })
  } catch (error) {
    throw {
      type: 'parse',
      message: `Failed to parse config: ${error}`,
      details: error,
    } as AppError
  }
}

export async function watchConfig(path: string, callback: (path: string) => void): Promise<void> {
  try {
    await invoke('watch_config', { path, callback })
  } catch (error) {
    throw {
      type: 'filesystem',
      message: `Failed to watch config: ${error}`,
      details: error,
    } as AppError
  }
}
