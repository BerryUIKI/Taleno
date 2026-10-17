import type { PluginManifest } from "../../types/plugin";
import { readPluginSource } from "../tauri/commands";
import { currentDocument, updateDocumentContent } from "../../store/editor";
import { insertTextAtSelection } from "../formatter";

export interface PluginCommand {
  id: string;
  title: string;
  shortcut?: string;
  run: () => void | Promise<void>;
}

export interface TalenoPluginContext {
  commands: {
    registerCommand: (command: PluginCommand) => () => void;
  };
  editor: {
    getContent: () => string;
    insertText: (text: string) => void;
    setContent: (content: string) => void;
  };
  storage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
}

export interface TalenoPluginModule {
  onload?: (ctx: TalenoPluginContext) => void | Promise<void>;
  onunload?: () => void | Promise<void>;
}

export class PluginPermissionError extends Error {
  constructor(public pluginId: string, public permission: string) {
    super(`[Plugin ${pluginId}] Permission denied: missing permission '${permission}'`);
    this.name = "PluginPermissionError";
  }
}

export class PluginExecutionError extends Error {
  constructor(public pluginId: string, message: string) {
    super(`[Plugin ${pluginId}] Execution failed: ${message}`);
    this.name = "PluginExecutionError";
  }
}

export function hasPermission(manifest: PluginManifest, permission: string): boolean {
  return Array.isArray(manifest.permissions) && manifest.permissions.includes(permission);
}

export function normalizeShortcut(shortcut: string): string {
  const parts = shortcut.split("+").map((p) => p.trim());
  const modifiers: string[] = [];
  let key = "";

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === "ctrl" || lower === "control") modifiers.push("Ctrl");
    else if (lower === "cmd" || lower === "meta" || lower === "command") modifiers.push("Cmd");
    else if (lower === "shift") modifiers.push("Shift");
    else if (lower === "alt" || lower === "opt" || lower === "option") modifiers.push("Alt");
    else if (part) key = part.toUpperCase();
  }

  const uniqueMods = Array.from(new Set(modifiers)).sort();
  return [...uniqueMods, key].join("+");
}

export const RESERVED_CORE_SHORTCUTS = new Set([
  "Ctrl+S", "Cmd+S",
  "Ctrl+O", "Cmd+O",
  "Ctrl+N", "Cmd+N",
  "Ctrl+P", "Cmd+P",
  "Ctrl+F", "Cmd+F",
  "Ctrl+H", "Cmd+H",
  "Ctrl+W", "Cmd+W",
  "Ctrl+,", "Cmd+,",
  "Ctrl+/", "Cmd+/",
  "Ctrl+Shift+X", "Cmd+Shift+X",
  "Ctrl+Shift+B", "Cmd+Shift+B",
  "Ctrl+Shift+D", "Cmd+Shift+D",
  "Ctrl+Shift+F", "Cmd+Shift+F",
  "Ctrl+Shift+Z", "Cmd+Shift+Z",
  "Ctrl+B", "Cmd+B",
  "Ctrl+I", "Cmd+I",
  "Ctrl+K", "Cmd+K",
  "Ctrl+`", "Cmd+`",
  "Ctrl+E", "Cmd+E",
  "Ctrl+0", "Cmd+0",
  "Ctrl+1", "Cmd+1",
  "Ctrl+2", "Cmd+2",
  "Ctrl+3", "Cmd+3",
  "Ctrl+4", "Cmd+4",
  "Ctrl+5", "Cmd+5",
  "Ctrl+6", "Cmd+6",
  "F11",
]);

export function matchesKeyboardEvent(e: KeyboardEvent, normalizedShortcut: string): boolean {
  const isCtrl = e.ctrlKey;
  const isMeta = e.metaKey;
  const isShift = e.shiftKey;
  const isAlt = e.altKey;

  const parts = normalizedShortcut.split("+");
  const keyPart = parts[parts.length - 1];
  const modParts = parts.slice(0, -1);

  const reqCtrl = modParts.includes("Ctrl");
  const reqCmd = modParts.includes("Cmd");
  const reqShift = modParts.includes("Shift");
  const reqAlt = modParts.includes("Alt");

  const modMatch =
    (reqCtrl || reqCmd ? isCtrl || isMeta : !isCtrl && !isMeta) &&
    reqShift === isShift &&
    reqAlt === isAlt;

  if (!modMatch) return false;

  return e.key.toUpperCase() === keyPart.toUpperCase();
}

interface BoundShortcut {
  pluginId: string;
  commandId: string;
  run: () => void | Promise<void>;
}

export class PluginRuntimeManager {
  private activeModules = new Map<string, TalenoPluginModule>();
  private activeManifests = new Map<string, PluginManifest>();
  private disposables = new Map<string, Array<() => void>>();
  private registeredCommands = new Map<string, PluginCommand>();
  private boundShortcuts = new Map<string, BoundShortcut>();
  private loadErrors = new Map<string, string>();
  private keydownListenerAttached = false;

  constructor() {
    this.attachKeydownListener();
  }

  private attachKeydownListener() {
    if (typeof window !== "undefined" && !this.keydownListenerAttached) {
      window.addEventListener("keydown", this.handleKeyDown);
      this.keydownListenerAttached = true;
    }
  }

  public destroy() {
    if (typeof window !== "undefined" && this.keydownListenerAttached) {
      window.removeEventListener("keydown", this.handleKeyDown);
      this.keydownListenerAttached = false;
    }
    this.activeModules.clear();
    this.activeManifests.clear();
    this.disposables.clear();
    this.registeredCommands.clear();
    this.boundShortcuts.clear();
    this.loadErrors.clear();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    for (const [shortcut, binding] of this.boundShortcuts.entries()) {
      if (matchesKeyboardEvent(e, shortcut)) {
        e.preventDefault();
        try {
          binding.run();
        } catch (err) {
          console.error(`[PluginRuntime] Error executing shortcut ${shortcut} for plugin ${binding.pluginId}:`, err);
        }
        return;
      }
    }
  };

  public getRegisteredCommands(): PluginCommand[] {
    return Array.from(this.registeredCommands.values());
  }

  public getLoadErrors(): Record<string, string> {
    const res: Record<string, string> = {};
    for (const [id, err] of this.loadErrors.entries()) {
      res[id] = err;
    }
    return res;
  }

  public getPluginError(id: string): string | undefined {
    return this.loadErrors.get(id);
  }

  public createContext(manifest: PluginManifest): TalenoPluginContext {
    const pluginId = manifest.id;

    return {
      commands: {
        registerCommand: (cmd: PluginCommand) => {
          if (!hasPermission(manifest, "commands")) {
            throw new PluginPermissionError(pluginId, "commands");
          }
          return this.registerPluginCommand(pluginId, cmd);
        },
      },
      editor: {
        getContent: () => {
          if (!hasPermission(manifest, "editor:read")) {
            throw new PluginPermissionError(pluginId, "editor:read");
          }
          return currentDocument().content;
        },
        insertText: (text: string) => {
          if (!hasPermission(manifest, "editor:write")) {
            throw new PluginPermissionError(pluginId, "editor:write");
          }
          insertTextAtSelection(text);
        },
        setContent: (content: string) => {
          if (!hasPermission(manifest, "editor:write")) {
            throw new PluginPermissionError(pluginId, "editor:write");
          }
          updateDocumentContent(content);
        },
      },
      storage: {
        getItem: (key: string) => {
          if (!hasPermission(manifest, "storage")) {
            throw new PluginPermissionError(pluginId, "storage");
          }
          try {
            return localStorage.getItem(`Taleno_plugin_${pluginId}_${key}`);
          } catch {
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          if (!hasPermission(manifest, "storage")) {
            throw new PluginPermissionError(pluginId, "storage");
          }
          try {
            localStorage.setItem(`Taleno_plugin_${pluginId}_${key}`, value);
          } catch (err) {
            console.warn(`[Plugin ${pluginId}] Storage write failed:`, err);
          }
        },
      },
    };
  }

  private registerPluginCommand(pluginId: string, cmd: PluginCommand): () => void {
    const namespacedId = `${pluginId}:${cmd.id}`;
    const wrappedCommand: PluginCommand = {
      ...cmd,
      id: namespacedId,
    };
    this.registeredCommands.set(namespacedId, wrappedCommand);

    let normalizedShortcut: string | null = null;
    if (cmd.shortcut) {
      normalizedShortcut = normalizeShortcut(cmd.shortcut);
      if (RESERVED_CORE_SHORTCUTS.has(normalizedShortcut)) {
        console.warn(
          `[PluginRuntime] Shortcut "${cmd.shortcut}" for command "${cmd.id}" conflicts with core application shortcut; ignoring shortcut binding.`
        );
      } else if (this.boundShortcuts.has(normalizedShortcut)) {
        console.warn(
          `[PluginRuntime] Shortcut "${cmd.shortcut}" is already bound to another command; ignoring shortcut binding for "${cmd.id}".`
        );
      } else {
        this.boundShortcuts.set(normalizedShortcut, {
          pluginId,
          commandId: cmd.id,
          run: cmd.run,
        });
      }
    }

    const dispose = () => {
      this.registeredCommands.delete(namespacedId);
      if (normalizedShortcut && this.boundShortcuts.get(normalizedShortcut)?.commandId === cmd.id) {
        this.boundShortcuts.delete(normalizedShortcut);
      }
    };

    const list = this.disposables.get(pluginId) || [];
    list.push(dispose);
    this.disposables.set(pluginId, list);

    return dispose;
  }

  public async loadPlugin(manifest: PluginManifest, optionalSource?: string): Promise<boolean> {
    const pluginId = manifest.id;

    if (this.activeModules.has(pluginId)) {
      await this.unloadPlugin(pluginId);
    }

    let source = optionalSource;
    if (!source) {
      try {
        source = await readPluginSource(pluginId);
      } catch (err: any) {
        const message = `Failed to read plugin source: ${err?.message || err}`;
        this.loadErrors.set(pluginId, message);
        console.error(`[PluginRuntime] ${message}`);
        throw new PluginExecutionError(pluginId, message);
      }
    }

    let mod: TalenoPluginModule;
    try {
      mod = this.evaluatePluginSource(source);
    } catch (err: any) {
      const message = `Plugin evaluation failed: ${err?.message || err}`;
      this.loadErrors.set(pluginId, message);
      console.error(`[PluginRuntime] ${message}`);
      throw new PluginExecutionError(pluginId, message);
    }

    try {
      this.activeModules.set(pluginId, mod);
      this.activeManifests.set(pluginId, manifest);
      this.disposables.set(pluginId, []);

      const ctx = this.createContext(manifest);
      if (mod.onload) {
        await Promise.resolve(mod.onload(ctx));
      }

      this.loadErrors.delete(pluginId);
      return true;
    } catch (err: any) {
      const message = `Plugin onload failed: ${err?.message || err}`;
      this.loadErrors.set(pluginId, message);
      console.error(`[PluginRuntime] ${message}`);
      await this.unloadPlugin(pluginId);
      throw new PluginExecutionError(pluginId, message);
    }
  }

  public async unloadPlugin(pluginId: string): Promise<void> {
    const mod = this.activeModules.get(pluginId);
    if (mod?.onunload) {
      try {
        await Promise.resolve(mod.onunload());
      } catch (err) {
        console.warn(`[PluginRuntime] Error during ${pluginId} onunload:`, err);
      }
    }

    const cleanups = this.disposables.get(pluginId) || [];
    for (const dispose of cleanups) {
      try {
        dispose();
      } catch (e) {
        console.warn(e);
      }
    }

    for (const [shortcut, binding] of Array.from(this.boundShortcuts.entries())) {
      if (binding.pluginId === pluginId) {
        this.boundShortcuts.delete(shortcut);
      }
    }

    for (const [cmdId] of Array.from(this.registeredCommands.entries())) {
      if (cmdId.startsWith(`${pluginId}:`)) {
        this.registeredCommands.delete(cmdId);
      }
    }

    this.disposables.delete(pluginId);
    this.activeModules.delete(pluginId);
    this.activeManifests.delete(pluginId);
  }

  public evaluatePluginSource(source: string): TalenoPluginModule {
    // Strip 'export default' or 'module.exports' for safe functional wrap
    const cleanSource = source
      .replace(/^\s*export\s+default\s+/m, "return ")
      .replace(/^\s*module\.exports\s*=\s*/m, "return ");

    const factory = new Function(cleanSource);
    const result = factory();
    if (!result || typeof result !== "object") {
      throw new Error("Plugin source must export an object with lifecycle methods");
    }
    return result as TalenoPluginModule;
  }
}

export const pluginRuntime = new PluginRuntimeManager();
