//! Tests for export commands
//!
//! Unit tests for export functionality.

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::export::{ExportFormat, ExportOptions};

    #[tokio::test]
    async fn test_generate_export_filename() {
        let filename = generate_export_filename("test-project".to_string(), "json".to_string()).unwrap();
        assert!(filename.contains("test-project"));
        assert!(filename.ends_with(".json"));
        assert!(filename.contains("config-"));
    }

    #[tokio::test]
    async fn test_generate_export_filename_with_special_chars() {
        let filename = generate_export_filename("Test/Project<>Name".to_string(), "markdown".to_string()).unwrap();
        assert!(!filename.contains('/'));
        assert!(!filename.contains('<'));
        assert!(!filename.contains('>'));
        assert!(filename.ends_with(".md"));
    }

    #[tokio::test]
    async fn test_generate_export_filename_csv() {
        let filename = generate_export_filename("my-project".to_string(), "csv".to_string()).unwrap();
        assert!(filename.ends_with(".csv"));
        assert!(filename.contains("my-project"));
    }

    #[tokio::test]
    async fn test_generate_export_filename_invalid_format() {
        let filename = generate_export_filename("test-project".to_string(), "pdf".to_string()).unwrap();
        assert!(filename.ends_with(".txt"));
    }

    #[test]
    fn test_calculate_record_count_json() {
        let json_content = r#"{
            "project": {
                "name": "test",
                "configurations": {
                    "mcp": [
                        {"name": "server1"},
                        {"name": "server2"}
                    ],
                    "agents": [
                        {"name": "agent1"}
                    ]
                }
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

    #[test]
    fn test_export_options_default() {
        let options = ExportOptions {
            format: ExportFormat::Json,
            include_inherited: true,
            include_mcp: true,
            include_agents: true,
            include_metadata: true,
        };

        assert_eq!(options.format, ExportFormat::Json);
        assert!(options.include_inherited);
        assert!(options.include_mcp);
        assert!(options.include_agents);
        assert!(options.include_metadata);
    }

    #[test]
    fn test_export_options_filter_mcp() {
        let options = ExportOptions {
            format: ExportFormat::Csv,
            include_inherited: false,
            include_mcp: false,
            include_agents: true,
            include_metadata: false,
        };

        assert!(!options.include_inherited);
        assert!(!options.include_mcp);
        assert!(options.include_agents);
        assert!(!options.include_metadata);
    }

    #[test]
    fn test_validation_result_success() {
        let result = ValidationResult {
            is_valid: true,
            errors: Vec::new(),
            warnings: Vec::new(),
        };

        assert!(result.is_valid);
        assert_eq!(result.errors.len(), 0);
        assert_eq!(result.warnings.len(), 0);
    }

    #[test]
    fn test_validation_result_with_errors() {
        let result = ValidationResult {
            is_valid: false,
            errors: vec!["Missing project name".to_string()],
            warnings: Vec::new(),
        };

        assert!(!result.is_valid);
        assert_eq!(result.errors.len(), 1);
        assert_eq!(result.errors[0], "Missing project name");
    }

    #[test]
    fn test_validation_result_with_warnings() {
        let result = ValidationResult {
            is_valid: true,
            errors: Vec::new(),
            warnings: vec!["Large export file".to_string()],
        };

        assert!(result.is_valid);
        assert_eq!(result.warnings.len(), 1);
        assert_eq!(result.warnings[0], "Large export file");
    }

    #[tokio::test]
    async fn test_validate_export_data_valid() {
        let data = serde_json::json!({
            "project": {
                "name": "test-project",
                "path": "/path/to/project"
            }
        });

        let result = validate_export_data(data).await.unwrap();
        assert!(result.is_valid);
        assert_eq!(result.errors.len(), 0);
    }

    #[tokio::test]
    async fn test_validate_export_data_missing_name() {
        let data = serde_json::json!({
            "project": {
                "path": "/path/to/project"
            }
        });

        let result = validate_export_data(data).await.unwrap();
        assert!(!result.is_valid);
        assert!(result.errors.len() > 0);
        assert!(result.errors.iter().any(|e| e.contains("name")));
    }

    #[tokio::test]
    async fn test_validate_export_data_missing_path() {
        let data = serde_json::json!({
            "project": {
                "name": "test-project"
            }
        });

        let result = validate_export_data(data).await.unwrap();
        assert!(!result.is_valid);
        assert!(result.errors.len() > 0);
        assert!(result.errors.iter().any(|e| e.contains("path")));
    }

    #[tokio::test]
    async fn test_validate_export_data_not_object() {
        let data = serde_json::json!("invalid");

        let result = validate_export_data(data).await.unwrap();
        assert!(!result.is_valid);
        assert!(result.errors.len() > 0);
        assert!(result.errors.iter().any(|e| e.contains("object")));
    }

    #[tokio::test]
    async fn test_validate_export_data_large_content() {
        let large_string = "x".repeat(11_000_000);
        let data = serde_json::json!({
            "content": large_string
        });

        let result = validate_export_data(data).await.unwrap();
        assert!(result.is_valid);
        assert!(result.warnings.len() > 0);
        assert!(result.warnings.iter().any(|w| w.contains("large")));
    }
}
