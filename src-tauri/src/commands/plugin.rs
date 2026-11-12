use crate::models::plugin::{PluginManifest, RemotePlugin};
use crate::services::plugin_service;
use tauri::AppHandle;

/// List all installed plugins in the app data directory.
#[tauri::command]
pub async fn list_plugins(app_handle: AppHandle) -> Result<Vec<PluginManifest>, String> {
    plugin_service::list_plugins(&app_handle).await
}

/// Open the plugins folder in the native OS file explorer.
#[tauri::command]
pub async fn open_plugins_folder(app_handle: AppHandle) -> Result<(), String> {
    plugin_service::open_plugins_folder(&app_handle).await
}

/// Read the main JavaScript source of a specific plugin.
#[tauri::command]
pub async fn read_plugin_source(
    app_handle: AppHandle,
    plugin_id: String,
) -> Result<String, String> {
    plugin_service::read_plugin_source(&app_handle, &plugin_id).await
}

/// Fetch available plugins from the remote BerryUIKI/Taleno-Plugins registry.
#[tauri::command]
pub async fn fetch_marketplace_plugins(app_handle: AppHandle) -> Result<Vec<RemotePlugin>, String> {
    plugin_service::fetch_marketplace_plugins(&app_handle).await
}

/// Install a plugin from the remote registry into the user's plugins directory.
#[tauri::command]
pub async fn install_plugin(
    app_handle: AppHandle,
    plugin_id: String,
    raw_base_url: String,
    entry_file: Option<String>,
) -> Result<PluginManifest, String> {
    let entry = entry_file.unwrap_or_else(|| "main.js".to_string());
    plugin_service::install_remote_plugin(&app_handle, &plugin_id, &raw_base_url, &entry).await
}

/// Uninstall (delete) a plugin from the user's plugins directory.
#[tauri::command]
pub async fn uninstall_plugin(app_handle: AppHandle, plugin_id: String) -> Result<(), String> {
    plugin_service::uninstall_plugin(&app_handle, &plugin_id).await
}

/// Update an installed plugin from the remote registry.
#[tauri::command]
pub async fn update_plugin(
    app_handle: AppHandle,
    plugin_id: String,
    raw_base_url: String,
    entry_file: Option<String>,
) -> Result<PluginManifest, String> {
    let entry = entry_file.unwrap_or_else(|| "main.js".to_string());
    plugin_service::install_remote_plugin(&app_handle, &plugin_id, &raw_base_url, &entry).await
}
