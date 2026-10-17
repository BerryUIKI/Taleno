use crate::models::theme::{RemoteTheme, ThemeManifest};
use crate::services::theme_service;
use tauri::AppHandle;

/// List all installed custom themes.
#[tauri::command]
pub async fn list_themes(app_handle: AppHandle) -> Result<Vec<ThemeManifest>, String> {
    theme_service::list_installed_themes(&app_handle).await
}

/// Read the CSS stylesheet of an installed theme.
#[tauri::command]
pub async fn read_theme_css(app_handle: AppHandle, theme_id: String) -> Result<String, String> {
    theme_service::read_theme_css(&app_handle, &theme_id).await
}

/// Open the user's themes folder in the native OS file explorer.
#[tauri::command]
pub async fn open_themes_folder(app_handle: AppHandle) -> Result<(), String> {
    theme_service::open_themes_folder(&app_handle).await
}

/// Fetch available community themes from the BerryUIKI/Taleno-Plugins registry.
#[tauri::command]
pub async fn fetch_marketplace_themes(app_handle: AppHandle) -> Result<Vec<RemoteTheme>, String> {
    theme_service::fetch_marketplace_themes(&app_handle).await
}

/// Install a remote theme into the user's themes directory.
#[tauri::command]
pub async fn install_theme(
    app_handle: AppHandle,
    theme_id: String,
    raw_base_url: String,
    entry_file: Option<String>,
) -> Result<ThemeManifest, String> {
    let entry = entry_file.unwrap_or_else(|| "theme.css".to_string());
    theme_service::install_remote_theme(&app_handle, &theme_id, &raw_base_url, &entry).await
}

/// Uninstall (delete) a theme from the user's themes directory.
#[tauri::command]
pub async fn uninstall_theme(app_handle: AppHandle, theme_id: String) -> Result<(), String> {
    theme_service::uninstall_theme(&app_handle, &theme_id).await
}
