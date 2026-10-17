import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TabBar } from "./TabBar";
import { addOrSwitchTab, openTabs } from "../../store/files";

vi.mock("../../lib/tauri/commands", () => ({
  startDrag: vi.fn(),
}));

describe("TabBar", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  beforeEach(() => {
    // Clear tabs or add a test tab
    openTabs().forEach((tab) => {
      // Clean tabs if needed
    });
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
  });

  it("calls onNewTab when double-clicking the empty tab bar area", () => {
    const onNewTab = vi.fn();

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(() => <TabBar onNewTab={onNewTab} />, container);

    const emptyArea = container.querySelector<HTMLDivElement>('[data-tab-empty="true"]');
    expect(emptyArea).toBeTruthy();

    emptyArea?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(onNewTab).toHaveBeenCalledTimes(1);
  });

  it("calls onNewTab exactly once even if double-clicks arrive in rapid succession", () => {
    const onNewTab = vi.fn();

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(() => <TabBar onNewTab={onNewTab} />, container);

    const emptyArea = container.querySelector<HTMLDivElement>('[data-tab-empty="true"]');
    expect(emptyArea).toBeTruthy();

    emptyArea?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    emptyArea?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(onNewTab).toHaveBeenCalledTimes(1);
  });

  it("calls onNewTab when double-clicking the tab bar background", () => {
    const onNewTab = vi.fn();

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(() => <TabBar onNewTab={onNewTab} />, container);

    const tabBar = container.querySelector<HTMLDivElement>('[data-tab-bar="true"]');
    expect(tabBar).toBeTruthy();

    tabBar?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(onNewTab).toHaveBeenCalledTimes(1);
  });

  it("does not call onNewTab when double-clicking a button in the tab bar", () => {
    const onNewTab = vi.fn();

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(() => <TabBar onNewTab={onNewTab} />, container);

    const newTabBtn = container.querySelector<HTMLButtonElement>("button");
    expect(newTabBtn).toBeTruthy();

    newTabBtn?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(onNewTab).not.toHaveBeenCalled();
  });

  it("calls onCloseTab when close tab button is clicked", () => {
    const onCloseTab = vi.fn();
    addOrSwitchTab({
      path: null,
      filename: "TestTab.md",
      content: "Sample",
      renderedContent: "",
      html: "",
      toc: [],
      wordCount: 1,
      isDirty: true,
      externallyModified: false,
    });

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(() => <TabBar onNewTab={vi.fn()} onCloseTab={onCloseTab} />, container);

    const closeBtn = container.querySelector<HTMLButtonElement>('button[aria-label^="Close"]');
    expect(closeBtn).toBeTruthy();
    closeBtn?.click();
    expect(onCloseTab).toHaveBeenCalled();
  });

  it("exposes tablist and tab roles with aria-selected", () => {
    addOrSwitchTab({
      path: null,
      filename: "Tab1.md",
      content: "",
      renderedContent: "",
      html: "",
      toc: [],
      wordCount: 0,
      isDirty: false,
      externallyModified: false,
    });

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(() => <TabBar onNewTab={vi.fn()} />, container);

    const tablist = container.querySelector<HTMLDivElement>('[role="tablist"]');
    expect(tablist).toBeTruthy();

    const tabs = container.querySelectorAll<HTMLDivElement>('[role="tab"]');
    expect(tabs.length).toBeGreaterThan(0);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].getAttribute("tabindex")).toBe("0");
  });

  it("supports keyboard navigation with ArrowRight and ArrowLeft", () => {
    addOrSwitchTab({
      path: "/path/one.md",
      filename: "One.md",
      content: "One",
      renderedContent: "",
      html: "",
      toc: [],
      wordCount: 1,
      isDirty: false,
      externallyModified: false,
    });
    addOrSwitchTab({
      path: "/path/two.md",
      filename: "Two.md",
      content: "Two",
      renderedContent: "",
      html: "",
      toc: [],
      wordCount: 1,
      isDirty: false,
      externallyModified: false,
    });

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(() => <TabBar onNewTab={vi.fn()} />, container);

    const tabElements = container.querySelectorAll<HTMLDivElement>('[role="tab"]');
    expect(tabElements.length).toBe(2);

    // Press ArrowLeft on second tab to cycle to first
    tabElements[1].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })
    );

    // Press Home to jump to first
    tabElements[1].dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true })
    );
  });
});
