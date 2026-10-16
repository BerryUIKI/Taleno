use tauri::Window;

/// Minimize the window.
#[tauri::command]
pub fn minimize_window(window: Window) -> Result<(), String> {
    #[cfg(desktop)]
    {
        window.minimize().map_err(|e| e.to_string())
    }
    #[cfg(not(desktop))]
    {
        let _ = window;
        Ok(())
    }
}

/// Toggle maximize / restore for the window.
#[tauri::command]
pub fn toggle_maximize_window(window: Window) -> Result<(), String> {
    #[cfg(desktop)]
    {
        let is_maximized = window.is_maximized().map_err(|e| e.to_string())?;
        if is_maximized {
            window.unmaximize().map_err(|e| e.to_string())
        } else {
            window.maximize().map_err(|e| e.to_string())
        }
    }
    #[cfg(not(desktop))]
    {
        let _ = window;
        Ok(())
    }
}

/// Close and destroy the application window.
#[tauri::command]
pub async fn close_window(window: Window) -> Result<(), String> {
    #[cfg(desktop)]
    {
        window.destroy().map_err(|e| e.to_string())
    }
    #[cfg(not(desktop))]
    {
        let _ = window;
        Ok(())
    }
}

/// Check if the window is currently maximized.
#[tauri::command]
pub fn is_window_maximized(window: Window) -> Result<bool, String> {
    #[cfg(desktop)]
    {
        window.is_maximized().map_err(|e| e.to_string())
    }
    #[cfg(not(desktop))]
    {
        let _ = window;
        Ok(false)
    }
}

/// Start dragging the window.
#[tauri::command]
pub fn start_drag(window: Window) -> Result<(), String> {
    #[cfg(desktop)]
    {
        window.start_dragging().map_err(|e| e.to_string())
    }
    #[cfg(not(desktop))]
    {
        let _ = window;
        Ok(())
    }
}

