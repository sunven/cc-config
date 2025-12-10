//! Export commands for configuration data
//!
//! Provides Tauri commands for exporting configuration data to various formats
//! and saving files to the filesystem.

use crate::types::app::AppError;
use crate::types::export::{
    ExportOptions, ExportResult, ExportStats, ValidationResult, ExportFileInfo,
    ProjectExportData, ComparisonExportData,
};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::Instant;

/// Save export content to file
#[tauri::command]
pub async fn save_export_file(
    content: String,
    filename: String,
    format: String,
) -> Result<ExportResult, AppError> {
    let start_time = Instant::now();

    // Validate inputs
    if content.is_empty() {
        return Ok(ExportResult {
            success: false,
            file_path: None,
            content: None,
            format: serde_json::from_str(&format).unwrap_or(crate::types::export::ExportFormat::Json),
            error: Some("Content cannot be empty".to_string()),
            stats: Some(ExportStats {
                record_count: 0,
                file_size: 0,
                duration: start_time.elapsed().as_millis() as u64,
            }),
        });
    }

    if filename.is_empty() {
        return Ok(ExportResult {
            success: false,
            file_path: None,
            content: None,
            format: serde_json::from_str(&format).unwrap_or(crate::types::export::ExportFormat::Json),
            error: Some("Filename cannot be empty".to_string()),
            stats: Some(ExportStats {
                record_count: 0,
                file_size: 0,
                duration: start_time.elapsed().as_millis() as u64,
            }),
        });
    }

    // Get downloads directory
    let downloads_dir = get_downloads_path().await?;

    // Create full file path
    let file_path = downloads_dir.join(&filename);

    // Write file to filesystem
    match tokio::fs::write(&file_path, content.as_bytes()).await {
        Ok(_) => {
            let file_size = tokio::fs::metadata(&file_path).await?.len();
            let duration = start_time.elapsed().as_millis() as u64;

            Ok(ExportResult {
                success: true,
                file_path: Some(file_path.to_string_lossy().to_string()),
                content: Some(content),
                format: serde_json::from_str(&format).unwrap_or(crate::types::export::ExportFormat::Json),
                error: None,
                stats: Some(ExportStats {
                    record_count: calculate_record_count(&content),
                    file_size,
                    duration,
                }),
            })
        }
        Err(e) => Ok(ExportResult {
            success: false,
            file_path: Some(file_path.to_string_lossy().to_string()),
            content: None,
            format: serde_json::from_str(&format).unwrap_or(crate::types::export::ExportFormat::Json),
            error: Some(e.to_string()),
            stats: Some(ExportStats {
                record_count: 0,
                file_size: 0,
                duration: start_time.elapsed().as_millis() as u64,
            }),
        }),
    }
}

/// Get the downloads directory path
#[tauri::command]
pub async fn get_downloads_path() -> Result<PathBuf, AppError> {
    // Use tauri API to get downloads directory
    let downloads_dir = tauri::api::path::download_dir(&tauri::generate_context!())
        .map_err(|e| AppError::Filesystem(e.to_string()))?;

    // Ensure directory exists
    if !downloads_dir.exists() {
        tokio::fs::create_dir_all(&downloads_dir)
            .await
            .map_err(|e| AppError::Filesystem(e.to_string()))?;
    }

    Ok(downloads_dir)
}

/// Validate export data before processing
#[tauri::command]
pub async fn validate_export_data(
    data: serde_json::Value,
) -> Result<ValidationResult, AppError> {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    // Check if data is an object
    if !data.is_object() {
        errors.push("Export data must be a JSON object".to_string());
    }

    // Check for required fields if it's a project export
    if let Some(project) = data.get("project") {
        if !project.is_object() {
            errors.push("Project must be a JSON object".to_string());
        } else {
            if !project.get("name").and_then(|v| v.as_str()).is_some() {
                errors.push("Project name is required".to_string());
            }
            if !project.get("path").and_then(|v| v.as_str()).is_some() {
                errors.push("Project path is required".to_string());
            }
        }
    }

    // Check for large content warning
    if let Some(content) = data.get("content").and_then(|v| v.as_str()) {
        if content.len() > 10_000_000 {
            warnings.push("Export content is large (>10MB), consider splitting".to_string());
        }
    }

    Ok(ValidationResult {
        is_valid: errors.is_empty(),
        errors,
        warnings,
    })
}

/// Generate a safe filename for export
#[tauri::command]
pub fn generate_export_filename(
    project_name: String,
    format: String,
) -> Result<String, AppError> {
    let format = format.trim().to_lowercase();
    let sanitized_name = project_name
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '-',
            _ => c,
        })
        .collect::<String>()
        .replace(' ', "-")
        .to_lowercase()
        .chars()
        .take(50)
        .collect::<String>();

    let timestamp = chrono::Utc::now().format("%Y-%m-%d");
    let extension = match format.as_str() {
        "json" => "json",
        "markdown" => "md",
        "csv" => "csv",
        _ => "txt",
    };

    Ok(format!("{}-config-{}.{}", sanitized_name, timestamp, extension))
}

/// Export project configuration data
#[tauri::command]
pub async fn export_project_config(
    project_data: ProjectExportData,
    options: ExportOptions,
) -> Result<ExportResult, AppError> {
    let start_time = Instant::now();

    // Generate filename
    let filename = generate_export_filename(
        project_data.project_name.clone(),
        format!("{:?}", options.format),
    )?;

    // Serialize project data to JSON
    let content = serde_json::to_string_pretty(&project_data)
        .map_err(|e| AppError::Parse(e.to_string()))?;

    // Save to file
    save_export_file(content, filename, format!("{:?}", options.format)).await
}

/// Export comparison data
#[tauri::command]
pub async fn export_comparison_data(
    comparison_data: ComparisonExportData,
    options: ExportOptions,
) -> Result<ExportResult, AppError> {
    let start_time = Instant::now();

    // Generate filename
    let filename = format!(
        "{}-vs-{}-comparison-{}",
        comparison_data.left_project.project_name,
        comparison_data.right_project.project_name,
        chrono::Utc::now().format("%Y-%m-%d")
    );

    let filename = generate_export_filename(filename, format!("{:?}", options.format))?;

    // Serialize comparison data
    let content = serde_json::to_string_pretty(&comparison_data)
        .map_err(|e| AppError::Parse(e.to_string()))?;

    // Save to file
    save_export_file(content, filename, format!("{:?}", options.format)).await
}

/// Check file system permissions for export
#[tauri::command]
pub async fn check_export_permissions() -> Result<bool, AppError> {
    let downloads_dir = get_downloads_path().await?;

    // Check if we can write to downloads directory
    match tokio::fs::metadata(&downloads_dir).await {
        Ok(metadata) => {
            if metadata.permissions().readonly() {
                Err(AppError::Permission(
                    "Downloads directory is read-only".to_string(),
                ))
            } else {
                Ok(true)
            }
        }
        Err(e) => Err(AppError::Filesystem(e.to_string())),
    }
}

/// Get export file information
#[tauri::command]
pub async fn get_export_file_info(
    file_path: String,
) -> Result<Option<ExportFileInfo>, AppError> {
    let path = Path::new(&file_path);

    if !path.exists() {
        return Ok(None);
    }

    let metadata = tokio::fs::metadata(path).await?;

    Ok(Some(ExportFileInfo {
        path: file_path,
        filename: path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string(),
        format: crate::types::export::ExportFormat::Json, // Default, should be determined from extension
        size: metadata.len(),
        created_at: chrono::Utc::now().to_rfc3339(),
    }))
}

/// Calculate record count from content
fn calculate_record_count(content: &str) -> u32 {
    // Simple heuristic: count lines or JSON objects
    if content.trim().starts_with('{') {
        // JSON format
        serde_json::from_str::<serde_json::Value>(content)
            .map(|v| {
                if let Some(arr) = v.get("configurations") {
                    let mut count = 0;
                    if let Some(mcp) = arr.get("mcp") {
                        count += mcp.as_array().map_or(0, |a| a.len() as u32);
                    }
                    if let Some(agents) = arr.get("agents") {
                        count += agents.as_array().map_or(0, |a| a.len() as u32);
                    }
                    count
                } else {
                    1
                }
            })
            .unwrap_or(1)
    } else {
        // Text format - count lines
        content.lines().count() as u32
    }
}

/// Delete export file
#[tauri::command]
pub async fn delete_export_file(file_path: String) -> Result<bool, AppError> {
    let path = Path::new(&file_path);

    if !path.exists() {
        return Ok(false);
    }

    tokio::fs::remove_file(path)
        .await
        .map(|_| true)
        .map_err(|e| AppError::Filesystem(e.to_string()))
}

/// List export files in downloads directory
#[tauri::command]
pub async fn list_export_files() -> Result<Vec<ExportFileInfo>, AppError> {
    let downloads_dir = get_downloads_path().await?;
    let mut files = Vec::new();

    let mut entries = tokio::fs::read_dir(&downloads_dir).await?;

    while let Some(entry) = entries.next_entry().await? {
        let path = entry.path();
        let filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        // Filter for export files
        if filename.ends_with("-config-") || filename.contains("-comparison-") {
            if let Ok(metadata) = entry.metadata().await {
                files.push(ExportFileInfo {
                    path: path.to_string_lossy().to_string(),
                    filename,
                    format: crate::types::export::ExportFormat::Json,
                    size: metadata.len(),
                    created_at: chrono::Utc::now().to_rfc3339(),
                });
            }
        }
    }

    Ok(files)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_record_count_json() {
        let json_content = r#"{
            "configurations": {
                "mcp": [
                    {"name": "server1"},
                    {"name": "server2"}
                ],
                "agents": [
                    {"name": "agent1"}
                ]
            }
        }"#;

        let count = calculate_record_count(json_content);
        assert_eq!(count, 3); // 2 MCP + 1 Agent
    }

    #[test]
    fn test_calculate_record_count_empty() {
        let count = calculate_record_count("");
        assert_eq!(count, 0);
    }

    #[test]
    fn test_calculate_record_count_text() {
        let text_content = "Line 1\nLine 2\nLine 3\n";
        let count = calculate_record_count(text_content);
        assert_eq!(count, 3);
    }
}
