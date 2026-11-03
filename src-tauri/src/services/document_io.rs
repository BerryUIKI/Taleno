use crate::services::document_location::DocumentLocation;
use crate::services::fs_service::{self, FsError};
use std::io::Write;
use tauri::AppHandle;
use tauri_plugin_fs::{FilePath, FsExt, OpenOptions};

/// Errors from reading or writing a document, whichever backend serves it.
#[derive(Debug, thiserror::Error)]
pub enum DocumentError {
    #[error("{0}")]
    Filesystem(#[from] FsError),
    #[error("Not a provider document URI: {0}")]
    NotAProviderUri(String),
    #[error("Failed I/O operation: {0}")]
    Io(#[from] std::io::Error),
}

/// Read a document from either the filesystem or a platform provider.
pub async fn read_document(
    app: &AppHandle,
    location: &DocumentLocation,
) -> Result<String, DocumentError> {
    match location {
        DocumentLocation::Path(path) => fs_service::read_file(&path.to_string_lossy())
            .await
            .map_err(DocumentError::from),
        DocumentLocation::Uri(uri) => {
            let app = app.clone();
            let uri = uri.clone();
            blocking(move || read_provider_document(&app, &uri)).await
        }
    }
}

/// Read the conflict baseline, or `None` when the destination does not exist yet.
pub async fn read_baseline(
    app: &AppHandle,
    location: &DocumentLocation,
) -> Result<Option<String>, DocumentError> {
    match location {
        DocumentLocation::Path(path) => fs_service::read_optional_file(&path.to_string_lossy())
            .await
            .map_err(DocumentError::from),
        DocumentLocation::Uri(uri) => {
            let app = app.clone();
            let uri = uri.clone();
            blocking(move || read_provider_baseline(&app, &uri)).await
        }
    }
}

/// Write a document.
///
/// Filesystem destinations keep the atomic tempfile-and-rename contract. Provider
/// documents cannot be replaced by rename: the provider owns the destination, and
/// a write is only as durable as the descriptor it hands back, so provider saves
/// truncate and rewrite the document in place after the same baseline check.
pub async fn write_document(
    app: &AppHandle,
    location: &DocumentLocation,
    content: &str,
    expected: Option<&str>,
) -> Result<(), DocumentError> {
    match location {
        DocumentLocation::Path(path) => {
            fs_service::write_file_checked(&path.to_string_lossy(), content, expected)
                .await
                .map_err(DocumentError::from)
        }
        DocumentLocation::Uri(uri) => {
            let app = app.clone();
            let uri = uri.clone();
            let content = content.to_owned();
            let expected = expected.map(str::to_owned);
            blocking(move || write_provider_document(&app, &uri, &content, expected.as_deref()))
                .await
        }
    }
}

async fn blocking<T, F>(work: F) -> Result<T, DocumentError>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, DocumentError> + Send + 'static,
{
    tokio::task::spawn_blocking(work)
        .await
        .map_err(|err| DocumentError::Io(std::io::Error::other(err)))?
}

/// Parses a provider URI and rejects plain paths, so a caller can never hand a
/// filesystem path to the provider API by accident.
fn provider_file_path(uri: &str) -> Result<FilePath, DocumentError> {
    match uri.parse::<FilePath>() {
        Ok(file_path @ FilePath::Url(_)) => Ok(file_path),
        _ => Err(DocumentError::NotAProviderUri(uri.to_string())),
    }
}

fn read_provider_document(app: &AppHandle, uri: &str) -> Result<String, DocumentError> {
    let file_path = provider_file_path(uri)?;
    let content = app.fs().read_to_string(file_path.clone())?;
    release_provider_access(app, &file_path);
    Ok(content)
}

fn read_provider_baseline(app: &AppHandle, uri: &str) -> Result<Option<String>, DocumentError> {
    let file_path = provider_file_path(uri)?;
    let result = match app.fs().read_to_string(file_path.clone()) {
        Ok(content) => Ok(Some(content)),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(err) => Err(err.into()),
    };
    release_provider_access(app, &file_path);
    result
}

fn write_provider_document(
    app: &AppHandle,
    uri: &str,
    content: &str,
    expected: Option<&str>,
) -> Result<(), DocumentError> {
    let file_path = provider_file_path(uri)?;
    let actual = match app.fs().read_to_string(file_path.clone()) {
        Ok(value) => Some(value),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => None,
        Err(err) => return Err(err.into()),
    };
    if actual.as_deref() != expected {
        return Err(DocumentError::Io(std::io::Error::other(
            "SAVE_CONFLICT: disk content changed; Reload or Save As before retrying",
        )));
    }
    // The provider created the document when the picker returned its URI; writing
    // truncates it. There is no rename step to make this atomic.
    let mut options = OpenOptions::new();
    options.write(true).truncate(true).create(true);
    let mut file = app.fs().open(file_path.clone(), options)?;
    file.write_all(content.as_bytes())?;
    file.flush()?;
    file.sync_all()?;
    release_provider_access(app, &file_path);
    Ok(())
}

/// iOS grants access to a security-scoped URL until the app relinquishes it.
/// Other platforms have no equivalent handle to release.
#[cfg(target_os = "ios")]
fn release_provider_access(app: &AppHandle, file_path: &FilePath) {
    let _ = app
        .fs()
        .stop_accessing_security_scoped_resource(file_path.clone());
}

#[cfg(not(target_os = "ios"))]
fn release_provider_access(_app: &AppHandle, _file_path: &FilePath) {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn provider_paths_accept_document_uris_only() {
        assert!(matches!(
            provider_file_path(
                "content://com.android.externalstorage.documents/document/primary%3ANotes%2Fa.md"
            ),
            Ok(FilePath::Url(_))
        ));
        assert!(matches!(
            provider_file_path("file:///Users/u/a.md"),
            Ok(FilePath::Url(_))
        ));
    }

    #[test]
    fn provider_paths_reject_filesystem_paths() {
        assert!(matches!(
            provider_file_path("/home/u/a.md"),
            Err(DocumentError::NotAProviderUri(_))
        ));
        assert!(matches!(
            provider_file_path(r"C:\notes\a.md"),
            Err(DocumentError::NotAProviderUri(_))
        ));
        assert!(matches!(
            provider_file_path("notes/a.md"),
            Err(DocumentError::NotAProviderUri(_))
        ));
    }
}
