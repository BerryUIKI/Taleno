import { Component, createEffect, createSignal, onMount, onCleanup } from "solid-js";
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
import type { Ctx } from "@milkdown/ctx";
import type { Transaction } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
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
import { currentDocument, updateDocumentContent, setCurrentDocument, registerEditorFlush } from "../../store/editor";
import { activeTabId } from "../../store/files";
import { registerWritingFormatter, type FormatAction } from "../../lib/formatter";

export const Editor: Component = () => {
  let containerRef!: HTMLDivElement;
  let editorInstance: MilkdownEditor | null = null;
  const tabId = activeTabId();
  const loadVersion = currentDocument().loadVersion;
  let disposed = false;
  let changed = false;
  const [ready, setReady] = createSignal(false);
  let publishedContent = currentDocument().content;
  let publishTimer: ReturnType<typeof setTimeout> | undefined;
  const isCurrent = () => !disposed && activeTabId() === tabId && currentDocument().loadVersion === loadVersion;
  const flush = () => {
    clearTimeout(publishTimer);
    if (!changed || !editorInstance || !isCurrent()) return;
    editorInstance.action((ctx) => {
      const markdown = ctx.get(serializerCtx)(ctx.get(editorViewCtx).state.doc);
      changed = false;
      publishedContent = markdown;
      if (markdown !== currentDocument().content) updateDocumentContent(markdown);
    });
  };
  let unregisterFlush: (() => void) | undefined;

  const executeFormat = (action: FormatAction) => {
    if (!editorInstance) return;
    try {
      editorInstance.action((ctx) => {
        const commands = ctx.get(commandsCtx);
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
        }
      });
    } catch (err) {
      console.warn("Writing format execution error:", err);
    }
  };

  onMount(async () => {
    registerWritingFormatter(executeFormat);

    try {
      editorInstance = await MilkdownEditor.make()
        .config((ctx: Ctx) => {
          ctx.set(rootCtx, containerRef);
          ctx.set(defaultValueCtx, currentDocument().content || "");
          ctx.update(editorViewOptionsCtx, (prev: Record<string, unknown>) => ({
            ...prev,
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
      if (disposed) {
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
    if (editorInstance) {
      try {
        await editorInstance.destroy();
      } catch (e) {
        console.warn("Editor cleanup error:", e);
      }
      editorInstance = null;
    }
  });

  return (
    <div aria-busy={!ready()} class="h-full overflow-y-auto bg-[var(--color-editor-bg)] px-8 py-6">
      <div class="max-w-4xl mx-auto">
        <div ref={containerRef} class="milkdown-container" />
      </div>
    </div>
  );
};
