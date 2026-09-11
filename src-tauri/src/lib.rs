mod commands;
mod models;
mod services;
mod state;

use state::AppState;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

/// Holds the file watcher so it doesn't get dropped.
struct WatcherState {
    _watcher: Mutex<Option<notify::RecommendedWatcher>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
            let files: Vec<String> = args
                .into_iter()
                .skip(1)
                .filter(|arg| {
                    let p = std::path::Path::new(arg);
                    p.exists() && p.is_file()
                })
                .collect();
            if !files.is_empty() {
                let _ = app.emit("single-instance-open", files);
            }
        }));
    }

    builder
        .manage(AppState::default())
        .manage(WatcherState {
            _watcher: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::file::open_file,
            commands::file::save_file,
            commands::file::get_active_document,
            commands::file::list_directory_tree,
            commands::file::create_entry,
            commands::file::delete_entry,
            commands::file::rename_entry,
            commands::markdown::render_markdown,
            commands::markdown::highlight_code,
            commands::markdown::export_document,
            commands::search::search_workspace,
            commands::window::minimize_window,
            commands::window::toggle_maximize_window,
            commands::window::close_window,
            commands::window::is_window_maximized,
            commands::window::start_drag,
            commands::plugin::list_plugins,
            commands::plugin::open_plugins_folder,
            commands::plugin::read_plugin_source,
            commands::plugin::fetch_marketplace_plugins,
            commands::plugin::install_plugin,
            commands::plugin::uninstall_plugin,
            commands::plugin::update_plugin,
            commands::theme::list_themes,
            commands::theme::read_theme_css,
            commands::theme::open_themes_folder,
            commands::theme::fetch_marketplace_themes,
            commands::theme::install_theme,
            commands::theme::uninstall_theme,
            get_cli_args,
            start_watching_file,
            stop_watching_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Taleno");
}

/// Retrieve command line file arguments passed when opening files from Windows Explorer.
#[tauri::command]
fn get_cli_args() -> Vec<String> {
    std::env::args()
        .skip(1)
        .filter(|arg| {
            let p = std::path::Path::new(arg);
            p.exists() && p.is_file()
        })
        .collect()
}

/// Start watching a file for external changes.
#[tauri::command]
fn start_watching_file(
    app_handle: tauri::AppHandle,
    path: String,
    watcher_state: tauri::State<'_, WatcherState>,
) -> Result<(), String> {
    let watcher = services::watcher::watch_file(app_handle, path)?;
    if let Ok(mut w) = watcher_state._watcher.lock() {
        *w = Some(watcher);
    }
    Ok(())
}

/// Stop watching the current file.
#[tauri::command]
fn stop_watching_file(
    watcher_state: tauri::State<'_, WatcherState>,
) -> Result<(), String> {
    if let Ok(mut w) = watcher_state._watcher.lock() {
        *w = None;
    }
    Ok(())
}
