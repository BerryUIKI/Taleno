use crate::services::parser;
#[cfg(test)]
use tokio::fs;

/// Export markdown to a self-contained, standalone styled HTML document.
pub async fn export_to_html(markdown: &str, title: &str, output_path: &str) -> Result<(), String> {
    let body_html = parser::markdown_to_html(markdown);

    let full_html = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{}</title>
  <style>
    :root {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background: #ffffff;
    }}
    body {{
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }}
    h1, h2, h3, h4, h5, h6 {{
      color: #0f172a;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 700;
    }}
    h1 {{ font-size: 2.25rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }}
    h2 {{ font-size: 1.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }}
    h3 {{ font-size: 1.35rem; }}
    p, ul, ol, blockquote, table, pre {{
      margin-bottom: 1.25em;
    }}
    blockquote {{
      border-left: 4px solid #4361ee;
      padding-left: 1rem;
      color: #475569;
      font-style: italic;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }}
    th, td {{
      border: 1px solid #cbd5e1;
      padding: 0.5rem 0.75rem;
      text-align: left;
      background: transparent;
    }}
    th {{
      font-weight: 600;
    }}
    code {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
      background: #f1f5f9;
      padding: 0.2em 0.4em;
      border-radius: 4px;
    }}
    pre {{
      background: #0f172a;
      color: #f8fafc;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }}
    pre code {{
      background: transparent;
      padding: 0;
      color: inherit;
    }}
    .copy-code-btn {{ display: none; }}
    @media print {{
      body {{ max-width: 100%; padding: 0; }}
      pre {{ white-space: pre-wrap; }}
    }}
  </style>
</head>
<body>
  {}
</body>
</html>"#,
        title, body_html
    );

    crate::services::fs_service::write_file_atomic(output_path, &full_html)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_export_to_html() {
        let temp_dir = std::env::temp_dir();
        let target = temp_dir.join("Taleno_export_test.html");
        let path = target.to_string_lossy().to_string();

        let md = "# Export Title\n\nThis is a paragraph.";
        let res = export_to_html(md, "Export Title", &path).await;
        assert!(res.is_ok());

        let read_back = fs::read_to_string(&target).await;
        assert!(read_back.is_ok());
        let html_content = read_back.unwrap();
        assert!(html_content.contains("<!DOCTYPE html>"));
        assert!(html_content.contains("<title>Export Title</title>"));
        assert!(html_content.contains("<h1 id=\"export-title\">Export Title</h1>"));

        let _ = fs::remove_file(&target).await;
    }
}
