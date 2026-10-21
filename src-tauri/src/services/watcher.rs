use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

/// Payload emitted to the frontend when a watched file changes.
#[derive(Clone, serde::Serialize)]
pub struct FileChangedPayload {
    pub path: String,
}

/// Start watching a file for external modifications.
/// Emits a "file-changed" event to the frontend when the file is modified.
pub fn watch_file(app_handle: AppHandle, file_path: String) -> Result<RecommendedWatcher, String> {
    let baseline_path = file_path.clone();
    watch_document(file_path, move || {
        let state = app_handle.state::<crate::state::AppState>();
        // Events from our atomic rename can arrive before the save command publishes
        // its baseline. Wait for that publication before classifying the event.
        let _io = state.document_io.blocking_lock();
        let baseline = state
            .disk_baselines
            .lock()
            .ok()
            .and_then(|values| values.get(&baseline_path).cloned());
        if std::fs::read_to_string(&baseline_path).ok().as_ref() == baseline.as_ref() {
            return;
        }
        let _ = app_handle.emit(
            "file-changed",
            FileChangedPayload {
                path: baseline_path.clone(),
            },
        );
    })
}

/// Watch the parent, because atomic replacement removes the original file's watch target.
fn watch_document(
    file_path: String,
    on_change: impl Fn() + Send + 'static,
) -> Result<RecommendedWatcher, String> {
    let (tx, rx) = mpsc::channel::<Result<Event, notify::Error>>();
    let mut watcher = RecommendedWatcher::new(
        move |res| {
            let _ = tx.send(res);
        },
        Config::default().with_poll_interval(Duration::from_secs(2)),
    )
    .map_err(|err| err.to_string())?;
    watcher
        .watch(
            Path::new(&file_path).parent().ok_or("File has no parent")?,
            RecursiveMode::NonRecursive,
        )
        .map_err(|err| err.to_string())?;
    std::thread::spawn(move || {
        while let Ok(result) = rx.recv() {
            if let Ok(event) = result {
                if matches!(
                    event.kind,
                    EventKind::Modify(_) | EventKind::Create(_) | EventKind::Remove(_)
                ) && event.paths.iter().any(|path| path == Path::new(&file_path))
                {
                    on_change();
                }
            }
        }
    });
    Ok(watcher)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn watches_correct_path_after_multiple_atomic_replacements() {
        let root = tempfile::tempdir().unwrap();
        let target = root.path().join("note.md");
        std::fs::write(&target, "base").unwrap();
        let target = target.canonicalize().unwrap();
        let (tx, rx) = mpsc::channel();
        let watched = target.clone();
        let _watcher = watch_document(target.to_string_lossy().into_owned(), move || {
            if let Ok(content) = std::fs::read_to_string(&watched) {
                // Match watch_file's baseline filter. FSEvents can deliver the
                // target's pre-subscription creation after watch() returns; that
                // unchanged content must not count as an external modification.
                if content != "base" {
                    let _ = tx.send(content);
                }
            }
        })
        .unwrap();
        // Unrelated siblings never trigger this document's callback.
        std::fs::write(root.path().join("other.md"), "other").unwrap();
        assert!(rx.recv_timeout(Duration::from_millis(100)).is_err());
        for content in ["first replacement", "second replacement"] {
            use std::io::Write;
            let mut stage = tempfile::NamedTempFile::new_in(root.path()).unwrap();
            stage.write_all(content.as_bytes()).unwrap();
            stage.persist(&target).unwrap();
            let deadline = std::time::Instant::now() + Duration::from_secs(5);
            loop {
                let remaining = deadline.saturating_duration_since(std::time::Instant::now());
                let observed = rx
                    .recv_timeout(remaining)
                    .expect("watch survives atomic replacement");
                if observed == content {
                    break;
                }
            }
        }
    }
}
