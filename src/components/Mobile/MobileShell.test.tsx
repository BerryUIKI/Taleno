import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "solid-js/web";
import { MobileShell } from "./MobileShell";
import { setLocale } from "../../i18n";

describe("MobileShell", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;
  const originalVisualViewport = window.visualViewport;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
    Object.defineProperty(window, "visualViewport", {
      value: originalVisualViewport,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      writable: true,
      configurable: true,
    });
    setLocale("en-US");
  });

  it("renders mobile shell container with top bar and children", () => {
    container = document.createElement("div");
    document.body.append(container);
    const onOpenFile = vi.fn();
    const onNewDocument = vi.fn();
    const onOpenQuickSwitcher = vi.fn();

    dispose = render(
      () => (
        <MobileShell
          onOpenFile={onOpenFile}
          onNewDocument={onNewDocument}
          onOpenQuickSwitcher={onOpenQuickSwitcher}
        >
          <div id="test-viewport">Mobile Document Viewport</div>
        </MobileShell>
      ),
      container
    );

    expect(container.querySelector("#test-viewport")?.textContent).toBe("Mobile Document Viewport");
    expect(container.querySelector('nav[aria-label="Mobile Navigation"]')).not.toBeNull();
  });

  it("adapts mobile shell height and offset to window.visualViewport geometry", () => {
    container = document.createElement("div");
    document.body.append(container);

    const listeners: Record<string, EventListener[]> = {};
    const mockVisualViewport = {
      height: 600,
      width: 400,
      offsetTop: 0,
      pageTop: 0,
      addEventListener: vi.fn((event: string, handler: EventListener) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: EventListener) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((h) => h !== handler);
        }
      }),
    };

    Object.defineProperty(window, "visualViewport", {
      value: mockVisualViewport,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
      configurable: true,
    });

    dispose = render(
      () => (
        <MobileShell
          onOpenFile={vi.fn()}
          onNewDocument={vi.fn()}
          onOpenQuickSwitcher={vi.fn()}
        >
          <div id="content">Content</div>
        </MobileShell>
      ),
      container
    );

    const shell = container.querySelector('[data-testid="mobile-shell"]') as HTMLElement;
    expect(shell).not.toBeNull();
    expect(shell.style.height).toBe("600px");

    // Simulate virtual keyboard opening (shrinks visualViewport height to 400px and scrolls offsetTop to 50px)
    mockVisualViewport.height = 400;
    mockVisualViewport.offsetTop = 50;

    listeners["resize"]?.forEach((handler) => handler(new Event("resize")));
    listeners["scroll"]?.forEach((handler) => handler(new Event("scroll")));

    expect(shell.style.height).toBe("400px");
    expect(shell.style.transform).toBe("translateY(50px)");

    // Test cleanup
    dispose?.();
    dispose = undefined;
    expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
