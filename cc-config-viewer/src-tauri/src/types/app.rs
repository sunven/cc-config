//! Application types module
//!
//! Core types for the cc-config-viewer application.
//! These types will be used in Story 1.5+ for the application shell and beyond.

use serde::{Deserialize, Serialize};

/// Application error types for consistent error handling
#[derive(Debug, Serialize, thiserror::Error)]
#[allow(dead_code)]
pub enum AppError {
    #[error("Filesystem error: {0}")]
    Filesystem(String),

    #[error("Permission error: {0}")]
    Permission(String),

    #[error("Parse error: {0}")]
    Parse(String),

    #[error("Network error: {0}")]
    Network(String),
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

/// Represents a project in the configuration viewer
#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub config_path: String,
}

/// Represents the source of a configuration value
#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ConfigSource {
    pub type_: String,
    pub path: String,
    pub priority: u32,
}

/// A configuration entry with its value and source
#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ConfigEntry {
    pub key: String,
    pub value: serde_json::Value,
    pub source: ConfigSource,
}
