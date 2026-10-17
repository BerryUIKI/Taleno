use crate::services::highlighter;
use crate::state::TocEntry;
use pulldown_cmark::{CodeBlockKind, Event, HeadingLevel, Options, Parser, Tag, TagEnd, html};
use std::collections::HashMap;
use std::path::{Component, Path, PathBuf};

/// Convert a Markdown string to HTML with full GFM support, syntect code highlighting, math, mermaid diagrams, and anchor IDs for TOC.
pub fn markdown_to_html(markdown: &str) -> String {
    markdown_to_html_with_path(markdown, None)
}

/// Convert a Markdown string to HTML, resolving relative image URLs against the document path.
pub fn markdown_to_html_with_path(markdown: &str, doc_path: Option<&str>) -> String {
    let options = gfm_options();
    let parser = Parser::new_ext(markdown, options);

    let mut events = Vec::new();
    let mut in_code_block = false;
    let mut code_lang = String::new();
    let mut code_buffer = String::new();

    let mut in_heading = false;
    let mut current_heading_level: u8 = 1;
    let mut heading_text_buffer = String::new();
    let mut heading_events: Vec<Event<'static>> = Vec::new();
    let mut slug_counts: HashMap<String, usize> = HashMap::new();

    for event in parser {
        match event {
            Event::Start(Tag::CodeBlock(kind)) => {
                in_code_block = true;
                code_buffer.clear();
                code_lang = match kind {
                    CodeBlockKind::Fenced(lang) => lang.to_string(),
                    CodeBlockKind::Indented => String::new(),
                };
            }
            Event::Text(text) if in_code_block => {
                code_buffer.push_str(&text);
            }
            Event::End(TagEnd::CodeBlock) => {
                in_code_block = false;
                let lang = code_lang.trim();

                let code_html = if lang == "mermaid" {
                    format!(
                        r#"<div class="mermaid-diagram my-6 p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center overflow-x-auto select-none">
                            <pre class="mermaid text-sm">{}</pre>
                        </div>"#,
                        html_escape(&code_buffer)
                    )
                } else if lang == "math" || lang == "katex" {
                    format!(
                        r#"<div class="math math-display my-4 p-4 text-center overflow-x-auto text-base font-serif bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]" data-math="{}">$${}$$</div>"#,
                        html_escape(&code_buffer),
                        html_escape(&code_buffer)
                    )
                } else {
                    let highlighted = if !lang.is_empty() {
                        highlighter::highlight(&code_buffer, lang).ok()
                    } else {
                        None
                    };

                    let lang_display = if lang.is_empty() { "text" } else { lang };
                    let escaped_lang = html_escape(lang_display);
                    let escaped_code = html_escape(&code_buffer);

                    if let Some(highlighted_inner) = highlighted {
                        format!(
                            r#"<div class="code-block-wrapper relative group my-4 rounded-lg overflow-hidden border border-[var(--color-border)]">
                                <div class="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] font-mono select-none">
                                    <span class="uppercase font-semibold tracking-wider">{}</span>
                                    <button type="button" class="copy-code-btn px-2 py-0.5 rounded bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition-colors text-[11px]" data-action="copy-code" aria-label="Copy code">Copy</button>
                                </div>
                                <div class="code-container p-4 overflow-x-auto text-sm">{}</div>
                            </div>"#,
                            escaped_lang, highlighted_inner
                        )
                    } else {
                        format!(
                            r#"<div class="code-block-wrapper relative group my-4 rounded-lg overflow-hidden border border-[var(--color-border)]">
                                <div class="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] font-mono select-none">
                                    <span class="uppercase font-semibold tracking-wider">{}</span>
                                    <button type="button" class="copy-code-btn px-2 py-0.5 rounded bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition-colors text-[11px]" data-action="copy-code" aria-label="Copy code">Copy</button>
                                </div>
                                <pre class="p-4 overflow-x-auto text-sm"><code>{}</code></pre>
                            </div>"#,
                            escaped_lang, escaped_code
                        )
                    }
                };

                events.push(Event::Html(code_html.into()));
            }
            Event::InlineMath(math) => {
                let math_html = format!(
                    r#"<span class="math math-inline" data-math="{}">${}$</span>"#,
                    html_escape(&math),
                    html_escape(&math)
                );
                events.push(Event::Html(math_html.into()));
            }
            Event::DisplayMath(math) => {
                let math_html = format!(
                    r#"<div class="math math-display my-4 p-4 text-center overflow-x-auto text-base font-serif bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]" data-math="{}">$${}$$</div>"#,
                    html_escape(&math),
                    html_escape(&math)
                );
                events.push(Event::Html(math_html.into()));
            }
            Event::Start(Tag::Image {
                link_type,
                dest_url,
                title,
                id,
            }) => {
                let resolved_url = resolve_image_url(&dest_url, doc_path);
                events.push(Event::Start(Tag::Image {
                    link_type,
                    dest_url: resolved_url.into(),
                    title,
                    id,
                }));
            }
            Event::Start(Tag::Heading { level, .. }) => {
                in_heading = true;
                current_heading_level = heading_level_to_u8(level);
                heading_text_buffer.clear();
                heading_events.clear();
            }
            Event::End(TagEnd::Heading(_)) => {
                in_heading = false;
                let slug = generate_unique_slug(&heading_text_buffer, &mut slug_counts);
                let mut inner_html = String::new();
                html::push_html(&mut inner_html, heading_events.drain(..));
                let heading_html = format!(
                    r#"<h{} id="{}">{}</h{}>"#,
                    current_heading_level, slug, inner_html, current_heading_level
                );
                events.push(Event::Html(heading_html.into()));
            }
            event_item if in_heading => {
                match &event_item {
                    Event::Text(t) => heading_text_buffer.push_str(t),
                    Event::Code(c) => heading_text_buffer.push_str(c),
                    _ => {}
                }
                // Clone event to static for HTML rendering
                let static_ev = match event_item {
                    Event::Start(tag) => match tag {
                        Tag::Emphasis => Event::Start(Tag::Emphasis),
                        Tag::Strong => Event::Start(Tag::Strong),
                        Tag::Strikethrough => Event::Start(Tag::Strikethrough),
                        Tag::Link {
                            link_type,
                            dest_url,
                            title,
                            id,
                        } => Event::Start(Tag::Link {
                            link_type,
                            dest_url: dest_url.to_string().into(),
                            title: title.to_string().into(),
                            id: id.to_string().into(),
                        }),
                        Tag::Image {
                            link_type,
                            dest_url,
                            title,
                            id,
                        } => {
                            let resolved = resolve_image_url(&dest_url, doc_path);
                            Event::Start(Tag::Image {
                                link_type,
                                dest_url: resolved.into(),
                                title: title.to_string().into(),
                                id: id.to_string().into(),
                            })
                        }
                        _ => Event::Html("".into()),
                    },
                    Event::End(tag_end) => match tag_end {
                        TagEnd::Emphasis => Event::End(TagEnd::Emphasis),
                        TagEnd::Strong => Event::End(TagEnd::Strong),
                        TagEnd::Strikethrough => Event::End(TagEnd::Strikethrough),
                        TagEnd::Link => Event::End(TagEnd::Link),
                        TagEnd::Image => Event::End(TagEnd::Image),
                        _ => Event::Html("".into()),
                    },
                    Event::Text(t) => Event::Text(t.to_string().into()),
                    Event::Code(c) => Event::Code(c.to_string().into()),
                    Event::Html(h) => Event::Html(h.to_string().into()),
                    Event::InlineHtml(h) => Event::InlineHtml(h.to_string().into()),
                    _ => Event::Html("".into()),
                };
                heading_events.push(static_ev);
            }
            _ if !in_code_block => {
                events.push(event);
            }
            _ => {}
        }
    }

    let mut html_output = String::new();
    html::push_html(&mut html_output, events.into_iter());
    html_output
}

/// Simple HTML character escape helper.
pub fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

/// Extract table-of-contents entries from Markdown headings with unique occurrence-aware IDs.
pub fn extract_toc(markdown: &str) -> Vec<TocEntry> {
    let options = gfm_options();
    let parser = Parser::new_ext(markdown, options);

    let mut toc = Vec::new();
    let mut in_heading = false;
    let mut current_level: u8 = 0;
    let mut current_text = String::new();
    let mut slug_counts: HashMap<String, usize> = HashMap::new();

    for event in parser {
        match event {
            Event::Start(Tag::Heading { level, .. }) => {
                in_heading = true;
                current_level = heading_level_to_u8(level);
                current_text.clear();
            }
            Event::Text(text) if in_heading => {
                current_text.push_str(&text);
            }
            Event::Code(code) if in_heading => {
                current_text.push_str(&code);
            }
            Event::End(TagEnd::Heading(_)) => {
                in_heading = false;
                let id = generate_unique_slug(&current_text, &mut slug_counts);
                toc.push(TocEntry {
                    level: current_level,
                    text: current_text.clone(),
                    id,
                });
            }
            _ => {}
        }
    }

    toc
}

/// Count words in a markdown string (plain text, ignoring syntax).
pub fn count_words(markdown: &str) -> usize {
    let options = gfm_options();
    let parser = Parser::new_ext(markdown, options);
    let mut count = 0;

    for event in parser {
        if let Event::Text(text) = event {
            count += text.split_whitespace().count();
        }
    }

    count
}

/// Shared GFM parser options including math and standard extensions.
fn gfm_options() -> Options {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);
    options.insert(Options::ENABLE_MATH);
    options
}

/// Convert a heading level enum to a u8.
fn heading_level_to_u8(level: HeadingLevel) -> u8 {
    match level {
        HeadingLevel::H1 => 1,
        HeadingLevel::H2 => 2,
        HeadingLevel::H3 => 3,
        HeadingLevel::H4 => 4,
        HeadingLevel::H5 => 5,
        HeadingLevel::H6 => 6,
    }
}

/// Generate a unique URL-friendly slug, keeping counts of occurrences.
fn generate_unique_slug(text: &str, slug_counts: &mut HashMap<String, usize>) -> String {
    let base_slug = slugify(text);
    let count = slug_counts.entry(base_slug.clone()).or_insert(0);
    let unique = if *count == 0 {
        base_slug
    } else {
        format!("{}-{}", base_slug, count)
    };
    *count += 1;
    unique
}

/// Create a URL-friendly slug from heading text.
fn slugify(text: &str) -> String {
    let slug = text
        .to_lowercase()
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '-'
            }
        })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-");

    if slug.is_empty() {
        "heading".to_string()
    } else {
        slug
    }
}

/// Returns true if a URL is an absolute remote or special URI scheme.
pub fn is_remote_or_special_url(url: &str) -> bool {
    let u = url.trim();
    u.starts_with("http://")
        || u.starts_with("https://")
        || u.starts_with("ftp://")
        || u.starts_with("data:")
        || u.starts_with("blob:")
        || u.starts_with("asset:")
        || u.starts_with("tauri:")
        || u.starts_with("mailto:")
        || u.starts_with('#')
}

/// Resolve a relative image URL against the parent directory of `doc_path`.
pub fn resolve_image_url(url: &str, doc_path: Option<&str>) -> String {
    if is_remote_or_special_url(url) {
        return url.to_string();
    }

    let Some(doc_path_str) = doc_path else {
        return url.to_string();
    };

    let doc_file_path = Path::new(doc_path_str);
    let Some(parent_dir) = doc_file_path.parent() else {
        return url.to_string();
    };

    // Decode percent-encoded relative paths (e.g. %20 -> space)
    let decoded_path = percent_encoding::percent_decode_str(url).decode_utf8_lossy();
    let joined = parent_dir.join(decoded_path.as_ref());
    let normalized = normalize_path(&joined);

    to_asset_url(&normalized)
}

/// Normalize Path components resolving `.` and `..` without requiring the file to exist on disk.
pub fn normalize_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                normalized.pop();
            }
            c => normalized.push(c),
        }
    }
    normalized
}

/// Convert an absolute path to a WebView-safe asset protocol URL for the current OS.
pub fn to_asset_url(path: &Path) -> String {
    to_asset_url_for_os(path, cfg!(target_os = "windows"))
}

/// Convert an absolute path to an asset protocol URL for a specific OS target.
pub fn to_asset_url_for_os(path: &Path, is_windows: bool) -> String {
    let path_str = path.to_string_lossy().replace('\\', "/");
    let mut segments = Vec::new();
    for segment in path_str.split('/') {
        if segment.is_empty() {
            continue;
        }
        let encoded = percent_encoding::utf8_percent_encode(
            segment,
            percent_encoding::NON_ALPHANUMERIC,
        )
        .to_string();
        segments.push(encoded);
    }
    let encoded_path = segments.join("/");

    if is_windows {
        format!("https://asset.localhost/{}", encoded_path)
    } else {
        format!("asset://localhost/{}", encoded_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_heading() {
        let result = markdown_to_html("# Hello");
        assert!(result.contains("<h1"));
        assert!(result.contains("id=\"hello\""));
        assert!(result.contains("Hello"));
    }

    #[test]
    fn test_duplicate_headings_generate_unique_occurrence_ids() {
        let md = "# Notes\n\nSome text.\n\n# Notes\n\nMore text.\n\n# Notes";
        let html = markdown_to_html(md);
        assert!(html.contains("id=\"notes\""));
        assert!(html.contains("id=\"notes-1\""));
        assert!(html.contains("id=\"notes-2\""));

        let toc = extract_toc(md);
        assert_eq!(toc.len(), 3);
        assert_eq!(toc[0].id, "notes");
        assert_eq!(toc[1].id, "notes-1");
        assert_eq!(toc[2].id, "notes-2");
    }

    #[test]
    fn test_heading_with_formatting_generates_matching_slug() {
        let md = "## **Important** _Notice_ and `Code`";
        let html = markdown_to_html(md);
        assert!(html.contains("id=\"important-notice-and-code\""));

        let toc = extract_toc(md);
        assert_eq!(toc.len(), 1);
        assert_eq!(toc[0].id, "important-notice-and-code");
    }

    #[test]
    fn test_bold() {
        let result = markdown_to_html("**bold text**");
        assert!(result.contains("<strong>"));
    }

    #[test]
    fn test_raw_html_formatting_is_preserved() {
        let md = "<div class=\"callout\"><u>Underlined</u> and <mark>marked</mark></div>";
        let result = markdown_to_html(md);
        assert!(result.contains("<div class=\"callout\">"));
        assert!(result.contains("<u>Underlined</u>"));
        assert!(result.contains("<mark>marked</mark>"));
    }

    #[test]
    fn test_inline_html_in_heading_is_preserved() {
        let result = markdown_to_html("# Heading <span class=\"accent\">HTML</span>");
        assert!(result.contains("<span class=\"accent\">HTML</span>"));
    }

    #[test]
    fn test_gfm_table() {
        let md = "| A | B |\n|---|---|\n| 1 | 2 |";
        let result = markdown_to_html(md);
        assert!(result.contains("<table>"));
    }

    #[test]
    fn test_remote_image_url_is_preserved() {
        let result = markdown_to_html("![Remote image](https://images.example.com/photo.png)");
        assert!(result.contains("<img"));
        assert!(result.contains("https://images.example.com/photo.png"));
    }

    #[test]
    fn test_resolve_relative_image_against_doc_path() {
        let md = "![Diagram](./assets/arch.png)\n![Sub](figures/flow.png)";
        let doc_path = if cfg!(target_os = "windows") {
            "D:\\workspace\\project\\doc.md"
        } else {
            "/workspace/project/doc.md"
        };

        let result = markdown_to_html_with_path(md, Some(doc_path));
        assert!(result.contains("<img"));
        assert!(!result.contains("./assets/arch.png"));
        assert!(result.contains("project"));
        assert!(result.contains("assets"));
        assert!(result.contains("arch"));
    }

    #[test]
    fn test_resolve_relative_image_with_spaces_and_unicode() {
        let path = Path::new("/workspace/notes/图片/my chart.png");
        let asset_url_win = to_asset_url_for_os(path, true);
        assert!(asset_url_win.starts_with("https://asset.localhost/"));
        assert!(asset_url_win.contains("my%20chart"));

        let asset_url_unix = to_asset_url_for_os(path, false);
        assert!(asset_url_unix.starts_with("asset://localhost/"));
        assert!(asset_url_unix.contains("my%20chart"));
    }

    #[test]
    fn test_resolve_relative_image_parent_traversal() {
        let path = Path::new("/workspace/project/sub/../shared/logo.png");
        let normalized = normalize_path(path);
        let normalized_str = normalized.to_string_lossy().replace('\\', "/");
        assert_eq!(normalized_str, "/workspace/project/shared/logo.png");
    }

    #[test]
    fn test_task_list() {
        let md = "- [x] Done\n- [ ] Todo";
        let result = markdown_to_html(md);
        assert!(result.contains("checked") || result.contains("checkbox"));
    }

    #[test]
    fn test_mermaid_block() {
        let md = "```mermaid\ngraph TD;\nA-->B;\n```";
        let result = markdown_to_html(md);
        assert!(result.contains("mermaid-diagram"));
        assert!(result.contains("class=\"mermaid"));
    }

    #[test]
    fn test_highlighted_code_block() {
        let md = "```rust\nfn main() {}\n```";
        let result = markdown_to_html(md);
        assert!(result.contains("code-block-wrapper"));
        assert!(result.contains("copy-code-btn"));
        assert!(result.contains("data-action=\"copy-code\""));
        assert!(!result.contains("onclick="));
    }

    #[test]
    fn test_code_block_language_label_is_escaped() {
        let md = "```<script>alert(1)</script>\nhello\n```";
        let result = markdown_to_html(md);
        assert!(!result.contains("<script>alert(1)</script>"));
        assert!(result.contains("&lt;script&gt;alert(1)&lt;/script&gt;"));
    }

    #[test]
    fn test_math_syntax_rendering() {
        let md = "Inline: $E = mc^2$\n\nDisplay:\n$$\\int_0^1 x dx$$";
        let result = markdown_to_html(md);
        assert!(result.contains("math-inline"));
        assert!(result.contains("math-display"));
        assert!(result.contains("data-math=\"E = mc^2\"") || result.contains("data-math=\"E&#39; = mc^2\"") || result.contains("E = mc^2"));
    }

    #[test]
    fn test_fenced_math_block() {
        let md = "```math\nx + y = z\n```";
        let result = markdown_to_html(md);
        assert!(result.contains("math-display"));
        assert!(result.contains("x + y = z"));
    }

    #[test]
    fn test_extract_toc() {
        let md = "# Title\n## Section 1\n### Sub Section\n## Section 2";
        let toc = extract_toc(md);
        assert_eq!(toc.len(), 4);
        assert_eq!(toc[0].level, 1);
        assert_eq!(toc[0].text, "Title");
        assert_eq!(toc[1].level, 2);
        assert_eq!(toc[2].level, 3);
    }

    #[test]
    fn test_count_words() {
        let md = "Hello world, this is **bold** and `code`.";
        let count = count_words(md);
        assert!(count >= 6);
    }

    #[test]
    fn test_slugify() {
        assert_eq!(slugify("Hello World"), "hello-world");
        assert_eq!(slugify("Section 1.2: Details"), "section-1-2-details");
    }
}
