import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  PluginRuntimeManager,
  PluginPermissionError,
  PluginExecutionError,
  normalizeShortcut,
  matchesKeyboardEvent,
  RESERVED_CORE_SHORTCUTS,
} from "./runtime";
import type { PluginManifest } from "../../types/plugin";
import {
  registerWritingInserter,
  registerCodeInserter,
  insertTextAtSelection,
} from "../formatter";
import {
  currentDocument,
  updateDocumentContent,
  setCurrentDocument,
  setDisplayMode,
} from "../../store/editor";

describe("PluginRuntimeManager", () => {
  let runtime: PluginRuntimeManager;

  const validManifest: PluginManifest = {
    id: "test-plugin",
    name: "Test Plugin",
    version: "1.0.0",
    description: "Test description",
    author: "Test Author",
    enabled: true,
    permissions: ["commands", "editor:read", "editor:write", "storage"],
  };

  beforeEach(() => {
    runtime = new PluginRuntimeManager();
    setCurrentDocument({
      path: null,
      filename: "Untitled.md",
      content: "Hello World",
      renderedContent: "Hello World",
      html: "<p>Hello World</p>",
      toc: [],
      wordCount: 2,
      isDirty: false,
      externallyModified: false,
    });
  });

  afterEach(() => {
    runtime.destroy();
    registerWritingInserter(null);
    registerCodeInserter(null);
    setDisplayMode("writing");
  });

  describe("Permission Enforcement (#73)", () => {
    it("permits operations when permissions are explicitly declared", async () => {
      const source = `
        export default {
          onload(ctx) {
            ctx.commands.registerCommand({ id: "run", title: "Run", run: () => {} });
            ctx.editor.insertText("!");
            ctx.storage.setItem("key", "val");
            const val = ctx.storage.getItem("key");
            const content = ctx.editor.getContent();
          }
        };
      `;

      const success = await runtime.loadPlugin(validManifest, source);
      expect(success).toBe(true);
      expect(runtime.getRegisteredCommands().length).toBe(1);
    });

    it("throws PluginPermissionError when accessing commands without permission", async () => {
      const restrictedManifest: PluginManifest = {
        ...validManifest,
        permissions: ["editor:read"],
      };

      const source = `
        export default {
          onload(ctx) {
            ctx.commands.registerCommand({ id: "cmd", title: "Cmd", run: () => {} });
          }
        };
      `;

      await expect(runtime.loadPlugin(restrictedManifest, source)).rejects.toThrow(
        PluginExecutionError
      );
      expect(runtime.getPluginError("test-plugin")).toContain("missing permission 'commands'");
    });

    it("throws PluginPermissionError when accessing editor:write without permission", async () => {
      const restrictedManifest: PluginManifest = {
        ...validManifest,
        permissions: ["editor:read"],
      };

      const source = `
        export default {
          onload(ctx) {
            ctx.editor.insertText("forbidden edit");
          }
        };
      `;

      await expect(runtime.loadPlugin(restrictedManifest, source)).rejects.toThrow(
        PluginExecutionError
      );
      expect(runtime.getPluginError("test-plugin")).toContain("missing permission 'editor:write'");
    });

    it("throws PluginPermissionError when accessing editor:read without permission", async () => {
      const restrictedManifest: PluginManifest = {
        ...validManifest,
        permissions: ["commands"],
      };

      const source = `
        export default {
          onload(ctx) {
            ctx.editor.getContent();
          }
        };
      `;

      await expect(runtime.loadPlugin(restrictedManifest, source)).rejects.toThrow(
        PluginExecutionError
      );
      expect(runtime.getPluginError("test-plugin")).toContain("missing permission 'editor:read'");
    });

    it("throws PluginPermissionError when accessing storage without permission", async () => {
      const restrictedManifest: PluginManifest = {
        ...validManifest,
        permissions: ["commands"],
      };

      const source = `
        export default {
          onload(ctx) {
            ctx.storage.setItem("pref", "true");
          }
        };
      `;

      await expect(runtime.loadPlugin(restrictedManifest, source)).rejects.toThrow(
        PluginExecutionError
      );
      expect(runtime.getPluginError("test-plugin")).toContain("missing permission 'storage'");
    });
  });

  describe("Editor Selection Insertion (#72)", () => {
    it("routes insertion through active writing inserter in writing mode", () => {
      setDisplayMode("writing");
      const writingInserter = vi.fn().mockReturnValue(true);
      registerWritingInserter(writingInserter);

      const ctx = runtime.createContext(validManifest);
      ctx.editor.insertText("inserted");

      expect(writingInserter).toHaveBeenCalledWith("inserted");
    });

    it("routes insertion through active code inserter in code mode", () => {
      setDisplayMode("code");
      const codeInserter = vi.fn().mockReturnValue(true);
      registerCodeInserter(codeInserter);

      const ctx = runtime.createContext(validManifest);
      ctx.editor.insertText("in code");

      expect(codeInserter).toHaveBeenCalledWith("in code");
    });

    it("falls back to appending to document when no editor adapter is active", () => {
      setDisplayMode("reading");
      const ctx = runtime.createContext(validManifest);
      ctx.editor.insertText(" appended");

      expect(currentDocument().content).toBe("Hello World appended");
      expect(currentDocument().isDirty).toBe(true);
    });
  });

  describe("Command Reachability & Shortcuts (#71)", () => {
    it("exposes registered plugin commands and cleans them up on unload", async () => {
      const runFn = vi.fn();
      const source = `
        export default {
          onload(ctx) {
            ctx.commands.registerCommand({
              id: "timestamp",
              title: "Insert Timestamp",
              shortcut: "Ctrl+Shift+T",
              run: () => { ctx.editor.insertText("2026-10-18"); }
            });
          }
        };
      `;

      await runtime.loadPlugin(validManifest, source);
      const commands = runtime.getRegisteredCommands();
      expect(commands.length).toBe(1);
      expect(commands[0].id).toBe("test-plugin:timestamp");
      expect(commands[0].title).toBe("Insert Timestamp");
      expect(commands[0].shortcut).toBe("Ctrl+Shift+T");

      // Verify command executes
      commands[0].run();
      expect(currentDocument().content).toContain("2026-10-18");

      // Unload plugin
      await runtime.unloadPlugin("test-plugin");
      expect(runtime.getRegisteredCommands().length).toBe(0);
    });

    it("normalizes shortcuts consistently", () => {
      expect(normalizeShortcut("ctrl + shift + t")).toBe("Ctrl+Shift+T");
      expect(normalizeShortcut("shift+cmd+p")).toBe("Cmd+Shift+P");
      expect(normalizeShortcut("alt + f4")).toBe("Alt+F4");
    });

    it("detects and rejects reserved core shortcuts", () => {
      expect(RESERVED_CORE_SHORTCUTS.has("Ctrl+S")).toBe(true);
      expect(RESERVED_CORE_SHORTCUTS.has("Ctrl+P")).toBe(true);
      expect(RESERVED_CORE_SHORTCUTS.has("Ctrl+Shift+X")).toBe(true);
    });

    it("matches keyboard events accurately", () => {
      const event = new KeyboardEvent("keydown", {
        key: "T",
        ctrlKey: true,
        shiftKey: true,
      });

      expect(matchesKeyboardEvent(event, "Ctrl+Shift+T")).toBe(true);
      expect(matchesKeyboardEvent(event, "Ctrl+T")).toBe(false);
      expect(matchesKeyboardEvent(event, "Ctrl+Shift+P")).toBe(false);
    });
  });

  describe("Error Preservation & Execution Failure (#69)", () => {
    it("records actionable error when plugin source evaluation throws", async () => {
      const brokenSource = `throw new SyntaxError("Unexpected token");`;

      await expect(runtime.loadPlugin(validManifest, brokenSource)).rejects.toThrow(
        PluginExecutionError
      );
      expect(runtime.getPluginError("test-plugin")).toContain("Plugin evaluation failed");
    });

    it("records actionable error when plugin onload rejects", async () => {
      const rejectingSource = `
        export default {
          onload() {
            throw new Error("Custom plugin startup failure");
          }
        };
      `;

      await expect(runtime.loadPlugin(validManifest, rejectingSource)).rejects.toThrow(
        PluginExecutionError
      );
      expect(runtime.getPluginError("test-plugin")).toContain("Custom plugin startup failure");
    });

    it("clears previous errors when plugin loads successfully", async () => {
      // First fail
      await expect(
        runtime.loadPlugin(validManifest, `throw new Error("Fail once");`)
      ).rejects.toThrow();
      expect(runtime.getPluginError("test-plugin")).toBeDefined();

      // Then succeed
      const goodSource = `export default { onload(ctx) {} };`;
      const ok = await runtime.loadPlugin(validManifest, goodSource);
      expect(ok).toBe(true);
      expect(runtime.getPluginError("test-plugin")).toBeUndefined();
    });
  });
});
