import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportDocumentWorkflow } from "./exportWorkflow";
import { save } from "@tauri-apps/plugin-dialog";
import { exportDocument } from "./tauri/commands";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
}));

vi.mock("./tauri/commands", () => ({
  exportDocument: vi.fn(),
}));

describe("Shared HTML Export Workflow (#112)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports document when a destination path is chosen", async () => {
    vi.mocked(save).mockResolvedValue("/output/my-note.html");
    vi.mocked(exportDocument).mockResolvedValue();

    const result = await exportDocumentWorkflow({
      filename: "my-note.md",
      content: "# Hello World",
    });

    expect(save).toHaveBeenCalledWith({
      defaultPath: "my-note.html",
      filters: [{ name: "HTML Document", extensions: ["html"] }],
    });
    expect(exportDocument).toHaveBeenCalledWith(
      "# Hello World",
      "my-note.md",
      "/output/my-note.html"
    );
    expect(result).toEqual({
      success: true,
      outputPath: "/output/my-note.html",
    });
  });

  it("returns success: false when dialog is cancelled", async () => {
    vi.mocked(save).mockResolvedValue(null);

    const result = await exportDocumentWorkflow({
      filename: "cancelled.md",
      content: "# Content",
    });

    expect(exportDocument).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false });
  });

  it("handles and reports errors during export gracefully", async () => {
    vi.mocked(save).mockRejectedValue(new Error("Disk full or permission denied"));

    const result = await exportDocumentWorkflow({
      filename: "err.md",
      content: "# Content",
    });

    expect(result).toEqual({
      success: false,
      error: "Disk full or permission denied",
    });
  });
});
