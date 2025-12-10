use serde::{Deserialize, Serialize};
use std::fmt;

/// Structured AppError enum representing all possible errors in the application
/// This follows the comprehensive error handling specifications from Story 6.1
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppError {
    Filesystem {
        path: String,
        operation: String,
        details: String,
    },
    Permission {
        path: String,
        required_permission: String,
    },
    Parse {
        file_type: String,
        line_number: Option<u32>,
        details: String,
    },
    Network {
        endpoint: String,
        status_code: Option<u16>,
    },
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Filesystem {
                path,
                operation,
                details,
            } => {
                write!(
                    f,
                    "FS Error: Failed to {} file '{}': {}",
                    operation, path, details
                )
            }
            AppError::Permission {
                path,
                required_permission,
            } => {
                write!(
                    f,
                    "Permission Error: Access denied to '{}'. Required permission: {}",
                    path, required_permission
                )
            }
            AppError::Parse {
                file_type,
                line_number,
                details,
            } => {
                if let Some(line) = line_number {
                    write!(
                        f,
                        "Parse Error in {} at line {}: {}",
                        file_type, line, details
                    )
                } else {
                    write!(f, "Parse Error in {}: {}", file_type, details)
                }
            }
            AppError::Network {
                endpoint,
                status_code,
            } => {
                if let Some(code) = status_code {
                    write!(
                        f,
                        "Network Error: Request to '{}' failed with status code {}",
                        endpoint, code
                    )
                } else {
                    write!(
                        f,
                        "Network Error: Request to '{}' failed",
                        endpoint
                    )
                }
            }
        }
    }
}

impl std::error::Error for AppError {}

/// Error code constants for programmatic error handling
pub mod error_codes {
    // File System Errors
    pub const FS001: &str = "FS001";
    pub const FS002: &str = "FS002";
    pub const FS003: &str = "FS003";
    pub const FS004: &str = "FS004";

    // Parse Errors
    pub const PR001: &str = "PR001";
    pub const PR002: &str = "PR002";
    pub const PR003: &str = "PR003";
    pub const PR004: &str = "PR004";

    // Network Errors
    pub const NT001: &str = "NT001";
    pub const NT002: &str = "NT002";
    pub const NT003: &str = "NT003";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_filesystem_error_display() {
        let error = AppError::Filesystem {
            path: "/test/path".to_string(),
            operation: "read".to_string(),
            details: "No such file".to_string(),
        };
        let display = format!("{}", error);
        assert!(display.contains("FS Error"));
        assert!(display.contains("/test/path"));
        assert!(display.contains("read"));
        assert!(display.contains("No such file"));
    }

    #[test]
    fn test_permission_error_display() {
        let error = AppError::Permission {
            path: "/restricted/file".to_string(),
            required_permission: "read".to_string(),
        };
        let display = format!("{}", error);
        assert!(display.contains("Permission Error"));
        assert!(display.contains("/restricted/file"));
        assert!(display.contains("read"));
    }

    #[test]
    fn test_parse_error_display_with_line() {
        let error = AppError::Parse {
            file_type: "JSON".to_string(),
            line_number: Some(42),
            details: "Invalid syntax".to_string(),
        };
        let display = format!("{}", error);
        assert!(display.contains("Parse Error"));
        assert!(display.contains("JSON"));
        assert!(display.contains("line 42"));
        assert!(display.contains("Invalid syntax"));
    }

    #[test]
    fn test_parse_error_display_without_line() {
        let error = AppError::Parse {
            file_type: "Markdown".to_string(),
            line_number: None,
            details: "Malformed header".to_string(),
        };
        let display = format!("{}", error);
        assert!(display.contains("Parse Error"));
        assert!(display.contains("Markdown"));
        assert!(display.contains("Malformed header"));
    }

    #[test]
    fn test_network_error_display_with_code() {
        let error = AppError::Network {
            endpoint: "https://api.example.com".to_string(),
            status_code: Some(404),
        };
        let display = format!("{}", error);
        assert!(display.contains("Network Error"));
        assert!(display.contains("https://api.example.com"));
        assert!(display.contains("404"));
    }

    #[test]
    fn test_network_error_display_without_code() {
        let error = AppError::Network {
            endpoint: "https://api.example.com".to_string(),
            status_code: None,
        };
        let display = format!("{}", error);
        assert!(display.contains("Network Error"));
        assert!(display.contains("https://api.example.com"));
    }

    #[test]
    fn test_error_serialization() {
        let error = AppError::Filesystem {
            path: "/test".to_string(),
            operation: "write".to_string(),
            details: "IO error".to_string(),
        };

        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("\"/test\""));
        assert!(json.contains("\"write\""));
        assert!(json.contains("\"IO error\""));
    }

    #[test]
    fn test_error_deserialization() {
        let json = r#"{"Filesystem":{"path":"/test","operation":"read","details":"error"}}"#;
        let error: AppError = serde_json::from_str(json).unwrap();

        match error {
            AppError::Filesystem {
                path,
                operation,
                details,
            } => {
                assert_eq!(path, "/test");
                assert_eq!(operation, "read");
                assert_eq!(details, "error");
            }
            _ => panic!("Expected Filesystem error"),
        }
    }

    #[test]
    fn test_error_debug_format() {
        let error = AppError::Parse {
            file_type: "YAML".to_string(),
            line_number: Some(10),
            details: "Invalid format".to_string(),
        };

        let debug = format!("{:?}", error);
        assert!(debug.contains("Parse"));
        assert!(debug.contains("YAML"));
    }

    #[test]
    fn test_error_codes_exist() {
        // Test that error code constants are defined
        assert_eq!(error_codes::FS001, "FS001");
        assert_eq!(error_codes::PR001, "PR001");
        assert_eq!(error_codes::NT001, "NT001");
    }
}
