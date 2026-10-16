import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MenuBar, type MenuBarProps } from "./MenuBar";
import { closeWindow, startDrag, toggleMaximizeWindow } from "../../lib/tauri/commands";
import { t } from "../../i18n";

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

vi.mock("../../lib/tauri/commands", () => ({
  minimizeWindow: vi.fn(),
  toggleMaximizeWindow: vi.fn(),
  closeWindow: vi.fn(),
  isWindowMaximized: vi.fn().mockResolvedValue(false),
  startDrag: vi.fn().mockResolvedValue(undefined),
}));

describe("MenuBar Title Bar Quick Access", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  beforeEach(() => vi.clearAllMocks());

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
  });

  const renderMenu = (overrides: Partial<MenuBarProps> = {}) => {
    container = document.createElement("div");
    document.body.append(container);
    dispose = render(() => (
      <MenuBar
        homeVisible={true}
        sidebarOpen={true}
        onGoHome={vi.fn()}
        onNewDocument={vi.fn()}
        onOpenFile={vi.fn()}
        onOpenFolder={vi.fn()}
        onSaveFile={vi.fn()}
        onExport={vi.fn()}
        onToggleSidebar={vi.fn()}
        onOpenQuickSwitcher={vi.fn()}
        onOpenSearchModal={vi.fn()}
        onOpenFindReplace={vi.fn()}
        onOpenThemeSettings={vi.fn()}
        onOpenRecent={vi.fn()}
        {...overrides}
      />
    ), container);
    return container;
  };

  it.each(["button", "svg", "line"])("routes clicks on the close %s through unsaved-change confirmation", (targetTag) => {
    const onCloseWindow = vi.fn();
    const menu = renderMenu({ onCloseWindow });
    const button = Array.from(menu.querySelectorAll("button")).find(b => b.title === t("window.close"))!;
    const target = targetTag === "button" ? button : button.querySelector(targetTag)!;

    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, detail: 1 }));
    target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0, detail: 1 }));
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
    target.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, button: 0, detail: 2 }));

    expect(onCloseWindow).toHaveBeenCalledOnce();
    expect(closeWindow).not.toHaveBeenCalled();
    expect(startDrag).not.toHaveBeenCalled();
    expect(toggleMaximizeWindow).not.toHaveBeenCalled();
    expect(target.closest("[data-tauri-drag-region]")).toBeNull();
  });

  it("closes through the window wrapper when no confirmation callback is provided", () => {
    const menu = renderMenu();
    const button = Array.from(menu.querySelectorAll("button")).find(b => b.title === t("window.close"))!;

    button.click();

    expect(closeWindow).toHaveBeenCalledOnce();
  });

  it("starts one drag from the title and preserves double-click maximize", () => {
    const menu = renderMenu();
    const title = menu.querySelector("header > div:nth-child(2) span")!;

    title.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
    expect(startDrag).toHaveBeenCalledOnce();
    title.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 2 }));
    expect(startDrag).toHaveBeenCalledOnce();

    title.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, button: 0 }));
    expect(toggleMaximizeWindow).toHaveBeenCalledOnce();
  });

  it("renders quick access buttons for plugins, themes, and language", () => {
    const onOpenSettings = vi.fn();
    const onOpenThemeSettings = vi.fn();

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <MenuBar
          homeVisible={false}
          sidebarOpen={true}
          onGoHome={vi.fn()}
          onNewDocument={vi.fn()}
          onOpenFile={vi.fn()}
          onOpenFolder={vi.fn()}
          onSaveFile={vi.fn()}
          onExport={vi.fn()}
          onToggleSidebar={vi.fn()}
          onOpenQuickSwitcher={vi.fn()}
          onOpenSearchModal={vi.fn()}
          onOpenFindReplace={vi.fn()}
          onOpenThemeSettings={onOpenThemeSettings}
          onOpenSettings={onOpenSettings}
          onOpenRecent={vi.fn()}
        />
      ),
      container
    );

    const pluginsBtn = container.querySelector<HTMLButtonElement>('[data-menu-quick="plugins"]');
    const themesBtn = container.querySelector<HTMLButtonElement>('[data-menu-quick="theme"]');
    const langBtn = container.querySelector<HTMLButtonElement>('[data-menu-quick="language"]');
    const versionBtn = container.querySelector<HTMLButtonElement>('[data-menu-quick="version"]');

    expect(pluginsBtn).toBeTruthy();
    expect(themesBtn).toBeTruthy();
    expect(langBtn).toBeTruthy();
    expect(versionBtn).toBeNull();

    pluginsBtn?.click();
    expect(onOpenSettings).toHaveBeenCalledWith("plugins");

    themesBtn?.click();
    expect(onOpenSettings).toHaveBeenCalledWith("theme");

    // Verify website and github buttons are not rendered in the title bar
    const allButtons = Array.from(container.querySelectorAll("button"));
    const hasWebsite = allButtons.some(b => b.title?.includes("BerryUIKI") || b.title?.includes("website") || b.title?.includes("官网"));
    expect(hasWebsite).toBe(false);
  });
});
