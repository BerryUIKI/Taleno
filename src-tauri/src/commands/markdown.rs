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
pub async fn render_markdown(
    markdown: String,
    doc_path: Option<String>,
    app: tauri::AppHandle,
    state: tauri::State<'_, crate::state::AppState>,
) -> Result<RenderResult, String> {
    if let Some(path) = doc_path.as_deref() {
        let known = state
            .disk_baselines
            .lock()
            .map_err(|e| e.to_string())?
            .contains_key(path);
        if known {
            let source = markdown.clone();
            let path = path.to_owned();
            tokio::task::spawn_blocking(move || {
                parser::grant_document_images(&app, &source, &path)
            })
            .await
            .map_err(|e| e.to_string())??;
        }
    }
    render_on_worker(markdown, doc_path).await
}

async fn render_on_worker(
    markdown: String,
    doc_path: Option<String>,
) -> Result<RenderResult, String> {
    tokio::task::spawn_blocking(move || RenderResult {
        html: parser::markdown_to_html_with_path(&markdown, doc_path.as_deref()),
        toc: parser::extract_toc(&markdown),
        word_count: parser::count_words(&markdown),
    })
    .await
    .map_err(|e| format!("Markdown rendering task failed: {e}"))
}

/// Resolve a Writing-mode image through the native document resource scope.
#[tauri::command]
pub async fn resolve_document_image(
    source: String,
    doc_path: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, crate::state::AppState>,
) -> Result<String, String> {
    use tauri::Manager;
    if !state
        .disk_baselines
        .lock()
        .map_err(|e| e.to_string())?
        .contains_key(&doc_path)
    {
        return Err("Image document has not been opened".into());
    }
    tokio::task::spawn_blocking(move || {
        let Some(target) = parser::resolve_document_image_path(&source, &doc_path)? else {
            return Ok(source);
        };
        app.asset_protocol_scope()
            .allow_file(&target)
            .map_err(|e| e.to_string())?;
        Ok(parser::to_asset_url(&target))
    })
    .await
    .map_err(|e| e.to_string())?
}

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
    presentation: Option<crate::services::export::HtmlPresentation>,
) -> Result<(), String> {
    crate::services::export::export_presentation(&markdown, &title, &output_path, presentation)
        .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test(flavor = "current_thread")]
    #[ignore = "manual responsiveness benchmark; run with --release --ignored --nocapture"]
    async fn worker_responsiveness_measurement() {
        use std::time::Instant;
        let markdown = "# Heading\n\nA paragraph with **formatting** and words.\n\n".repeat(2000);
        for offload in [false, true] {
            let started = Instant::now();
            let heartbeat = tokio::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_millis(1)).await;
                started.elapsed()
            });
            tokio::task::yield_now().await;
            for _ in 0..8 {
                if offload {
                    std::hint::black_box(render_on_worker(markdown.clone(), None).await.unwrap());
                } else {
                    std::hint::black_box(parser::markdown_to_html(&markdown));
                    std::hint::black_box(parser::extract_toc(&markdown));
                    std::hint::black_box(parser::count_words(&markdown));
                }
            }
            println!(
                "offload={offload}, render_total={:?}, one_ms_heartbeat_observed={:?}",
                started.elapsed(),
                heartbeat.await.unwrap()
            );
        }
    }

    #[tokio::test]
    async fn test_render_markdown_async() {
        let md = "# Title\n\nThis is a paragraph with **bold** text.\n\n## Subheading\n\n- item 1\n- item 2";
        let result = render_on_worker(md.to_string(), None).await;
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
