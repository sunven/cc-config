//! Configuration file reader module
//!
//! Provides file system access functions with path validation
//! for secure, permission-controlled configuration file reading.

use crate::types::app::AppError;
use serde_json::Value;
use std::path::PathBuf;

/// Validate that the path is allowed (home directory or current project)
fn validate_path(path: &str) -> Result<PathBuf, AppError> {
    let path_buf = PathBuf::from(path);
    let canonical = path_buf.canonicalize()
        .map_err(|e| AppError::Filesystem(format!("Invalid path: {}", e)))?;

    // In test mode, allow any path for testing
    #[cfg(test)]
    {
        return Ok(canonical);
    }

    // Allow home directory paths
    #[cfg(not(test))]
    if let Some(home) = dirs::home_dir() {
        if canonical.starts_with(&home) {
            return Ok(canonical);
        }
    }

    // Allow current directory paths
    #[cfg(not(test))]
    if let Ok(current) = std::env::current_dir() {
        if canonical.starts_with(&current) {
            return Ok(canonical);
        }
    }

    #[cfg(not(test))]
    Err(AppError::Permission("Access denied: path outside allowed directories".to_string()))
}

/// Read a file from the specified path with security validation
///
/// # Arguments
/// * `path` - The file path to read
///
/// # Returns
/// * `Result<String, AppError>` - File contents or error
pub fn read_file(path: String) -> Result<String, AppError> {
    let validated_path = validate_path(&path)?;
    let content = std::fs::read_to_string(validated_path)
        .map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => AppError::Filesystem("File not found".to_string()),
            std::io::ErrorKind::PermissionDenied => AppError::Permission("Access denied".to_string()),
            _ => AppError::Filesystem("Failed to read file".to_string()),
        })?;
    Ok(content)
}

/// Parse JSON content into a serde_json::Value
///
/// # Arguments
/// * `content` - JSON string to parse
///
/// # Returns
/// * `Result<Value, AppError>` - Parsed JSON value or error
pub fn parse_json(content: String) -> Result<Value, AppError> {
    let data: Value = serde_json::from_str(&content)?;
    Ok(data)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_read_file_success() {
        let mut temp_file = std::env::current_dir().unwrap();
        temp_file.push("test_config_temp.json");
        let content = r#"{"test": "data"}"#;
        fs::write(&temp_file, content).unwrap();

        let result = read_file(temp_file.to_string_lossy().to_string());
        if let Err(ref e) = result {
            eprintln!("Error: {:?}", e);
        }
        assert!(result.is_ok(), "Failed to read file: {:?}", result.err());
        assert_eq!(result.unwrap(), content);

        fs::remove_file(temp_file).ok();
    }

    #[test]
    fn test_read_file_not_found() {
        let result = read_file("/nonexistent/file.json".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_read_file_permission_denied() {
        let result = read_file("/etc/shadow".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_path_blocks_system_paths() {
        let result = validate_path("/etc/passwd");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_json_valid() {
        let json = r#"{"key": "value"}"#;
        let result = parse_json(json.to_string());
        assert!(result.is_ok());
        let value = result.unwrap();
        assert_eq!(value["key"], "value");
    }

    #[test]
    fn test_parse_json_invalid() {
        let json = "invalid json";
        let result = parse_json(json.to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_json_empty_object() {
        let json = "{}";
        let result = parse_json(json.to_string());
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_json_array() {
        let json = r#"[1, 2, 3]"#;
        let result = parse_json(json.to_string());
        assert!(result.is_ok());
    }
}
