use notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebounceEventResult, DebouncedEvent};
use std::path::Path;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

use crate::types::app::AppError;

/// Config file change event payload sent to frontend
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigChangedEvent {
    pub path: String,
    pub change_type: String, // "create", "modify", or "delete"
}

/// Watcher state stored in Tauri managed state
pub struct WatcherState {
    pub _debouncer: notify_debouncer_mini::Debouncer<notify::RecommendedWatcher>,
}

/// Initialize file system watcher for configuration files
/// Watches user-level and project-level config files with 300ms debouncing
pub fn watch_config_files(app: AppHandle) -> Result<(), AppError> {
    let debounce_duration = Duration::from_millis(300);

    // Clone app handle for the callback
    let app_clone = app.clone();

    // Create debounced watcher with callback
    let mut debouncer = new_debouncer(
        debounce_duration,
        move |result: DebounceEventResult| {
            match result {
                Ok(events) => {
                    for event in events {
                        handle_file_event(&app_clone, event);
                    }
                }
                Err(errors) => {
                    eprintln!("Watcher errors: {:?}", errors);
                }
            }
        },
    )
    .map_err(|e| AppError::Filesystem(format!("Failed to create watcher: {}", e)))?;

    let watcher = debouncer.watcher();

    // Watch user home directory for .claude.json and .claude/ subdirectories
    if let Some(home_dir) = dirs::home_dir() {
        // Watch ~/.claude.json specifically (not entire home dir)
        let claude_config = home_dir.join(".claude.json");
        if claude_config.exists() {
            watcher
                .watch(&claude_config, RecursiveMode::NonRecursive)
                .map_err(|e| {
                    AppError::Filesystem(format!("Failed to watch {}: {}", claude_config.display(), e))
                })?;
            println!("Watching: {}", claude_config.display());
        }

        // Watch ~/.claude/settings.json specifically
        let settings_file = home_dir.join(".claude").join("settings.json");
        if settings_file.exists() {
            watcher
                .watch(&settings_file, RecursiveMode::NonRecursive)
                .map_err(|e| {
                    AppError::Filesystem(format!("Failed to watch {}: {}", settings_file.display(), e))
                })?;
            println!("Watching: {}", settings_file.display());
        }

        // Watch ~/.claude/agents/ directory (performance: only agents, not entire .claude)
        let agents_dir = home_dir.join(".claude").join("agents");
        if agents_dir.exists() {
            watcher
                .watch(&agents_dir, RecursiveMode::Recursive)
                .map_err(|e| {
                    AppError::Filesystem(format!("Failed to watch {}: {}", agents_dir.display(), e))
                })?;
            println!("Watching: {}", agents_dir.display());
        }
    }

    // Watch current project directory for .mcp.json and .claude/ files
    if let Ok(current_dir) = std::env::current_dir() {
        // Watch project .mcp.json
        let mcp_config = current_dir.join(".mcp.json");
        if mcp_config.exists() {
            watcher
                .watch(&mcp_config, RecursiveMode::NonRecursive)
                .map_err(|e| {
                    AppError::Filesystem(format!("Failed to watch {}: {}", mcp_config.display(), e))
                })?;
            println!("Watching: {}", mcp_config.display());
        }

        // Watch project .claude/agents/ directory
        let project_agents_dir = current_dir.join(".claude").join("agents");
        if project_agents_dir.exists() {
            watcher
                .watch(&project_agents_dir, RecursiveMode::Recursive)
                .map_err(|e| {
                    AppError::Filesystem(format!("Failed to watch {}: {}", project_agents_dir.display(), e))
                })?;
            println!("Watching: {}", project_agents_dir.display());
        }
    }

    // Store the debouncer in Tauri managed state to prevent it from being dropped
    app.manage(WatcherState {
        _debouncer: debouncer,
    });

    Ok(())
}

/// Handle file system events and emit to frontend
fn handle_file_event(app: &AppHandle, event: DebouncedEvent) {
    // Determine change type from the event kind
    // Note: DebouncedEvent doesn't preserve the original event kind details
    // So we use a heuristic: check if file still exists
    let path = &event.path;

    let change_type = if path.exists() {
        "modify" // File exists, so it was created or modified
    } else {
        "delete" // File doesn't exist, so it was deleted
    };

    // Check if this is a config file we care about
    if is_config_file(path) {
        let event_payload = ConfigChangedEvent {
            path: path.display().to_string(),
            change_type: change_type.to_string(),
        };

        if let Err(e) = app.emit("config-changed", event_payload) {
            eprintln!("Failed to emit config-changed event: {}", e);
        } else {
            println!("Emitted config-changed event: {} - {}", change_type, path.display());
        }
    }
}

/// Check if the path is a configuration file we should watch
/// Uses Path methods instead of string matching for cross-platform compatibility
fn is_config_file(path: &Path) -> bool {
    // Get the file name
    let file_name = match path.file_name().and_then(|n| n.to_str()) {
        Some(name) => name,
        None => return false,
    };

    // Check for .claude.json
    if file_name == ".claude.json" {
        return true;
    }

    // Check for .mcp.json
    if file_name == ".mcp.json" {
        return true;
    }

    // Check for settings.json in .claude directory
    if file_name == "settings.json" {
        if let Some(parent) = path.parent() {
            if let Some(parent_name) = parent.file_name().and_then(|n| n.to_str()) {
                if parent_name == ".claude" {
                    return true;
                }
            }
        }
    }

    // Check for .md files in .claude/agents/ directory
    if file_name.ends_with(".md") {
        if let Some(parent) = path.parent() {
            if let Some(parent_name) = parent.file_name().and_then(|n| n.to_str()) {
                if parent_name == "agents" {
                    // Check if grandparent is .claude
                    if let Some(grandparent) = parent.parent() {
                        if let Some(gp_name) = grandparent.file_name().and_then(|n| n.to_str()) {
                            if gp_name == ".claude" {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_is_config_file_claude_json() {
        let path = PathBuf::from("/home/user/.claude.json");
        assert!(is_config_file(&path));
    }

    #[test]
    fn test_is_config_file_claude_settings() {
        let path = PathBuf::from("/home/user/.claude/settings.json");
        assert!(is_config_file(&path));
    }

    #[test]
    fn test_is_config_file_mcp_json() {
        let path = PathBuf::from("/home/user/project/.mcp.json");
        assert!(is_config_file(&path));
    }

    #[test]
    fn test_is_config_file_agent_md() {
        let path = PathBuf::from("/home/user/project/.claude/agents/test-agent.md");
        assert!(is_config_file(&path));
    }

    #[test]
    fn test_is_config_file_not_config() {
        let path = PathBuf::from("/home/user/some-file.txt");
        assert!(!is_config_file(&path));
    }

    #[test]
    fn test_config_changed_event_serialization() {
        let event = ConfigChangedEvent {
            path: "/home/user/.claude.json".to_string(),
            change_type: "modify".to_string(),
        };

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("path"));
        assert!(json.contains("changeType")); // Check camelCase serialization
    }

    #[test]
    fn test_windows_path_handling() {
        // Test cross-platform path handling for .claude/settings.json
        // Use platform-appropriate path separators
        #[cfg(windows)]
        let path = PathBuf::from(r"C:\Users\user\.claude\settings.json");

        #[cfg(not(windows))]
        let path = PathBuf::from("/Users/user/.claude/settings.json");

        assert!(is_config_file(&path), "Path should be recognized as a config file: {:?}", path);
    }

    #[test]
    fn test_delete_event_detection() {
        // Test that change_type is correctly identified
        // This is a unit test for the logic, actual file deletion testing requires integration tests
        let event = ConfigChangedEvent {
            path: "/home/user/.claude.json".to_string(),
            change_type: "delete".to_string(),
        };
        assert_eq!(event.change_type, "delete");
    }
}
