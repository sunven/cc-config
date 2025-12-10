//! Error handling commands for Tauri API
//!
//! These commands provide an interface for the frontend to interact with
//! error logging and retrieval functionality.

use crate::types::error::AppError;
use crate::utils::error_logger::{ErrorLogger, ErrorLoggerResult};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{command, State};

/// Global error logger instance (shared across commands)
pub type ErrorLoggerState = Mutex<ErrorLogger>;

/// Error log entry for API responses
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorLogEntryDto {
    pub timestamp: String,
    pub level: String,
    pub error_type: String,
    pub error_message: String,
    pub error_code: Option<String>,
    pub context: Option<String>,
}

/// Error logging request
#[derive(Debug, Deserialize)]
pub struct LogErrorRequest {
    pub error_type: String,
    pub message: String,
    pub code: Option<String>,
    pub context: Option<String>,
}

/// Initialize the error logger
#[command]
pub fn init_error_logger(logger: State<'_, ErrorLoggerState>) -> Result<(), String> {
    let logger = logger.lock().map_err(|e| e.to_string())?;
    logger
        .init()
        .map_err(|e| format!("Failed to initialize error logger: {}", e))
}

/// Log an error from the frontend
#[command]
pub async fn log_error(
    logger: State<'_, ErrorLoggerState>,
    request: LogErrorRequest,
) -> Result<(), String> {
    let logger = logger.lock().map_err(|e| e.to_string())?;

    // Convert error type string to AppError
    let error = match request.error_type.as_str() {
        "Filesystem" => AppError::Filesystem {
            path: request.context.clone().unwrap_or_else(|| "unknown".to_string()),
            operation: "unknown".to_string(),
            details: request.message,
        },
        "Permission" => AppError::Permission {
            path: request.context.clone().unwrap_or_else(|| "unknown".to_string()),
            required_permission: "unknown".to_string(),
        },
        "Parse" => AppError::Parse {
            file_type: request.context.clone().unwrap_or_else(|| "unknown".to_string()),
            line_number: None,
            details: request.message,
        },
        "Network" => AppError::Network {
            endpoint: request.context.clone().unwrap_or_else(|| "unknown".to_string()),
            status_code: None,
        },
        _ => AppError::Filesystem {
            path: "unknown".to_string(),
            operation: "unknown".to_string(),
            details: format!("Unknown error type: {}", request.error_type),
        },
    };

    logger
        .log_error(&error, request.code.as_deref(), request.context.as_deref())
        .map_err(|e| format!("Failed to log error: {}", e))
}

/// Log a warning from the frontend
#[command]
pub async fn log_warning(
    logger: State<'_, ErrorLoggerState>,
    message: String,
    context: Option<String>,
) -> Result<(), String> {
    let logger = logger.lock().map_err(|e| e.to_string())?;
    logger
        .log_warning(&message, context.as_deref())
        .map_err(|e| format!("Failed to log warning: {}", e))
}

/// Log an info message from the frontend
#[command]
pub async fn log_info(
    logger: State<'_, ErrorLoggerState>,
    message: String,
    context: Option<String>,
) -> Result<(), String> {
    let logger = logger.lock().map_err(|e| e.to_string())?;
    logger
        .log_info(&message, context.as_deref())
        .map_err(|e| format!("Failed to log info: {}", e))
}

/// Export error logs as JSON
#[command]
pub async fn export_error_logs(
    logger: State<'_, ErrorLoggerState>,
) -> Result<String, String> {
    let logger = logger.lock().map_err(|e| e.to_string())?;
    logger
        .export_logs()
        .map_err(|e| format!("Failed to export logs: {}", e))
}

/// Get the current log file path
#[command]
pub async fn get_log_file_path(
    logger: State<'_, ErrorLoggerState>,
) -> Result<String, String> {
    let logger = logger.lock().map_err(|e| e.to_string())?;
    Ok(logger
        .current_log_path()
        .to_string_lossy()
        .to_string())
}

/// Clear all error logs
#[command]
pub async fn clear_error_logs(
    logger: State<'_, ErrorLoggerState>,
) -> Result<(), String> {
    let logger = logger.lock().map_err(|e| e.to_string())?;
    logger
        .clear_logs()
        .map_err(|e| format!("Failed to clear logs: {}", e))
}

/// Get error statistics
#[command]
pub async fn get_error_stats(
    logger: State<'_, ErrorLoggerState>,
) -> Result<ErrorStats, String> {
    let logger = logger.lock().map_err(|e| e.to_string())?;

    // Export logs and count by type and level
    let logs_json = logger
        .export_logs()
        .map_err(|e| format!("Failed to export logs: {}", e))?;

    let entries: Vec<ErrorLogEntryDto> = serde_json::from_str(&logs_json)
        .map_err(|e| format!("Failed to parse logs: {}", e))?;

    let mut error_count = 0;
    let mut warning_count = 0;
    let mut info_count = 0;
    let mut by_type: std::collections::HashMap<String, u32> = std::collections::HashMap::new();

    for entry in &entries {
        match entry.level.as_str() {
            "ERROR" => error_count += 1,
            "WARN" => warning_count += 1,
            "INFO" => info_count += 1,
            _ => {}
        }

        *by_type.entry(entry.error_type.clone()).or_insert(0) += 1;
    }

    Ok(ErrorStats {
        total_logs: entries.len() as u32,
        error_count,
        warning_count,
        info_count,
        by_type,
    })
}

/// Error statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorStats {
    pub total_logs: u32,
    pub error_count: u32,
    pub warning_count: u32,
    pub info_count: u32,
    pub by_type: std::collections::HashMap<String, u32>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_log_error_command() {
        let temp_dir = TempDir::new().unwrap();
        let config = crate::utils::error_logger::ErrorLoggerConfig {
            log_dir: temp_dir.path().to_path_buf(),
            max_file_size: 1024 * 1024,
            max_files: 5,
        };
        let logger = ErrorLogger::with_config(config);
        logger.init().unwrap();

        let request = LogErrorRequest {
            error_type: "Filesystem".to_string(),
            message: "Test error".to_string(),
            code: Some("FS001".to_string()),
            context: Some("/test/path".to_string()),
        };

        // Directly test the error logging logic
        let error = AppError::Filesystem {
            path: "/test/path".to_string(),
            operation: "unknown".to_string(),
            details: "Test error".to_string(),
        };

        let result = logger.log_error(&error, Some("FS001"), Some("/test/path"));

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_log_warning_command() {
        let temp_dir = TempDir::new().unwrap();
        let config = crate::utils::error_logger::ErrorLoggerConfig {
            log_dir: temp_dir.path().to_path_buf(),
            max_file_size: 1024 * 1024,
            max_files: 5,
        };
        let logger = ErrorLogger::with_config(config);
        logger.init().unwrap();

        let result = logger.log_warning("Test warning", Some("test_context"));

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_log_info_command() {
        let temp_dir = TempDir::new().unwrap();
        let config = crate::utils::error_logger::ErrorLoggerConfig {
            log_dir: temp_dir.path().to_path_buf(),
            max_file_size: 1024 * 1024,
            max_files: 5,
        };
        let logger = ErrorLogger::with_config(config);
        logger.init().unwrap();

        let result = logger.log_info("Test info", Some("test_context"));

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_export_error_logs_command() {
        let temp_dir = TempDir::new().unwrap();
        let config = crate::utils::error_logger::ErrorLoggerConfig {
            log_dir: temp_dir.path().to_path_buf(),
            max_file_size: 1024 * 1024,
            max_files: 5,
        };
        let logger = ErrorLogger::with_config(config);
        logger.init().unwrap();

        let error = AppError::Parse {
            file_type: "JSON".to_string(),
            line_number: None,
            details: "Test parse error".to_string(),
        };

        logger.log_error(&error, Some("PR001"), Some("JSON")).unwrap();
        logger.log_error(&error, Some("PR001"), Some("JSON")).unwrap();

        let result = logger.export_logs();
        assert!(result.is_ok());

        let logs = result.unwrap();
        let entries: Vec<ErrorLogEntryDto> = serde_json::from_str(&logs).unwrap();
        assert_eq!(entries.len(), 2);
    }

    #[tokio::test]
    async fn test_get_error_stats_command() {
        let temp_dir = TempDir::new().unwrap();
        let config = crate::utils::error_logger::ErrorLoggerConfig {
            log_dir: temp_dir.path().to_path_buf(),
            max_file_size: 1024 * 1024,
            max_files: 5,
        };
        let logger = ErrorLogger::with_config(config);
        logger.init().unwrap();

        // Log some errors
        for i in 0..5 {
            let error = AppError::Filesystem {
                path: "/test".to_string(),
                operation: "read".to_string(),
                details: format!("Test error {}", i),
            };
            logger.log_error(&error, Some("FS001"), Some("/test")).unwrap();
        }

        let result = logger.export_logs();
        assert!(result.is_ok());

        let logs = result.unwrap();
        let entries: Vec<ErrorLogEntryDto> = serde_json::from_str(&logs).unwrap();
        assert_eq!(entries.len(), 5);

        // Check stats
        let mut error_count = 0;
        let mut by_type: std::collections::HashMap<String, u32> = std::collections::HashMap::new();

        for entry in &entries {
            if entry.level == "ERROR" {
                error_count += 1;
            }
            *by_type.entry(entry.error_type.clone()).or_insert(0) += 1;
        }

        assert_eq!(error_count, 5);
        assert!(by_type.contains_key("Filesystem"));
        assert_eq!(by_type["Filesystem"], 5);
    }

    #[tokio::test]
    async fn test_clear_error_logs_command() {
        let temp_dir = TempDir::new().unwrap();
        let config = crate::utils::error_logger::ErrorLoggerConfig {
            log_dir: temp_dir.path().to_path_buf(),
            max_file_size: 1024 * 1024,
            max_files: 5,
        };
        let logger = ErrorLogger::with_config(config);
        logger.init().unwrap();

        let error = AppError::Network {
            endpoint: "https://example.com".to_string(),
            status_code: None,
        };

        logger.log_error(&error, None, Some("https://example.com")).unwrap();

        let result = logger.clear_logs();
        assert!(result.is_ok());

        let logs = logger.export_logs().unwrap();
        let entries: Vec<ErrorLogEntryDto> = serde_json::from_str(&logs).unwrap();
        assert_eq!(entries.len(), 0);
    }
}
