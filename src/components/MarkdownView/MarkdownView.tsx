import { Component, createEffect, createSignal, onMount, onCleanup, Show } from "solid-js";
import { renderMarkdown, type RenderResult } from "../../lib/tauri/commands";
import { registerReadingMatchRevealer } from "../../lib/formatter";

export interface MarkdownViewProps {
  html: string;
  content: string;
  renderedContent: string;
  externallyModified: boolean;
  onReload: () => void;
  onRendered: (sourceContent: string, result: RenderResult) => void;
}

export const MarkdownView: Component<MarkdownViewProps> = (props) => {
  let containerRef!: HTMLDivElement;
  const [renderedHtml, setRenderedHtml] = createSignal(
    props.content === props.renderedContent ? props.html : ""
  );
  let renderVersion = 0;

  const revealMatchInReading = (start: number, end: number): boolean => {
    if (!containerRef) return false;
    const text = props.content.substring(start, end).trim();
    if (!text) return false;

    const walker = document.createTreeWalker(containerRef, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const nodeText = node.nodeValue || "";
      const idx = nodeText.toLowerCase().indexOf(text.toLowerCase());
      if (idx !== -1) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, Math.min(nodeText.length, idx + text.length));
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        (node.parentElement as HTMLElement)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }
    }
    return false;
  };

  onMount(() => {
    registerReadingMatchRevealer(revealMatchInReading);
  });

  createEffect(() => {
    const content = props.content;
    const renderedContent = props.renderedContent;

    if (content === renderedContent) {
      renderVersion += 1;
      setRenderedHtml(props.html);
      return;
    }

    const version = ++renderVersion;
    setRenderedHtml("");

    void renderMarkdown(content)
      .then((result) => {
        if (version !== renderVersion) return;
        setRenderedHtml(result.html);
        props.onRendered(content, result);
      })
      .catch((err) => {
        if (version !== renderVersion) return;
        console.error("Failed to render Markdown for reading mode:", err);
      });
  });

  onCleanup(() => {
    renderVersion += 1;
    registerReadingMatchRevealer(null);
  });

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
      />
    </div>
  );
};
