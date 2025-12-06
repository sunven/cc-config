use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub config_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigSource {
    pub type_: String,
    pub path: String,
    pub priority: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigEntry {
    pub key: String,
    pub value: serde_json::Value,
    pub source: ConfigSource,
}
