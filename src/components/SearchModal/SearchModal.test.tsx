import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchModal } from "./SearchModal";
import { setWorkspaceTree } from "../../store/files";
import * as tauriCommands from "../../lib/tauri/commands";

describe("SearchModal Component", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  beforeEach(() => {
    setWorkspaceTree({
      name: "workspace",
      path: "/mock/workspace",
      is_directory: true,
      children: [],
    });
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
    setWorkspaceTree(null);
    vi.restoreAllMocks();
  });

  it("renders when open and has accessible dialog and combobox attributes", async () => {
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <SearchModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectResult={vi.fn()}
        />
      ),
      container
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");

    const input = container.querySelector('input[role="combobox"]');
    expect(input).toBeTruthy();
  });

  it("restores prior focus when modal closes", async () => {
    const triggerBtn = document.createElement("button");
    triggerBtn.textContent = "Trigger";
    document.body.append(triggerBtn);
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    container = document.createElement("div");
    document.body.append(container);

    let isOpen = true;
    dispose = render(
      () => (
        <SearchModal
          isOpen={isOpen}
          onClose={vi.fn()}
          onSelectResult={vi.fn()}
        />
      ),
      container
    );

    await new Promise((r) => setTimeout(r, 10));
    const input = container.querySelector('input[role="combobox"]');
    expect(document.activeElement).toBe(input);

    // Simulate close
    dispose();
    expect(document.activeElement).toBe(triggerBtn);
    triggerBtn.remove();
  });

  it("discards obsolete search responses when a newer query is triggered", async () => {
    vi.spyOn(tauriCommands, "searchWorkspace").mockImplementation(async (query: string, _rootPath: string) => {
      if (query === "slow") {
        // Delayed resolution
        await new Promise((r) => setTimeout(r, 200));
        return {
          matches: [
            {
              file_name: "slow.md",
              file_path: "/mock/slow.md",
              line_number: 1,
              line_content: "Old slow match",
              match_start: 0,
              match_end: 3,
            },
          ],
          truncated: false,
        };
      }
      return {
        matches: [
          {
            file_name: "fast.md",
            file_path: "/mock/fast.md",
            line_number: 2,
            line_content: "New fast match",
            match_start: 0,
            match_end: 3,
          },
        ],
        truncated: false,
      };
    });

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <SearchModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectResult={vi.fn()}
        />
      ),
      container
    );

    const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;

    // Trigger slow search
    input.value = "slow";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // Wait 160ms so debounce triggers and searchWorkspace("slow") starts
    await new Promise((r) => setTimeout(r, 160));

    // Immediately trigger newer fast search
    input.value = "fast";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // Wait for fast search to debounce and resolve
    await new Promise((r) => setTimeout(r, 200));

    // Wait for slow search to also finish
    await new Promise((r) => setTimeout(r, 200));

    // Container should contain fast.md and NOT slow.md
    expect(container.textContent).toContain("fast.md");
    expect(container.textContent).not.toContain("slow.md");
  });

  it("supports keyboard navigation with ArrowDown/ArrowUp and accessible options", async () => {
    vi.spyOn(tauriCommands, "searchWorkspace").mockResolvedValue({
      matches: [
        {
          file_name: "doc1.md",
          file_path: "/mock/doc1.md",
          line_number: 10,
          line_content: "First match content",
          match_start: 0,
          match_end: 5,
        },
        {
          file_name: "doc2.md",
          file_path: "/mock/doc2.md",
          line_number: 20,
          line_content: "Second match content",
          match_start: 0,
          match_end: 6,
        },
      ],
      truncated: false,
    });

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <SearchModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectResult={vi.fn()}
        />
      ),
      container
    );

    const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    input.value = "test";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 200));

    const options = container.querySelectorAll('[role="option"]');
    expect(options.length).toBe(2);
    expect(options[0].getAttribute("aria-selected")).toBe("true");
    expect(options[1].getAttribute("aria-selected")).toBe("false");

    // ArrowDown moves selection to second item
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(options[0].getAttribute("aria-selected")).toBe("false");
    expect(options[1].getAttribute("aria-selected")).toBe("true");

    // ArrowUp moves selection back to first item
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    expect(options[0].getAttribute("aria-selected")).toBe("true");
    expect(options[1].getAttribute("aria-selected")).toBe("false");
  });

  it("selects active result and navigates to line on Enter", async () => {
    vi.spyOn(tauriCommands, "searchWorkspace").mockResolvedValue({
      matches: [
        {
          file_name: "doc1.md",
          file_path: "/mock/doc1.md",
          line_number: 42,
          line_content: "Target match on line 42",
          match_start: 0,
          match_end: 6,
        },
      ],
      truncated: false,
    });

    const onSelectResult = vi.fn();
    const onClose = vi.fn();

    container = document.createElement("div");
    document.body.append(container);

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

    const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    input.value = "target";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 200));

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onSelectResult).toHaveBeenCalledWith(
      "/mock/doc1.md",
      42,
      "Target match on line 42"
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("displays search results and explains truncation when capped", async () => {
    const mockMatches = [
      {
        file_path: "/mock/workspace/doc1.md",
        file_name: "doc1.md",
        line_number: 10,
        line_content: "Found query_target here",
        match_start: 6,
        match_end: 18,
      },
    ];

    vi.spyOn(tauriCommands, "searchWorkspace").mockResolvedValue({
      matches: mockMatches,
      truncated: true,
    });

    const onSelectResult = vi.fn();
    const onClose = vi.fn();

    container = document.createElement("div");
    document.body.append(container);

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

    const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    input.value = "query_target";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 200));

    expect(container.textContent).toContain("Found 1 match");
    expect(container.textContent).toContain("(Results capped at 100 matches)");
    expect(container.textContent).toContain("doc1.md");
    expect(container.textContent).toContain("Line 10");
    expect(container.textContent).toContain("Found query_target here");

    // Click result item
    const item = container.querySelector<HTMLDivElement>('[role="option"]')!;
    item.click();
    expect(onSelectResult).toHaveBeenCalledWith(
      "/mock/workspace/doc1.md",
      10,
      "Found query_target here"
    );
    expect(onClose).toHaveBeenCalled();
  });
});
