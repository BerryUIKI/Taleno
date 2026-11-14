import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { closeWindow } from "./commands";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: vi.fn() }));

describe("closeWindow", () => {
  const destroy = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getCurrentWindow).mockReturnValue({ destroy } as unknown as ReturnType<typeof getCurrentWindow>);
    destroy.mockResolvedValue(undefined);
  });

  it("destroys the window without calling a native command", async () => {
    await closeWindow();

    expect(destroy).toHaveBeenCalledOnce();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("propagates a rejection from the window API", async () => {
    destroy.mockRejectedValue(new Error("window API unavailable"));

    await expect(closeWindow()).rejects.toThrow("window API unavailable");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("passes markdown and docPath to render_markdown", async () => {
    const { renderMarkdown } = await import("./commands");
    vi.mocked(invoke).mockResolvedValue({
      html: "<p>test</p>",
      toc: [],
      word_count: 1,
    });

    await renderMarkdown("# Title", "/path/to/doc.md");
    expect(invoke).toHaveBeenCalledWith("render_markdown", {
      markdown: "# Title",
      docPath: "/path/to/doc.md",
    });
  });
});
