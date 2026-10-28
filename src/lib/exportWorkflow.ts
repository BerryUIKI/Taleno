import { save } from "@tauri-apps/plugin-dialog";
import { exportDocument, renderMarkdown } from "./tauri/commands";
import { currentDocument, flushPendingEdits, type DocumentState } from "../store/editor";

export interface ExportWorkflowResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Shared HTML export workflow used by both MenuBar and EditorToolbar (#112).
 */
export async function exportDocumentWorkflow(
  doc: Pick<DocumentState, "content" | "filename"> & { path?: string | null } = currentDocument()
): Promise<ExportWorkflowResult> {
  try {
    const active = doc === currentDocument();
    flushPendingEdits();
    if (active) doc = currentDocument();
    // Capture the source before the asynchronous destination dialog.
    const snapshot = { ...doc };
    const baseName = doc.filename
      ? doc.filename.replace(/\.(md|markdown|mdx|txt)$/i, "")
      : "document";
    const selected = await save({
      defaultPath: `${baseName}.html`,
      filters: [{ name: "HTML Document", extensions: ["html"] }],
    });

    if (selected && typeof selected === "string") {
      const rendered = await renderMarkdown(snapshot.content, snapshot.path);
      const { prepareHtmlPresentation } = await import("./exportPresentation");
      const presentation = await prepareHtmlPresentation(rendered.html);
      await exportDocument(snapshot.content, snapshot.filename || "document.md", selected, presentation);
      return { success: true, outputPath: selected };
    }
    return { success: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
