import { save } from "@tauri-apps/plugin-dialog";
import { exportDocument, renderMarkdown } from "./tauri/commands";
import { currentDocument, flushPendingEdits, type DocumentState } from "../store/editor";
import { reportFileError } from "../store/fileErrors";

export interface ExportWorkflowResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

type ExportSource = Pick<DocumentState, "content" | "filename"> & { path?: string | null };

/**
 * Shared HTML export workflow used by both MenuBar and EditorToolbar (#112).
 */
export async function exportDocumentWorkflow(
  doc?: ExportSource
): Promise<ExportWorkflowResult> {
  try {
    flushPendingEdits();
    // Capture the source before the asynchronous destination dialog.
    const snapshot = { ...(doc ?? currentDocument()) };
    const baseName = snapshot.filename
      ? snapshot.filename.replace(/\.(md|markdown|mdx|txt)$/i, "")
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

/** Run the shared export flow and surface success or failure to the user. */
export async function exportCurrentDocument(): Promise<void> {
  const doc = currentDocument();
  const result = await exportDocumentWorkflow();
  if (result.success && result.outputPath) {
    alert(`Exported document successfully to:\n${result.outputPath}`);
  } else if (result.error) {
    reportFileError({
      type: "export",
      message: `Failed to export document: ${result.error}`,
      path: doc.filename,
    });
  }
}
