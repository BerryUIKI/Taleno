use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// Payload emitted to the frontend when a watched file changes.
#[derive(Clone, serde::Serialize)]
pub struct FileChangedPayload {
    pub path: String,
}

/// Start watching a file for external modifications.
/// Emits a "file-changed" event to the frontend when the file is modified.
pub fn watch_file(app_handle: AppHandle, file_path: String) -> Result<RecommendedWatcher, String> {
    let path = file_path.clone();

    let (tx, rx) = mpsc::channel::<Result<Event, notify::Error>>();

    let mut watcher = RecommendedWatcher::new(
        move |res| {
            let _ = tx.send(res);
        },
        Config::default().with_poll_interval(Duration::from_secs(2)),
    )
    .map_err(|e| format!("Failed to create file watcher: {}", e))?;

    watcher
        .watch(Path::new(&file_path), RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch file: {}", e))?;

    // Spawn a thread to process file change events
    std::thread::spawn(move || {
        while let Ok(event_result) = rx.recv() {
            if let Ok(event) = event_result {
                match event.kind {
                    EventKind::Modify(_) | EventKind::Create(_) => {
                        let _ = app_handle
                            .emit("file-changed", FileChangedPayload { path: path.clone() });
                    }
                    _ => {}
                }
            }
        }
    });

    Ok(watcher)
}
