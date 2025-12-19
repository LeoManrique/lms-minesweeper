mod commands;
mod scaling;

use commands::{get_system_language, resize_window};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            resize_window,
            get_system_language
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
