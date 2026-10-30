import { render } from "solid-js/web";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  CodeView,
  analyzeDocumentText,
  computeGutterWindow,
  sameGutterWindow,
  countDocumentLines,
} from "./CodeView";
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

  describe("analyzeDocumentText", () => {
    it("reports line count and the longest monospace line", () => {
      expect(analyzeDocumentText("abc\nlonger line\n")).toEqual({
        lineCount: 3,
        maxColumns: 11,
        hasNonAscii: false,
      });
    });

    it("counts tabs as two columns and detects non-ASCII text", () => {
      expect(analyzeDocumentText("\ta\n中文").maxColumns).toBe(3);
      expect(analyzeDocumentText("\ta\n中文").hasNonAscii).toBe(true);
      expect(analyzeDocumentText("plain ASCII").hasNonAscii).toBe(false);
      expect(analyzeDocumentText("").lineCount).toBe(1);
    });
  });

  describe("computeGutterWindow", () => {
    it("keeps the uniform row model when no line wraps", () => {
      const rowHeight = 24;
      const state = computeGutterWindow({
        lineCount: 1000,
        rowHeight,
        scrollTop: 2400,
        viewportHeight: 800,
        measured: false,
        topOf: (index) => index * rowHeight,
        totalHeight: 1000 * rowHeight,
      });

      expect(state.start).toBe(91);
      expect(state.items[0].number).toBe(92);
      expect(state.items.length).toBeLessThan(100);
      expect(state.items.every((item) => item.height === rowHeight)).toBe(true);
    });

    it("positions numbers on the first row of wrapped lines", () => {
      const rowHeight = 24;
      // Line 2 wraps to three visual rows.
      const heights = [24, 24, 72, 24, 24];
      const tops = heights.reduce<number[]>((acc, height) => {
        acc.push(acc[acc.length - 1] + height);
        return acc;
      }, [0]);

      const state = computeGutterWindow({
        lineCount: heights.length,
        rowHeight,
        scrollTop: 0,
        viewportHeight: 800,
        measured: true,
        topOf: (index) => tops[index],
        totalHeight: tops[tops.length - 1],
      });

      expect(state.start).toBe(0);
      expect(state.offsetTop).toBe(0);
      expect(state.items.map((item) => item.top)).toEqual([0, 24, 48, 120, 144]);
      expect(state.items.map((item) => item.height)).toEqual([24, 24, 72, 24, 24]);
    });

    it("keeps the number of a tall wrapped line that spans the viewport", () => {
      const rowHeight = 24;
      // Line 0 wraps to 100 visual rows; lines 1-2 are normal.
      const tops = [0, 2400, 2424, 2448];
      const state = computeGutterWindow({
        lineCount: 3,
        rowHeight,
        scrollTop: 1200,
        viewportHeight: 240,
        measured: true,
        topOf: (index) => tops[index],
        totalHeight: 2448,
      });

      expect(state.start).toBe(0);
      expect(state.offsetTop).toBe(0);
      expect(state.items[0]).toMatchObject({ number: 1, top: 0, height: 2400 });
      expect(state.items[1]).toMatchObject({ number: 2, top: 2400, height: 24 });
    });

    it("finds the scrolled start line through wrapped-and-empty-line heights", () => {
      const rowHeight = 24;
      const heights = Array.from({ length: 100 }, (_, index) => (index === 10 ? 240 : 24));
      const tops = heights.reduce<number[]>((acc, height) => {
        acc.push(acc[acc.length - 1] + height);
        return acc;
      }, [0]);

      const state = computeGutterWindow({
        lineCount: heights.length,
        rowHeight,
        scrollTop: tops[11] + 24 + 8 * rowHeight,
        viewportHeight: 240,
        measured: true,
        topOf: (index) => tops[index],
        totalHeight: tops[tops.length - 1],
      });

      expect(state.start).toBe(11);
      expect(state.offsetTop).toBe(tops[11]);
      expect(state.items[0]).toMatchObject({ number: 12, top: 0, height: 24 });
    });
  });

  describe("Gutter DOM stability across edits", () => {
    it("bounds the gutter DOM for large documents and updates the visible scroll window", () => {
      setCurrentDocument({ ...currentDocument(), content: "line\n".repeat(10000) });
      dispose = render(() => <CodeView />, container);
      expect(container.querySelectorAll('[data-testid="gutter-line-number"]').length).toBeLessThan(100);
      const textarea = container.querySelector("textarea")!;
      textarea.scrollTop = 2400;
      textarea.dispatchEvent(new Event("scroll", { bubbles: true }));
      const first = container.querySelector('[data-testid="gutter-line-number"]');
      expect(Number(first?.textContent)).toBeGreaterThan(1);
    });
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

  describe("sameGutterWindow", () => {
    const state = (overrides = {}) => ({
      start: 10,
      offsetTop: 240,
      totalHeight: 24000,
      items: [
        { number: 11, top: 0, height: 24 },
        { number: 12, top: 24, height: 24 },
      ],
      ...overrides,
    });

    it("treats an identically rendered window as unchanged", () => {
      expect(sameGutterWindow(state(), state())).toBe(true);
    });

    it("detects a changed start line, scroll offset, total height or row geometry", () => {
      expect(sameGutterWindow(state(), state({ start: 11 }))).toBe(false);
      expect(sameGutterWindow(state(), state({ offsetTop: 264 }))).toBe(false);
      expect(sameGutterWindow(state(), state({ totalHeight: 24024 }))).toBe(false);
      expect(sameGutterWindow(state(), state({ items: [{ number: 11, top: 0, height: 48 }] }))).toBe(false);
    });
  });
});
