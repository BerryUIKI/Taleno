import { save } from "@tauri-apps/plugin-dialog";
import { exportDocument } from "./tauri/commands";
import { type DocumentState } from "../store/editor";

export interface ExportWorkflowResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Shared HTML export workflow used by both MenuBar and EditorToolbar (#112).
 */
export async function exportDocumentWorkflow(
  doc: Pick<DocumentState, "content" | "filename">
): Promise<ExportWorkflowResult> {
  try {
    const baseName = doc.filename
      ? doc.filename.replace(/\.(md|markdown|mdx|txt)$/i, "")
      : "document";
    const selected = await save({
      defaultPath: `${baseName}.html`,
      filters: [{ name: "HTML Document", extensions: ["html"] }],
    });

    if (selected && typeof selected === "string") {
      await exportDocument(doc.content, doc.filename || "document.md", selected);
      return { success: true, outputPath: selected };
    }
    return { success: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
