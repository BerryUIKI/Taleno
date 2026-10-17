use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// Represents the currently active document.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveDocument {
    /// Absolute path on disk
    pub path: String,
    /// Raw markdown content
    pub content: String,
    /// Rendered HTML
    pub html: String,
    /// Table of contents extracted from headings
    pub toc: Vec<TocEntry>,
    /// Word count
    pub word_count: usize,
    /// Whether the file has been externally modified
    pub externally_modified: bool,
}

/// A single entry in the table of contents.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TocEntry {
    /// Heading level (1-6)
    pub level: u8,
    /// Heading text
    pub text: String,
    /// Anchor id for scrolling
    pub id: String,
}

/// Global application state managed by Tauri.
#[derive(Debug, Default)]
pub struct AppState {
    /// The currently active document (if any)
    pub active_document: Mutex<Option<ActiveDocument>>,
    /// The workspace root folder (if any)
    pub workspace_root: Mutex<Option<String>>,
}
