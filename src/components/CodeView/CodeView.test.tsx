import { render } from "solid-js/web";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CodeView, countDocumentLines } from "./CodeView";
import { currentDocument, setCurrentDocument, resetDocument } from "../../store/editor";

describe("CodeView Line Gutter & Performance", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement;

  beforeEach(() => {
    resetDocument();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container.remove();
  });

  describe("countDocumentLines", () => {
    it("should return 1 for empty content", () => {
      expect(countDocumentLines("")).toBe(1);
    });

    it("should return 1 for single line without newline", () => {
      expect(countDocumentLines("hello world")).toBe(1);
    });

    it("should count lines accurately with various newlines", () => {
      expect(countDocumentLines("line 1\nline 2")).toBe(2);
      expect(countDocumentLines("line 1\nline 2\nline 3")).toBe(3);
      expect(countDocumentLines("line 1\nline 2\n")).toBe(3);
    });

    it("should handle large documents efficiently in under 5ms", () => {
      const largeDoc = "Sample line of markdown content with words\n".repeat(5000);
      const start = performance.now();
      const count = countDocumentLines(largeDoc);
      const duration = performance.now() - start;

      expect(count).toBe(5001);
      expect(duration).toBeLessThan(10);
    });
  });

  describe("Gutter DOM stability across edits", () => {
    it("should retain existing gutter DOM elements when line count is unchanged", async () => {
      setCurrentDocument({
        ...currentDocument(),
        content: "First line\nSecond line\nThird line",
      });

      dispose = render(() => <CodeView />, container);
      const initialNodes = Array.from(
        container.querySelectorAll('[data-testid="gutter-line-number"]')
      );
      expect(initialNodes.length).toBe(3);
      expect(initialNodes.map((n) => n.textContent)).toEqual(["1", "2", "3"]);

      // Edit content inside existing lines without adding newlines
      setCurrentDocument({
        ...currentDocument(),
        content: "First line edited\nSecond line with more text\nThird line modified",
      });

      // Wait a microtask for Solid reactive tracking
      await new Promise((r) => setTimeout(r, 0));

      const updatedNodes = Array.from(
        container.querySelectorAll('[data-testid="gutter-line-number"]')
      );
      expect(updatedNodes.length).toBe(3);

      // Verify that DOM nodes were preserved by reference (stable, zero DOM churn)
      expect(updatedNodes[0]).toBe(initialNodes[0]);
      expect(updatedNodes[1]).toBe(initialNodes[1]);
      expect(updatedNodes[2]).toBe(initialNodes[2]);
    });

    it("should append new gutter element while preserving existing elements when line count increases", async () => {
      setCurrentDocument({
        ...currentDocument(),
        content: "Alpha\nBeta",
      });

      dispose = render(() => <CodeView />, container);
      const initialNodes = Array.from(
        container.querySelectorAll('[data-testid="gutter-line-number"]')
      );
      expect(initialNodes.length).toBe(2);

      // Add a third line
      setCurrentDocument({
        ...currentDocument(),
        content: "Alpha\nBeta\nGamma",
      });

      await new Promise((r) => setTimeout(r, 0));

      const updatedNodes = Array.from(
        container.querySelectorAll('[data-testid="gutter-line-number"]')
      );
      expect(updatedNodes.length).toBe(3);
      // First two nodes are unchanged by reference
      expect(updatedNodes[0]).toBe(initialNodes[0]);
      expect(updatedNodes[1]).toBe(initialNodes[1]);
      expect(updatedNodes[2].textContent).toBe("3");
    });
  });
});
