import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setWorkspaceTree } from "../../store/files";
import * as commands from "../../lib/tauri/commands";
import { SearchModal } from "./SearchModal";

describe("SearchModal", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
    setWorkspaceTree(null);
    vi.restoreAllMocks();
  });

  it("renders search input and placeholder when open", () => {
    container = document.createElement("div");
    document.body.append(container);
    dispose = render(
      () => <SearchModal isOpen={true} onClose={() => {}} onSelectResult={() => {}} />,
      container
    );
    const input = container.querySelector<HTMLInputElement>("input");
    expect(input).not.toBeNull();
    expect(input?.placeholder).toContain("Search across all workspace Markdown files");
  });

  it("displays search results and explains truncation when capped", async () => {
    setWorkspaceTree({
      name: "test-workspace",
      path: "/test/workspace",
      is_directory: true,
      children: [],
    });

    const mockMatches = [
      {
        file_path: "/test/workspace/doc1.md",
        file_name: "doc1.md",
        line_number: 10,
        line_content: "Found query_target here",
        match_start: 6,
        match_end: 18,
      },
    ];

    vi.spyOn(commands, "searchWorkspace").mockResolvedValue({
      matches: mockMatches,
      truncated: true,
    });

    container = document.createElement("div");
    document.body.append(container);
    const onSelectResult = vi.fn();
    const onClose = vi.fn();

    dispose = render(
      () => (
        <SearchModal
          isOpen={true}
          onClose={onClose}
          onSelectResult={onSelectResult}
        />
      ),
      container
    );

    const input = container.querySelector<HTMLInputElement>("input")!;
    input.value = "query_target";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // Wait for search promise resolution
    await Promise.resolve();
    await Promise.resolve();

    expect(container.textContent).toContain("Found 1 match");
    expect(container.textContent).toContain("(Results capped at 100 matches)");
    expect(container.textContent).toContain("doc1.md");
    expect(container.textContent).toContain("Line 10");
    expect(container.textContent).toContain("Found query_target here");

    // Click result item
    const item = container.querySelector<HTMLDivElement>(".group")!;
    item.click();
    expect(onSelectResult).toHaveBeenCalledWith("/test/workspace/doc1.md");
    expect(onClose).toHaveBeenCalled();
  });
});
