// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod config;
mod types;

use commands::config::{read_config, parse_config, watch_config};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize file watcher on app startup
            let app_handle = app.handle().clone();

            // Initialize watcher directly (no thread spawn needed - watcher runs in background)
            if let Err(e) = config::watcher::watch_config_files(app_handle) {
                eprintln!("Failed to initialize file watcher: {}", e);
                // Watcher failure is not fatal - app can still work without auto-updates
            } else {
                println!("File watcher initialized successfully");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            read_config,
            parse_config,
            watch_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
