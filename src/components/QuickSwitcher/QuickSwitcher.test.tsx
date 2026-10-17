import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuickSwitcher } from "./QuickSwitcher";
import {
  openTabs,
  setOpenTabs,
  quickSwitcherOpen,
  setQuickSwitcherOpen,
  setWorkspaceTree,
  selectTab,
} from "../../store/files";

describe("QuickSwitcher Component", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  beforeEach(() => {
    setOpenTabs([
      {
        id: "tab-1",
        document: {
          path: "/workspace/open-doc.md",
          filename: "open-doc.md",
          content: "Open doc content",
          renderedContent: "Open doc content",
          html: "<p>Open doc content</p>",
          toc: [],
          wordCount: 3,
          isDirty: false,
          externallyModified: false,
        },
      },
    ]);

    setWorkspaceTree({
      name: "workspace",
      path: "/workspace",
      is_directory: true,
      children: [
        {
          name: "open-doc.md",
          path: "/workspace/open-doc.md",
          is_directory: false,
        },
        {
          name: "unopened-note.md",
          path: "/workspace/unopened-note.md",
          is_directory: false,
        },
        {
          name: "subfolder",
          path: "/workspace/subfolder",
          is_directory: true,
          children: [
            {
              name: "nested-guide.mdx",
              path: "/workspace/subfolder/nested-guide.mdx",
              is_directory: false,
            },
            {
              name: "image.png",
              path: "/workspace/subfolder/image.png",
              is_directory: false,
            },
          ],
        },
      ],
    });

    setQuickSwitcherOpen(true);
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
    setQuickSwitcherOpen(false);
    vi.restoreAllMocks();
  });

  it("renders when open and has accessible dialog and combobox attributes", async () => {
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => <QuickSwitcher onOpenFileByPath={vi.fn()} />,
      container
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();

    const input = container.querySelector('input[role="combobox"]');
    expect(input).toBeTruthy();
  });

  it("restores prior focus when quick switcher closes", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Editor Trigger";
    document.body.append(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => <QuickSwitcher onOpenFileByPath={vi.fn()} />,
      container
    );

    await new Promise((r) => setTimeout(r, 10));
    const input = container.querySelector('input[role="combobox"]');
    expect(document.activeElement).toBe(input);

    // Close quick switcher
    setQuickSwitcherOpen(false);
    await new Promise((r) => setTimeout(r, 10));
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("displays both open tabs and unopened workspace markdown files without duplicates", async () => {
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => <QuickSwitcher onOpenFileByPath={vi.fn()} />,
      container
    );

    const options = container.querySelectorAll('[role="option"]');
    // Expect 3 options:
    // 1. open-doc.md (tab)
    // 2. unopened-note.md (workspaceFile)
    // 3. nested-guide.mdx (workspaceFile)
    // Note: open-doc.md should NOT be duplicated as a workspace file, and image.png should be excluded.
    expect(options.length).toBe(3);

    expect(container.textContent).toContain("open-doc.md");
    expect(container.textContent).toContain("unopened-note.md");
    expect(container.textContent).toContain("nested-guide.mdx");
    expect(container.textContent).not.toContain("image.png");
  });

  it("navigates with ArrowDown and selects unopened workspace file on Enter", async () => {
    const onOpenFileByPath = vi.fn();
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => <QuickSwitcher onOpenFileByPath={onOpenFileByPath} />,
      container
    );

    const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;

    // Move to 2nd item (unopened-note.md)
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    // Press Enter
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onOpenFileByPath).toHaveBeenCalledWith("/workspace/unopened-note.md");
    expect(quickSwitcherOpen()).toBe(false);
  });
});
