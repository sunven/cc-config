//! Error logging utilities with rotation and structured logging
//!
//! This module provides functionality to log errors to files with rotation
//! to keep log file size under 10MB as per Story 6.1 requirements.

use crate::types::error::AppError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use tracing::{error, info, warn};

/// Maximum log file size (10MB)
const MAX_LOG_SIZE: u64 = 10 * 1024 * 1024;

/// Error log entry structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ErrorLogEntry {
    pub timestamp: String,
    pub level: String,
    pub error_type: String,
    pub error_message: String,
    pub error_code: Option<String>,
    pub context: Option<String>,
}

/// Error logger configuration
#[derive(Debug, Clone)]
pub struct ErrorLoggerConfig {
    pub log_dir: PathBuf,
    pub max_file_size: u64,
    pub max_files: u32, // Number of rotated log files to keep
}

/// Default error logger configuration
impl Default for ErrorLoggerConfig {
    fn default() -> Self {
        Self {
            log_dir: dirs::data_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("cc-config-viewer")
                .join("logs"),
            max_file_size: MAX_LOG_SIZE,
            max_files: 5, // Keep 5 rotated files
        }
    }
}

/// Error logger for managing error logs with rotation
pub struct ErrorLogger {
    config: ErrorLoggerConfig,
    current_log_path: PathBuf,
}

/// Error logger result type
pub type ErrorLoggerResult<T> = Result<T, Box<dyn std::error::Error>>;

impl ErrorLogger {
    /// Create a new error logger with default configuration
    pub fn new() -> Self {
        Self::with_config(ErrorLoggerConfig::default())
    }

    /// Create a new error logger with custom configuration
    pub fn with_config(config: ErrorLoggerConfig) -> Self {
        let current_log_path = config.log_dir.join("error.log");
        Self {
            config,
            current_log_path,
        }
    }

    /// Initialize the error logger (create log directory if needed)
    pub fn init(&self) -> ErrorLoggerResult<()> {
        if let Some(parent) = self.current_log_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create log directory: {}", e))?;
        }
        Ok(())
    }

    /// Log an error with full context
    pub fn log_error(
        &self,
        error: &AppError,
        error_code: Option<&str>,
        context: Option<&str>,
    ) -> ErrorLoggerResult<()> {
        // Check if rotation is needed
        self.rotate_if_needed()?;

        // Create log entry
        let entry = ErrorLogEntry {
            timestamp: Utc::now().to_rfc3339(),
            level: "ERROR".to_string(),
            error_type: self.get_error_type(error),
            error_message: error.to_string(),
            error_code: error_code.map(|s| s.to_string()),
            context: context.map(|s| s.to_string()),
        };

        // Write to log file
        self.write_log_entry(&entry)?;

        // Also log to tracing for console output
        error!(error = ?error, code = error_code, context = context, "Error logged");

        Ok(())
    }

    /// Log a warning
    pub fn log_warning(&self, message: &str, context: Option<&str>) -> ErrorLoggerResult<()> {
        self.rotate_if_needed()?;

        let entry = ErrorLogEntry {
            timestamp: Utc::now().to_rfc3339(),
            level: "WARN".to_string(),
            error_type: "Warning".to_string(),
            error_message: message.to_string(),
            error_code: None,
            context: context.map(|s| s.to_string()),
        };

        self.write_log_entry(&entry)?;
        warn!(context = context, "Warning logged");

        Ok(())
    }

    /// Log an info message
    pub fn log_info(&self, message: &str, context: Option<&str>) -> ErrorLoggerResult<()> {
        self.rotate_if_needed()?;

        let entry = ErrorLogEntry {
            timestamp: Utc::now().to_rfc3339(),
            level: "INFO".to_string(),
            error_type: "Info".to_string(),
            error_message: message.to_string(),
            error_code: None,
            context: context.map(|s| s.to_string()),
        };

        self.write_log_entry(&entry)?;
        info!(context = context, "Info logged");

        Ok(())
    }

    /// Get error type string from AppError
    fn get_error_type(&self, error: &AppError) -> String {
        match error {
            AppError::Filesystem { .. } => "Filesystem".to_string(),
            AppError::Permission { .. } => "Permission".to_string(),
            AppError::Parse { .. } => "Parse".to_string(),
            AppError::Network { .. } => "Network".to_string(),
        }
    }

    /// Write a log entry to the current log file
    fn write_log_entry(&self, entry: &ErrorLogEntry) -> ErrorLoggerResult<()> {
        let json = serde_json::to_string(entry)?;
        let mut file = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.current_log_path)?;

        file.write_all(json.as_bytes())?;
        file.write_all(b"\n")?;

        Ok(())
    }

    /// Rotate log file if it exceeds max size
    fn rotate_if_needed(&self) -> ErrorLoggerResult<()> {
        if let Ok(metadata) = fs::metadata(&self.current_log_path) {
            if metadata.len() > self.config.max_file_size {
                self.rotate_logs()?;
            }
        }
        Ok(())
    }

    /// Rotate log files
    fn rotate_logs(&self) -> ErrorLoggerResult<()> {
        // Remove oldest log file if we have max_files
        let oldest_log = self.config.log_dir.join(format!("error.{}.log", self.config.max_files));
        if oldest_log.exists() {
            fs::remove_file(&oldest_log)
                .map_err(|e| format!("Failed to remove oldest log: {}", e))?;
        }

        // Rotate existing log files (error.4.log -> error.5.log, etc.)
        for i in (1..self.config.max_files).rev() {
            let current = self.config.log_dir.join(format!("error.{}.log", i));
            let next = self.config.log_dir.join(format!("error.{}.log", i + 1));

            if current.exists() {
                fs::rename(&current, &next)
                    .map_err(|e| format!("Failed to rotate log {}: {}", i, e))?;
            }
        }

        // Rename current log to error.1.log
        if self.current_log_path.exists() {
            let first_log = self.config.log_dir.join("error.1.log");
            fs::rename(&self.current_log_path, &first_log)
                .map_err(|e| format!("Failed to rotate current log: {}", e))?;
        }

        Ok(())
    }

    /// Export error logs as JSON string
    pub fn export_logs(&self) -> ErrorLoggerResult<String> {
        let mut entries = Vec::new();

        // Read current log file
        if self.current_log_path.exists() {
            let content = fs::read_to_string(&self.current_log_path)?;
            for line in content.lines() {
                if !line.trim().is_empty() {
                    let entry: ErrorLogEntry = serde_json::from_str(line)?;
                    entries.push(entry);
                }
            }
        }

        // Read rotated log files
        for i in 1..=self.config.max_files {
            let log_path = self.config.log_dir.join(format!("error.{}.log", i));
            if log_path.exists() {
                let content = fs::read_to_string(&log_path)?;
                for line in content.lines() {
                    if !line.trim().is_empty() {
                        let entry: ErrorLogEntry = serde_json::from_str(line)?;
                        entries.push(entry);
                    }
                }
            }
        }

        // Sort by timestamp
        entries.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));

        Ok(serde_json::to_string_pretty(&entries)?)
    }

    /// Get the current log file path
    pub fn current_log_path(&self) -> &Path {
        &self.current_log_path
    }

    /// Clear all logs
    pub fn clear_logs(&self) -> ErrorLoggerResult<()> {
        // Clear current log
        if self.current_log_path.exists() {
            fs::write(&self.current_log_path, "")?;
        }

        // Clear rotated logs
        for i in 1..=self.config.max_files {
            let log_path = self.config.log_dir.join(format!("error.{}.log", i));
            if log_path.exists() {
                fs::write(&log_path, "")?;
            }
        }

        Ok(())
    }
}

impl Default for ErrorLogger {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_error_logger_creation() {
        let logger = ErrorLogger::new();
        assert!(logger.current_log_path().ends_with("error.log"));
    }

    #[test]
    fn test_error_logger_with_custom_config() {
        let temp_dir = TempDir::new().unwrap();
        let config = ErrorLoggerConfig {
            log_dir: temp_dir.path().to_path_buf(),
            max_file_size: 1024,
            max_files: 3,
        };
        let logger = ErrorLogger::with_config(config);
        assert_eq!(logger.config.max_file_size, 1024);
        assert_eq!(logger.config.max_files, 3);
    }

    #[test]
    fn test_log_error() {
        let temp_dir = TempDir::new().unwrap();
        let config = ErrorLoggerConfig {
            log_dir: temp_dir.path().to_path_buf(),
            max_file_size: 1024,
            max_files: 3,
        };
        let logger = ErrorLogger::with_config(config);
        logger.init().unwrap();

        let error = AppError::Filesystem {
            path: "/test/path".to_string(),
            operation: "read".to_string(),
            details: "File not found".to_string(),
        };

        logger.log_error(&error, Some("FS001"), Some("test_context")).unwrap();

        // Check that log file was created
        assert!(logger.current_log_path().exists());
    }

    #[test]
    fn test_log_rotation_size() {
        let temp_dir = TempDir::new().unwrap();
        let config = ErrorLoggerConfig {
            log_dir: temp_dir.path().to_path_buf(),
            max_file_size: 100, // Very small size to trigger rotation
            max_files: 2,
        };
        let logger = ErrorLogger::with_config(config);
        logger.init().unwrap();

        let error = AppError::Parse {
            file_type: "JSON".to_string(),
            line_number: Some(1),
            details: "Test error".to_string(),
        };

        // Write enough errors to trigger rotation
        for _ in 0..10 {
            logger.log_error(&error, None, None).unwrap();
        }

        // Check that rotation occurred (error.1.log should exist)
        let rotated_log = temp_dir.path().join("error.1.log");
        assert!(rotated_log.exists());
    }

    #[test]
    fn test_log_export() {
        let temp_dir = TempDir::new().unwrap();
        let config = ErrorLoggerConfig {
            log_dir: temp_dir.path().to_path_buf(),
            max_file_size: 1024,
            max_files: 2,
        };
        let logger = ErrorLogger::with_config(config);
        logger.init().unwrap();

        let error = AppError::Network {
            endpoint: "https://example.com".to_string(),
            status_code: Some(404),
        };

        logger.log_error(&error, Some("NT001"), Some("test")).unwrap();

        let exported = logger.export_logs().unwrap();
        let entries: Vec<ErrorLogEntry> = serde_json::from_str(&exported).unwrap();

        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].error_code, Some("NT001".to_string()));
        assert_eq!(entries[0].level, "ERROR");
    }

    #[test]
    fn test_get_error_type() {
        let logger = ErrorLogger::new();

        let fs_error = AppError::Filesystem {
            path: "/test".to_string(),
            operation: "read".to_string(),
            details: "error".to_string(),
        };
        assert_eq!(logger.get_error_type(&fs_error), "Filesystem");

        let perm_error = AppError::Permission {
            path: "/test".to_string(),
            required_permission: "read".to_string(),
        };
        assert_eq!(logger.get_error_type(&perm_error), "Permission");

        let parse_error = AppError::Parse {
            file_type: "JSON".to_string(),
            line_number: Some(1),
            details: "error".to_string(),
        };
        assert_eq!(logger.get_error_type(&parse_error), "Parse");

        let network_error = AppError::Network {
            endpoint: "https://example.com".to_string(),
            status_code: Some(404),
        };
        assert_eq!(logger.get_error_type(&network_error), "Network");
    }
}
