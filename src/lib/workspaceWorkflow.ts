import { open } from "@tauri-apps/plugin-dialog";
import { listDirectoryTree, type FileEntry } from "./tauri/commands";
import { setWorkspaceTree } from "../store/files";

export interface WorkspaceWorkflowResult {
  success: boolean;
  tree?: FileEntry;
  path?: string;
  error?: string;
}

/**
 * Shared workspace folder opening workflow used by both App (MenuBar/Shortcuts)
 * and Sidebar (#113). Retains backend-only directory tree listing.
 */
export async function openWorkspaceFolderWorkflow(): Promise<WorkspaceWorkflowResult> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (selected && typeof selected === "string") {
      const tree = await listDirectoryTree(selected);
      setWorkspaceTree(tree);
      return { success: true, tree, path: selected };
    }
    return { success: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
