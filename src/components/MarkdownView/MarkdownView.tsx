import { Component, createEffect, createSignal, onMount, onCleanup, Show } from "solid-js";
import { enhanceMarkdown } from "../../lib/richRendering";
import { renderMarkdown, type RenderResult } from "../../lib/tauri/commands";
import { registerReadingMatchRevealer } from "../../lib/formatter";

export interface MarkdownViewProps {
  html: string;
  content: string;
  renderedContent: string;
  docPath?: string | null;
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
  const [renderError, setRenderError] = createSignal("");
  const [retryVersion, setRetryVersion] = createSignal(0);

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

  const processEnhancements = (container: HTMLElement) => {
    void enhanceMarkdown(container).catch(error => console.error("Rich rendering failed:", error));
  };

  createEffect(() => {
    retryVersion();
    setRenderError("");
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
        setRenderError(String(err));
        console.error("Failed to render Markdown for reading mode:", err);
      });
  });

  onMount(() => {
    if (containerRef) {
      processEnhancements(containerRef);
    }
  });

  onCleanup(() => {
    renderVersion += 1;
    registerReadingMatchRevealer(null);
    if (containerRef) {
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

      <Show when={renderError()}><div role="alert" class="p-4"><p>{renderError()}</p><button onClick={() => setRetryVersion(v => v + 1)}>Retry rendering</button></div></Show>
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
