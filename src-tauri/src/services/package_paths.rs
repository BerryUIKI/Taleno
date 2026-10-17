//! Filesystem boundary shared by plugin/theme reads and installation.
use std::path::{Path, PathBuf};
use std::sync::Mutex;

static INSTALL_LOCK: Mutex<()> = Mutex::new(());

pub fn validate_entry(entry: &str) -> Result<(), String> {
    // Check Windows syntax even on Unix, so a catalog has the same meaning everywhere.
    if entry.is_empty()
        || entry.contains(['\\', ':', '\0'])
        || entry.split('/').any(|part| {
            part.is_empty() || part == "." || part == ".." || part.ends_with(['.', ' '])
        })
    {
        return Err(format!("Invalid relative package path: {entry}"));
    }
    if Path::new(entry).is_absolute() {
        return Err("Absolute entries are forbidden".into());
    }
    Ok(())
}

fn is_link(metadata: &std::fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        metadata.file_attributes() & 0x400 != 0 // Includes junctions and other reparse points.
    }
    #[cfg(not(windows))]
    {
        metadata.file_type().is_symlink()
    }
}

/// Reject links/reparse points at every component, including the package directory.
pub fn validate_root(root: &Path) -> Result<(), String> {
    if is_link(&std::fs::symlink_metadata(root).map_err(|e| e.to_string())?) {
        return Err("Linked package roots are forbidden".into());
    }
    Ok(())
}

pub fn contained(root: &Path, entry: &str) -> Result<PathBuf, String> {
    validate_entry(entry)?;
    validate_root(root)?;
    let root = root.canonicalize().map_err(|e| e.to_string())?;
    let mut path = root.clone();
    for part in entry.split('/') {
        path.push(part);
        match std::fs::symlink_metadata(&path) {
            Ok(metadata) if is_link(&metadata) => {
                return Err(format!(
                    "Linked package paths are forbidden: {}",
                    path.display()
                ));
            }
            Ok(_) => {}
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => {}
            Err(err) => return Err(err.to_string()),
        }
    }
    if path.exists()
        && !path
            .canonicalize()
            .map_err(|e| e.to_string())?
            .starts_with(&root)
    {
        return Err("Package path escapes its root".into());
    }
    Ok(path)
}

/// Stage completely before moving the previous installation; roll back on publication failure.
/// The lock covers both package types and protects concurrent Taleno installs, not hostile OS users.
pub fn install(
    root: &Path,
    id: &str,
    manifest_name: &str,
    manifest: &str,
    entry: &str,
    content: &str,
) -> Result<(), String> {
    validate_entry(entry)?;
    if entry == manifest_name {
        return Err("Entry cannot replace the manifest".into());
    }
    let _guard = INSTALL_LOCK.lock().map_err(|e| e.to_string())?;
    let target = contained(root, id)?;
    let stage = tempfile::Builder::new()
        .prefix(".taleno-install-")
        .tempdir_in(root)
        .map_err(|e| e.to_string())?;
    let file = contained(stage.path(), entry)?;
    std::fs::create_dir_all(file.parent().ok_or("Missing entry parent")?)
        .map_err(|e| e.to_string())?;
    std::fs::write(stage.path().join(manifest_name), manifest).map_err(|e| e.to_string())?;
    std::fs::write(file, content).map_err(|e| e.to_string())?;
    publish(root, stage.path(), &target)
}

fn publish(root: &Path, stage: &Path, target: &Path) -> Result<(), String> {
    let backup = tempfile::Builder::new()
        .prefix(".taleno-backup-")
        .tempdir_in(root)
        .map_err(|e| e.to_string())?;
    let previous = backup.path().join("previous");
    let existed = target.try_exists().map_err(|e| e.to_string())?;
    if existed {
        std::fs::rename(&target, &previous).map_err(|e| e.to_string())?;
    }
    if let Err(err) = std::fs::rename(stage, target) {
        if existed {
            if let Err(rollback) = std::fs::rename(&previous, &target) {
                let recovery = backup.keep();
                return Err(format!(
                    "Install failed: {err}; rollback failed: {rollback}. Previous installation preserved at {}",
                    recovery.display()
                ));
            }
        }
        return Err(err.to_string());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn failed_publication_restores_previous_installation() {
        let root = tempfile::tempdir().unwrap();
        install(
            root.path(),
            "sample",
            "manifest.json",
            "old",
            "main.js",
            "keep me",
        )
        .unwrap();
        let target = root.path().join("sample");
        assert!(publish(root.path(), &root.path().join("missing-stage"), &target).is_err());
        assert_eq!(
            std::fs::read_to_string(target.join("main.js")).unwrap(),
            "keep me"
        );
        assert_eq!(std::fs::read_dir(root.path()).unwrap().count(), 1);
    }

    #[test]
    fn rejects_platform_traversal_and_preserves_previous_install() {
        let dir = tempfile::tempdir().unwrap();
        install(
            dir.path(),
            "sample",
            "manifest.json",
            "old",
            "main.js",
            "old script",
        )
        .unwrap();
        for entry in [
            "../outside",
            "/absolute",
            "C:/escape",
            "a/../../escape",
            "a\\escape",
            "main.js:stream",
            "x/..",
            "",
        ] {
            assert!(install(dir.path(), "sample", "manifest.json", "new", entry, "bad").is_err());
        }
        assert_eq!(
            std::fs::read_to_string(dir.path().join("sample/main.js")).unwrap(),
            "old script"
        );
        install(
            dir.path(),
            "sample",
            "manifest.json",
            "new",
            "src/main.js",
            "new script",
        )
        .unwrap();
        assert_eq!(
            std::fs::read_to_string(dir.path().join("sample/src/main.js")).unwrap(),
            "new script"
        );
    }

    #[test]
    fn rejects_linked_package_directory() {
        let dir = tempfile::tempdir().unwrap();
        let outside = tempfile::tempdir().unwrap();
        let link = dir.path().join("escape");
        #[cfg(unix)]
        std::os::unix::fs::symlink(outside.path(), &link).unwrap();
        #[cfg(windows)]
        {
            // Junctions require no Developer Mode / symlink privilege on Windows.
            let status = std::process::Command::new("cmd")
                .args(["/C", "mklink", "/J"])
                .arg(&link)
                .arg(outside.path())
                .output()
                .unwrap();
            assert!(status.status.success());
        }
        assert!(contained(dir.path(), "escape/file.css").is_err());
        assert!(install(dir.path(), "escape", "theme.json", "{}", "theme.css", "bad").is_err());
        std::fs::remove_dir(&link)
            .or_else(|_| std::fs::remove_file(&link))
            .unwrap();
    }
}
