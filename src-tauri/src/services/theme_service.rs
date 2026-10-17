use crate::models::theme::{RemoteTheme, ThemeManifest, ThemeRegistryResponse};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const GITHUB_THEMES_DEV_URL: &str =
    "https://raw.githubusercontent.com/BerryUIKI/Taleno-Plugins/dev/themes.json";
const GITHUB_THEMES_MAIN_URL: &str =
    "https://raw.githubusercontent.com/BerryUIKI/Taleno-Plugins/main/themes.json";

/// Ensure the user's custom themes directory exists.
pub fn ensure_themes_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let base_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    let themes_dir = base_dir.join("themes");
    if !themes_dir.exists() {
        fs::create_dir_all(&themes_dir)
            .map_err(|e| format!("Failed to create themes directory: {}", e))?;
    }

    Ok(themes_dir)
}

/// Validate theme ID to prevent path traversal attacks.
pub fn validate_theme_id(id: &str) -> Result<(), String> {
    if id.is_empty() || id.len() > 64 {
        return Err("Theme ID must be between 1 and 64 characters".to_string());
    }
    if !id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err(
            "Theme ID contains invalid characters. Only a-z, 0-9, '-', and '_' are allowed"
                .to_string(),
        );
    }
    Ok(())
}

/// List all installed custom themes in the themes directory.
pub async fn list_installed_themes(app_handle: &AppHandle) -> Result<Vec<ThemeManifest>, String> {
    let themes_dir = ensure_themes_dir(app_handle)?;
    scan_themes_dir(&themes_dir)
}

/// Synchronous scanning logic for directory inspection and testing.
pub fn scan_themes_dir(themes_dir: &Path) -> Result<Vec<ThemeManifest>, String> {
    if !themes_dir.exists() {
        return Ok(Vec::new());
    }

    let entries =
        fs::read_dir(themes_dir).map_err(|e| format!("Failed to read themes directory: {}", e))?;

    let mut manifests = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let manifest_path = path.join("theme.json");
            if manifest_path.exists() {
                if let Ok(content) = fs::read_to_string(&manifest_path) {
                    if let Ok(manifest) = serde_json::from_str::<ThemeManifest>(&content) {
                        manifests.push(manifest);
                    }
                }
            }
        }
    }

    manifests.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(manifests)
}

/// Read the CSS stylesheet source of an installed theme.
pub async fn read_theme_css(app_handle: &AppHandle, theme_id: &str) -> Result<String, String> {
    validate_theme_id(theme_id)?;
    let themes_dir = ensure_themes_dir(app_handle)?;
    let theme_dir = themes_dir.join(theme_id);

    if !theme_dir.exists() {
        return Err(format!("Theme '{}' does not exist", theme_id));
    }

    let manifest_path = theme_dir.join("theme.json");
    let entry_file = if manifest_path.exists() {
        fs::read_to_string(&manifest_path)
            .ok()
            .and_then(|content| serde_json::from_str::<ThemeManifest>(&content).ok())
            .map(|m| m.entry_file)
            .unwrap_or_else(|| "theme.css".to_string())
    } else {
        "theme.css".to_string()
    };

    let css_path = theme_dir.join(&entry_file);
    if !css_path.exists() {
        return Err(format!(
            "Stylesheet '{}' not found for theme '{}'",
            entry_file, theme_id
        ));
    }

    fs::read_to_string(&css_path).map_err(|e| format!("Failed to read theme CSS file: {}", e))
}

/// Open the native OS file explorer pointing to the themes directory.
pub async fn open_themes_folder(app_handle: &AppHandle) -> Result<(), String> {
    let themes_dir = ensure_themes_dir(app_handle)?;

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&themes_dir)
            .spawn()
            .map_err(|e| format!("Failed to open file explorer: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&themes_dir)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&themes_dir)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        let _ = themes_dir;
    }

    Ok(())
}

/// Fetch available themes from the remote repository.
pub async fn fetch_marketplace_themes(app_handle: &AppHandle) -> Result<Vec<RemoteTheme>, String> {
    let base_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;
    let cache_dir = base_dir.join("cache");
    let cache_file = cache_dir.join("marketplace_themes.json");

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap_or_default();

    let mut response_text = None;

    if let Ok(res) = client.get(GITHUB_THEMES_DEV_URL).send().await {
        if res.status().is_success() {
            response_text = res.text().await.ok();
        }
    }

    if response_text.is_none() {
        if let Ok(res) = client.get(GITHUB_THEMES_MAIN_URL).send().await {
            if res.status().is_success() {
                response_text = res.text().await.ok();
            }
        }
    }

    if let Some(text) = response_text {
        let _ = fs::create_dir_all(&cache_dir);
        let _ = fs::write(&cache_file, &text);

        let parsed: ThemeRegistryResponse = serde_json::from_str(&text)
            .map_err(|e| format!("Failed to parse themes registry response: {}", e))?;
        return Ok(parsed.themes);
    }

    if cache_file.exists() {
        if let Ok(cached_text) = fs::read_to_string(&cache_file) {
            if let Ok(parsed) = serde_json::from_str::<ThemeRegistryResponse>(&cached_text) {
                return Ok(parsed.themes);
            }
        }
    }

    Err("Failed to fetch themes from registry and no local cache was available".to_string())
}

/// Install a theme from the remote registry.
pub async fn install_remote_theme(
    app_handle: &AppHandle,
    theme_id: &str,
    raw_base_url: &str,
    entry_file: &str,
) -> Result<ThemeManifest, String> {
    validate_theme_id(theme_id)?;
    let themes_dir = ensure_themes_dir(app_handle)?;

    let base_url = if raw_base_url.ends_with('/') {
        raw_base_url.to_string()
    } else {
        format!("{}/", raw_base_url)
    };

    let manifest_url = format!("{}theme.json", base_url);
    let css_url = format!("{}{}", base_url, entry_file);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .unwrap_or_default();

    let manifest_res = client
        .get(&manifest_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download theme manifest: {}", e))?;

    if !manifest_res.status().is_success() {
        return Err(format!(
            "Failed to download theme.json: HTTP {}",
            manifest_res.status()
        ));
    }

    let manifest_text = manifest_res
        .text()
        .await
        .map_err(|e| format!("Failed to read theme manifest text: {}", e))?;

    let parsed_manifest: ThemeManifest = serde_json::from_str(&manifest_text)
        .map_err(|e| format!("Invalid theme manifest structure: {}", e))?;

    if parsed_manifest.id != theme_id {
        return Err(format!(
            "Theme ID mismatch in manifest: expected '{}', found '{}'",
            theme_id, parsed_manifest.id
        ));
    }

    let css_res = client
        .get(&css_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download theme stylesheet: {}", e))?;

    if !css_res.status().is_success() {
        return Err(format!(
            "Failed to download stylesheet '{}': HTTP {}",
            entry_file,
            css_res.status()
        ));
    }

    let css_text = css_res
        .text()
        .await
        .map_err(|e| format!("Failed to read theme CSS text: {}", e))?;

    let temp_dir_name = format!(".tmp_install_theme_{}", theme_id);
    let temp_dir = themes_dir.join(&temp_dir_name);
    let target_dir = themes_dir.join(theme_id);

    if temp_dir.exists() {
        let _ = fs::remove_dir_all(&temp_dir);
    }
    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temporary directory: {}", e))?;

    let temp_manifest_path = temp_dir.join("theme.json");
    let temp_css_path = temp_dir.join(entry_file);

    fs::write(&temp_manifest_path, &manifest_text)
        .map_err(|e| format!("Failed to write temporary theme manifest: {}", e))?;
    fs::write(&temp_css_path, &css_text)
        .map_err(|e| format!("Failed to write temporary theme stylesheet: {}", e))?;

    if target_dir.exists() {
        let _ = fs::remove_dir_all(&target_dir);
    }

    fs::rename(&temp_dir, &target_dir)
        .map_err(|e| format!("Failed to move installed theme into place: {}", e))?;

    Ok(parsed_manifest)
}

/// Uninstall (delete) an installed theme.
pub async fn uninstall_theme(app_handle: &AppHandle, theme_id: &str) -> Result<(), String> {
    validate_theme_id(theme_id)?;
    let themes_dir = ensure_themes_dir(app_handle)?;
    let target_dir = themes_dir.join(theme_id);

    if !target_dir.exists() {
        return Ok(());
    }

    fs::remove_dir_all(&target_dir).map_err(|e| format!("Failed to delete theme directory: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_theme_id() {
        assert!(validate_theme_id("dracula").is_ok());
        assert!(validate_theme_id("nord_blue").is_ok());
        assert!(validate_theme_id("catppuccin-macchiato").is_ok());

        assert!(validate_theme_id("").is_err());
        assert!(validate_theme_id("../evil").is_err());
        assert!(validate_theme_id("has spaces").is_err());
        assert!(validate_theme_id("theme/path").is_err());
    }

    #[test]
    fn test_scan_themes_dir_empty() {
        let temp_dir = std::env::temp_dir().join("Taleno_test_themes_empty_dir");
        let _ = fs::remove_dir_all(&temp_dir);
        let _ = fs::create_dir_all(&temp_dir);
        let list = scan_themes_dir(&temp_dir).unwrap();
        assert_eq!(list.len(), 0);
        let _ = fs::remove_dir_all(&temp_dir);
    }
}
