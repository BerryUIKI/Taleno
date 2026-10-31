import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";
import { setCurrentDocument } from "../../store/editor";
import { setTheme } from "../../store/settings";
import { StatusBar } from "./StatusBar";

describe("StatusBar", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
  });

  it("places document details on the left and display controls before the theme button", () => {
    setTheme("light");
    setCurrentDocument({
      path: "/tmp/example.md",
      filename: "example.md",
      content: "Hello Taleno",
      renderedContent: "Hello Taleno",
      html: "<p>Hello Taleno</p>",
      toc: [],
      wordCount: 2,
      isDirty: false,
      externallyModified: false,
    });

    container = document.createElement("div");
    document.body.append(container);
    dispose = render(() => <StatusBar />, container);

    const footer = container.querySelector("footer");
    const versionBtn = container.querySelector<HTMLButtonElement>('[data-status-section="version"]');
    const documentInfo = container.querySelector('[data-status-section="document-info"]');
    const displayMode = container.querySelector('[data-status-section="display-mode"]');
    const themeButton = container.querySelector<HTMLButtonElement>('[data-status-section="theme"]');

    expect(versionBtn).toBeTruthy();
    expect(versionBtn?.textContent).toContain("v0.1.11");
    expect(footer?.firstElementChild).toBe(versionBtn);
    expect(displayMode).toBeTruthy();
    expect(themeButton).toBeTruthy();
    expect(
      documentInfo!.compareDocumentPosition(displayMode!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      displayMode!.compareDocumentPosition(themeButton!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(themeButton?.parentElement).toBe(footer?.lastElementChild);
    expect(themeButton?.textContent?.trim()).toBe("");
    expect(themeButton?.getAttribute("aria-label")).toContain("Toggle Theme");
  });
});
