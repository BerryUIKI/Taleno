use crate::services::{fs_service, parser};
use crate::state::{ActiveDocument, AppState};
use tauri::State;

/// Response returned when a file is successfully opened.
#[derive(serde::Serialize)]
pub struct OpenFileResponse {
    pub path: String,
    pub filename: String,
    pub content: String,
    pub html: String,
    pub toc: Vec<crate::state::TocEntry>,
    pub word_count: usize,
}

/// Open a file by path: read, parse, cache, and return full render data.
#[tauri::command]
pub async fn open_file(
    path: String,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<OpenFileResponse, String> {
    let _io = state.document_io.lock().await;
    let content = fs_service::read_file(&path)
        .await
        .map_err(|e| e.to_string())?;
    let path = tokio::fs::canonicalize(path)
        .await
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .into_owned();
    state
        .disk_baselines
        .lock()
        .map_err(|e| e.to_string())?
        .insert(path.clone(), content.clone());

    parser::grant_document_images(&app, &content, &path)?;
    let html = parser::markdown_to_html_with_path(&content, Some(&path));
    let toc = parser::extract_toc(&content);
    let word_count = parser::count_words(&content);

    let filename = std::path::Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    // Store active document in state
    if let Ok(mut doc) = state.active_document.lock() {
        *doc = Some(ActiveDocument {
            path: path.clone(),
            content: content.clone(),
            html: html.clone(),
            toc: toc.clone(),
            word_count,
            externally_modified: false,
        });
    }

    Ok(OpenFileResponse {
        path: path.clone(),
        filename,
        content: content.clone(),
        html: html.clone(),
        toc,
        word_count,
    })
}

/// Save content to a file using atomic write.
#[tauri::command]
pub async fn save_file(
    path: String,
    content: String,
    expected_content: Option<String>,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<OpenFileResponse, String> {
    let _io = state.document_io.lock().await;
    fs_service::write_file_checked(&path, &content, expected_content.as_deref())
        .await
        .map_err(|e| e.to_string())?;
    let path = tokio::fs::canonicalize(path)
        .await
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .into_owned();
    state
        .disk_baselines
        .lock()
        .map_err(|e| e.to_string())?
        .insert(path.clone(), content.clone());

    parser::grant_document_images(&app, &content, &path)?;
    let html = parser::markdown_to_html_with_path(&content, Some(&path));
    let toc = parser::extract_toc(&content);
    let word_count = parser::count_words(&content);
    let filename = std::path::Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    // Update cached state
    if let Ok(mut doc) = state.active_document.lock() {
        *doc = Some(ActiveDocument {
            path: path.clone(),
            content: content.clone(),
            html: html.clone(),
            toc: toc.clone(),
            word_count,
            externally_modified: false,
        });
    }

    Ok(OpenFileResponse {
        path,
        filename,
        content,
        html,
        toc,
        word_count,
    })
}

#[tauri::command]
pub async fn read_file_baseline(path: String) -> Result<Option<String>, String> {
    fs_service::read_optional_file(&path)
        .await
        .map_err(|err| err.to_string())
}

/// Get the current active document state.
#[tauri::command]
pub fn get_active_document(state: State<'_, AppState>) -> Result<Option<OpenFileResponse>, String> {
    let doc = state.active_document.lock().map_err(|e| e.to_string())?;
    Ok(doc.as_ref().map(|d| OpenFileResponse {
        path: d.path.clone(),
        filename: std::path::Path::new(&d.path)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "Unknown".to_string()),
        content: d.content.clone(),
        html: d.html.clone(),
        toc: d.toc.clone(),
        word_count: d.word_count,
    }))
}

/// Recursively list a workspace directory tree.
#[tauri::command]
pub async fn list_directory_tree(
    path: String,
    state: State<'_, AppState>,
) -> Result<crate::models::document::FileEntry, String> {
    let tree = fs_service::read_dir_tree(&path)
        .await
        .map_err(|e| e.to_string())?;

    if let Ok(mut ws) = state.workspace_root.lock() {
        *ws = Some(path);
    }

    Ok(tree)
}

/// Create a new file or directory in workspace.
#[tauri::command]
pub async fn create_entry(
    parent_path: String,
    name: String,
    is_directory: bool,
) -> Result<(), String> {
    fs_service::create_child(&parent_path, &name, is_directory)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a file or directory.
#[tauri::command]
pub async fn delete_entry(path: String) -> Result<(), String> {
    fs_service::delete_file_entry(&path)
        .await
        .map_err(|e| e.to_string())
}

/// Rename a file or directory.
#[tauri::command]
pub async fn rename_entry(old_path: String, new_path: String) -> Result<(), String> {
    fs_service::rename_file_entry(&old_path, &new_path)
        .await
        .map_err(|e| e.to_string())
}
