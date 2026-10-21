import { Component, createEffect, createMemo, createSignal, Show, onMount, onCleanup, untrack } from "solid-js";
import {
  defaultValueCtx,
  Editor as MilkdownEditor,
  editorViewOptionsCtx,
  rootCtx,
  editorViewCtx,
  parserCtx,
  serializerCtx,
  commandsCtx,
} from "@milkdown/core";
import { resolveDocumentImage } from "../../lib/tauri/commands";
import type { Node as ProseNode } from "@milkdown/kit/prose/model";
import type { Ctx } from "@milkdown/ctx";
import type { Transaction } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet, type EditorView } from "@milkdown/kit/prose/view";
import {
  commonmark,
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  insertImageCommand,
  linkSchema,
} from "@milkdown/preset-commonmark";
import {
  gfm,
  toggleStrikethroughCommand,
  insertTableCommand,
} from "@milkdown/preset-gfm";
import {
  history,
  undoCommand,
  redoCommand,
} from "@milkdown/plugin-history";
import { nord } from "@milkdown/theme-nord";
import "@milkdown/theme-nord/style.css";
import { type SelectionBookmark, TextSelection } from "@milkdown/kit/prose/state";
import { closeHistory } from "@milkdown/kit/prose/history";
import { currentDocument, updateDocumentContent, setCurrentDocument, registerEditorFlush, type TocEntry } from "../../store/editor";
import { activeTabId } from "../../store/files";
import { registerWritingFormatter, registerWritingMatchRevealer, registerWritingInserter, type FormatAction } from "../../lib/formatter";
import { registerWritingHeadingRevealer } from "../../lib/headingNavigation";

export const Editor: Component = () => {
  let containerRef!: HTMLDivElement;
  let editorInstance: MilkdownEditor | null = null;
  let liveView: EditorView | undefined;
  const imageRefreshers = new Set<() => void>();
  const imageDocumentPath = createMemo(() => currentDocument().path);
  const tabId = activeTabId();
  const loadVersion = currentDocument().loadVersion;
  let disposed = false;
  let changed = false;
  const [ready, setReady] = createSignal(false);
  let publishedContent = currentDocument().content;
  let publishTimer: ReturnType<typeof setTimeout> | undefined;
  const isCurrent = () => !disposed && activeTabId() === tabId && currentDocument().loadVersion === loadVersion;
  createEffect(() => {
    imageDocumentPath();
    untrack(() => { if (isCurrent()) for (const refresh of imageRefreshers) refresh(); });
  });
  const flush = () => {
    clearTimeout(publishTimer);
    if (!changed || !editorInstance || !isCurrent()) return;
    editorInstance.action((ctx) => {
      const markdown = ctx.get(serializerCtx)(ctx.get(editorViewCtx).state.doc);
      changed = false;
      publishedContent = markdown;
      if (markdown !== currentDocument().content) updateDocumentContent(markdown, { deferStats: true });
    });
  };
  let unregisterFlush: (() => void) | undefined;

  const revealHeadingInWriting = (_entry: TocEntry, index: number): boolean => {
    if (editorInstance) {
      try {
        let targetPos: number | null = null;
        editorInstance.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          if (!view) return;
          let headingCount = 0;
          view.state.doc.descendants((node, pos) => {
            if (targetPos !== null) return false;
            if (node.type.name === "heading") {
              if (headingCount === index) {
                targetPos = pos;
                return false;
              }
              headingCount++;
            }
          });
          if (targetPos !== null) {
            view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(targetPos + 1))).scrollIntoView());
            view.focus();
            const dom = view.nodeDOM(targetPos);
            if (dom instanceof HTMLElement) {
              dom.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        });
        if (targetPos !== null) return true;
      } catch {
        // Fall back to DOM search
      }
    }

    if (containerRef) {
      const headings = containerRef.querySelectorAll(
        "h1, h2, h3, h4, h5, h6"
      );
      if (headings[index]) {
        headings[index].scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
    }
    return false;
  };

  const [insertion, setInsertion] = createSignal<{ kind: "link" | "image"; bookmark: SelectionBookmark; text: string } | null>(null);
  const [insertionUrl, setInsertionUrl] = createSignal("");
  const [insertionText, setInsertionText] = createSignal("");
  const [insertionError, setInsertionError] = createSignal("");
  const closeInsertion = () => {
    setInsertion(null);
    editorInstance?.action(ctx => ctx.get(editorViewCtx).focus());
  };
  const confirmInsertion = (event: SubmitEvent) => {
    event.preventDefault();
    const pending = insertion();
    const url = insertionUrl().trim();
    if (!pending || !editorInstance || !isCurrent()) return;
    if (!url || (/^[a-z][a-z0-9+.-]*:/i.test(url) && !/^(https?:|mailto:)/i.test(url))) {
      setInsertionError("Enter an HTTP(S) URL or a relative path."); return;
    }
    editorInstance.action(ctx => {
      const view = ctx.get(editorViewCtx);
      const selection = pending.bookmark.resolve(view.state.doc);
      view.dispatch(closeHistory(view.state.tr.setSelection(selection)));
      if (pending.kind === "image") {
        ctx.get(commandsCtx).call(insertImageCommand.key, { src: url, alt: insertionText() });
      } else {
        const label = insertionText() || url;
        const tr = view.state.tr.insertText(label, selection.from, selection.to);
        tr.addMark(selection.from, selection.from + label.length, linkSchema.type(ctx).create({ href: url }));
        view.dispatch(tr.scrollIntoView());
      }
      view.dispatch(closeHistory(view.state.tr));
      view.focus();
    });
    setInsertion(null);
  };
  const executeFormat = (action: FormatAction) => {
    if (!editorInstance) return;
    if (action === "link" || action === "image") {
      editorInstance.action(ctx => {
        const view = ctx.get(editorViewCtx);
        const text = view.state.doc.textBetween(view.state.selection.from, view.state.selection.to, " ");
        setInsertion({ kind: action, bookmark: view.state.selection.getBookmark(), text });
        setInsertionText(text); setInsertionUrl(""); setInsertionError("");
      });
      return;
    }
    try {
      editorInstance.action((ctx) => {
        const commands = ctx.get(commandsCtx);
        const view = ctx.get(editorViewCtx);
        if (action !== "undo" && action !== "redo") view.dispatch(closeHistory(view.state.tr));
        switch (action) {
          case "undo":
            commands.call(undoCommand.key);
            break;
          case "redo":
            commands.call(redoCommand.key);
            break;
          case "bold":
            commands.call(toggleStrongCommand.key);
            break;
          case "italic":
            commands.call(toggleEmphasisCommand.key);
            break;
          case "strikethrough":
            commands.call(toggleStrikethroughCommand.key);
            break;
          case "code_inline":
            commands.call(toggleInlineCodeCommand.key);
            break;
          case "h1":
            commands.call(wrapInHeadingCommand.key, 1);
            break;
          case "h2":
            commands.call(wrapInHeadingCommand.key, 2);
            break;
          case "h3":
            commands.call(wrapInHeadingCommand.key, 3);
            break;
          case "h4":
            commands.call(wrapInHeadingCommand.key, 4);
            break;
          case "h5":
            commands.call(wrapInHeadingCommand.key, 5);
            break;
          case "h6":
            commands.call(wrapInHeadingCommand.key, 6);
            break;
          case "paragraph":
            commands.call(turnIntoTextCommand.key);
            break;
          case "blockquote":
            commands.call(wrapInBlockquoteCommand.key);
            break;
          case "bullet_list":
            commands.call(wrapInBulletListCommand.key);
            break;
          case "ordered_list":
            commands.call(wrapInOrderedListCommand.key);
            break;
          case "table":
            commands.call(insertTableCommand.key);
            break;
          case "task_list": {
            const view = ctx.get(editorViewCtx);
            if (!view) break;
            const { state, dispatch } = view;
            const { $from } = state.selection;
            let listItemDepth = -1;
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === "list_item") {
                listItemDepth = d;
                break;
              }
            }
            if (listItemDepth > 0) {
              const node = $from.node(listItemDepth);
              const pos = $from.before(listItemDepth);
              const newChecked = node.attrs.checked == null ? false : null;
              const tr = state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                checked: newChecked,
              });
              dispatch(tr);
            } else {
              commands.call(wrapInBulletListCommand.key);
              const updatedView = ctx.get(editorViewCtx);
              if (updatedView) {
                const updatedState = updatedView.state;
                const { $from: updatedFrom } = updatedState.selection;
                for (let d = updatedFrom.depth; d > 0; d--) {
                  if (updatedFrom.node(d).type.name === "list_item") {
                    const node = updatedFrom.node(d);
                    const pos = updatedFrom.before(d);
                    const tr = updatedState.tr.setNodeMarkup(pos, undefined, {
                      ...node.attrs,
                      checked: false,
                    });
                    updatedView.dispatch(tr);
                    break;
                  }
                }
              }
            }
            break;
          }
        }
        if (action !== "undo" && action !== "redo") view.dispatch(closeHistory(view.state.tr));
      });
    } catch (err) {
      console.warn("Writing format execution error:", err);
    }
  };

  const revealMatchInWriting = (start: number, end: number, line?: number): boolean => {
    if (!editorInstance) return false;
    try {
      let revealed = false;
      editorInstance.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        if (!view) return;

        let currentPos = 0;
        let targetFrom = -1;
        let targetTo = -1;

        view.state.doc.descendants((node, pos) => {
          if (node.isText && node.text) {
            const textLen = node.text.length;
            if (targetFrom === -1 && currentPos + textLen >= start) {
              const offsetInNode = Math.max(0, start - currentPos);
              targetFrom = pos + offsetInNode;
              const endOffsetInNode = Math.min(textLen, Math.max(offsetInNode, end - currentPos));
              targetTo = pos + endOffsetInNode;
            }
            currentPos += textLen;
          }
        });

        if (targetFrom !== -1 && targetTo !== -1 && targetTo >= targetFrom) {
          const selection = TextSelection.create(view.state.doc, targetFrom, targetTo);
          const tr = view.state.tr.setSelection(selection).scrollIntoView();
          view.dispatch(tr);
          view.focus();
          revealed = true;
        } else if (line !== undefined) {
          const tr = view.state.tr.scrollIntoView();
          view.dispatch(tr);
          revealed = true;
        }
      });
      return revealed;
    } catch (err) {
      console.warn("Writing revealMatch error:", err);
      return false;
    }
  };

  const insertTextInWriting = (text: string): boolean => {
    if (!editorInstance) return false;
    try {
      let inserted = false;
      editorInstance.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        if (!view) return;
        const { state } = view;
        const tr = state.tr.insertText(text, state.selection.from, state.selection.to);
        view.dispatch(tr);
        inserted = true;
      });
      return inserted;
    } catch (err) {
      console.warn("Writing insertText error:", err);
      return false;
    }
  };

  onMount(async () => {
    registerWritingFormatter(executeFormat);
    registerWritingMatchRevealer(revealMatchInWriting);
    registerWritingInserter(insertTextInWriting);
    registerWritingHeadingRevealer(revealHeadingInWriting);

    try {
      editorInstance = await MilkdownEditor.make()
        .config((ctx: Ctx) => {
          ctx.set(rootCtx, containerRef);
          ctx.set(defaultValueCtx, currentDocument().content || "");
          ctx.update(editorViewOptionsCtx, (prev: Record<string, unknown>) => ({
            ...prev,
            nodeViews: {
              image(node: ProseNode) {
                const image = document.createElement("img");
                let version = 0;
                let currentNode = node;
                const update = (next: ProseNode) => {
                  if (next.type.name !== "image") return false;
                  currentNode = next;
                  const request = ++version;
                  const source = String(next.attrs.src ?? "");
                  image.alt = String(next.attrs.alt ?? "");
                  image.title = String(next.attrs.title ?? "");
                  const path = currentDocument().path;
                  if (!path || /^(?:[a-z][a-z0-9+.-]*:|#)/i.test(source)) image.src = source;
                  else {
                    image.removeAttribute("src");
                    void resolveDocumentImage(source, path).then(url => {
                      if (request === version) image.src = url;
                    }).catch(error => {
                      if (request === version) image.title = String(error);
                    });
                  }
                  return true;
                };
                const refresh = () => { update(currentNode); };
                imageRefreshers.add(refresh);
                update(node);
                return { dom: image, update, ignoreMutation: () => true, destroy: () => { version++; imageRefreshers.delete(refresh); } };
              },
            },
            decorations(state: EditorView["state"]) {
              const from = state.selection.$from;
              if (from.depth === 0) return DecorationSet.empty;
              return DecorationSet.create(state.doc, [Decoration.node(from.before(1), from.after(1), { class: "taleno-active-block" })]);
            },
            dispatchTransaction(this: EditorView, transaction: Transaction) {
              const view = this;
              const previous = view.state.doc;
              view.updateState(view.state.apply(transaction));
              if (isCurrent() && transaction.getMeta("addToHistory") !== false && !previous.eq(view.state.doc)) {
                changed = true;
                // Dirty immediately; serialization can wait until the user pauses.
                setCurrentDocument((doc) => ({ ...doc, isDirty: true }));
                clearTimeout(publishTimer);
                publishTimer = setTimeout(flush, 150);
              }
            },
            attributes: {
              class:
                "milkdown-theme-nord prose outline-none focus:outline-none min-h-[500px] leading-relaxed text-base",
              spellcheck: "false",
            },
          }));

        })
        .config(nord)
        .use(commonmark)
        .use(gfm)
        .use(history)
        .create();
      editorInstance.action(ctx => { liveView = ctx.get(editorViewCtx); });
      if (disposed) {
        liveView?.destroy();
        await editorInstance.destroy();
        editorInstance = null;
        return;
      }
      unregisterFlush = registerEditorFlush(flush);
      setReady(true);
    } catch (err) {
      console.error("Failed to initialize Milkdown editor:", err);
    }
  });

  // External same-document edits (Find/Replace or plugins) are real undoable operations.
  // User-originated publications do not serialize/replace the whole editor a second time.
  createEffect(() => {
    const content = currentDocument().content;
    if (!ready() || !editorInstance || content === publishedContent || !isCurrent()) return;
    publishedContent = content;
    editorInstance.action((ctx) => {
      const parsed = ctx.get(parserCtx)(content || "");
      const view = ctx.get(editorViewCtx);
      if (parsed) view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, parsed.content));
    });
  });

  onCleanup(async () => {
    flush();
    disposed = true;
    clearTimeout(publishTimer);
    unregisterFlush?.();
    registerWritingFormatter(null);
    registerWritingMatchRevealer(null);
    registerWritingInserter(null);
    registerWritingHeadingRevealer(null);
    if (editorInstance) {
      try {
        // Disconnect ProseMirror's observer before Milkdown removes schema contexts.
        liveView?.destroy();
        await editorInstance.destroy();
      } catch (e) {
        console.warn("Editor cleanup error:", e);
      }
      editorInstance = null;
    }
  });

  return (
    <>
    <div aria-busy={!ready()} class="h-full overflow-y-auto bg-[var(--color-editor-bg)] px-8 py-6">
      <div class="max-w-4xl mx-auto">
        <div ref={containerRef} class="milkdown-container" />
      </div>
    </div>
    <Show when={insertion()}>{pending => (
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); closeInsertion(); } }}>
        <form role="dialog" aria-modal="true" aria-label={pending().kind === "link" ? "Insert link" : "Insert image"} onSubmit={confirmInsertion} class="p-6 rounded-lg shadow-xl w-96 max-w-full bg-[var(--color-bg-primary)] flex flex-col gap-3">
          <strong>{pending().kind === "link" ? "Insert link" : "Insert image"}</strong>
          <label>URL<input autofocus required class="block w-full p-2 border rounded" value={insertionUrl()} onInput={event => setInsertionUrl(event.currentTarget.value)} /></label>
          <label>{pending().kind === "link" ? "Text" : "Alternative text"}<input class="block w-full p-2 border rounded" value={insertionText()} onInput={event => setInsertionText(event.currentTarget.value)} /></label>
          <Show when={insertionError()}><p role="alert">{insertionError()}</p></Show>
          <div class="flex justify-end gap-3"><button type="button" onClick={closeInsertion}>Cancel</button><button type="submit">Insert</button></div>
        </form>
      </div>
    )}</Show>
    </>
  );
};
