use crate::services::{highlighter, parser};
use crate::state::TocEntry;

/// Response from rendering markdown.
#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct RenderResult {
    pub html: String,
    pub toc: Vec<TocEntry>,
    pub word_count: usize,
}

/// Render Markdown string to HTML with TOC and word count offloaded to a blocking worker thread.
#[tauri::command]
pub async fn render_markdown(markdown: String) -> Result<RenderResult, String> {
    tokio::task::spawn_blocking(move || RenderResult {
        html: parser::markdown_to_html(&markdown),
        toc: parser::extract_toc(&markdown),
        word_count: parser::count_words(&markdown),
    })
    .await
    .map_err(|e| format!("Markdown rendering task failed: {e}"))
}

/// Highlight a code block and return styled HTML offloaded to a blocking worker thread.
#[tauri::command]
pub async fn highlight_code(code: String, language: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        highlighter::highlight(&code, &language).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| format!("Code highlighting task failed: {e}"))?
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

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_render_markdown_async() {
        let md = "# Title\n\nThis is a paragraph with **bold** text.\n\n## Subheading\n\n- item 1\n- item 2";
        let result = render_markdown(md.to_string()).await;
        assert!(result.is_ok());
        let res = result.unwrap();
        assert!(res.html.contains("<h1"));
        assert_eq!(res.toc.len(), 2);
        assert_eq!(res.toc[0].text, "Title");
        assert_eq!(res.toc[1].text, "Subheading");
        assert!(res.word_count > 0);
    }

    #[tokio::test]
    async fn test_highlight_code_async() {
        let code = "fn hello() -> &'static str { \"world\" }";
        let result = highlight_code(code.to_string(), "rs".to_string()).await;
        assert!(result.is_ok());
        let html = result.unwrap();
        assert!(html.contains("syn-code"));
    }

    #[tokio::test]
    async fn test_highlight_code_unsupported_error() {
        let result = highlight_code("echo 123".to_string(), "invalid_lang_xyz".to_string()).await;
        assert!(result.is_err());
    }
}

