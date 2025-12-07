import { invoke } from '@tauri-apps/api/core'
import type { AppError } from '../types'

// Rust AppError is serialized as { Filesystem: "msg" } | { Permission: "msg" } | { Parse: "msg" }
interface RustAppError {
  Filesystem?: string
  Permission?: string
  Parse?: string
  Network?: string
}

function convertRustError(error: unknown): AppError {
  const rustError = error as RustAppError

  if (rustError.Permission) {
    return {
      type: 'permission',
      message: `Permission denied: ${rustError.Permission}`,
      details: error,
    }
  } else if (rustError.Filesystem) {
    return {
      type: 'filesystem',
      message: `File system error: ${rustError.Filesystem}`,
      details: error,
    }
  } else if (rustError.Parse) {
    return {
      type: 'parse',
      message: `Parse error: ${rustError.Parse}`,
      details: error,
    }
  } else if (rustError.Network) {
    return {
      type: 'network',
      message: `Network error: ${rustError.Network}`,
      details: error,
    }
  } else {
    return {
      type: 'filesystem',
      message: `Unknown error: ${error}`,
      details: error,
    }
  }
}

export async function readConfigFile(path: string): Promise<string> {
  try {
    return await invoke<string>('read_config', { path })
  } catch (error) {
    throw convertRustError(error)
  }
}

export async function parseConfigData(content: string): Promise<Record<string, any>> {
  try {
    return await invoke<Record<string, any>>('parse_config', { content })
  } catch (error) {
    throw convertRustError(error)
  }
}

// Keep backwards compatibility with old function names
export async function readConfig(path: string): Promise<string> {
  return readConfigFile(path)
}

export async function parseConfig(content: string): Promise<any> {
  return parseConfigData(content)
}

export async function watchConfig(path: string, callback: (path: string) => void): Promise<void> {
  try {
    await invoke('watch_config', { path, callback })
  } catch (error) {
    throw convertRustError(error)
  }
}
