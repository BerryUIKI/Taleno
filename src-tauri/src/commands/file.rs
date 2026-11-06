use crate::models::document::FileEntry;
use crate::services::document_location::DocumentLocation;
use crate::services::{document_io, fs_service, parser};
use crate::state::{AppState, TocEntry};
use tauri::State;

/// Response returned when a document is opened or saved.
#[derive(serde::Serialize)]
pub struct OpenFileResponse {
    pub path: String,
    pub filename: String,
    pub content: String,
    pub html: String,
    pub toc: Vec<TocEntry>,
    pub word_count: usize,
}

/// Resolve a filesystem path once; provider URIs stay opaque.
async fn canonical_path(location: &DocumentLocation, raw_path: String) -> Result<String, String> {
    match location.as_path() {
        Some(path) => tokio::fs::canonicalize(path)
            .await
            .map(|path| path.to_string_lossy().into_owned())
            .map_err(|e| e.to_string()),
        None => Ok(raw_path),
    }
}

/// Publish a document snapshot after a successful read or write: record the
/// conflict baseline, grant local image access, and render the response.
async fn document_response(
    app: &tauri::AppHandle,
    state: &AppState,
    location: &DocumentLocation,
    raw_path: String,
    content: String,
) -> Result<OpenFileResponse, String> {
    let path = canonical_path(location, raw_path).await?;
    state
        .disk_baselines
        .lock()
        .map_err(|e| e.to_string())?
        .insert(path.clone(), content.clone());

    // Relative images resolve against a filesystem directory; provider documents
    // have no such directory, so their images are left to the document itself.
    let base_path = (!location.is_uri()).then_some(path.as_str());
    if let Some(base) = base_path {
        parser::grant_document_images(app, &content, base)?;
    }

    let filename = location
        .display_name()
        .unwrap_or_else(|| "Unknown".to_string());
    let html = parser::markdown_to_html_with_path(&content, base_path);
    let toc = parser::extract_toc(&content);
    let word_count = parser::count_words(&content);

    Ok(OpenFileResponse {
        path,
        filename,
        content,
        html,
        toc,
        word_count,
    })
}

/// Open a file by path: read, parse, and return full render data.
#[tauri::command]
pub async fn open_file(
    path: String,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<OpenFileResponse, String> {
    let location = DocumentLocation::parse(&path);
    let _io = state.document_io.lock().await;
    let content = document_io::read_document(&app, &location)
        .await
        .map_err(|e| e.to_string())?;
    document_response(&app, state.inner(), &location, path, content).await
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
    let location = DocumentLocation::parse(&path);
    let _io = state.document_io.lock().await;
    document_io::write_document(&app, &location, &content, expected_content.as_deref())
        .await
        .map_err(|e| e.to_string())?;
    document_response(&app, state.inner(), &location, path, content).await
}

#[tauri::command]
pub async fn read_file_baseline(
    path: String,
    app: tauri::AppHandle,
) -> Result<Option<String>, String> {
    let location = DocumentLocation::parse(&path);
    document_io::read_baseline(&app, &location)
        .await
        .map_err(|err| err.to_string())
}

/// Recursively list a workspace directory tree.
#[tauri::command]
pub async fn list_directory_tree(path: String) -> Result<FileEntry, String> {
    fs_service::read_dir_tree(&path)
        .await
        .map_err(|e| e.to_string())
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
