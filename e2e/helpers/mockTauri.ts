import type { Page } from "@playwright/test";

export async function installTauriMock(page: Page) {
  await page.addInitScript(() => {
    const listeners = new Map<string, Array<(event: any) => void>>();
    let nextId = 1;

    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args: any = {}) => {
        if (cmd === "get_cli_args") {
          return [];
        }
        if (cmd === "list_plugins") {
          return [];
        }
        if (cmd === "list_custom_themes") {
          return [];
        }
        if (cmd === "render_markdown") {
          const md = args.markdown || "";
          const words = md.trim() ? md.trim().split(/\s+/).length : 0;
          return {
            html: `<p>${md}</p>`,
            toc: [],
            word_count: words,
          };
        }
        if (cmd === "open_file") {
          const content = "# Sample Note\n\nInitial document content.";
          return {
            path: args.path || "/workspace/note.md",
            filename: "note.md",
            content,
            html: "<h1>Sample Note</h1><p>Initial document content.</p>",
            toc: [{ level: 1, text: "Sample Note", id: "sample-note" }],
            word_count: 5,
          };
        }
        if (cmd === "save_file" || cmd === "save_file_atomic") {
          const content = args.content || "";
          const words = content.trim() ? content.trim().split(/\s+/).length : 0;
          return {
            path: args.path || "/workspace/note.md",
            filename: "note.md",
            content,
            html: `<p>${content}</p>`,
            toc: [],
            word_count: words,
          };
        }
        if (cmd === "stop_watching_file" || cmd === "start_watching_file") {
          return null;
        }
        if (cmd.startsWith("plugin:")) {
          return null;
        }
        return null;
      },
    };

    (window as any).__TAURI_EVENT_PLUGIN_INTERNALS__ = {
      registerListener: (event: string, handler: (event: any) => void) => {
        const id = nextId++;
        if (!listeners.has(event)) {
          listeners.set(event, []);
        }
        listeners.get(event)!.push(handler);
        return id;
      },
      unregisterListener: (_event: string, _id: number) => {},
    };
  });
}
