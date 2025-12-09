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

/// Represents a configuration capability for comparison
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct Capability {
    pub id: String,
    pub key: String,
    pub value: serde_json::Value,
    pub source: String,
}

/// Represents the result of a capability comparison
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct DiffResult {
    pub capability_id: String,
    pub left_value: Option<Capability>,
    pub right_value: Option<Capability>,
    pub status: DiffStatus,
    pub severity: DiffSeverity,
    pub highlight_class: Option<String>, // CSS class for visual highlighting
}

/// Status of a capability comparison
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[allow(dead_code)]
pub enum DiffStatus {
    #[serde(rename = "match")]
    Match,
    #[serde(rename = "different")]
    Different,
    #[serde(rename = "conflict")]
    Conflict,
    #[serde(rename = "only-left")]
    OnlyLeft,
    #[serde(rename = "only-right")]
    OnlyRight,
}

/// Severity level of a difference
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[allow(dead_code)]
pub enum DiffSeverity {
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "medium")]
    Medium,
    #[serde(rename = "high")]
    High,
}

/// Highlighting configuration for difference visualization
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct HighlightFilters {
    pub show_only_differences: bool,
    pub show_blue_only: bool, // Only in A
    pub show_green_only: bool, // Only in B
    pub show_yellow_only: bool, // Different values
}

/// Summary statistics for difference highlighting
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct SummaryStats {
    pub total_differences: u32,
    pub only_in_a: u32,
    pub only_in_b: u32,
    pub different_values: u32,
}

/// Health status of a project
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[allow(dead_code)]
pub enum HealthStatus {
    #[serde(rename = "good")]
    Good,
    #[serde(rename = "warning")]
    Warning,
    #[serde(rename = "error")]
    Error,
}

/// Represents a health issue found in a project
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct HealthIssue {
    pub id: String,
    pub type_: String, // "warning" or "error"
    pub severity: DiffSeverity,
    pub message: String,
    pub details: Option<String>,
    pub project_id: String,
}

/// Health metrics for a project
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct ProjectHealth {
    pub project_id: String,
    pub status: HealthStatus,
    pub score: f64, // 0-100
    pub metrics: HealthMetrics,
    pub issues: Vec<HealthIssue>,
    pub recommendations: Vec<String>,
}

/// Health metrics for a project
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct HealthMetrics {
    pub total_capabilities: u32,
    pub valid_configs: u32,
    pub invalid_configs: u32,
    pub warnings: u32,
    pub errors: u32,
    pub last_checked: String, // ISO 8601 date string
    pub last_accessed: Option<String>, // ISO 8601 date string
}
