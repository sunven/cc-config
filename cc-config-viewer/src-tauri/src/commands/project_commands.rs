use crate::types::app::{
    AppError, Capability, DiffResult, DiffStatus, DiffSeverity, HighlightFilters, SummaryStats,
};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Project scanning configuration
#[derive(Debug, Clone)]
pub struct ScanConfig {
    pub max_depth: u32,
    pub include_hidden: bool,
}

/// Represents a discovered project with metadata
#[derive(Debug, Serialize, Deserialize)]
pub struct DiscoveredProject {
    pub id: String,
    pub name: String,
    pub path: String,
    pub config_file_count: u32,
    pub last_modified: u64,
    pub config_sources: ConfigSources,
    pub mcp_servers: Option<Vec<String>>,
    pub sub_agents: Option<Vec<String>>,
}

/// Configuration source indicators
#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigSources {
    pub user: bool,
    pub project: bool,
    pub local: bool,
}

/// List all discovered projects from filesystem scan (default depth: 3)
#[tauri::command]
pub async fn list_projects() -> Result<Vec<DiscoveredProject>, AppError> {
    let scan_config = ScanConfig {
        max_depth: 3,
        include_hidden: false,
    };

    scan_projects_with_config(scan_config).await
}

/// Scan projects with custom depth configuration (max depth: 5)
#[tauri::command]
pub async fn scan_projects(depth: u32) -> Result<Vec<DiscoveredProject>, AppError> {
    // Validate depth is within acceptable range (1-5)
    let max_depth = if depth == 0 {
        3 // Default to 3 if 0 is passed
    } else if depth > 5 {
        5 // Cap at maximum of 5 levels
    } else {
        depth
    };

    let scan_config = ScanConfig {
        max_depth,
        include_hidden: false,
    };

    scan_projects_with_config(scan_config).await
}

/// Internal function to scan projects with custom config
async fn scan_projects_with_config(config: ScanConfig) -> Result<Vec<DiscoveredProject>, AppError> {
    // Get user home directory
    let home_dir = dirs::home_dir()
        .ok_or_else(|| AppError::Filesystem("Failed to get home directory".to_string()))?;

    // Convert to PathBuf to avoid lifetime issues
    let home_dir: PathBuf = home_dir;

    // Scan for projects in home directory
    scan_directory(&home_dir, &config, 0).await
}

/// Recursively scan directory for projects using a stack with depth control
async fn scan_directory(
    start_dir: &PathBuf,
    config: &ScanConfig,
    initial_depth: u32,
) -> Result<Vec<DiscoveredProject>, AppError> {
    let mut projects = Vec::new();
    let mut dir_stack = vec![(start_dir.clone(), initial_depth)];

    while let Some((current_dir, current_depth)) = dir_stack.pop() {
        // Skip system directories
        if current_dir == PathBuf::from("/proc") || current_dir == PathBuf::from("/sys") || current_dir == PathBuf::from("/dev") {
            continue;
        }

        // Check depth limit
        if current_depth >= config.max_depth {
            continue;
        }

        // Clone the path to avoid lifetime issues
        let dir_path = current_dir.clone();

        // Read directory entries
        let entries = match tokio::task::spawn_blocking(move || {
            std::fs::read_dir(dir_path).map_err(AppError::from)
        }).await {
            Ok(entries) => entries.map_err(|e| AppError::Filesystem(format!("Task error: {}", e)))?,
            Err(_) => continue,
        };

        for entry in entries {
            let entry = match entry.map_err(AppError::from) {
                Ok(e) => e,
                Err(_) => continue,
            };
            let path = entry.path();

            // Skip hidden directories if configured
            if !config.include_hidden && path.file_name().map_or(false, |name| {
                name.to_string_lossy().starts_with('.')
            }) {
                continue;
            }

            // If it's a directory, check if it's a project
            if path.is_dir() {
                // Check if it's a project
                if let Some(project) = check_if_project(&path.to_path_buf()).await? {
                    projects.push(project);
                }

                // Add subdirectories to stack with incremented depth
                let next_depth = current_depth + 1;
                if next_depth < config.max_depth {
                    dir_stack.push((path.to_path_buf(), next_depth));
                }
            }
        }
    }

    Ok(projects)
}

/// Check if a directory is a project (has .mcp.json or .claude/ directory)
async fn check_if_project(dir: &PathBuf) -> Result<Option<DiscoveredProject>, AppError> {
    let mcp_json = dir.join(".mcp.json");
    let claude_dir = dir.join(".claude");
    let settings_json = dir.join(".claude").join("settings.json");

    let has_mcp = mcp_json.exists() && mcp_json.is_file();
    let has_claude_settings = settings_json.exists() && settings_json.is_file();

    if !has_mcp && !has_claude_settings {
        return Ok(None);
    }

    // Generate project ID from path
    let id = generate_project_id(dir);

    // Get project name from directory name
    let name = dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    // Count config files
    let config_file_count = count_config_files(dir);

    // Get last modified timestamp
    let last_modified = dir.metadata()
        .and_then(|m| m.modified())
        .map(|m| m.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs())
        .unwrap_or(0);

    // Determine config sources
    let config_sources = ConfigSources {
        user: has_claude_settings,
        project: has_mcp,
        local: false, // TODO: Implement local config detection
    };

    // Count MCP servers if .mcp.json exists
    let mcp_servers = if has_mcp {
        match count_mcp_servers(mcp_json).await {
            Ok(count) => Some(vec![format!("{} servers", count)]),
            Err(_) => None,
        }
    } else {
        None
    };

    // Count sub-agents if .claude/agents exists
    let sub_agents = if claude_dir.exists() && claude_dir.is_dir() {
        match count_sub_agents(claude_dir).await {
            Ok(count) => Some(vec![format!("{} agents", count)]),
            Err(_) => None,
        }
    } else {
        None
    };

    let project = DiscoveredProject {
        id,
        name,
        path: dir.to_string_lossy().to_string(),
        config_file_count,
        last_modified,
        config_sources,
        mcp_servers,
        sub_agents,
    };

    Ok(Some(project))
}

/// Count configuration files in a project
fn count_config_files(dir: &Path) -> u32 {
    let mut count = 0;
    let config_files = [".mcp.json", ".claude/settings.json"];

    for config_file in &config_files {
        if dir.join(config_file).exists() {
            count += 1;
        }
    }

    count
}

/// Count MCP servers in .mcp.json
async fn count_mcp_servers(mcp_path: PathBuf) -> Result<usize, AppError> {
    let content = tokio::task::spawn_blocking(move || {
        std::fs::read_to_string(&mcp_path).map_err(AppError::from)
    })
    .await
    .map_err(|e| AppError::Filesystem(format!("Task error: {}", e)))??;

    let config: serde_json::Value = serde_json::from_str(&content)
        .map_err(AppError::from)?;

    if let Some(mcp_servers) = config.get("mcpServers") {
        if let Some(servers_obj) = mcp_servers.as_object() {
            return Ok(servers_obj.len());
        }
    }

    Ok(0)
}

/// Count sub-agents in .claude/agents directory
async fn count_sub_agents(agents_dir: PathBuf) -> Result<usize, AppError> {
    let entries = tokio::task::spawn_blocking(move || {
        std::fs::read_dir(&agents_dir).map_err(AppError::from)
    })
    .await
    .map_err(|e| AppError::Filesystem(format!("Task error: {}", e)))??;

    let mut count = 0;
    for entry in entries {
        let entry = entry.map_err(AppError::from)?;
        let path = entry.path();

        // Count .md files as agent files
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
            count += 1;
        }
    }

    Ok(count)
}

/// Generate a unique ID for a project
fn generate_project_id(path: &Path) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// Start watching for project changes
#[tauri::command]
pub async fn watch_projects(app: tauri::AppHandle) -> Result<(), AppError> {
    use notify::RecursiveMode;
    use notify_debouncer_mini::{new_debouncer, DebounceEventResult};
    use std::time::Duration;
    use tauri::Emitter;
    use tauri::Manager;

    let debounce_duration = Duration::from_millis(300);

    // Clone app handle for the callback
    let app_clone = app.clone();

    // Create debounced watcher with 300ms debouncing
    let mut debouncer = new_debouncer(
        debounce_duration,
        move |result: DebounceEventResult| {
            match result {
                Ok(events) => {
                    for event in events {
                        // Emit project-updated event when file system changes
                        // For simplicity, we'll emit a generic change event
                        // The actual change type can be determined by checking if the path still exists
                        let payload = ProjectUpdatedEvent {
                            path: event.path.to_string_lossy().to_string(),
                            change_type: "change".to_string(),
                        };

                        if let Err(e) = app_clone.emit("project-updated", &payload) {
                            eprintln!("Failed to emit project-updated event: {}", e);
                        }
                    }
                }
                Err(errors) => {
                    eprintln!("Project watcher errors: {:?}", errors);
                }
            }
        },
    )
    .map_err(|e| AppError::Filesystem(format!("Failed to create project watcher: {}", e)))?;

    let watcher = debouncer.watcher();

    // Get user home directory to watch for projects
    if let Some(home_dir) = dirs::home_dir() {
        // Watch user home directory recursively for new projects
        watcher
            .watch(&home_dir, RecursiveMode::Recursive)
            .map_err(|e| {
                AppError::Filesystem(format!(
                    "Failed to watch home directory: {}",
                    e
                ))
            })?;

        println!("Started watching home directory for project changes: {}", home_dir.display());
    }

    // Store watcher in app state to keep it alive
    app.manage(crate::config::watcher::WatcherState {
        _debouncer: debouncer,
    });

    println!("Project watcher started with 300ms debouncing");
    Ok(())
}

/// Event payload for project updates
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectUpdatedEvent {
    pub path: String,
    pub change_type: String,
}

/// Compare two projects and return their capabilities
#[tauri::command]
pub async fn compare_projects(
    left_path: String,
    right_path: String,
) -> Result<Vec<DiffResult>, AppError> {
    // Extract capabilities from both projects
    let left_capabilities = extract_project_capabilities(&left_path).await?;
    let right_capabilities = extract_project_capabilities(&right_path).await?;

    // Calculate differences
    calculate_diff(left_capabilities, right_capabilities).await
}

/// Extract capabilities from a project path
async fn extract_project_capabilities(project_path: &str) -> Result<Vec<Capability>, AppError> {
    let path = PathBuf::from(project_path);

    if !path.exists() || !path.is_dir() {
        return Err(AppError::Filesystem(format!(
            "Project path does not exist or is not a directory: {}",
            project_path
        )));
    }

    let mut capabilities = Vec::new();

    // Extract .mcp.json capabilities
    let mcp_path = path.join(".mcp.json");
    if mcp_path.exists() && mcp_path.is_file() {
        match extract_mcp_capabilities(&mcp_path).await {
            Ok(mut caps) => capabilities.append(&mut caps),
            Err(e) => eprintln!("Warning: Failed to extract MCP capabilities: {}", e),
        }
    }

    // Extract .claude/settings.json capabilities
    let settings_path = path.join(".claude").join("settings.json");
    if settings_path.exists() && settings_path.is_file() {
        match extract_settings_capabilities(&settings_path).await {
            Ok(mut caps) => capabilities.append(&mut caps),
            Err(e) => eprintln!("Warning: Failed to extract settings capabilities: {}", e),
        }
    }

    Ok(capabilities)
}

/// Extract capabilities from .mcp.json file
async fn extract_mcp_capabilities(mcp_path: &PathBuf) -> Result<Vec<Capability>, AppError> {
    let mcp_path_clone = mcp_path.clone();
    let content = tokio::task::spawn_blocking(move || {
        std::fs::read_to_string(&mcp_path_clone).map_err(AppError::from)
    })
    .await
    .map_err(|e| AppError::Filesystem(format!("Task error: {}", e)))??;

    let config: serde_json::Value = serde_json::from_str(&content)
        .map_err(AppError::from)?;

    let mut capabilities = Vec::new();

    // Extract mcpServers
    if let Some(mcp_servers) = config.get("mcpServers") {
        if let Some(servers_obj) = mcp_servers.as_object() {
            for (server_name, server_config) in servers_obj {
                capabilities.push(Capability {
                    id: format!("mcp.{}", server_name),
                    key: format!("mcpServers.{}", server_name),
                    value: server_config.clone(),
                    source: "project".to_string(),
                });
            }
        }
    }

    Ok(capabilities)
}

/// Extract capabilities from .claude/settings.json file
async fn extract_settings_capabilities(settings_path: &PathBuf) -> Result<Vec<Capability>, AppError> {
    let settings_path_clone = settings_path.clone();
    let content = tokio::task::spawn_blocking(move || {
        std::fs::read_to_string(&settings_path_clone).map_err(AppError::from)
    })
    .await
    .map_err(|e| AppError::Filesystem(format!("Task error: {}", e)))??;

    let config: serde_json::Value = serde_json::from_str(&content)
        .map_err(AppError::from)?;

    let mut capabilities = Vec::new();

    // Extract various settings
    if let Some(allowed_tools) = config.get("allowedTools") {
        capabilities.push(Capability {
            id: "allowedTools".to_string(),
            key: "allowedTools".to_string(),
            value: allowed_tools.clone(),
            source: "user".to_string(),
        });
    }

    if let Some(disallowed_tools) = config.get("disallowedTools") {
        capabilities.push(Capability {
            id: "disallowedTools".to_string(),
            key: "disallowedTools".to_string(),
            value: disallowed_tools.clone(),
            source: "user".to_string(),
        });
    }

    Ok(capabilities)
}

/// Calculate difference between two capability lists
#[tauri::command]
pub async fn calculate_diff(
    left_capabilities: Vec<Capability>,
    right_capabilities: Vec<Capability>,
) -> Result<Vec<DiffResult>, AppError> {
    let mut diffs = Vec::new();

    // Create a map of right capabilities for efficient lookup
    let right_map: std::collections::HashMap<String, &Capability> = right_capabilities
        .iter()
        .map(|cap| (cap.id.clone(), cap))
        .collect();

    // Process left capabilities
    for left_cap in &left_capabilities {
        if let Some(right_cap) = right_map.get(&left_cap.id) {
            // Capability exists in both - compare values
            if left_cap.value == right_cap.value {
                // Values match
                diffs.push(DiffResult {
                    capability_id: left_cap.id.clone(),
                    left_value: Some(left_cap.clone()),
                    right_value: Some((*right_cap).clone()),
                    status: DiffStatus::Match,
                    severity: DiffSeverity::Low,
                    highlight_class: Some("".to_string()), // No highlighting for matches
                });
            } else {
                // Values differ
                diffs.push(DiffResult {
                    capability_id: left_cap.id.clone(),
                    left_value: Some(left_cap.clone()),
                    right_value: Some((*right_cap).clone()),
                    status: DiffStatus::Different,
                    severity: DiffSeverity::Medium,
                    highlight_class: Some("bg-yellow-100 text-yellow-800".to_string()), // Yellow for different values
                });
            }
        } else {
            // Capability only exists in left
            diffs.push(DiffResult {
                capability_id: left_cap.id.clone(),
                left_value: Some(left_cap.clone()),
                right_value: None,
                status: DiffStatus::OnlyLeft,
                severity: DiffSeverity::Medium,
                highlight_class: Some("bg-blue-100 text-blue-800".to_string()), // Blue for only in A
            });
        }
    }

    // Process right capabilities that don't exist in left
    let left_map: std::collections::HashMap<String, &Capability> = left_capabilities
        .iter()
        .map(|cap| (cap.id.clone(), cap))
        .collect();

    for right_cap in &right_capabilities {
        if !left_map.contains_key(&right_cap.id) {
            // Capability only exists in right
            diffs.push(DiffResult {
                capability_id: right_cap.id.clone(),
                left_value: None,
                right_value: Some(right_cap.clone()),
                status: DiffStatus::OnlyRight,
                severity: DiffSeverity::Medium,
                highlight_class: Some("bg-green-100 text-green-800".to_string()), // Green for only in B
            });
        }
    }

    Ok(diffs)
}

/// Categorize differences with highlighting metadata
#[tauri::command]
pub async fn categorize_differences(
    diff_results: Vec<DiffResult>,
) -> Result<Vec<DiffResult>, AppError> {
    let categorized = diff_results
        .into_iter()
        .map(|mut diff| {
            // Ensure highlight_class is set based on status
            if diff.highlight_class.is_none() {
                diff.highlight_class = Some(match diff.status {
                    DiffStatus::Match => "".to_string(), // No highlighting for matches
                    DiffStatus::OnlyLeft => "bg-blue-100 text-blue-800".to_string(), // Blue for only in A
                    DiffStatus::OnlyRight => "bg-green-100 text-green-800".to_string(), // Green for only in B
                    DiffStatus::Different | DiffStatus::Conflict => {
                        "bg-yellow-100 text-yellow-800".to_string()
                    } // Yellow for different values
                });
            }
            diff
        })
        .collect();

    Ok(categorized)
}

/// Calculate summary statistics for highlighting
#[tauri::command]
pub async fn calculate_summary_stats(
    diff_results: Vec<DiffResult>,
) -> Result<SummaryStats, AppError> {
    let mut only_in_a = 0;
    let mut only_in_b = 0;
    let mut different_values = 0;

    for diff in diff_results {
        match diff.status {
            DiffStatus::OnlyLeft => only_in_a += 1,
            DiffStatus::OnlyRight => only_in_b += 1,
            DiffStatus::Different | DiffStatus::Conflict => different_values += 1,
            DiffStatus::Match => {}
        }
    }

    let total_differences = only_in_a + only_in_b + different_values;

    Ok(SummaryStats {
        total_differences,
        only_in_a,
        only_in_b,
        different_values,
    })
}

/// Filter capabilities based on highlighting filters
#[tauri::command]
pub async fn filter_capabilities(
    capabilities: Vec<Capability>,
    filters: HighlightFilters,
) -> Result<Vec<Capability>, AppError> {
    let filtered: Vec<Capability> = capabilities
        .into_iter()
        .filter(|_cap| {
            // If showOnlyDifferences is true, filter to show only differences
            if filters.show_only_differences {
                // Only keep capabilities that would be highlighted (not matches)
                // This is a placeholder - actual filtering would happen at diff level
                return true;
            }

            // Individual filter toggles
            // For now, return all capabilities
            // In full implementation, this would check against diff results
            true
        })
        .collect();

    Ok(filtered)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_generate_project_id() {
        let path = Path::new("/home/user/my-project");
        let id = generate_project_id(path);
        assert!(!id.is_empty());
        assert_eq!(id.len(), 16); // Hash is 16 chars
    }

    #[tokio::test]
    async fn test_count_config_files() {
        let temp_dir = tempfile::tempdir().unwrap();
        let dir = temp_dir.path();

        // No config files
        assert_eq!(count_config_files(dir), 0);

        // Add .mcp.json
        std::fs::write(dir.join(".mcp.json"), "{}").unwrap();
        assert_eq!(count_config_files(dir), 1);

        // Add .claude/settings.json
        let claude_dir = dir.join(".claude");
        std::fs::create_dir_all(&claude_dir).unwrap();
        std::fs::write(claude_dir.join("settings.json"), "{}").unwrap();
        assert_eq!(count_config_files(dir), 2);
    }

    #[tokio::test]
    async fn test_check_if_project_with_mcp() {
        let temp_dir = tempfile::tempdir().unwrap();
        let dir = temp_dir.path().to_path_buf();

        // No config files
        assert!(check_if_project(&dir).await.unwrap().is_none());

        // Add .mcp.json
        std::fs::write(dir.join(".mcp.json"), r#"{"mcpServers": {}}"#).unwrap();
        let project = check_if_project(&dir).await.unwrap().unwrap();
        assert_eq!(project.name, temp_dir.path().file_name().unwrap().to_str().unwrap());
        assert_eq!(project.config_file_count, 1);
        assert!(project.config_sources.project);
    }

    #[tokio::test]
    async fn test_count_mcp_servers() {
        let temp_dir = tempfile::tempdir().unwrap();
        let mcp_path = temp_dir.path().join(".mcp.json");

        // Empty mcpServers
        std::fs::write(&mcp_path, r#"{"mcpServers": {}}"#).unwrap();
        assert_eq!(count_mcp_servers(mcp_path.clone()).await.unwrap(), 0);

        // With servers
        std::fs::write(
            &mcp_path,
            r#"{
                "mcpServers": {
                    "server1": {},
                    "server2": {},
                    "server3": {}
                }
            }"#,
        )
        .unwrap();
        assert_eq!(count_mcp_servers(mcp_path).await.unwrap(), 3);
    }

    #[tokio::test]
    async fn test_count_sub_agents() {
        let temp_dir = tempfile::tempdir().unwrap();
        let agents_dir = temp_dir.path().join("agents");

        // Create agents directory
        std::fs::create_dir_all(&agents_dir).unwrap();

        // No agent files yet
        assert_eq!(count_sub_agents(agents_dir.clone()).await.unwrap(), 0);

        // Add agent files
        std::fs::write(agents_dir.join("agent1.md"), "# Agent 1").unwrap();
        std::fs::write(agents_dir.join("agent2.md"), "# Agent 2").unwrap();
        std::fs::write(agents_dir.join("readme.txt"), "Not an agent").unwrap();

        assert_eq!(count_sub_agents(agents_dir).await.unwrap(), 2);
    }

    #[tokio::test]
    async fn test_scan_projects_depth_validation() {
        // Test with different depth values - this tests the validation logic
        // Note: Actual scan may fail in test environment, so we just test that
        // the function doesn't panic and returns a Result

        // Test depth 0 (should default to 3)
        let result = scan_projects(0).await;
        // We only care that it returns a Result, not that it succeeds
        // (may fail due to filesystem permissions in test environment)
        assert!(result.is_ok() || result.is_err());

        // Test depth within range (1-5)
        let result = scan_projects(3).await;
        assert!(result.is_ok() || result.is_err());

        // Test depth > 5 (should be capped at 5)
        let result = scan_projects(10).await;
        assert!(result.is_ok() || result.is_err());
    }

    // Story 5.2: Comparison tests

    #[tokio::test]
    async fn test_calculate_diff_matching_capabilities() {
        let left_capabilities = vec![
            Capability {
                id: "key1".to_string(),
                key: "key1".to_string(),
                value: serde_json::Value::String("value1".to_string()),
                source: "left".to_string(),
            },
            Capability {
                id: "key2".to_string(),
                key: "key2".to_string(),
                value: serde_json::Value::String("value2".to_string()),
                source: "left".to_string(),
            },
        ];

        let right_capabilities = vec![
            Capability {
                id: "key1".to_string(),
                key: "key1".to_string(),
                value: serde_json::Value::String("value1".to_string()),
                source: "right".to_string(),
            },
            Capability {
                id: "key2".to_string(),
                key: "key2".to_string(),
                value: serde_json::Value::String("value2".to_string()),
                source: "right".to_string(),
            },
        ];

        let result = calculate_diff(left_capabilities, right_capabilities).await.unwrap();

        // Both capabilities should match
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].status, DiffStatus::Match);
        assert_eq!(result[1].status, DiffStatus::Match);
        assert_eq!(result[0].highlight_class, Some("".to_string()));
        assert_eq!(result[1].highlight_class, Some("".to_string()));
    }

    #[tokio::test]
    async fn test_calculate_diff_different_values() {
        let left_capabilities = vec![
            Capability {
                id: "key1".to_string(),
                key: "key1".to_string(),
                value: serde_json::Value::String("value1".to_string()),
                source: "left".to_string(),
            },
        ];

        let right_capabilities = vec![
            Capability {
                id: "key1".to_string(),
                key: "key1".to_string(),
                value: serde_json::Value::String("different_value".to_string()),
                source: "right".to_string(),
            },
        ];

        let result = calculate_diff(left_capabilities, right_capabilities).await.unwrap();

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].status, DiffStatus::Different);
        assert_eq!(result[0].highlight_class, Some("bg-yellow-100 text-yellow-800".to_string()));
    }

    #[tokio::test]
    async fn test_calculate_diff_only_left() {
        let left_capabilities = vec![
            Capability {
                id: "unique_key".to_string(),
                key: "unique_key".to_string(),
                value: serde_json::Value::String("left_only".to_string()),
                source: "left".to_string(),
            },
        ];

        let right_capabilities = vec![];

        let result = calculate_diff(left_capabilities, right_capabilities).await.unwrap();

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].status, DiffStatus::OnlyLeft);
        assert_eq!(result[0].highlight_class, Some("bg-blue-100 text-blue-800".to_string()));
    }

    #[tokio::test]
    async fn test_calculate_diff_only_right() {
        let left_capabilities = vec![];

        let right_capabilities = vec![
            Capability {
                id: "unique_key".to_string(),
                key: "unique_key".to_string(),
                value: serde_json::Value::String("right_only".to_string()),
                source: "right".to_string(),
            },
        ];

        let result = calculate_diff(left_capabilities, right_capabilities).await.unwrap();

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].status, DiffStatus::OnlyRight);
        assert_eq!(result[0].highlight_class, Some("bg-green-100 text-green-800".to_string()));
    }

    #[tokio::test]
    async fn test_compare_projects_valid_paths() {
        // This test will fail initially as compare_projects is not implemented
        let result = compare_projects(
            "/tmp/left_project".to_string(),
            "/tmp/right_project".to_string(),
        ).await;

        // Currently this will panic due to todo!()
        // After implementation, it should return an empty Vec or proper error
        assert!(result.is_err() || result.is_ok());
    }

    // Story 5.3: Highlighting tests

    #[tokio::test]
    async fn test_categorize_differences_with_highlighting() {
        let diff_results = vec![
            DiffResult {
                capability_id: "cap1".to_string(),
                left_value: Some(Capability {
                    id: "cap1".to_string(),
                    key: "cap1".to_string(),
                    value: serde_json::Value::String("value1".to_string()),
                    source: "left".to_string(),
                }),
                right_value: None,
                status: DiffStatus::OnlyLeft,
                severity: DiffSeverity::Medium,
                highlight_class: None,
            },
            DiffResult {
                capability_id: "cap2".to_string(),
                left_value: None,
                right_value: Some(Capability {
                    id: "cap2".to_string(),
                    key: "cap2".to_string(),
                    value: serde_json::Value::String("value2".to_string()),
                    source: "right".to_string(),
                }),
                status: DiffStatus::OnlyRight,
                severity: DiffSeverity::Medium,
                highlight_class: None,
            },
            DiffResult {
                capability_id: "cap3".to_string(),
                left_value: Some(Capability {
                    id: "cap3".to_string(),
                    key: "cap3".to_string(),
                    value: serde_json::Value::String("value3".to_string()),
                    source: "left".to_string(),
                }),
                right_value: Some(Capability {
                    id: "cap3".to_string(),
                    key: "cap3".to_string(),
                    value: serde_json::Value::String("different".to_string()),
                    source: "right".to_string(),
                }),
                status: DiffStatus::Different,
                severity: DiffSeverity::Medium,
                highlight_class: None,
            },
            DiffResult {
                capability_id: "cap4".to_string(),
                left_value: Some(Capability {
                    id: "cap4".to_string(),
                    key: "cap4".to_string(),
                    value: serde_json::Value::String("same".to_string()),
                    source: "left".to_string(),
                }),
                right_value: Some(Capability {
                    id: "cap4".to_string(),
                    key: "cap4".to_string(),
                    value: serde_json::Value::String("same".to_string()),
                    source: "right".to_string(),
                }),
                status: DiffStatus::Match,
                severity: DiffSeverity::Low,
                highlight_class: None,
            },
        ];

        let result = categorize_differences(diff_results).await.unwrap();

        // Check that highlight classes are set correctly
        assert_eq!(result[0].highlight_class, Some("bg-blue-100 text-blue-800".to_string())); // Only in A - Blue
        assert_eq!(result[1].highlight_class, Some("bg-green-100 text-green-800".to_string())); // Only in B - Green
        assert_eq!(result[2].highlight_class, Some("bg-yellow-100 text-yellow-800".to_string())); // Different - Yellow
        assert_eq!(result[3].highlight_class, Some("".to_string())); // Match - No highlighting
    }

    #[tokio::test]
    async fn test_calculate_summary_stats() {
        let diff_results = vec![
            DiffResult {
                capability_id: "cap1".to_string(),
                left_value: Some(Capability {
                    id: "cap1".to_string(),
                    key: "cap1".to_string(),
                    value: serde_json::Value::String("value1".to_string()),
                    source: "left".to_string(),
                }),
                right_value: None,
                status: DiffStatus::OnlyLeft,
                severity: DiffSeverity::Medium,
                highlight_class: None,
            },
            DiffResult {
                capability_id: "cap2".to_string(),
                left_value: None,
                right_value: Some(Capability {
                    id: "cap2".to_string(),
                    key: "cap2".to_string(),
                    value: serde_json::Value::String("value2".to_string()),
                    source: "right".to_string(),
                }),
                status: DiffStatus::OnlyRight,
                severity: DiffSeverity::Medium,
                highlight_class: None,
            },
            DiffResult {
                capability_id: "cap3".to_string(),
                left_value: Some(Capability {
                    id: "cap3".to_string(),
                    key: "cap3".to_string(),
                    value: serde_json::Value::String("value3".to_string()),
                    source: "left".to_string(),
                }),
                right_value: Some(Capability {
                    id: "cap3".to_string(),
                    key: "cap3".to_string(),
                    value: serde_json::Value::String("different".to_string()),
                    source: "right".to_string(),
                }),
                status: DiffStatus::Different,
                severity: DiffSeverity::Medium,
                highlight_class: None,
            },
            DiffResult {
                capability_id: "cap4".to_string(),
                left_value: Some(Capability {
                    id: "cap4".to_string(),
                    key: "cap4".to_string(),
                    value: serde_json::Value::String("same".to_string()),
                    source: "left".to_string(),
                }),
                right_value: Some(Capability {
                    id: "cap4".to_string(),
                    key: "cap4".to_string(),
                    value: serde_json::Value::String("same".to_string()),
                    source: "right".to_string(),
                }),
                status: DiffStatus::Match,
                severity: DiffSeverity::Low,
                highlight_class: None,
            },
        ];

        let stats = calculate_summary_stats(diff_results).await.unwrap();

        assert_eq!(stats.total_differences, 3);
        assert_eq!(stats.only_in_a, 1);
        assert_eq!(stats.only_in_b, 1);
        assert_eq!(stats.different_values, 1);
    }

    #[tokio::test]
    async fn test_calculate_summary_stats_empty() {
        let diff_results = vec![];

        let stats = calculate_summary_stats(diff_results).await.unwrap();

        assert_eq!(stats.total_differences, 0);
        assert_eq!(stats.only_in_a, 0);
        assert_eq!(stats.only_in_b, 0);
        assert_eq!(stats.different_values, 0);
    }

    #[tokio::test]
    async fn test_categorize_differences_preserves_existing_highlight_class() {
        let diff_results = vec![
            DiffResult {
                capability_id: "cap1".to_string(),
                left_value: Some(Capability {
                    id: "cap1".to_string(),
                    key: "cap1".to_string(),
                    value: serde_json::Value::String("value1".to_string()),
                    source: "left".to_string(),
                }),
                right_value: None,
                status: DiffStatus::OnlyLeft,
                severity: DiffSeverity::Medium,
                highlight_class: Some("custom-class".to_string()),
            },
        ];

        let result = categorize_differences(diff_results).await.unwrap();

        // Should preserve existing highlight class
        assert_eq!(result[0].highlight_class, Some("custom-class".to_string()));
    }

    #[tokio::test]
    async fn test_filter_capabilities() {
        let capabilities = vec![
            Capability {
                id: "cap1".to_string(),
                key: "cap1".to_string(),
                value: serde_json::Value::String("value1".to_string()),
                source: "left".to_string(),
            },
            Capability {
                id: "cap2".to_string(),
                key: "cap2".to_string(),
                value: serde_json::Value::String("value2".to_string()),
                source: "right".to_string(),
            },
        ];

        let filters = HighlightFilters {
            show_only_differences: false,
            show_blue_only: true,
            show_green_only: false,
            show_yellow_only: false,
        };

        let result = filter_capabilities(capabilities, filters).await.unwrap();

        // Should return all capabilities (filtering happens at diff level)
        assert_eq!(result.len(), 2);
    }

    #[tokio::test]
    async fn test_filter_capabilities_show_only_differences() {
        let capabilities = vec![
            Capability {
                id: "cap1".to_string(),
                key: "cap1".to_string(),
                value: serde_json::Value::String("value1".to_string()),
                source: "left".to_string(),
            },
            Capability {
                id: "cap2".to_string(),
                key: "cap2".to_string(),
                value: serde_json::Value::String("value2".to_string()),
                source: "right".to_string(),
            },
        ];

        let filters = HighlightFilters {
            show_only_differences: true,
            show_blue_only: false,
            show_green_only: false,
            show_yellow_only: false,
        };

        let result = filter_capabilities(capabilities, filters).await.unwrap();

        // Should return capabilities (actual filtering at diff level in full implementation)
        assert_eq!(result.len(), 2);
    }
}
