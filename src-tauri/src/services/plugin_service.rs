use super::package_paths;
use crate::models::plugin::{PluginManifest, PluginRegistryResponse, RemotePlugin};
use std::path::{Path, PathBuf};
use std::time::Duration;
use tauri::Manager;
use tokio::fs;

const SAMPLE_PLUGIN_DIR: &str = "sample-timestamp";
const SAMPLE_PLUGIN_MANIFEST: &str = r#"{
  "id": "sample-timestamp",
  "name": "Timestamp Inserter",
  "version": "1.0.0",
  "description": "Inserts the current ISO 8601 timestamp at the cursor or document end with a single command.",
  "author": "Taleno Team",
  "enabled": true,
  "main": "main.js",
  "tags": ["utilities", "editor", "official"],
  "permissions": ["editor:write", "commands"]
}"#;

const SAMPLE_PLUGIN_SCRIPT: &str = r#"// Taleno Sample Plugin: Timestamp Inserter
export default {
  onload(ctx) {
    console.log("[Sample Plugin] Loaded Timestamp Inserter");
    ctx.commands.registerCommand({
      id: "insert-timestamp",
      title: "Insert Current Timestamp",
      run() {
        const now = new Date().toLocaleString();
        ctx.editor.insertText(`\n> 🕒 _Timestamp: ${now}_\n`);
      }
    });
  },
  onunload() {
    console.log("[Sample Plugin] Unloaded Timestamp Inserter");
  }
};
"#;

const REGISTRY_PRIMARY_URL: &str =
    "https://raw.githubusercontent.com/BerryUIKI/Taleno-Plugins/dev/plugins.json";
const REGISTRY_FALLBACK_URL: &str =
    "https://raw.githubusercontent.com/BerryUIKI/Taleno-Plugins/main/plugins.json";

/// Validates that a plugin ID contains only safe alphanumeric, dash, and underscore characters.
pub fn validate_plugin_id(id: &str) -> Result<(), String> {
    if id.is_empty() || id.len() > 64 {
        return Err("Plugin ID must be between 1 and 64 characters".to_string());
    }
    if !id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err(
            "Plugin ID must contain only alphanumeric characters, dashes, or underscores"
                .to_string(),
        );
    }
    Ok(())
}

/// Resolve the path to the app's plugins directory.
pub fn get_plugins_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;
    Ok(base_dir.join("plugins"))
}

/// Ensure the plugins directory exists and initialize a sample plugin if empty.
pub async fn ensure_plugins_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let plugins_dir = get_plugins_dir(app_handle)?;
    if !plugins_dir.exists() {
        fs::create_dir_all(&plugins_dir)
            .await
            .map_err(|e| format!("Failed to create plugins directory: {}", e))?;
    }

    package_paths::validate_root(&plugins_dir)?;
    // Check if directory is empty; if so, create the sample starter plugin
    let mut entries = fs::read_dir(&plugins_dir)
        .await
        .map_err(|e| format!("Failed to read plugins directory: {}", e))?;

    let is_empty = entries
        .next_entry()
        .await
        .map_err(|e| e.to_string())?
        .is_none();
    if is_empty {
        let sample_dir = plugins_dir.join(SAMPLE_PLUGIN_DIR);
        if fs::create_dir_all(&sample_dir).await.is_ok() {
            let _ = fs::write(sample_dir.join("manifest.json"), SAMPLE_PLUGIN_MANIFEST).await;
            let _ = fs::write(sample_dir.join("main.js"), SAMPLE_PLUGIN_SCRIPT).await;
        }
    }

    Ok(plugins_dir)
}

/// Scan the plugins directory and parse all valid plugin manifests.
pub async fn list_plugins(app_handle: &tauri::AppHandle) -> Result<Vec<PluginManifest>, String> {
    let plugins_dir = ensure_plugins_dir(app_handle).await?;
    scan_plugins_in_dir(&plugins_dir).await
}

/// Helper function to scan a directory path for plugin manifests.
pub async fn scan_plugins_in_dir(plugins_dir: &Path) -> Result<Vec<PluginManifest>, String> {
    if !plugins_dir.exists() {
        return Ok(Vec::new());
    }
    package_paths::validate_root(plugins_dir)?;

    let mut manifests = Vec::new();
    let mut entries = fs::read_dir(plugins_dir)
        .await
        .map_err(|e| format!("Failed to read directory {}: {}", plugins_dir.display(), e))?;

    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
        let path = entry.path();
        if path.is_dir() && !entry.file_name().to_string_lossy().starts_with('.') {
            let folder = entry.file_name().to_string_lossy().into_owned();
            let manifest_path =
                match package_paths::contained(plugins_dir, &format!("{folder}/manifest.json")) {
                    Ok(path) => path,
                    Err(_) => continue,
                };
            if manifest_path.is_file() {
                if let Ok(content) = fs::read_to_string(&manifest_path).await {
                    if let Ok(manifest) = serde_json::from_str::<PluginManifest>(&content) {
                        manifests.push(manifest);
                    }
                }
            }
        }
    }

    Ok(manifests)
}

/// Read the main JavaScript code for a specific plugin ID.
pub async fn read_plugin_source(
    app_handle: &tauri::AppHandle,
    plugin_id: &str,
) -> Result<String, String> {
    let plugins_dir = ensure_plugins_dir(app_handle).await?;
    read_plugin_source_from_dir(&plugins_dir, plugin_id).await
}

/// Helper function to read plugin JavaScript source from a specified root directory.
pub async fn read_plugin_source_from_dir(
    plugins_dir: &Path,
    plugin_id: &str,
) -> Result<String, String> {
    validate_plugin_id(plugin_id)?;
    if !plugins_dir.exists() {
        return Err(format!(
            "Plugins directory does not exist: {}",
            plugins_dir.display()
        ));
    }

    let mut entries = fs::read_dir(plugins_dir)
        .await
        .map_err(|e| format!("Failed to read directory {}: {}", plugins_dir.display(), e))?;

    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
        let path = entry.path();
        if path.is_dir() && !entry.file_name().to_string_lossy().starts_with('.') {
            let folder = entry.file_name().to_string_lossy().into_owned();
            let manifest_path =
                match package_paths::contained(plugins_dir, &format!("{folder}/manifest.json")) {
                    Ok(path) => path,
                    Err(_) => continue,
                };
            if manifest_path.is_file() {
                if let Ok(content) = fs::read_to_string(&manifest_path).await {
                    if let Ok(manifest) = serde_json::from_str::<PluginManifest>(&content) {
                        if manifest.id == plugin_id {
                            let entry_name = manifest.main.unwrap_or_else(|| "main.js".to_string());
                            let script_file = package_paths::contained(
                                plugins_dir,
                                &format!("{folder}/{entry_name}"),
                            )?;
                            if script_file.is_file() {
                                return fs::read_to_string(&script_file).await.map_err(|e| {
                                    format!(
                                        "Failed to read script {}: {}",
                                        script_file.display(),
                                        e
                                    )
                                });
                            } else {
                                return Err(format!(
                                    "Plugin entry file '{}' not found in {}",
                                    entry_name,
                                    path.display()
                                ));
                            }
                        }
                    }
                }
            }
        }
    }

    Err(format!("Plugin with id '{}' was not found", plugin_id))
}

/// Open the plugins folder in the native operating system file explorer.
pub async fn open_plugins_folder(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let plugins_dir = ensure_plugins_dir(app_handle).await?;
    let path_str = plugins_dir.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open Finder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        let _ = path_str;
    }

    Ok(())
}

/// Helper to download response text via reqwest with user agent and timeout.
async fn download_text(client: &reqwest::Client, url: &str) -> Result<String, String> {
    let resp = client
        .get(url)
        .header("User-Agent", "Taleno-Client")
        .send()
        .await
        .map_err(|e| format!("Request failed for {}: {}", url, e))?;

    if !resp.status().is_success() {
        return Err(format!("HTTP {} when requesting {}", resp.status(), url));
    }

    resp.text()
        .await
        .map_err(|e| format!("Failed to read response from {}: {}", url, e))
}

/// Fetch the list of available plugins from the remote BerryUIKI/Taleno-Plugins registry.
pub async fn fetch_marketplace_plugins(
    app_handle: &tauri::AppHandle,
) -> Result<Vec<RemotePlugin>, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(12))
        .build()
        .map_err(|e| e.to_string())?;

    // Try primary dev branch first, fallback to main
    let json_text = match download_text(&client, REGISTRY_PRIMARY_URL).await {
        Ok(text) => text,
        Err(_) => download_text(&client, REGISTRY_FALLBACK_URL).await?,
    };

    let registry: PluginRegistryResponse = serde_json::from_str(&json_text)
        .map_err(|e| format!("Failed to parse registry JSON: {}", e))?;

    // Cache registry locally for offline use
    if let Ok(base_dir) = app_handle.path().app_data_dir() {
        let cache_dir = base_dir.join("cache");
        let _ = fs::create_dir_all(&cache_dir).await;
        let _ = fs::write(cache_dir.join("marketplace.json"), &json_text).await;
    }

    Ok(registry.plugins)
}

/// Download and install a plugin from the remote repository.
pub async fn install_remote_plugin(
    app_handle: &tauri::AppHandle,
    plugin_id: &str,
    raw_base_url: &str,
    entry_file: &str,
) -> Result<PluginManifest, String> {
    validate_plugin_id(plugin_id)?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let base = raw_base_url.trim_end_matches('/');
    let manifest_url = format!("{}/manifest.json", base);
    let script_name = if entry_file.is_empty() {
        "main.js"
    } else {
        entry_file
    };
    package_paths::validate_entry(script_name)?;
    let script_url = format!("{}/{}", base, script_name);

    // Download manifest and entry script
    let manifest_content = download_text(&client, &manifest_url).await?;
    let script_content = download_text(&client, &script_url).await?;

    let parsed_manifest: PluginManifest = serde_json::from_str(&manifest_content)
        .map_err(|e| format!("Downloaded manifest is invalid JSON: {}", e))?;

    if parsed_manifest.id != plugin_id {
        return Err(format!(
            "Manifest ID mismatch: expected '{}', found '{}'",
            plugin_id, parsed_manifest.id
        ));
    }

    let manifest_entry = parsed_manifest.main.as_deref().unwrap_or("main.js");
    package_paths::validate_entry(manifest_entry)?;
    if manifest_entry != script_name {
        return Err("Manifest entry does not match the downloaded entry".into());
    }
    let plugins_dir = ensure_plugins_dir(app_handle).await?;
    package_paths::install(
        &plugins_dir,
        plugin_id,
        "manifest.json",
        &manifest_content,
        script_name,
        &script_content,
    )?;

    Ok(parsed_manifest)
}

/// Uninstall (delete) an installed plugin folder.
pub async fn uninstall_plugin(
    app_handle: &tauri::AppHandle,
    plugin_id: &str,
) -> Result<(), String> {
    validate_plugin_id(plugin_id)?;
    let plugins_dir = ensure_plugins_dir(app_handle).await?;
    let target_folder = package_paths::contained(&plugins_dir, plugin_id)?;

    if target_folder.exists() {
        fs::remove_dir_all(&target_folder)
            .await
            .map_err(|e| format!("Failed to uninstall plugin '{}': {}", plugin_id, e))?;
    }

    Ok(())
}

/// Update an existing plugin by re-installing the latest remote files.
pub async fn update_remote_plugin(
    app_handle: &tauri::AppHandle,
    plugin_id: &str,
    raw_base_url: &str,
    entry_file: &str,
) -> Result<PluginManifest, String> {
    install_remote_plugin(app_handle, plugin_id, raw_base_url, entry_file).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_scan_and_read_plugins_in_temp_dir() {
        let temp_dir = std::env::temp_dir().join("Taleno_test_plugins_dir");
        let root = temp_dir.as_path();
        let _ = fs::remove_dir_all(&temp_dir).await;
        fs::create_dir_all(&temp_dir).await.unwrap();

        let plugin_folder = root.join("test-plugin");
        fs::create_dir_all(&plugin_folder).await.unwrap();

        let manifest_content = r#"{
            "id": "test-plugin-id",
            "name": "Test Plugin",
            "version": "1.0.0",
            "description": "A unit test plugin",
            "author": "Tester",
            "enabled": true,
            "main": "index.js",
            "tags": ["testing"]
        }"#;

        let script_content = "console.log('Hello from test plugin');";

        fs::write(plugin_folder.join("manifest.json"), manifest_content)
            .await
            .unwrap();
        fs::write(plugin_folder.join("index.js"), script_content)
            .await
            .unwrap();

        let list = scan_plugins_in_dir(root).await.unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].id, "test-plugin-id");
        assert_eq!(list[0].name, "Test Plugin");

        let source = read_plugin_source_from_dir(root, "test-plugin-id")
            .await
            .unwrap();
        assert_eq!(source, script_content);

        let mut manifest: serde_json::Value = serde_json::from_str(manifest_content).unwrap();
        manifest["main"] = serde_json::json!("../private.js");
        fs::write(root.join("private.js"), "must not read")
            .await
            .unwrap();
        fs::write(plugin_folder.join("manifest.json"), manifest.to_string())
            .await
            .unwrap();
        assert!(
            read_plugin_source_from_dir(root, "test-plugin-id")
                .await
                .is_err()
        );

        let _ = fs::remove_dir_all(&temp_dir).await;
    }

    #[test]
    fn test_validate_plugin_id() {
        assert!(validate_plugin_id("wordcount-pro").is_ok());
        assert!(validate_plugin_id("sample_123").is_ok());
        assert!(validate_plugin_id("").is_err());
        assert!(validate_plugin_id("../escape").is_err());
        assert!(validate_plugin_id("test/path").is_err());
        assert!(validate_plugin_id("has space").is_err());
    }
}
