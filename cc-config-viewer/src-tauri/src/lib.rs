// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod config;
mod types;

use commands::config::{read_config, parse_config, watch_config};
use commands::source::{get_source_location, open_in_editor, copy_to_clipboard};
use commands::project_commands::{
    list_projects, scan_projects, watch_projects, health_check_project, calculate_health_metrics,
    refresh_all_project_health,
};
use commands::export_commands::{
    save_export_file, get_downloads_path, validate_export_data, generate_export_filename,
    export_project_config, export_comparison_data, check_export_permissions,
    get_export_file_info, delete_export_file, list_export_files,
};

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
            watch_config,
            get_source_location,
            open_in_editor,
            copy_to_clipboard,
            list_projects,
            scan_projects,
            watch_projects,
            health_check_project,
            calculate_health_metrics,
            refresh_all_project_health,
            save_export_file,
            get_downloads_path,
            validate_export_data,
            generate_export_filename,
            export_project_config,
            export_comparison_data,
            check_export_permissions,
            get_export_file_info,
            delete_export_file,
            list_export_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
