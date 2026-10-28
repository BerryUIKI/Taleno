use crate::services::search_service::{self, WorkspaceSearchResult};

/// Full-text search across all markdown/text files in workspace.
///
/// Delegates directory recursion, link policy enforcement, cycle prevention,
/// and match bounds to `search_service`.
#[tauri::command]
pub async fn search_workspace(
    query: String,
    root_path: String,
) -> Result<WorkspaceSearchResult, String> {
    search_service::search_workspace(&query, &root_path).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::fs;

    #[tokio::test]
    async fn test_workspace_search_command() {
        let temp_dir = std::env::temp_dir().join("Taleno_search_cmd_test");
        let _ = fs::create_dir_all(&temp_dir).await;

        let file1 = temp_dir.join("cmd_note.md");
        fs::write(&file1, "# Header\nHello from search command!")
            .await
            .unwrap();

        let results = search_workspace(
            "search command".to_string(),
            temp_dir.to_string_lossy().to_string(),
        )
        .await;

        assert!(results.is_ok());
        let res = results.unwrap();
        assert_eq!(res.matches.len(), 1);
        assert!(!res.truncated);
        assert_eq!(res.matches[0].line_number, 2);

        let _ = fs::remove_dir_all(&temp_dir).await;
    }
}
