//! Workspace search service providing bounded, full-text Markdown search.
//!
//! # Link Policy & Root Containment
//! 1. **Root Containment**: All filesystem traversals must strictly reside within
//!    the canonicalized workspace root. Any symlink, junction, or reparse point whose
//!    canonical target resolves outside the declared root is skipped.
//! 2. **Cycle Prevention**: Visited directories are tracked by their canonical paths
//!    (`HashSet<PathBuf>`). If a directory or link points to an already-visited path,
//!    it is treated as a link cycle and skipped immediately.
//! 3. **Traversal Bounds**:
//!    - Depth bound: Recursion depth is capped (default: 32).
//!    - Result limit: Traversal and file scanning terminates globally as soon as
//!      `max_matches` (default: 100) is reached.
//!    - File size bound: Files exceeding 10 MB are skipped to prevent memory exhaustion.
//! 4. **Cancellation**: Cooperative cancellation is supported via an optional `AtomicBool` token.
//! 5. **Fault Tolerance**: Unreadable directories (e.g. permission denied) do not abort
//!    the overall search; sibling directories and remaining files continue to be processed.

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tokio::fs;

pub const DEFAULT_MAX_MATCHES: usize = 100;
pub const DEFAULT_MAX_DEPTH: usize = 32;
pub const MAX_SEARCH_FILE_SIZE: u64 = 10 * 1024 * 1024; // 10 MB per file limit

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SearchMatch {
    pub file_path: String,
    pub file_name: String,
    pub line_number: usize,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct WorkspaceSearchResult {
    pub matches: Vec<SearchMatch>,
    pub truncated: bool,
}

#[derive(Debug, Clone)]
pub struct SearchOptions {
    pub max_matches: usize,
    pub max_depth: usize,
    pub cancellation_token: Option<Arc<AtomicBool>>,
}

impl Default for SearchOptions {
    fn default() -> Self {
        Self {
            max_matches: DEFAULT_MAX_MATCHES,
            max_depth: DEFAULT_MAX_DEPTH,
            cancellation_token: None,
        }
    }
}

/// Strip Windows verbatim extended-length prefix (\\?\) for consistent cross-platform paths.
pub fn normalize_path(path: &Path) -> String {
    let s = path.to_string_lossy().to_string();
    if let Some(stripped) = s.strip_prefix(r"\\?\") {
        stripped.to_string()
    } else {
        s
    }
}

/// Full-text search across all markdown/text files in workspace using default bounds.
pub async fn search_workspace(
    query: &str,
    root_path: &str,
) -> Result<WorkspaceSearchResult, String> {
    search_workspace_with_options(query, root_path, SearchOptions::default()).await
}

/// Full-text search across all markdown/text files in workspace with configurable bounds.
pub async fn search_workspace_with_options(
    query: &str,
    root_path: &str,
    options: SearchOptions,
) -> Result<WorkspaceSearchResult, String> {
    if query.trim().is_empty() {
        return Ok(WorkspaceSearchResult::default());
    }

    let root = Path::new(root_path);
    if !root.exists() {
        return Ok(WorkspaceSearchResult::default());
    }

    let canonical_root = match fs::canonicalize(root).await {
        Ok(p) => p,
        Err(err) => return Err(format!("Failed to canonicalize workspace root: {err}")),
    };

    let mut visited_dirs = HashSet::new();
    visited_dirs.insert(canonical_root.clone());

    let mut matches = Vec::new();
    let q_lower = query.to_lowercase();
    let mut truncated = false;

    search_dir_recursive(
        &canonical_root,
        &canonical_root,
        &q_lower,
        query,
        &mut matches,
        &mut visited_dirs,
        0,
        &options,
        &mut truncated,
    )
    .await?;

    Ok(WorkspaceSearchResult { matches, truncated })
}

#[allow(clippy::too_many_arguments)]
async fn search_dir_recursive(
    dir: &Path,
    canonical_root: &Path,
    q_lower: &str,
    original_q: &str,
    matches: &mut Vec<SearchMatch>,
    visited_dirs: &mut HashSet<PathBuf>,
    depth: usize,
    options: &SearchOptions,
    truncated: &mut bool,
) -> Result<(), String> {
    // 1. Check global match cap & cancellation
    if matches.len() >= options.max_matches {
        *truncated = true;
        return Ok(());
    }
    if let Some(ref token) = options.cancellation_token {
        if token.load(Ordering::Relaxed) {
            return Ok(());
        }
    }
    // 2. Check max depth bound
    if depth >= options.max_depth {
        return Ok(());
    }

    // 3. Gracefully open directory (ignore unreadable / permission denied)
    let mut read_dir = match fs::read_dir(dir).await {
        Ok(rd) => rd,
        Err(_) => return Ok(()),
    };

    // Collect and sort entries for deterministic traversal order
    let mut entries = Vec::new();
    while let Ok(Some(entry)) = read_dir.next_entry().await {
        entries.push(entry);
    }
    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        // Stop scanning immediately when cap is reached or cancelled
        if matches.len() >= options.max_matches {
            *truncated = true;
            return Ok(());
        }
        if let Some(ref token) = options.cancellation_token {
            if token.load(Ordering::Relaxed) {
                return Ok(());
            }
        }

        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip ignored directories & files
        if name.starts_with('.')
            || name == "node_modules"
            || name == "target"
            || name == "dist"
            || name == "build"
        {
            continue;
        }

        let file_type = match entry.file_type().await {
            Ok(ft) => ft,
            Err(_) => continue,
        };

        if file_type.is_dir() || file_type.is_symlink() {
            let meta = match fs::metadata(&entry_path).await {
                Ok(m) => m,
                Err(_) => continue,
            };

            if meta.is_dir() {
                let canonical_target = match fs::canonicalize(&entry_path).await {
                    Ok(p) => p,
                    Err(_) => continue,
                };

                // Root containment: must stay inside the declared workspace root
                if !canonical_target.starts_with(canonical_root) {
                    continue;
                }

                // Cycle prevention: do not re-visit previously visited directories
                if !visited_dirs.insert(canonical_target.clone()) {
                    continue;
                }

                // Recurse into subdirectory
                Box::pin(search_dir_recursive(
                    &canonical_target,
                    canonical_root,
                    q_lower,
                    original_q,
                    matches,
                    visited_dirs,
                    depth + 1,
                    options,
                    truncated,
                ))
                .await?;

                if matches.len() >= options.max_matches {
                    *truncated = true;
                    return Ok(());
                }
            } else if meta.is_file() {
                process_file(
                    &entry_path,
                    &name,
                    canonical_root,
                    q_lower,
                    original_q,
                    matches,
                    options,
                    truncated,
                )
                .await?;
            }
        } else if file_type.is_file() {
            process_file(
                &entry_path,
                &name,
                canonical_root,
                q_lower,
                original_q,
                matches,
                options,
                truncated,
            )
            .await?;
        }
    }

    Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn process_file(
    path: &Path,
    name: &str,
    canonical_root: &Path,
    q_lower: &str,
    original_q: &str,
    matches: &mut Vec<SearchMatch>,
    options: &SearchOptions,
    truncated: &mut bool,
) -> Result<(), String> {
    if matches.len() >= options.max_matches {
        *truncated = true;
        return Ok(());
    }

    // Only search Markdown and plain text files
    if !(name.ends_with(".md") || name.ends_with(".markdown") || name.ends_with(".txt")) {
        return Ok(());
    }

    // Symlink containment check for file symlinks:
    // Ensure the resolved canonical path is within canonical_root
    if let Ok(canonical_file) = fs::canonicalize(path).await {
        if !canonical_file.starts_with(canonical_root) {
            return Ok(());
        }
    } else {
        return Ok(());
    }

    // Size limit check
    if let Ok(meta) = fs::metadata(path).await {
        if meta.len() > MAX_SEARCH_FILE_SIZE {
            return Ok(());
        }
    }

    // Read content and search line by line
    if let Ok(content) = fs::read_to_string(path).await {
        let display_path = normalize_path(path);
        for (idx, line) in content.lines().enumerate() {
            let line_lower = line.to_lowercase();
            if let Some(pos) = line_lower.find(q_lower) {
                matches.push(SearchMatch {
                    file_path: display_path.clone(),
                    file_name: name.to_string(),
                    line_number: idx + 1,
                    line_content: line.to_string(),
                    match_start: pos,
                    match_end: pos + original_q.len(),
                });
                if matches.len() >= options.max_matches {
                    *truncated = true;
                    return Ok(());
                }
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_dir_link(target: &Path, link: &Path) -> bool {
        #[cfg(windows)]
        {
            let output = std::process::Command::new("cmd")
                .args(["/C", "mklink", "/J"])
                .arg(link)
                .arg(target)
                .output();
            match output {
                Ok(out) => out.status.success(),
                Err(_) => false,
            }
        }
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(target, link).is_ok()
        }
    }

    #[tokio::test]
    async fn test_workspace_search_basic() {
        let temp_dir = std::env::temp_dir().join("Taleno_search_service_test_basic");
        let _ = fs::create_dir_all(&temp_dir).await;

        let file1 = temp_dir.join("note1.md");
        fs::write(
            &file1,
            "# First Document\nContains unique_keyword_xyz inside.\nSecond line.",
        )
        .await
        .unwrap();

        let res = search_workspace("unique_keyword_xyz", &temp_dir.to_string_lossy())
            .await
            .unwrap();

        assert_eq!(res.matches.len(), 1);
        assert!(!res.truncated);
        assert_eq!(res.matches[0].line_number, 2);
        assert_eq!(res.matches[0].file_name, "note1.md");
        assert_eq!(
            res.matches[0].line_content,
            "Contains unique_keyword_xyz inside."
        );
        assert_eq!(res.matches[0].match_start, 9);
        assert_eq!(res.matches[0].match_end, 9 + "unique_keyword_xyz".len());

        let _ = fs::remove_dir_all(&temp_dir).await;
    }

    #[tokio::test]
    async fn test_workspace_search_enforces_global_cap_across_siblings() {
        let temp_dir = std::env::temp_dir().join("Taleno_search_service_test_cap");
        let _ = fs::create_dir_all(&temp_dir).await;

        // Create 3 sibling directories, each with 60 matches (total 180 matches)
        for dir_idx in 1..=3 {
            let sub_dir = temp_dir.join(format!("sub_{dir_idx}"));
            fs::create_dir_all(&sub_dir).await.unwrap();
            let mut file_content = String::new();
            for line_idx in 1..=60 {
                file_content.push_str(&format!("Match line {line_idx} target_word\n"));
            }
            fs::write(sub_dir.join("doc.md"), &file_content)
                .await
                .unwrap();
        }

        let res = search_workspace("target_word", &temp_dir.to_string_lossy())
            .await
            .unwrap();

        // Must be capped exactly at DEFAULT_MAX_MATCHES (100) and marked truncated
        assert_eq!(res.matches.len(), DEFAULT_MAX_MATCHES);
        assert!(res.truncated);

        let _ = fs::remove_dir_all(&temp_dir).await;
    }

    #[tokio::test]
    async fn test_workspace_search_depth_bound() {
        let temp_dir = std::env::temp_dir().join("Taleno_search_service_test_depth");
        let _ = fs::create_dir_all(&temp_dir).await;

        // Create a deeply nested directory
        let mut deep_dir = temp_dir.clone();
        for i in 1..=10 {
            deep_dir = deep_dir.join(format!("d_{i}"));
        }
        fs::create_dir_all(&deep_dir).await.unwrap();
        fs::write(deep_dir.join("deep.md"), "deep_keyword_findme")
            .await
            .unwrap();

        // Search with max_depth = 5 (should not reach depth 10)
        let options = SearchOptions {
            max_matches: 100,
            max_depth: 5,
            cancellation_token: None,
        };
        let res = search_workspace_with_options(
            "deep_keyword_findme",
            &temp_dir.to_string_lossy(),
            options,
        )
        .await
        .unwrap();

        assert_eq!(res.matches.len(), 0);

        // Search with max_depth = 15 (should reach depth 10)
        let options_reach = SearchOptions {
            max_matches: 100,
            max_depth: 15,
            cancellation_token: None,
        };
        let res_reach = search_workspace_with_options(
            "deep_keyword_findme",
            &temp_dir.to_string_lossy(),
            options_reach,
        )
        .await
        .unwrap();

        assert_eq!(res_reach.matches.len(), 1);

        let _ = fs::remove_dir_all(&temp_dir).await;
    }

    #[tokio::test]
    async fn test_workspace_search_prevents_directory_link_cycles() {
        let temp_dir = std::env::temp_dir().join("Taleno_search_service_test_cycle");
        let _ = fs::create_dir_all(&temp_dir).await;

        let sub_a = temp_dir.join("folder_a");
        fs::create_dir_all(&sub_a).await.unwrap();
        fs::write(sub_a.join("note_a.md"), "keyword_in_cycle")
            .await
            .unwrap();

        // Create link folder_a/cycle -> temp_dir (points back to parent)
        let link_path = sub_a.join("cycle_link");
        if create_test_dir_link(&temp_dir, &link_path) {
            let res = search_workspace("keyword_in_cycle", &temp_dir.to_string_lossy())
                .await
                .unwrap();

            // Should terminate and find exactly 1 match without looping
            assert_eq!(res.matches.len(), 1);
            assert!(!res.truncated);

            #[cfg(windows)]
            let _ = std::process::Command::new("cmd")
                .args(["/C", "rmdir"])
                .arg(&link_path)
                .output();
            #[cfg(unix)]
            let _ = fs::remove_file(&link_path).await;
        }

        let _ = fs::remove_dir_all(&temp_dir).await;
    }

    #[tokio::test]
    async fn test_workspace_search_enforces_root_containment() {
        let temp_dir = std::env::temp_dir().join("Taleno_search_service_test_containment");
        let outside_dir = std::env::temp_dir().join("Taleno_search_service_test_outside");
        let _ = fs::create_dir_all(&temp_dir).await;
        let _ = fs::create_dir_all(&outside_dir).await;

        // Write sensitive keyword outside workspace root
        fs::write(outside_dir.join("secret.md"), "outside_secret_keyword")
            .await
            .unwrap();

        // Create link inside workspace root pointing outside
        let escape_link = temp_dir.join("escape_link");
        if create_test_dir_link(&outside_dir, &escape_link) {
            let res = search_workspace("outside_secret_keyword", &temp_dir.to_string_lossy())
                .await
                .unwrap();

            // Should not search outside workspace
            assert_eq!(res.matches.len(), 0);

            #[cfg(windows)]
            let _ = std::process::Command::new("cmd")
                .args(["/C", "rmdir"])
                .arg(&escape_link)
                .output();
            #[cfg(unix)]
            let _ = fs::remove_file(&escape_link).await;
        }

        let _ = fs::remove_dir_all(&temp_dir).await;
        let _ = fs::remove_dir_all(&outside_dir).await;
    }

    #[tokio::test]
    async fn test_workspace_search_cancellation() {
        let temp_dir = std::env::temp_dir().join("Taleno_search_service_test_cancel");
        let _ = fs::create_dir_all(&temp_dir).await;

        fs::write(temp_dir.join("doc1.md"), "cancel_keyword_test")
            .await
            .unwrap();

        let cancel_token = Arc::new(AtomicBool::new(true)); // Already cancelled
        let options = SearchOptions {
            max_matches: 100,
            max_depth: 32,
            cancellation_token: Some(cancel_token),
        };

        let res = search_workspace_with_options(
            "cancel_keyword_test",
            &temp_dir.to_string_lossy(),
            options,
        )
        .await
        .unwrap();

        assert_eq!(res.matches.len(), 0);

        let _ = fs::remove_dir_all(&temp_dir).await;
    }

    #[tokio::test]
    async fn test_workspace_search_empty_query_and_missing_dir() {
        let res = search_workspace("", "non_existent_path").await.unwrap();
        assert_eq!(res.matches.len(), 0);
        assert!(!res.truncated);

        let res2 = search_workspace("   ", "non_existent_path").await.unwrap();
        assert_eq!(res2.matches.len(), 0);

        let res3 = search_workspace("query", "non_existent_path_xyz_12345")
            .await
            .unwrap();
        assert_eq!(res3.matches.len(), 0);
    }
}
