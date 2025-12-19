use tauri::{AppHandle, Manager};
use crate::scaling::get_window_size;

/// Resize the window based on the selected difficulty
#[tauri::command]
pub fn resize_window(app: AppHandle, difficulty: String) {
    let (width, height) = get_window_size(&difficulty);

    println!("resize_window: {} -> {}x{}", difficulty, width, height);

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_size(tauri::LogicalSize::new(width as f64, height as f64));
        let _ = window.center();
    }
}

/// Get the system language
#[tauri::command]
pub fn get_system_language() -> String {
    // Use sys-locale crate to get system locale
    let locale = sys_locale::get_locale().unwrap_or_else(|| "en".to_string());

    // Normalize the language code (e.g., "en-US" -> "en", "es-ES" -> "es")
    locale
        .split(&['-', '_'][..])
        .next()
        .unwrap_or("en")
        .to_lowercase()
}
