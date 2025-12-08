//! Source tracing commands
//!
//! This module implements commands for tracing configuration items back to their source files.
//! Integrates with Story 3.3's inheritance path visualization.

use crate::types::app::AppError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};

/// Represents the location where a configuration item was defined
#[derive(Debug, Serialize, Deserialize)]
pub struct SourceLocation {
    pub file_path: String,
    pub line_number: Option<u32>,
    pub column_number: Option<u32>,
    pub context: Option<String>,
}

/// Request for tracing a configuration item
#[derive(Debug, Deserialize)]
pub struct TraceSourceRequest {
    pub config_key: String,
    pub search_paths: Vec<String>,
}

/// Error types specific to source tracing
#[derive(Debug, thiserror::Error)]
pub enum SourceTraceError {
    #[error("Configuration key not found: {0}")]
    NotFound(String),

    #[error("File not accessible: {0}")]
    FileNotAccessible(String),

    #[error("Invalid file format: {0}")]
    InvalidFormat(String),
}

/// Find the source location of a configuration key in a file
fn find_config_in_file(
    file_path: &str,
    config_key: &str,
) -> Result<Option<SourceLocation>, SourceTraceError> {
    let file = File::open(file_path)
        .map_err(|e| SourceTraceError::FileNotAccessible(format!("{}: {}", file_path, e)))?;

    let reader = BufReader::new(file);
    let lines = reader.lines();

    let mut line_number = 0;
    let mut found_line: Option<String> = None;

    for (current_line, line_result) in lines.enumerate() {
        let line = line_result.map_err(|e| {
            SourceTraceError::InvalidFormat(format!("Error reading line {}: {}", current_line + 1, e))
        })?;
        line_number = current_line as u32 + 1;

        // Check if this line contains the config key
        if line.contains(config_key) {
            found_line = Some(line);
            break;
        }
    }

    if let Some(line_content) = found_line {
        Ok(Some(SourceLocation {
            file_path: file_path.to_string(),
            line_number: Some(line_number),
            column_number: None, // Could be enhanced to find exact column
            context: Some(line_content),
        }))
    } else {
        Ok(None)
    }
}

/// Trace a configuration item back to its source file
#[tauri::command]
pub async fn get_source_location(
    request: TraceSourceRequest,
) -> Result<Option<SourceLocation>, AppError> {
    let config_key = request.config_key.clone();

    // Search through each file in order
    for file_path in request.search_paths.into_iter() {
        let file_path_for_log = file_path.clone();
        let config_key_for_search = config_key.clone();
        let file_path_for_search = file_path.clone();

        match tokio::task::spawn_blocking(move || {
            find_config_in_file(&file_path_for_search, &config_key_for_search)
        })
        .await
        {
            Ok(Ok(Some(location))) => return Ok(Some(location)),
            Ok(Ok(None)) => continue, // Not found in this file, try next
            Ok(Err(e)) => {
                // Log the error but continue searching
                println!("Error searching in file {}: {}", file_path_for_log, e);
                continue;
            }
            Err(e) => {
                // Task error, log and continue
                println!("Task error for file {}: {}", file_path_for_log, e);
                continue;
            }
        }
    }

    // Not found in any file
    Ok(None)
}

/// Open a file in the system's default editor
#[tauri::command]
pub async fn open_in_editor(file_path: String, line_number: Option<u32>) -> Result<(), AppError> {
    let args = if let Some(line) = line_number {
        vec![file_path.clone(), format!("{}:{}", file_path, line)]
    } else {
        vec![file_path]
    };

    #[cfg(target_os = "windows")]
    let mut command = tokio::process::Command::new("cmd");

    #[cfg(target_os = "macos")]
    let mut command = tokio::process::Command::new("open");

    #[cfg(target_os = "linux")]
    let mut command = tokio::process::Command::new("xdg-open");

    #[cfg(target_os = "windows")]
    {
        command.arg("/c").arg("start").args(&args);
    }

    #[cfg(not(target_os = "windows"))]
    {
        command.args(&args);
    }

    let output = command
        .output()
        .await
        .map_err(|e| AppError::Filesystem(format!("Failed to open editor: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Filesystem(format!(
            "Editor failed with error: {}",
            stderr
        )));
    }

    Ok(())
}

/// Copy text to system clipboard
#[tauri::command]
pub async fn copy_to_clipboard(text: String) -> Result<(), AppError> {
    use tauri::api::clipboard;

    clipboard::write_text(&tauri::generate_context!(), &text)
        .map_err(|e| AppError::Filesystem(format!("Failed to copy to clipboard: {}", e)))?;

    println!("Successfully copied to clipboard: {}", text);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_source_location_not_found() {
        let request = TraceSourceRequest {
            config_key: "nonexistent_key".to_string(),
            search_paths: vec!["/tmp/empty.json".to_string()],
        };

        let result = get_source_location(request).await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }

    #[test]
    fn test_find_config_in_file_with_mock_file() {
        use std::io::Write;
        use tempfile::NamedTempFile;

        // Create a temporary file with test content
        let mut temp_file = NamedTempFile::new().unwrap();
        writeln!(temp_file, "{{").unwrap();
        writeln!(temp_file, r#"  "testKey": "testValue","#).unwrap();
        writeln!(temp_file, "}}").unwrap();

        let file_path = temp_file.path().to_str().unwrap();

        let result = find_config_in_file(file_path, "testKey").unwrap();
        assert!(result.is_some());

        let location = result.unwrap();
        assert_eq!(location.file_path, file_path);
        assert_eq!(location.line_number, Some(2));
        assert!(location.context.is_some());
    }
}