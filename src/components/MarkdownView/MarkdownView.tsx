import { Component, createEffect, createSignal, onMount, onCleanup, Show } from "solid-js";
import katex from "katex";
import mermaid from "mermaid";
import { renderMarkdown, type RenderResult } from "../../lib/tauri/commands";

export interface MarkdownViewProps {
  html: string;
  content: string;
  renderedContent: string;
  docPath?: string | null;
  externallyModified: boolean;
  onReload: () => void;
  onRendered: (sourceContent: string, result: RenderResult) => void;
}

// Initialize mermaid once with strict security and offline mode
mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  suppressErrorRendering: true,
});

export const MarkdownView: Component<MarkdownViewProps> = (props) => {
  let containerRef!: HTMLDivElement;
  const [renderedHtml, setRenderedHtml] = createSignal(
    props.content === props.renderedContent ? props.html : ""
  );
  let renderVersion = 0;

  const processEnhancements = (container: HTMLElement) => {
    if (!container) return;

    // 1. Render Math Formulas via KaTeX
    const mathElements = container.querySelectorAll<HTMLElement>(".math-inline, .math-display");
    mathElements.forEach((el) => {
      if (el.getAttribute("data-katex-rendered") === "true") return;
      const rawMath =
        el.getAttribute("data-math") ||
        el.textContent?.replace(/^\$\$|\$\$$|^\$|\$$/g, "") ||
        "";
      const isDisplay = el.classList.contains("math-display");
      try {
        katex.render(rawMath, el, {
          throwOnError: false,
          displayMode: isDisplay,
        });
        el.setAttribute("data-katex-rendered", "true");
      } catch (err) {
        console.warn("KaTeX render error:", err);
      }
    });

    // 2. Render Mermaid Diagrams via Mermaid
    const mermaidNodes = container.querySelectorAll<HTMLElement>("pre.mermaid");
    mermaidNodes.forEach(async (preEl, idx) => {
      if (preEl.getAttribute("data-mermaid-rendered") === "true") return;
      preEl.setAttribute("data-mermaid-rendered", "true");

      const code = preEl.textContent || "";
      const diagramId = `mermaid-svg-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
      try {
        const { svg } = await mermaid.render(diagramId, code);
        const parent = preEl.parentElement;
        if (parent) {
          parent.innerHTML = svg;
        }
      } catch (err: any) {
        console.warn("Mermaid render error:", err);
        const parent = preEl.parentElement;
        if (parent) {
          parent.innerHTML = `
            <div class="p-3 my-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-md font-mono text-left">
              <div class="font-bold mb-1">⚠️ Mermaid Diagram Error:</div>
              <div>${err?.message || "Invalid syntax"}</div>
            </div>
            <pre class="mermaid text-xs opacity-60 font-mono text-left p-2 bg-[var(--color-bg-secondary)] rounded">${code}</pre>
          `;
        }
      }
    });
  };

  createEffect(() => {
    const content = props.content;
    const renderedContent = props.renderedContent;

    if (content === renderedContent) {
      renderVersion += 1;
      setRenderedHtml(props.html);
      setTimeout(() => {
        if (containerRef) processEnhancements(containerRef);
      }, 0);
      return;
    }

    const version = ++renderVersion;
    setRenderedHtml("");

    const renderPromise = props.docPath
      ? renderMarkdown(content, props.docPath)
      : renderMarkdown(content);

    void renderPromise
      .then((result) => {
        if (version !== renderVersion) return;
        setRenderedHtml(result.html);
        props.onRendered(content, result);
        setTimeout(() => {
          if (containerRef) processEnhancements(containerRef);
        }, 0);
      })
      .catch((err) => {
        if (version !== renderVersion) return;
        console.error("Failed to render Markdown for reading mode:", err);
      });
  });

  onMount(() => {
    if (containerRef) {
      containerRef.addEventListener("click", handleContainerClick);
      processEnhancements(containerRef);
    }
  });

  onCleanup(() => {
    renderVersion += 1;
    if (containerRef) {
      containerRef.removeEventListener("click", handleContainerClick);
    }
  });

  const handleContainerClick = async (e: MouseEvent) => {
    const target = (e.target as HTMLElement)?.closest(".copy-code-btn") as HTMLButtonElement | null;
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();

    const wrapper = target.closest(".code-block-wrapper");
    const codeEl = wrapper?.querySelector(".code-container, pre code, pre");
    const text = codeEl?.textContent || "";

    try {
      await navigator.clipboard.writeText(text);
      const originalText = target.textContent;
      target.textContent = "Copied!";
      target.classList.add("text-green-500");
      setTimeout(() => {
        target.textContent = originalText;
        target.classList.remove("text-green-500");
      }, 1500);
    } catch (err) {
      console.error("Failed to copy code to clipboard:", err);
      target.textContent = "Failed";
      setTimeout(() => {
        target.textContent = "Copy";
      }, 1500);
    }
  };

  return (
    <div class="relative h-full overflow-y-auto" style={{ background: "var(--color-editor-bg)" }}>
      {/* External modification banner */}
      <Show when={props.externallyModified}>
        <div
          class="sticky top-0 z-10 flex items-center justify-between px-4 py-2 text-sm"
          style={{
            background: "var(--color-accent)",
            color: "white",
          }}
        >
          <span>This file has been modified externally.</span>
          <button
            class="px-3 py-1 rounded text-sm font-medium transition-colors"
            style={{
              background: "rgba(255,255,255,0.2)",
            }}
            onClick={props.onReload}
          >
            Reload
          </button>
        </div>
      </Show>

      {/* Rendered markdown content */}
      <div
        ref={containerRef}
        class="markdown-body max-w-4xl mx-auto px-8 py-6"
        innerHTML={renderedHtml()}
        onClick={handleContainerClick}
      />
    </div>
  );
};
