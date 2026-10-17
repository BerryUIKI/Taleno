import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "solid-js/web";
import { MobileTopBar } from "./MobileTopBar";
import { setLocale } from "../../i18n";

describe("MobileTopBar", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
    setLocale("en-US");
  });

  it("renders document title and action buttons in English", () => {
    setLocale("en-US");
    container = document.createElement("div");
    document.body.append(container);
    const onOpenFiles = vi.fn();
    const onOpenOutline = vi.fn();
    const onOpenSettings = vi.fn();
    const onNewDocument = vi.fn();

    dispose = render(
      () => (
        <MobileTopBar
          onOpenFiles={onOpenFiles}
          onOpenOutline={onOpenOutline}
          onOpenSettings={onOpenSettings}
          onNewDocument={onNewDocument}
        />
      ),
      container
    );

    expect(container.textContent).toContain("Untitled");

    const filesBtn = container.querySelector('button[aria-label="Files & Workspace"]');
    expect(filesBtn).not.toBeNull();
    (filesBtn as HTMLButtonElement).click();
    expect(onOpenFiles).toHaveBeenCalledOnce();

    const outlineBtn = container.querySelector('button[aria-label="Outline"]');
    expect(outlineBtn).not.toBeNull();
    (outlineBtn as HTMLButtonElement).click();
    expect(onOpenOutline).toHaveBeenCalledOnce();

    const newDocBtn = container.querySelector('button[aria-label="New Document"]');
    expect(newDocBtn).not.toBeNull();
    (newDocBtn as HTMLButtonElement).click();
    expect(onNewDocument).toHaveBeenCalledOnce();
  });

  it("renders localized action buttons in Chinese", () => {
    setLocale("zh-CN");
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <MobileTopBar
          onOpenFiles={vi.fn()}
          onOpenOutline={vi.fn()}
          onOpenSettings={vi.fn()}
          onNewDocument={vi.fn()}
        />
      ),
      container
    );

    expect(container.querySelector('button[aria-label="文件与工作区"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="大纲"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="新建文档"]')).not.toBeNull();
  });
});
