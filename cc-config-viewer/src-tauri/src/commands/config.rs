use crate::config::reader;
use crate::types::app::AppError;
use std::collections::HashMap;

#[tauri::command]
pub async fn read_config(path: String) -> Result<String, AppError> {
    tokio::task::spawn_blocking(move || reader::read_file(path))
        .await
        .map_err(|e| AppError::Filesystem(format!("Task error: {}", e)))?
}

#[tauri::command]
pub async fn parse_config(content: String) -> Result<HashMap<String, serde_json::Value>, AppError> {
    let value = reader::parse_json(content)?;
    match value.as_object() {
        Some(obj) => Ok(obj.clone().into_iter().collect()),
        None => Err(AppError::Parse("Expected JSON object".to_string())),
    }
}

#[tauri::command]
pub fn watch_config(path: String) -> Result<(), String> {
    // TODO: Implement file watching
    // This will be implemented in Story 1.8
    println!("Watching config file: {}", path);
    Ok(())
}

#[tauri::command]
pub fn get_current_dir() -> Result<String, AppError> {
    std::env::current_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| AppError::Filesystem(format!("Failed to get current directory: {}", e)))
}

#[tauri::command]
pub fn get_home_dir() -> Result<String, AppError> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| AppError::Filesystem("Failed to get home directory".to_string()))
}
