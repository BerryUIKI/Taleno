use std::sync::LazyLock;
use syntect::html::{ClassStyle, ClassedHTMLGenerator};
use syntect::parsing::SyntaxSet;
use syntect::util::LinesWithEndings;
use thiserror::Error;

/// Global immutable syntax registry loaded once and reused across all highlight requests.
static SYNTAX_SET: LazyLock<SyntaxSet> = LazyLock::new(SyntaxSet::load_defaults_newlines);

#[derive(Error, Debug)]
pub enum HighlightError {
    #[error("Unsupported language: {0}")]
    UnsupportedLanguage(String),
    #[error("Highlighting failed: {0}")]
    SyntectError(#[from] syntect::Error),
}

/// Highlight a code string for a given language and return styled HTML.
pub fn highlight(code: &str, language: &str) -> Result<String, HighlightError> {
    let syntax = SYNTAX_SET
        .find_syntax_by_token(language)
        .ok_or_else(|| HighlightError::UnsupportedLanguage(language.to_string()))?;

    let class_style = ClassStyle::SpacedPrefixed { prefix: "syn-" };
    let mut generator = ClassedHTMLGenerator::new_with_class_style(syntax, &SYNTAX_SET, class_style);
    let mut normalized = code.to_string();
    if !normalized.ends_with('\n') {
        normalized.push('\n');
    }

    for line in LinesWithEndings::from(&normalized) {
        generator.parse_html_for_line_which_includes_newline(line)?;
    }

    let tokens = generator.finalize();
    let html = format!(r#"<pre><code class="syn-code">{tokens}</code></pre>"#);

    Ok(html)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::thread;
    use std::time::Instant;

    #[test]
    fn test_highlight_rust() {
        let result = highlight("fn main() {}", "rs");
        assert!(result.is_ok());
        let html = result.unwrap();
        assert!(html.contains("class=\"syn-code\""));
        assert!(html.contains("syn-"));
        assert!(!html.contains("style="));
    }

    #[test]
    fn test_unsupported_language() {
        let result = highlight("code", "nonexistent_lang_xyz");
        assert!(result.is_err());
    }

    #[test]
    fn test_concurrent_highlight_calls() {
        let mut handles = Vec::new();
        let samples = Arc::new(vec![
            ("fn main() { println!(\"hello\"); }", "rs"),
            ("{\"key\": \"value\", \"count\": 42}", "json"),
            ("const x = () => { return 123; };", "js"),
            ("<div class=\"app\"><span>test</span></div>", "html"),
            ("# Heading\n\nSome **bold** text", "md"),
        ]);

        for i in 0..20 {
            let samples = Arc::clone(&samples);
            handles.push(thread::spawn(move || {
                let (code, lang) = samples[i % samples.len()];
                let res = highlight(code, lang);
                assert!(res.is_ok(), "Failed for language {lang}");
                let html = res.unwrap();
                assert!(html.contains("syn-code"));
            }));
        }

        for handle in handles {
            handle.join().expect("Thread should not panic");
        }
    }

    #[test]
    fn test_highlight_performance_reuse() {
        // Warm up lazy lock
        let _ = highlight("let a = 1;", "rs");

        let start = Instant::now();
        for _ in 0..100 {
            let res = highlight("fn calculate() -> i32 { 1 + 2 }", "rs");
            assert!(res.is_ok());
        }
        let elapsed = start.elapsed();
        println!("100 highlight operations took: {:?}", elapsed);
        // With cached SyntaxSet, 100 small highlights should complete in well under 200ms even in debug mode.
        assert!(
            elapsed.as_millis() < 500,
            "100 highlight calls took too long: {:?}",
            elapsed
        );
    }
}

