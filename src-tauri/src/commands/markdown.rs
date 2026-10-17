use crate::services::{highlighter, parser};
use crate::state::TocEntry;

/// Response from rendering markdown.
#[derive(serde::Serialize)]
pub struct RenderResult {
    pub html: String,
    pub toc: Vec<TocEntry>,
    pub word_count: usize,
}

/// Render Markdown string to HTML with TOC and word count.
#[tauri::command]
pub fn render_markdown(markdown: &str, doc_path: Option<&str>) -> RenderResult {
    RenderResult {
        html: parser::markdown_to_html_with_path(markdown, doc_path),
        toc: parser::extract_toc(markdown),
        word_count: parser::count_words(markdown),
    }
}

/// Highlight a code block and return styled HTML.
#[tauri::command]
pub fn highlight_code(code: &str, language: &str) -> Result<String, String> {
    highlighter::highlight(code, language).map_err(|e| e.to_string())
}

/// Export markdown to standalone HTML/PDF document.
#[tauri::command]
pub async fn export_document(
    markdown: String,
    title: String,
    output_path: String,
) -> Result<(), String> {
    crate::services::export::export_to_html(&markdown, &title, &output_path).await
}
