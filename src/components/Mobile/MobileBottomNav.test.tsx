import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "solid-js/web";
import { MobileBottomNav } from "./MobileBottomNav";
import { setLocale } from "../../i18n";

describe("MobileBottomNav", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
    setLocale("en-US");
  });

  it("renders localized navigation buttons in English and dispatches toggle events", () => {
    setLocale("en-US");
    container = document.createElement("div");
    document.body.append(container);
    const onToggleSheet = vi.fn();

    dispose = render(
      () => (
        <MobileBottomNav
          activeSheet={null}
          onToggleSheet={onToggleSheet}
        />
      ),
      container
    );

    const filesBtn = container.querySelector('button[aria-label="File"]');
    expect(filesBtn).not.toBeNull();
    (filesBtn as HTMLButtonElement).click();
    expect(onToggleSheet).toHaveBeenCalledWith("files");

    const outlineBtn = container.querySelector('button[aria-label="Outline"]');
    expect(outlineBtn).not.toBeNull();
    (outlineBtn as HTMLButtonElement).click();
    expect(onToggleSheet).toHaveBeenCalledWith("outline");

    const searchBtn = container.querySelector('button[aria-label="Search"]');
    expect(searchBtn).not.toBeNull();
    (searchBtn as HTMLButtonElement).click();
    expect(onToggleSheet).toHaveBeenCalledWith("search");

    const settingsBtn = container.querySelector('button[aria-label="Settings"]');
    expect(settingsBtn).not.toBeNull();
    (settingsBtn as HTMLButtonElement).click();
    expect(onToggleSheet).toHaveBeenCalledWith("settings");
  });

  it("renders localized navigation buttons in Chinese", () => {
    setLocale("zh-CN");
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <MobileBottomNav
          activeSheet={null}
          onToggleSheet={vi.fn()}
        />
      ),
      container
    );

    expect(container.querySelector('button[aria-label="文件"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="大纲"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="搜索"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="设置"]')).not.toBeNull();
    expect(container.textContent).toContain("大纲");
    expect(container.textContent).toContain("搜索");
  });
});
