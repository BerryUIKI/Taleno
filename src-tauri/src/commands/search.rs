use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMatch {
    pub file_path: String,
    pub file_name: String,
    pub line_number: usize,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

/// Full-text search across all markdown files in workspace.
#[tauri::command]
pub async fn search_workspace(
    query: String,
    root_path: String,
) -> Result<Vec<SearchMatch>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let mut matches = Vec::new();
    let root = Path::new(&root_path);
    if !root.exists() {
        return Ok(matches);
    }

    let q_lower = query.to_lowercase();
    search_dir_recursive(root, &q_lower, &query, &mut matches).await?;

    Ok(matches)
}

async fn search_dir_recursive(
    dir: &Path,
    q_lower: &str,
    original_q: &str,
    matches: &mut Vec<SearchMatch>,
) -> Result<(), String> {
    let mut read_dir = fs::read_dir(dir).await.map_err(|e| e.to_string())?;

    while let Ok(Some(entry)) = read_dir.next_entry().await {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if name.starts_with('.')
            || name == "node_modules"
            || name == "target"
            || name == "dist"
            || name == "build"
        {
            continue;
        }

        if path.is_dir() {
            Box::pin(search_dir_recursive(&path, q_lower, original_q, matches)).await?;
        } else if name.ends_with(".md") || name.ends_with(".markdown") || name.ends_with(".txt") {
            if let Ok(content) = fs::read_to_string(&path).await {
                for (idx, line) in content.lines().enumerate() {
                    let line_lower = line.to_lowercase();
                    if let Some(pos) = line_lower.find(q_lower) {
                        matches.push(SearchMatch {
                            file_path: path.to_string_lossy().to_string(),
                            file_name: name.clone(),
                            line_number: idx + 1,
                            line_content: line.to_string(),
                            match_start: pos,
                            match_end: pos + original_q.len(),
                        });
                        if matches.len() >= 100 {
                            return Ok(());
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_workspace_search() {
        let temp_dir = std::env::temp_dir().join("Taleno_search_test");
        let _ = fs::create_dir_all(&temp_dir).await;

        let file1 = temp_dir.join("note1.md");
        let _ = fs::write(
            &file1,
            "# First Document\nContains unique_keyword_xyz inside.",
        )
        .await;

        let results = search_workspace(
            "unique_keyword_xyz".to_string(),
            temp_dir.to_string_lossy().to_string(),
        )
        .await;

        assert!(results.is_ok());
        let matches = results.unwrap();
        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].line_number, 2);

        let _ = fs::remove_dir_all(&temp_dir).await;
    }
}
