//! Export types for configuration data
//!
//! Provides types for exporting configuration data in various formats.

use serde::{Deserialize, Serialize};

/// Export format types
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[allow(dead_code)]
pub enum ExportFormat {
    #[serde(rename = "json")]
    Json,
    #[serde(rename = "markdown")]
    Markdown,
    #[serde(rename = "csv")]
    Csv,
}

/// Export configuration options
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct ExportOptions {
    pub format: ExportFormat,
    pub include_inherited: bool,
    pub include_mcp: bool,
    pub include_agents: bool,
    pub include_metadata: bool,
}

/// Export metadata for tracking
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct ExportMetadata {
    pub version: String,
    pub export_format: ExportFormat,
    pub timestamp: String,
    pub source_type: String,
    pub record_count: u32,
    pub file_size: u64,
    pub include_inherited: bool,
    pub include_mcp: bool,
    pub include_agents: bool,
}

/// Export statistics
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct ExportStats {
    pub record_count: u32,
    pub file_size: u64,
    pub duration: u64,
}

/// Result of an export operation
#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ExportResult {
    pub success: bool,
    pub file_path: Option<String>,
    pub content: Option<String>,
    pub format: ExportFormat,
    pub error: Option<String>,
    pub stats: Option<ExportStats>,
}

/// Validation result for export data
#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Export file information
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct ExportFileInfo {
    pub path: String,
    pub filename: String,
    pub format: ExportFormat,
    pub size: u64,
    pub created_at: String,
}

/// Project export data structure
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct ProjectExportData {
    pub project_id: String,
    pub project_name: String,
    pub project_path: String,
    pub configurations: ProjectConfigurations,
    pub metadata: ExportMetadata,
}

/// Project configurations
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct ProjectConfigurations {
    pub mcp: Option<Vec<serde_json::Value>>,
    pub agents: Option<Vec<serde_json::Value>>,
    pub inherited: Option<Vec<serde_json::Value>>,
}

/// Comparison export data structure
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct ComparisonExportData {
    pub left_project: ProjectExportData,
    pub right_project: ProjectExportData,
    pub diff_results: Vec<DiffResult>,
    pub metadata: ExportMetadata,
}

/// Re-export DiffResult from app module
pub use crate::types::app::DiffResult;
