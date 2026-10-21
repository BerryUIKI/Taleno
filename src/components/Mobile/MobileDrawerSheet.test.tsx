import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "solid-js/web";
import { MobileDrawerSheet } from "./MobileDrawerSheet";
import { addOrSwitchTab, openTabs, setOpenTabs, setActiveTabId } from "../../store/files";
import { documentFromResponse, updateDocumentContent } from "../../store/editor";
import { setLocale } from "../../i18n";

describe("MobileDrawerSheet", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
    setLocale("en-US");
  });

  it("delegates dirty-tab closing to the shared confirmation flow", () => {
    setActiveTabId(null); setOpenTabs([]);
    addOrSwitchTab(documentFromResponse({ path: "/a.md", filename: "a.md", content: "A", html: "", toc: [], word_count: 1 }));
    updateDocumentContent("unsaved");
    const requestClose = vi.fn();
    container = document.createElement("div"); document.body.append(container);
    dispose = render(() => <MobileDrawerSheet view="files" onClose={vi.fn()} onOpenFile={vi.fn()} onNewDocument={vi.fn()} onCloseTab={requestClose} />, container);
    const close = Array.from(container.querySelectorAll("button")).find((button) => button.getAttribute("aria-label") === "Close Tab");
    expect(close).toBeDefined();
    close!.click();
    expect(requestClose).toHaveBeenCalledWith("/a.md");
    expect(openTabs()[0].document).toMatchObject({ content: "unsaved", isDirty: true });
  });

  it("renders localized settings sheet in English", () => {
    setLocale("en-US");
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

    expect(container.textContent).toContain("Preferences & Theme");
    expect(container.textContent).toContain("Light Theme");
    expect(container.textContent).toContain("Dark Theme");

    const closeBtn = container.querySelector('button[aria-label="Close"]');
    expect(closeBtn).not.toBeNull();
    (closeBtn as HTMLButtonElement).click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders localized settings sheet in Chinese (zh-CN)", () => {
    setLocale("zh-CN");
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

    expect(container.textContent).toContain("偏好设置与主题");
    expect(container.textContent).toContain("浅色");
    expect(container.textContent).toContain("深色");

    const closeBtn = container.querySelector('button[aria-label="关闭"]');
    expect(closeBtn).not.toBeNull();
    (closeBtn as HTMLButtonElement).click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders localized files and workspace sheet with Save and Save As actions", () => {
    setLocale("en-US");
    container = document.createElement("div");
    document.body.append(container);
    const onSaveFile = vi.fn();
    const onSaveFileAs = vi.fn();

    dispose = render(
      () => (
        <MobileDrawerSheet
          view="files"
          onClose={vi.fn()}
          onOpenFile={vi.fn()}
          onNewDocument={vi.fn()}
          onSaveFile={onSaveFile}
          onSaveFileAs={onSaveFileAs}
        />
      ),
      container
    );

    expect(container.textContent).toContain("Files & Workspace");
    expect(container.textContent).toContain("Workspace Files");
    expect(container.textContent).toContain("+ New Note");

    const saveBtn = container.querySelector('button[aria-label="Save"]');
    const saveAsBtn = container.querySelector('button[aria-label="Save As..."]');

    expect(saveBtn).not.toBeNull();
    expect(saveAsBtn).not.toBeNull();

    (saveBtn as HTMLButtonElement).click();
    expect(onSaveFile).toHaveBeenCalledOnce();

    (saveAsBtn as HTMLButtonElement).click();
    expect(onSaveFileAs).toHaveBeenCalledOnce();
  });
});
