import { Component, createEffect, onMount, onCleanup } from "solid-js";
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
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { nord } from "@milkdown/theme-nord";
import "@milkdown/theme-nord/style.css";
import { currentDocument, updateDocumentContent } from "../../store/editor";
import { registerWritingFormatter, registerWritingInserter, type FormatAction } from "../../lib/formatter";

export const Editor: Component = () => {
  let containerRef!: HTMLDivElement;
  let editorInstance: MilkdownEditor | null = null;

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
    registerWritingInserter(insertTextInWriting);

    try {
      editorInstance = await MilkdownEditor.make()
        .config((ctx: Ctx) => {
          ctx.set(rootCtx, containerRef);
          ctx.set(defaultValueCtx, currentDocument().content || "");
          ctx.update(editorViewOptionsCtx, (prev: Record<string, unknown>) => ({
            ...prev,
            attributes: {
              class:
                "milkdown-theme-nord prose outline-none focus:outline-none min-h-[500px] leading-relaxed text-base",
              spellcheck: "false",
            },
          }));

          ctx.get(listenerCtx).markdownUpdated((_: unknown, markdown: string) => {
            if (markdown !== currentDocument().content) {
              updateDocumentContent(markdown);
            }
          });
        })
        .config(nord)
        .use(commonmark)
        .use(gfm)
        .use(history)
        .use(listener)
        .create();
    } catch (err) {
      console.error("Failed to initialize Milkdown editor:", err);
    }
  });

  // Keep Milkdown editor content synchronized when active document changes externally
  createEffect(() => {
    const content = currentDocument().content;
    if (!editorInstance) return;

    try {
      editorInstance.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const parser = ctx.get(parserCtx);
        const serializer = ctx.get(serializerCtx);
        if (!view || !parser || !serializer) return;

        const currentMd = serializer(view.state.doc);
        if (currentMd !== content) {
          const parsedDoc = parser(content || "");
          if (parsedDoc) {
            const tr = view.state.tr.replaceWith(
              0,
              view.state.doc.content.size,
              parsedDoc
            );
            view.dispatch(tr);
          }
        }
      });
    } catch (err) {
      console.warn("Failed to sync Milkdown document content:", err);
    }
  });

  onCleanup(async () => {
    registerWritingFormatter(null);
    registerWritingInserter(null);
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
    <div class="h-full overflow-y-auto bg-[var(--color-editor-bg)] px-8 py-6">
      <div class="max-w-4xl mx-auto">
        <div ref={containerRef} class="milkdown-container" />
      </div>
    </div>
  );
};
