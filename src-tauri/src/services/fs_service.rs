use crate::models::document::FileEntry;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;
use thiserror::Error;
use tokio::fs;

// Serialize Taleno writes/checks. External applications cannot participate in this lock.
static SAVE_LOCK: LazyLock<tokio::sync::Mutex<()>> = LazyLock::new(|| tokio::sync::Mutex::new(()));

#[derive(Error, Debug)]
pub enum FsError {
    #[error("Failed I/O operation: {0}")]
    IoError(#[from] std::io::Error),
    #[error("File or directory not found: {0}")]
    NotFound(String),
}

/// Read a file's contents as a UTF-8 string.
pub async fn read_file(path: &str) -> Result<String, FsError> {
    let p = Path::new(path);
    if !p.exists() {
        return Err(FsError::NotFound(path.to_string()));
    }
    let content = fs::read_to_string(p).await?;
    Ok(content)
}

/// Write content to a file using atomic write pattern:
/// 1. Write to a temporary file (.tmp)
/// 2. Rename the temp file to the target path
pub async fn write_file_atomic(path: &str, content: &str) -> Result<(), FsError> {
    let path = path.to_owned();
    let content = content.to_owned();
    tokio::task::spawn_blocking(move || atomic_replace(Path::new(&path), &content, || Ok(())))
        .await
        .map_err(std::io::Error::other)?
}

/// Staging is exclusively created in the same directory. Only our own temp is cleaned up.
fn atomic_replace(
    target: &Path,
    content: &str,
    before_replace: impl FnOnce() -> Result<(), FsError>,
) -> Result<(), FsError> {
    use std::io::Write;
    let parent = target
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or(Path::new("."));
    std::fs::create_dir_all(parent)?;
    let mut temp = tempfile::Builder::new()
        .prefix(".taleno-save-")
        .tempfile_in(parent)?;
    temp.write_all(content.as_bytes())?;
    temp.flush()?;
    temp.as_file().sync_all()?;
    before_replace()?;
    temp.persist(target).map_err(|e| e.error)?;
    // Directory fsync is supported on Unix; Windows replacement uses tempfile's native path.
    #[cfg(unix)]
    std::fs::File::open(parent)?.sync_all()?;
    Ok(())
}

pub async fn read_optional_file(path: &str) -> Result<Option<String>, FsError> {
    match fs::read_to_string(path).await {
        Ok(content) => Ok(Some(content)),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(err) => Err(err.into()),
    }
}

/// Compare the disk baseline both before staging and immediately before replacing.
/// A missing baseline means a new destination; it never authorizes overwriting an existing file.
pub async fn write_file_checked(
    path: &str,
    content: &str,
    expected: Option<&str>,
) -> Result<(), FsError> {
    let _guard = SAVE_LOCK.lock().await;
    let path = path.to_owned();
    let content = content.to_owned();
    let expected = expected.map(str::to_owned);
    tokio::task::spawn_blocking(move || {
        let check = || {
            let actual = match std::fs::read_to_string(&path) {
                Ok(value) => Some(value),
                Err(err) if err.kind() == std::io::ErrorKind::NotFound => None,
                Err(err) => return Err(FsError::IoError(err)),
            };
            if actual != expected {
                return Err(FsError::IoError(std::io::Error::other(
                    "SAVE_CONFLICT: disk content changed; Reload or Save As before retrying",
                )));
            }
            Ok(())
        };
        check()?;
        atomic_replace(Path::new(&path), &content, check)
    })
    .await
    .map_err(std::io::Error::other)?
}

const MAX_DIR_TREE_DEPTH: usize = 32;

/// Recursively read a directory tree, sorting directories first and filtering out hidden/build folders.
///
/// Enforces root containment, max depth bounds, and cycle prevention.
pub async fn read_dir_tree(path: &str) -> Result<FileEntry, FsError> {
    let root = Path::new(path);
    if !root.exists() {
        return Err(FsError::NotFound(path.to_string()));
    }

    let canonical_root = match fs::canonicalize(root).await {
        Ok(c) => c,
        Err(_) => return Err(FsError::NotFound(path.to_string())),
    };

    let mut visited_dirs = HashSet::new();
    visited_dirs.insert(canonical_root.clone());

    read_dir_tree_bounded(path, root, &canonical_root, &mut visited_dirs, 0).await
}

async fn read_dir_tree_bounded(
    display_path: &str,
    current_path: &Path,
    canonical_root: &Path,
    visited_dirs: &mut HashSet<PathBuf>,
    depth: usize,
) -> Result<FileEntry, FsError> {
    let name = current_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| display_path.to_string());

    let is_dir = current_path.is_dir();
    let mut entry = FileEntry {
        name,
        path: display_path.to_string(),
        is_directory: is_dir,
        children: if is_dir { Some(Vec::new()) } else { None },
    };

    if is_dir {
        if depth >= MAX_DIR_TREE_DEPTH {
            return Ok(entry);
        }

        let mut children = Vec::new();
        let mut read_dir = match fs::read_dir(current_path).await {
            Ok(rd) => rd,
            Err(_) => return Ok(entry),
        };

        while let Ok(Some(child)) = read_dir.next_entry().await {
            let child_path = child.path();
            let child_name = child.file_name().to_string_lossy().to_string();

            // Skip ignored directories & files
            if child_name.starts_with('.')
                || child_name == "node_modules"
                || child_name == "target"
                || child_name == "dist"
                || child_name == "build"
            {
                continue;
            }

            let child_path_str = child_path.to_string_lossy().to_string();
            if child_path.is_dir() {
                // Canonicalize to verify root containment and detect cycles
                let canonical_child = match fs::canonicalize(&child_path).await {
                    Ok(p) => p,
                    Err(_) => continue,
                };

                // Root containment: cannot escape declared workspace root
                if !canonical_child.starts_with(canonical_root) {
                    continue;
                }

                // Cycle prevention: cannot re-visit an already visited directory
                if !visited_dirs.insert(canonical_child.clone()) {
                    continue;
                }

                if let Ok(sub_tree) = Box::pin(read_dir_tree_bounded(
                    &child_path_str,
                    &child_path,
                    canonical_root,
                    visited_dirs,
                    depth + 1,
                ))
                .await
                {
                    children.push(sub_tree);
                }
            } else {
                // For files, if it's a symlink, verify it doesn't escape the workspace root
                if let Ok(file_type) = child.file_type().await {
                    if file_type.is_symlink() {
                        if let Ok(canonical_file) = fs::canonicalize(&child_path).await {
                            if !canonical_file.starts_with(canonical_root) {
                                continue;
                            }
                        } else {
                            continue;
                        }
                    }
                }

                children.push(FileEntry {
                    name: child_name,
                    path: child_path_str,
                    is_directory: false,
                    children: None,
                });
            }
        }

        // Sort: directories first, then alphabetical
        children.sort_by(|a, b| {
            if a.is_directory == b.is_directory {
                a.name.to_lowercase().cmp(&b.name.to_lowercase())
            } else if a.is_directory {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        });

        entry.children = Some(children);
    }

    Ok(entry)
}

/// The UI supplies the parent and a single filename separately; names cannot escape the parent.
pub async fn create_child(parent: &str, name: &str, is_dir: bool) -> Result<(), FsError> {
    if name.is_empty()
        || name == "."
        || name == ".."
        || name.contains(['/', '\\', ':', '\0'])
        || name.ends_with(['.', ' '])
    {
        return Err(FsError::IoError(std::io::Error::other(
            "Enter a single filename, without directories",
        )));
    }
    let parent = fs::canonicalize(parent).await?;
    let target = parent.join(name);
    if is_dir {
        fs::create_dir(&target).await?;
    } else {
        fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&target)
            .await?;
    }
    Ok(())
}

/// Delete a file or directory.
pub async fn delete_file_entry(path: &str) -> Result<(), FsError> {
    let p = Path::new(path);
    if !p.exists() {
        return Err(FsError::NotFound(path.to_string()));
    }
    if p.is_dir() {
        fs::remove_dir_all(p).await?;
    } else {
        fs::remove_file(p).await?;
    }
    Ok(())
}

/// Rename a file or directory.
pub async fn rename_file_entry(old_path: &str, new_path: &str) -> Result<(), FsError> {
    let old_p = Path::new(old_path);
    if !old_p.exists() {
        return Err(FsError::NotFound(old_path.to_string()));
    }
    fs::rename(old_p, Path::new(new_path)).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn refuses_collisions_and_filename_escapes() {
        let dir = tempfile::tempdir().unwrap();
        let parent = dir.path().to_str().unwrap();
        create_child(parent, "note.md", false).await.unwrap();
        let target = dir.path().join("note.md");
        fs::write(&target, "keep this").await.unwrap();
        assert!(create_child(parent, "note.md", false).await.is_err());
        for name in [
            "../outside.md",
            "a/b.md",
            "..\\outside.md",
            "C:other",
            "/root",
        ] {
            assert!(create_child(parent, name, false).await.is_err());
        }
        assert_eq!(fs::read_to_string(target).await.unwrap(), "keep this");
    }

    #[tokio::test]
    async fn unique_staging_preserves_siblings_under_concurrent_writers() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("note.md");
        let path = path.to_str().unwrap();
        fs::write(format!("{path}.tmp"), "unrelated").await.unwrap();
        let (a, b) = tokio::join!(write_file_atomic(path, "A"), write_file_atomic(path, "B"));
        a.unwrap();
        b.unwrap();
        assert!(["A", "B"].contains(&read_file(path).await.unwrap().as_str()));
        assert_eq!(
            read_file(&format!("{path}.tmp")).await.unwrap(),
            "unrelated"
        );
        assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 2);
    }

    #[tokio::test]
    async fn checked_save_rejects_modified_deleted_or_unread_baselines() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("note.md");
        let path = path.to_str().unwrap();
        write_file_checked(path, "base", None).await.unwrap();
        fs::write(path, "external").await.unwrap();
        assert!(
            write_file_checked(path, "local", Some("base"))
                .await
                .unwrap_err()
                .to_string()
                .contains("SAVE_CONFLICT")
        );
        assert!(write_file_checked(path, "local", None).await.is_err());
        assert_eq!(read_file(path).await.unwrap(), "external");
        // An explicit overwrite must capture a new baseline, rather than disable conflict checking.
        write_file_checked(path, "local", Some("external"))
            .await
            .unwrap();
        fs::remove_file(path).await.unwrap();
        assert!(
            write_file_checked(path, "local", Some("local"))
                .await
                .is_err()
        );
    }

    #[test]
    fn failed_commit_keeps_original_and_cleans_only_owned_temporary_file() {
        let dir = tempfile::tempdir().unwrap();
        let target = dir.path().join("note.md");
        std::fs::write(&target, "original").unwrap();
        let error = atomic_replace(&target, "new", || {
            Err(FsError::IoError(std::io::Error::other(
                "injected pre-rename failure",
            )))
        });
        assert!(error.is_err());
        assert_eq!(std::fs::read_to_string(&target).unwrap(), "original");
        assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 1);
        // A rename to an existing directory fails, keeping it intact and removing our stage.
        let directory = dir.path().join("directory");
        std::fs::create_dir(&directory).unwrap();
        assert!(atomic_replace(&directory, "new", || Ok(())).is_err());
        assert!(directory.is_dir());
        assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 2);
    }

    #[tokio::test]
    async fn test_atomic_write_and_read() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("Taleno_test_atomic.md");
        let test_path = test_file.to_string_lossy().to_string();

        let content = "# Hello Taleno Atomic Write";
        let res = write_file_atomic(&test_path, content).await;
        assert!(res.is_ok());

        let read_back = read_file(&test_path).await;
        assert!(read_back.is_ok());
        assert_eq!(read_back.unwrap(), content);

        let del_res = delete_file_entry(&test_path).await;
        assert!(del_res.is_ok());
    }

    #[tokio::test]
    async fn test_read_dir_tree() {
        let temp_dir = std::env::temp_dir().join("Taleno_test_tree");
        let temp_path = temp_dir.to_string_lossy().to_string();

        let _ = fs::create_dir_all(&temp_dir).await;
        let sub_file = temp_dir.join("test_note.md");
        let _ = write_file_atomic(&sub_file.to_string_lossy(), "content").await;

        let tree = read_dir_tree(&temp_path).await;
        assert!(tree.is_ok());
        let tree_res = tree.unwrap();
        assert!(tree_res.is_directory);
        assert!(tree_res.children.is_some());

        let _ = fs::remove_dir_all(&temp_dir).await;
    }

    fn create_test_dir_link(target: &Path, link: &Path) -> bool {
        #[cfg(windows)]
        {
            let output = std::process::Command::new("cmd")
                .args(["/C", "mklink", "/J"])
                .arg(link)
                .arg(target)
                .output();
            match output {
                Ok(out) => out.status.success(),
                Err(_) => false,
            }
        }
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(target, link).is_ok()
        }
    }

    #[tokio::test]
    async fn test_read_dir_tree_prevents_cycles() {
        let temp_dir = std::env::temp_dir().join("Taleno_test_tree_cycle");
        let _ = fs::create_dir_all(&temp_dir).await;

        let sub_dir = temp_dir.join("sub_folder");
        fs::create_dir_all(&sub_dir).await.unwrap();
        let _ = write_file_atomic(&sub_dir.join("note.md").to_string_lossy(), "content").await;

        let link_path = sub_dir.join("cycle_link");
        if create_test_dir_link(&temp_dir, &link_path) {
            let tree = read_dir_tree(&temp_dir.to_string_lossy()).await;
            assert!(tree.is_ok());
            let tree_res = tree.unwrap();
            assert!(tree_res.is_directory);

            #[cfg(windows)]
            let _ = std::process::Command::new("cmd")
                .args(["/C", "rmdir"])
                .arg(&link_path)
                .output();
            #[cfg(unix)]
            let _ = fs::remove_file(&link_path).await;
        }

        let _ = fs::remove_dir_all(&temp_dir).await;
    }

    #[tokio::test]
    async fn test_read_dir_tree_prevents_external_escape() {
        let temp_dir = std::env::temp_dir().join("Taleno_test_tree_containment");
        let outside_dir = std::env::temp_dir().join("Taleno_test_tree_outside");
        let _ = fs::create_dir_all(&temp_dir).await;
        let _ = fs::create_dir_all(&outside_dir).await;

        let _ =
            write_file_atomic(&outside_dir.join("outside.md").to_string_lossy(), "secret").await;

        let escape_link = temp_dir.join("escape_link");
        if create_test_dir_link(&outside_dir, &escape_link) {
            let tree = read_dir_tree(&temp_dir.to_string_lossy()).await;
            assert!(tree.is_ok());
            let tree_res = tree.unwrap();
            let children = tree_res.children.unwrap();
            for child in &children {
                if child.name == "escape_link" {
                    assert!(
                        child.children.is_none() || child.children.as_ref().unwrap().is_empty()
                    );
                }
            }

            #[cfg(windows)]
            let _ = std::process::Command::new("cmd")
                .args(["/C", "rmdir"])
                .arg(&escape_link)
                .output();
            #[cfg(unix)]
            let _ = fs::remove_file(&escape_link).await;
        }

        let _ = fs::remove_dir_all(&temp_dir).await;
        let _ = fs::remove_dir_all(&outside_dir).await;
    }
}
