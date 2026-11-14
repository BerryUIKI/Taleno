use std::sync::LazyLock;
use syntect::html::{ClassStyle, ClassedHTMLGenerator};
use syntect::parsing::SyntaxSet;
use syntect::util::LinesWithEndings;

/// Global immutable syntax registry loaded once and reused across all highlight requests.
static SYNTAX_SET: LazyLock<SyntaxSet> = LazyLock::new(SyntaxSet::load_defaults_newlines);

/// Highlight a code string for a given language and return styled HTML.
/// `None` means the language is unsupported or syntect failed to parse it.
pub fn highlight(code: &str, language: &str) -> Option<String> {
    let syntax = SYNTAX_SET.find_syntax_by_token(language)?;

    let class_style = ClassStyle::SpacedPrefixed { prefix: "syn-" };
    let mut generator =
        ClassedHTMLGenerator::new_with_class_style(syntax, &SYNTAX_SET, class_style);
    let mut normalized = code.to_string();
    if !normalized.ends_with('\n') {
        normalized.push('\n');
    }

    for line in LinesWithEndings::from(&normalized) {
        generator
            .parse_html_for_line_which_includes_newline(line)
            .ok()?;
    }

    let tokens = generator.finalize();
    let html = format!(r#"<pre><code class="syn-code">{tokens}</code></pre>"#);

    Some(html)
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
        assert!(result.is_some());
        let html = result.unwrap();
        assert!(html.contains("class=\"syn-code\""));
        assert!(html.contains("syn-"));
        assert!(!html.contains("style="));
    }

    #[test]
    fn test_unsupported_language() {
        let result = highlight("code", "nonexistent_lang_xyz");
        assert!(result.is_none());
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
                assert!(res.is_some(), "Failed for language {lang}");
                let html = res.unwrap();
                assert!(html.contains("syn-code"));
            }));
        }

        for handle in handles {
            handle.join().expect("Thread should not panic");
        }
    }

    #[test]
    #[ignore = "manual comparative benchmark; run with --release --ignored --nocapture"]
    fn test_highlight_performance_reuse() {
        // Warm up lazy lock
        let _ = highlight("let a = 1;", "rs");

        let baseline = Instant::now();
        for _ in 0..100 {
            let syntax = SyntaxSet::load_defaults_newlines();
            let definition = syntax.find_syntax_by_token("rs").unwrap();
            let mut generator = ClassedHTMLGenerator::new_with_class_style(
                definition,
                &syntax,
                ClassStyle::SpacedPrefixed { prefix: "syn-" },
            );
            generator
                .parse_html_for_line_which_includes_newline("fn calculate() -> i32 { 1 + 2 }\n")
                .unwrap();
            std::hint::black_box(generator.finalize());
        }
        let baseline = baseline.elapsed();
        let start = Instant::now();
        for _ in 0..100 {
            let res = highlight("fn calculate() -> i32 { 1 + 2 }", "rs");
            assert!(res.is_some());
        }
        let elapsed = start.elapsed();
        println!("100 identical small Rust blocks: uncached={baseline:?}, cached={elapsed:?}");
    }
}
