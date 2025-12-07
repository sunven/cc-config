use std::collections::HashMap;
use std::fs;

#[tauri::command]
pub fn read_config(path: String) -> Result<String, String> {
    match fs::read_to_string(path) {
        Ok(content) => Ok(content),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn parse_config(content: String) -> Result<HashMap<String, serde_json::Value>, String> {
    match serde_json::from_str::<HashMap<String, serde_json::Value>>(&content) {
        Ok(config) => Ok(config),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn watch_config(path: String) -> Result<(), String> {
    // TODO: Implement file watching
    // This will be implemented in Story 1.8
    println!("Watching config file: {}", path);
    Ok(())
}
