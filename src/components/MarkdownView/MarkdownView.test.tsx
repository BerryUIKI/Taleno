import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownView } from "./MarkdownView";

const renderMarkdownMock = vi.hoisted(() => vi.fn());

vi.mock("../../lib/tauri/commands", () => ({
  renderMarkdown: renderMarkdownMock,
}));

describe("MarkdownView", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    renderMarkdownMock.mockReset();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("renders fresh Markdown for a newly created document", async () => {
    const result = {
      html: '<h1 id="draft">Draft</h1>',
      toc: [{ level: 1, text: "Draft", id: "draft" }],
      word_count: 1,
    };
    renderMarkdownMock.mockResolvedValue(result);
    const onRendered = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <MarkdownView
          content="# Draft"
          renderedContent=""
          html=""
          externallyModified={false}
          onReload={() => undefined}
          onRendered={onRendered}
        />
      ),
      container
    );

    await vi.waitFor(() => {
      expect(container.querySelector("h1")?.textContent).toBe("Draft");
    });
    expect(renderMarkdownMock).toHaveBeenCalledWith("# Draft");
    expect(onRendered).toHaveBeenCalledWith("# Draft", result);
  });

  it("renders math formulas using KaTeX", async () => {
    const htmlWithMath = `
      <p>Energy: <span class="math math-inline" data-math="E = mc^2">$E = mc^2$</span></p>
      <div class="math math-display" data-math="\\int_0^1 x dx">$$\\int_0^1 x dx$$</div>
    `;
    const container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <MarkdownView
          content="math content"
          renderedContent="math content"
          html={htmlWithMath}
          externallyModified={false}
          onReload={() => undefined}
          onRendered={vi.fn()}
        />
      ),
      container
    );

    await vi.waitFor(() => {
      const katexElements = container.querySelectorAll(".katex");
      expect(katexElements.length).toBeGreaterThan(0);
    });
  });

  it("handles invalid math formula without breaking document", async () => {
    const htmlWithInvalidMath = `
      <p>Invalid: <span class="math math-inline" data-math="\\frac{unclosed">$invalid$</span></p>
    `;
    const container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <MarkdownView
          content="invalid math"
          renderedContent="invalid math"
          html={htmlWithInvalidMath}
          externallyModified={false}
          onReload={() => undefined}
          onRendered={vi.fn()}
        />
      ),
      container
    );

    await vi.waitFor(() => {
      // KaTeX with throwOnError: false renders the error inside .katex-error span
      const errorSpan = container.querySelector(".katex-error, .katex");
      expect(errorSpan).toBeTruthy();
    });
  });

  it("renders Mermaid diagrams and handles invalid diagram syntax visibly", async () => {
    const htmlWithInvalidMermaid = `
      <div class="mermaid-diagram">
        <pre class="mermaid">invalid mermaid syntax {{{</pre>
      </div>
    `;
    const container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <MarkdownView
          content="mermaid content"
          renderedContent="mermaid content"
          html={htmlWithInvalidMermaid}
          externallyModified={false}
          onReload={() => undefined}
          onRendered={vi.fn()}
        />
      ),
      container
    );

    await vi.waitFor(() => {
      expect(container.textContent).toContain("Mermaid Diagram Error");
    });
  });

  it("handles copy code button click via event delegation without inline script", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const htmlWithCode = `
      <div class="code-block-wrapper">
        <div class="flex items-center justify-between">
          <span>RUST</span>
          <button type="button" class="copy-code-btn" data-action="copy-code">Copy</button>
        </div>
        <div class="code-container">fn main() { println!("Hello"); }</div>
      </div>
    `;
    const container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <MarkdownView
          content="code content"
          renderedContent="code content"
          html={htmlWithCode}
          externallyModified={false}
          onReload={() => undefined}
          onRendered={vi.fn()}
        />
      ),
      container
    );

    const copyBtn = container.querySelector<HTMLButtonElement>(".copy-code-btn")!;
    expect(copyBtn).toBeTruthy();

    copyBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('fn main() { println!("Hello"); }');
      expect(copyBtn.textContent).toBe("Copied!");
    });
  });
});
