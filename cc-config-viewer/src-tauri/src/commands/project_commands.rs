use crate::types::app::AppError;
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

/// List all discovered projects from filesystem scan
#[tauri::command]
pub async fn list_projects() -> Result<Vec<DiscoveredProject>, AppError> {
    let scan_config = ScanConfig {
        max_depth: 3,
        include_hidden: false,
    };

    scan_projects_with_config(scan_config).await
}

/// Scan projects with custom configuration
#[tauri::command]
pub async fn scan_projects(depth: u32) -> Result<Vec<DiscoveredProject>, AppError> {
    let scan_config = ScanConfig {
        max_depth: depth,
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

/// Recursively scan directory for projects using a stack
async fn scan_directory(
    start_dir: &PathBuf,
    config: &ScanConfig,
    _initial_depth: u32,
) -> Result<Vec<DiscoveredProject>, AppError> {
    let mut projects = Vec::new();
    let mut dir_stack = vec![start_dir.clone()];

    while let Some(current_dir) = dir_stack.pop() {
        if current_dir == PathBuf::from("/proc") || current_dir == PathBuf::from("/sys") || current_dir == PathBuf::from("/dev") {
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

                // Add subdirectories to stack (for breadth-first traversal)
                dir_stack.push(path.to_path_buf());
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
pub async fn watch_projects() -> Result<(), AppError> {
    // TODO: Implement file watcher
    // This will be implemented with 300ms debouncing
    println!("Starting project watcher...");
    Ok(())
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
}
