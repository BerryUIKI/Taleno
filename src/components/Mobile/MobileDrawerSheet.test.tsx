import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "solid-js/web";
import { MobileDrawerSheet } from "./MobileDrawerSheet";
import { addOrSwitchTab, openTabs, setOpenTabs, setActiveTabId } from "../../store/files";
import { documentFromResponse, updateDocumentContent } from "../../store/editor";

describe("MobileDrawerSheet", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
  });

  it("delegates dirty-tab closing to the shared confirmation flow", () => {
    setActiveTabId(null); setOpenTabs([]);
    addOrSwitchTab(documentFromResponse({ path: "/a.md", filename: "a.md", content: "A", html: "", toc: [], word_count: 1 }));
    updateDocumentContent("unsaved");
    const requestClose = vi.fn();
    container = document.createElement("div"); document.body.append(container);
    dispose = render(() => <MobileDrawerSheet view="files" onClose={vi.fn()} onOpenFile={vi.fn()} onNewDocument={vi.fn()} onCloseTab={requestClose} />, container);
    const close = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.trim() === "✕" && !button.hasAttribute("aria-label"));
    expect(close).toBeDefined();
    close!.click();
    expect(requestClose).toHaveBeenCalledWith("/a.md");
    expect(openTabs()[0].document).toMatchObject({ content: "unsaved", isDirty: true });
  });

  it("renders files and settings sheet when active", () => {
    container = document.createElement("div");
    document.body.append(container);
    const onClose = vi.fn();
    const onOpenFile = vi.fn();
    const onNewDocument = vi.fn();

    dispose = render(
      () => (
        <MobileDrawerSheet
          view="settings"
          onClose={onClose}
          onOpenFile={onOpenFile}
          onNewDocument={onNewDocument}
        />
      ),
      container
    );

    expect(container.textContent).toContain("偏好设置");
    expect(container.textContent).toContain("浅色");
    expect(container.textContent).toContain("深色");

    const closeBtn = container.querySelector('button[aria-label="Close"]');
    expect(closeBtn).not.toBeNull();
    (closeBtn as HTMLButtonElement).click();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
