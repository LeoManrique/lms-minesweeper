use std::collections::HashMap;

/// Window dimensions for each difficulty level per platform
pub struct WindowSize {
    pub width: u32,
    pub height: u32,
}

/// Get the base window sizes for each platform
fn get_window_sizes() -> HashMap<&'static str, HashMap<&'static str, WindowSize>> {
    let mut sizes = HashMap::new();

    // Windows sizes
    let mut windows_sizes = HashMap::new();
    windows_sizes.insert("beginner", WindowSize { width: 362, height: 510 });
    windows_sizes.insert("intermediate", WindowSize { width: 619, height: 762 });
    windows_sizes.insert("expert", WindowSize { width: 1123, height: 762 });
    sizes.insert("windows", windows_sizes);

    // Linux sizes
    let mut linux_sizes = HashMap::new();
    linux_sizes.insert("beginner", WindowSize { width: 342, height: 450 });
    linux_sizes.insert("intermediate", WindowSize { width: 569, height: 680 });
    linux_sizes.insert("expert", WindowSize { width: 1013, height: 680 });
    sizes.insert("linux", linux_sizes);

    // macOS sizes (same as Windows)
    let mut macos_sizes = HashMap::new();
    macos_sizes.insert("beginner", WindowSize { width: 362, height: 510 });
    macos_sizes.insert("intermediate", WindowSize { width: 619, height: 762 });
    macos_sizes.insert("expert", WindowSize { width: 1123, height: 762 });
    sizes.insert("macos", macos_sizes);

    sizes
}

/// Get Linux scale factor from GNOME settings
#[cfg(target_os = "linux")]
fn get_linux_scale_factor() -> f64 {
    // Try monitors.xml first (most reliable for fractional scaling)
    if let Some(config_dir) = dirs::config_dir() {
        let monitors_path = config_dir.join("monitors.xml");
        if let Ok(content) = std::fs::read_to_string(&monitors_path) {
            // Parse scale value from monitors.xml
            if let Some(scale_start) = content.find("<scale>") {
                let scale_start = scale_start + 7;
                if let Some(scale_end) = content[scale_start..].find("</scale>") {
                    let scale_str = &content[scale_start..scale_start + scale_end];
                    if let Ok(scale) = scale_str.trim().parse::<f64>() {
                        if scale > 0.0 {
                            return scale;
                        }
                    }
                }
            }
        }
    }

    // Fallback: try gsettings scaling-factor
    if let Ok(output) = std::process::Command::new("gsettings")
        .args(["get", "org.gnome.desktop.interface", "scaling-factor"])
        .output()
    {
        if output.status.success() {
            let scale_str = String::from_utf8_lossy(&output.stdout);
            let scale_str = scale_str.trim().trim_start_matches("uint32 ");
            if let Ok(scale) = scale_str.parse::<f64>() {
                if scale > 0.0 {
                    return scale;
                }
            }
        }
    }

    1.0
}

#[cfg(not(target_os = "linux"))]
fn get_linux_scale_factor() -> f64 {
    1.0
}

/// Get the appropriate window dimensions for the given difficulty
/// Automatically applies platform-specific base sizes and scaling
pub fn get_window_size(difficulty: &str) -> (u32, u32) {
    let sizes = get_window_sizes();

    // Determine current OS
    let os_key = if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "macos"
    };

    // Get OS-specific sizes, fallback to Windows
    let os_sizes = sizes.get(os_key).unwrap_or_else(|| sizes.get("windows").unwrap());

    // Get difficulty-specific size, fallback to beginner
    let size = os_sizes.get(difficulty).unwrap_or_else(|| os_sizes.get("beginner").unwrap());

    #[cfg(target_os = "linux")]
    {
        let scale = get_linux_scale_factor();
        if scale > 1.0 {
            let width = (size.width as f64 * scale) as u32;
            let height = (size.height as f64 * scale) as u32;
            return (width, height);
        }
    }

    (size.width, size.height)
}
