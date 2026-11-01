import { render } from "solid-js/web";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CodeView, clearCodeViewSessions } from "./CodeView";
import { currentDocument, setCurrentDocument, resetDocument } from "../../store/editor";

describe("CodeView line gutter & virtualization", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement;

  /** CodeMirror keeps a hidden spacer element in the gutter to size it. */
  const lineNumbers = () =>
    Array.from(
      container.querySelectorAll<HTMLElement>(".cm-lineNumbers .cm-gutterElement")
    ).filter((node) => node.style.visibility !== "hidden");

  beforeEach(() => {
    clearCodeViewSessions();
    resetDocument();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container.remove();
    clearCodeViewSessions();
  });

  it("bounds the mounted lines and line numbers for a 10,000-line document", () => {
    setCurrentDocument({ ...currentDocument(), content: "line\n".repeat(10000) });

    dispose = render(() => <CodeView />, container);

    const lines = container.querySelectorAll(".cm-content .cm-line");
    const numbers = lineNumbers();

    expect(lines.length).toBeGreaterThan(0);
    expect(numbers.length).toBeGreaterThan(0);
    // Only the visible slice is in the DOM; a full-document textarea mounted all
    // 10,001 lines at once.
    expect(lines.length).toBeLessThan(200);
    expect(numbers.length).toBeLessThan(200);
    expect(numbers[0].textContent).toBe("1");
  });

  it("numbers every line of a short document", () => {
    setCurrentDocument({
      ...currentDocument(),
      content: "First line\nSecond line\nThird line",
    });

    dispose = render(() => <CodeView />, container);

    expect(lineNumbers().map((node) => node.textContent)).toEqual(["1", "2", "3"]);
    expect(container.querySelector(".cm-content")!.textContent).toBe(
      "First lineSecond lineThird line"
    );
  });

  it("rebuilds the numbering when the document is replaced", async () => {
    setCurrentDocument({ ...currentDocument(), content: "Alpha\nBeta" });
    dispose = render(() => <CodeView />, container);
    expect(lineNumbers().length).toBe(2);

    setCurrentDocument({ ...currentDocument(), content: "Alpha\nBeta\nGamma" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lineNumbers().map((node) => node.textContent)).toEqual(["1", "2", "3"]);
  });
});
