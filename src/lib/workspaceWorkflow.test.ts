import { describe, it, expect, vi, beforeEach } from "vitest";
import { openWorkspaceFolderWorkflow } from "./workspaceWorkflow";
import { open } from "@tauri-apps/plugin-dialog";
import { listDirectoryTree, type FileEntry } from "./tauri/commands";
import { workspaceTree } from "../store/files";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

vi.mock("./tauri/commands", () => ({
  listDirectoryTree: vi.fn(),
}));

describe("Shared Workspace Folder Workflow (#113)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists tree and updates workspace store when folder is picked", async () => {
    const mockTree: FileEntry = {
      name: "my-project",
      path: "/projects/my-project",
      is_directory: true,
      children: [
        {
          name: "README.md",
          path: "/projects/my-project/README.md",
          is_directory: false,
        },
      ],
    };

    vi.mocked(open).mockResolvedValue("/projects/my-project");
    vi.mocked(listDirectoryTree).mockResolvedValue(mockTree);

    const result = await openWorkspaceFolderWorkflow();

    expect(open).toHaveBeenCalledWith({
      directory: true,
      multiple: false,
    });
    expect(listDirectoryTree).toHaveBeenCalledWith("/projects/my-project");
    expect(workspaceTree()).toEqual(mockTree);
    expect(result).toEqual({
      success: true,
      tree: mockTree,
      path: "/projects/my-project",
    });
  });

  it("returns success: false when dialog is cancelled", async () => {
    vi.mocked(open).mockResolvedValue(null);

    const result = await openWorkspaceFolderWorkflow();

    expect(listDirectoryTree).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false });
  });

  it("handles errors when directory listing fails", async () => {
    vi.mocked(open).mockResolvedValue("/inaccessible/folder");
    vi.mocked(listDirectoryTree).mockRejectedValue(
      new Error("Access is denied")
    );

    const result = await openWorkspaceFolderWorkflow();

    expect(result).toEqual({
      success: false,
      error: "Access is denied",
    });
  });
});
