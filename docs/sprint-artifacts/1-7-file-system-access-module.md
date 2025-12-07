# Story 1.7: File System Access Module

Status: ready-for-dev

## Story

As a developer,
I want to implement Rust modules for file system access,
So that the application can read configuration files securely.

## Acceptance Criteria

1. **Tauri File System Plugin Installation**
   - Given the project is initialized
   - When I install tauri-plugin-fs:
     ```bash
     cd cc-config-viewer/src-tauri
     cargo add tauri-plugin-fs
     ```
   - Then the plugin is added to Cargo.toml
   - And plugin is registered in main.rs

2. **File System Permissions Configuration**
   - Given tauri-plugin-fs is installed
   - When I configure file system permissions in capabilities/default.json:
     ```json
     {
       "permissions": [
         "core:default",
         "opener:default",
         "fs:allow-read",
         "fs:allow-home-read"
       ]
     }
     ```
   - Then the application can read:
     - ~/.claude.json
     - ~/.claude/settings.json
     - Project directory files (.mcp.json, .claude/agents/*.md)
   - And the application cannot access arbitrary system paths

3. **Config Reader Module Implementation**
   - Given file system permissions are configured
   - When I implement src-tauri/src/config/reader.rs:
     ```rust
     pub fn read_file(path: String) -> Result<String, AppError>
     pub fn parse_json(content: String) -> Result<ConfigData, AppError>
     ```
   - Then the module can:
     - Read file contents from allowed paths
     - Parse JSON configuration data
     - Handle file not found errors
     - Handle permission denied errors
     - Handle JSON parse errors

4. **Tauri Commands Implementation**
   - Given reader module is implemented
   - When I implement src-tauri/src/commands/config_commands.rs:
     ```rust
     #[tauri::command]
     async fn read_config(path: String) -> Result<String, AppError>

     #[tauri::command]
     async fn parse_config(content: String) -> Result<ConfigData, AppError>
     ```
   - Then commands are registered in main.rs
   - And frontend can call via:
     ```typescript
     import { invoke } from '@tauri-apps/api/core'
     const config = await invoke('read_config', { path: '~/.claude.json' })
     ```

5. **Error Type Implementation**
   - Given commands are implemented
   - When I implement src-tauri/src/types/error.rs:
     ```rust
     #[derive(Debug, serde::Serialize)]
     pub enum AppError {
         Filesystem(String),
         Permission(String),
         Parse(String),
     }
     ```
   - Then all Rust errors are converted to AppError
   - And errors are properly serialized to frontend
   - And error messages are user-friendly

6. **Compilation and Integration**
   - Given all modules are implemented
   - When I run `cargo check` in src-tauri/
   - Then compilation succeeds with zero errors
   - And when I run `cargo test`
   - Then all unit tests pass

## Tasks / Subtasks

- [ ] Task 1: Install and configure tauri-plugin-fs (AC: #1, #2)
  - [ ] Add tauri-plugin-fs to Cargo.toml
  - [ ] Register plugin in main.rs
  - [ ] Configure fs permissions in capabilities/default.json
  - [ ] Test file system access with simple read

- [ ] Task 2: Implement AppError type (AC: #5)
  - [ ] Create src-tauri/src/types/error.rs
  - [ ] Implement AppError enum with variants
  - [ ] Implement From<std::io::Error> for AppError
  - [ ] Implement From<serde_json::Error> for AppError
  - [ ] Add serde serialization

- [ ] Task 3: Implement config reader module (AC: #3)
  - [ ] Create src-tauri/src/config/mod.rs
  - [ ] Create src-tauri/src/config/reader.rs
  - [ ] Implement read_file function with error handling
  - [ ] Implement parse_json function with error handling
  - [ ] Add unit tests for reader functions

- [ ] Task 4: Implement Tauri commands (AC: #4)
  - [ ] Create src-tauri/src/commands/mod.rs
  - [ ] Create src-tauri/src/commands/config_commands.rs
  - [ ] Implement read_config Tauri command
  - [ ] Implement parse_config Tauri command
  - [ ] Register commands in main.rs
  - [ ] Add integration tests

- [ ] Task 5: Frontend integration wrapper (AC: #4)
  - [ ] Create src/lib/tauriApi.ts wrapper functions
  - [ ] Implement readConfigFile function
  - [ ] Implement parseConfigData function
  - [ ] Add TypeScript error handling
  - [ ] Add unit tests for frontend wrapper

- [ ] Task 6: Verification and testing (AC: #6)
  - [ ] Run `cargo check` and ensure zero errors
  - [ ] Run `cargo test` and ensure all tests pass
  - [ ] Test reading ~/.claude.json from frontend
  - [ ] Test error handling (file not found, permission denied)
  - [ ] Verify TypeScript compilation

## Dev Notes

### Architecture Requirements

**From Architecture (Section 3.2 - Data Architecture):**
- Use Tauri fs API for file operations
- Restricted paths: ~/.claude.json, ~/.claude/settings.json, project directories
- Permission model: filesystem:scope with explicit path allowlist
- Error handling: Rust layer handles FileSystemError and PermissionDenied

**From Code Review Report (Story 1.3):**
- Story 1.3 deferred file system permissions to Story 1.7
- Current Tauri v2 core permissions don't include file system access
- Need to install tauri-plugin-fs plugin
- Must configure fs:allow-read and fs:allow-home-read permissions

### Technical Specifications

**Tauri Plugin FS:**
- Version: Latest compatible with Tauri v2
- Documentation: https://v2.tauri.app/plugin/file-system/
- Permissions required:
  - `fs:allow-read` - Allow reading files
  - `fs:allow-home-read` - Allow reading from home directory
  - Optional: `fs:scope` for path restrictions

**Rust Error Handling Pattern:**
```rust
use std::fmt;

#[derive(Debug, serde::Serialize)]
pub enum AppError {
    Filesystem(String),
    Permission(String),
    Parse(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Filesystem(msg) => write!(f, "File system error: {}", msg),
            AppError::Permission(msg) => write!(f, "Permission denied: {}", msg),
            AppError::Parse(msg) => write!(f, "Parse error: {}", msg),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::PermissionDenied => {
                AppError::Permission(err.to_string())
            }
            _ => AppError::Filesystem(err.to_string()),
        }
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Parse(err.to_string())
    }
}
```

**Config Reader Implementation Pattern:**
```rust
use tauri_plugin_fs::FsExt;

pub fn read_file(app: &tauri::AppHandle, path: String) -> Result<String, AppError> {
    let fs = app.fs();
    let content = fs.read_to_string(path)?;
    Ok(content)
}

pub fn parse_json(content: String) -> Result<serde_json::Value, AppError> {
    let data: serde_json::Value = serde_json::from_str(&content)?;
    Ok(data)
}
```

**Frontend Integration Pattern:**
```typescript
// src/lib/tauriApi.ts
import { invoke } from '@tauri-apps/api/core'

export interface AppError {
  Filesystem?: string
  Permission?: string
  Parse?: string
}

export async function readConfigFile(path: string): Promise<string> {
  try {
    return await invoke<string>('read_config', { path })
  } catch (error) {
    const appError = error as AppError
    if (appError.Permission) {
      throw new Error(`Permission denied: ${appError.Permission}`)
    } else if (appError.Filesystem) {
      throw new Error(`File system error: ${appError.Filesystem}`)
    } else {
      throw new Error('Unknown error reading config file')
    }
  }
}
```

### Previous Story Intelligence

**From Story 1.3 (Tauri Permissions Configuration):**
- Core permissions already configured: core:default, opener:default
- File system permissions deferred to Story 1.7
- Need to add fs:allow-read and fs:allow-home-read
- Must install tauri-plugin-fs first

**From Story 1.6 (Zustand Stores Implementation):**
- configStore.updateConfigs() expects async config loading
- Type imports from @/types/* pattern established
- Error state management in configStore (error: string | null)

**Learnings Applied:**
- Frontend already expects async config loading
- Error handling pattern established in stores
- Type safety is critical (TypeScript strict mode)
- Integration tests required before marking complete

### File Structure Requirements

**Rust Files to Create:**
```
src-tauri/src/
├── types/
│   ├── mod.rs
│   └── error.rs          (AppError enum)
├── config/
│   ├── mod.rs
│   └── reader.rs         (read_file, parse_json)
└── commands/
    ├── mod.rs
    └── config_commands.rs (Tauri commands)
```

**Frontend Files to Create/Modify:**
```
src/lib/
└── tauriApi.ts           (Frontend wrapper functions)
```

**Modified Files:**
```
src-tauri/
├── Cargo.toml            (Add tauri-plugin-fs)
├── src/main.rs           (Register plugin and commands)
└── capabilities/default.json (Add fs permissions)
```

### Testing Requirements

**Rust Unit Tests:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_json_valid() {
        let json = r#"{"key": "value"}"#;
        let result = parse_json(json.to_string());
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_json_invalid() {
        let json = "invalid json";
        let result = parse_json(json.to_string());
        assert!(result.is_err());
    }
}
```

**Frontend Integration Tests:**
```typescript
describe('tauriApi', () => {
  it('reads config file successfully', async () => {
    const config = await readConfigFile('~/.claude.json')
    expect(config).toBeDefined()
  })

  it('handles file not found error', async () => {
    await expect(readConfigFile('/nonexistent/file.json'))
      .rejects.toThrow('File system error')
  })
})
```

### Project Structure Notes

**Alignment with Architecture:**
- Rust modules in src-tauri/src/ ✅
- Commands in commands/ directory ✅
- Error types in types/ directory ✅
- Frontend wrapper in lib/ directory ✅

**References:**
- [Architecture: Section 3.2 - Data Architecture](../../docs/architecture.md#data-architecture)
- [Architecture: Section 3.3 - Authentication & Security](../../docs/architecture.md#authentication--security)
- [Epic 1: Story 1.7](../../docs/epics.md#story-17-file-system-access-module)
- [Code Review: Story 1.3](../../docs/code-review-report-story-1-3.md)

### Security Considerations

**Permission Restrictions:**
- Only allow reading from:
  - User home directory (~/.claude.json, ~/.claude/)
  - Current project directory (.mcp.json, .claude/)
- Deny access to:
  - System directories (/etc, /usr, /System)
  - Other user directories
  - Arbitrary paths

**Error Messages:**
- Don't expose full file paths in errors
- User-friendly messages for common cases
- Detailed logging for debugging (backend only)

### Performance Considerations

**File Reading:**
- Use async operations to prevent blocking
- No caching at this stage (will be added in future stories)
- Efficient JSON parsing with serde_json

**Error Handling:**
- Fast fail on permission errors
- Minimal overhead for error conversion
- No retry logic (will be added if needed)

## Dev Agent Record

### Context Reference

Epic 1: Foundation Setup - Story 1.7
Source: docs/epics.md#story-17-file-system-access-module
Code Review Context: docs/code-review-report-story-1-3.md

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Implementation Plan

**Implementation Sequence:**

1. **tauri-plugin-fs Installation** (Priority: CRITICAL)
   - Install plugin via cargo
   - Register in main.rs
   - Configure permissions
   - Verify basic file read works

2. **AppError Type** (Priority: HIGH)
   - Foundation for all error handling
   - Must be done before reader module
   - Includes serde serialization

3. **Config Reader Module** (Priority: HIGH)
   - Core functionality
   - Implements read_file and parse_json
   - Comprehensive error handling

4. **Tauri Commands** (Priority: HIGH)
   - Bridge between Rust and frontend
   - Async commands
   - Error conversion

5. **Frontend Integration** (Priority: MEDIUM)
   - TypeScript wrapper
   - Type-safe error handling
   - Ready for use in configStore

6. **Testing & Verification** (Priority: HIGH)
   - Unit tests for all modules
   - Integration tests
   - Manual verification

**Implementation Approach:**
- Red-Green-Refactor cycle for each module
- Unit tests before marking tasks complete
- Integration test after all modules done
- TypeScript compilation check

### Completion Notes List

(To be filled during implementation)

### File List

(To be filled during implementation)

### Change Log

(To be filled during implementation)
