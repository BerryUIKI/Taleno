# 🧩 Taleno Plugin Developer Handbook

This document provides a comprehensive guide for designing, developing, testing, and distributing plugins for **Taleno**.

---

## 1. Architectural Overview

Taleno uses a **local-first, sandboxed extensibility model** designed to keep editor keystroke latency strictly under 16ms (60 FPS) while ensuring user data integrity.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SolidJS Frontend Layer                          │
│                                                                        │
│   [Plugin Runtime Sandbox (src/lib/plugins/runtime.ts)]                │
│   ├── Provides `TalenoPluginContext` bridge                            │
│   ├── Tracks registered commands & disposables                         │
│   └── Invokes `onload(ctx)` and `onunload()` on toggle                 │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Tauri 2 IPC (invoke)
┌───────────────────────────────────▼────────────────────────────────────┐
│                        Rust Native Backend Core                        │
│                                                                        │
│   [Plugin Service (src-tauri/src/services/plugin_service.rs)]          │
│   ├── Resolves identifier-derived app_data_dir `plugins/` directory     │
│   ├── Validates `manifest.json` schemas & reads scripts                │
│   ├── Fetches online registry from `BerryUIKI/Taleno-Plugins`          │
│   └── Performs crash-resilient atomic downloads & installations        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Plugin Directory & File Structure

Plugins live in individual folders inside the application data directory resolved by Tauri's native `app_data_dir()` from the bundle identifier (`com.berryuiki.taleno`):

- **Windows**: `%APPDATA%\com.berryuiki.taleno\plugins\<plugin-id>\`
- **macOS**: `~/Library/Application Support/com.berryuiki.taleno/plugins/<plugin-id>/`
- **Linux**: `~/.local/share/com.berryuiki.taleno/plugins/<plugin-id>/` (or `$XDG_DATA_HOME/com.berryuiki.taleno/plugins/<plugin-id>/`)

> [!TIP]
> **Prefer In-App Navigation**: You do not need to construct or locate paths manually. In Taleno, navigate to **Settings ➔ Plugins** and click **"Open Plugins Folder"**. The app automatically opens the exact platform-resolved directory using native OS shell integration.

A standard plugin must contain at minimum:

```
<plugin-id>/
├── manifest.json       # Required: Metadata, permissions, and entry script pointer
├── main.js             # Required: ES Module or CommonJS script exporting lifecycle hooks
└── README.md           # Required: Documentation, screenshots, and command descriptions
```

---

## 3. The Plugin Manifest (`manifest.json`)

The manifest provides declarative metadata used by the Taleno settings interface and permission validator:

```json
{
  "id": "my-timestamp-plugin",
  "name": "Timestamp Inserter",
  "version": "1.0.0",
  "description": "Inserts the current ISO 8601 timestamp at cursor position.",
  "author": "Your Name or Team",
  "homepage": "https://github.com/YourUsername/my-timestamp-plugin",
  "enabled": true,
  "main": "main.js",
  "tags": ["utilities", "productivity"],
  "minTalenoVersion": "0.1.6",
  "permissions": [
    "editor:write",
    "commands"
  ]
}
```

### Manifest Schema Specification

| Field | Type | Mandatory | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` | **Yes** | Unique identifier (`^[a-z0-9-_]{3,40}$`). Must match folder name. |
| `name` | `string` | **Yes** | User-friendly display name shown in settings. |
| `version` | `string` | **Yes** | Semantic versioning (`MAJOR.MINOR.PATCH`). |
| `description` | `string` | **Yes** | Concise description under 160 characters. |
| `author` | `string` | **Yes** | Author or organization name. |
| `main` | `string` | **Yes** | Relative path to the entry script (typically `main.js`). |
| `enabled` | `boolean` | No | Default active state upon initial discovery (default: `true`). |
| `tags` | `string[]` | No | Search categories (e.g. `["math", "analytics"]`). |
| `permissions` | `string[]` | **Yes** | Array of required permission tokens. |
| `minTalenoVersion` | `string` | No | Minimum core Taleno version required. |

---

## 4. Script Lifecycle & The `TalenoPluginContext` API

Your plugin's entry script (`main.js`) exports lifecycle functions that receive a sandboxed `TalenoPluginContext` instance:

```javascript
export default {
  /**
   * Invoked when the plugin is enabled, installed, or upon Taleno launch.
   * @param {TalenoPluginContext} ctx - Sandboxed runtime interface.
   */
  onload(ctx) {
    console.log("My plugin loaded successfully!");
  },

  /**
   * Invoked when the plugin is disabled, uninstalled, or during app shutdown.
   */
  onunload() {
    console.log("My plugin unloaded and cleaned up!");
  },
};
```

### 4.1 Commands API (`ctx.commands`)

Allows registering custom actions and keyboard shortcuts into Taleno:

```javascript
const unregister = ctx.commands.registerCommand({
  id: "insert-greeting",
  title: "Insert Friendly Greeting",
  shortcut: "Ctrl+Shift+G", // Optional keyboard hint
  run() {
    ctx.editor.insertText("\n> **Hello from Taleno Plugin!**\n");
  },
});

// Any registered command is automatically torn down when the plugin is disabled.
// You can also call unregister() manually if needed.
```

### 4.2 Editor API (`ctx.editor`)

Allows non-destructive inspection and modification of the active document:

```javascript
// 1. Read document text
const content = ctx.editor.getContent();

// 2. Append or insert Markdown text at cursor position
ctx.editor.insertText("\n### New Header\nParagraph text...\n");

// 3. Replace document text completely (requires 'editor:write' permission)
ctx.editor.setContent("# Replaced Document\n");
```

### 4.3 Storage API (`ctx.storage`)

Provides isolated, key-value configuration storage scoped directly to your plugin's `id`:

```javascript
// Store persistent data
ctx.storage.setItem("userPreference", "compact");

// Retrieve persistent data
const pref = ctx.storage.getItem("userPreference");
```

---

## 5. Security, Sandbox & Execution Boundary

Taleno's architecture prioritizes user data protection, least-privilege execution, and editor stability:

1. **Production Content Security Policy (CSP)**:
   - The main window runs under a strict production CSP (`default-src 'self'`) that strictly prohibits `unsafe-eval`.
   - Script evaluation is hosted within an isolated sandboxed iframe (`public/plugin-sandbox.html`) running with `sandbox="allow-scripts"` and an opaque `null` origin, or mediated via a broker boundary.
   - The sandbox execution realm has **no access** to parent DOM, `localStorage`, `window.__TAURI_INTERNALS__`, or native system APIs. Communication occurs exclusively via structured RPC messages.

2. **Least-Privilege Scopes & Permission Broker**:
   - `commands`: Ability to register actions into the command palette / Quick Switcher.
   - `editor:read`: Ability to inspect document Markdown text.
   - `editor:write`: Ability to insert or modify document text.
   - `storage`: Isolated persistent key-value configuration scoped strictly to `Taleno_plugin_<id>_<key>`.
   - Attempting to access an undeclared capability throws `PluginPermissionError` at the broker boundary, blocking execution.

3. **Editor Selection Insertion**:
   - `ctx.editor.insertText(text)` routes through the active editor adapter (`insertTextAtSelection`):
     - In **Writing Mode (Milkdown)**: Uses ProseMirror transaction insertion at the active selection range (`state.tr.insertText(text, from, to)`), preserving undo history and marking document dirty.
     - In **Code Mode**: Replaces the active `<textarea>` selection range and preserves cursor position.
     - If no editor selection exists or in Reading Mode: safely appends to the document and marks dirty state.

4. **Command Reachability & Shortcut Conflict Handling**:
   - Commands registered via `ctx.commands.registerCommand` are exposed in the **Quick Switcher / Command Palette** (<kbd>Ctrl+P</kbd> / <kbd>Cmd+P</kbd>).
   - Declared keyboard shortcuts are normalized and validated against core reserved shortcuts (`Ctrl+S`, `Ctrl+O`, `Ctrl+N`, `Ctrl+P`, `Ctrl+F`, `Ctrl+Shift+X`, etc.). Conflicts with reserved application shortcuts are rejected with a warning.
   - All registered commands and shortcut listeners are automatically unregistered and disposed when the plugin is toggled off or unloaded.

5. **Failure Reporting & Enabled Intent**:
   - If a plugin fails to load (e.g. missing file, syntax error, or runtime exception), the error is **never swallowed into a silent no-op**.
   - An actionable error message is recorded in the UI (`pluginErrors`) and displayed directly on the plugin card in Settings.
   - The user's enabled intent (`enabled: true`) is preserved in configuration so that repairing the source script automatically restores functionality upon reload.

---

## 6. Local Development & Testing Workflow

1. Open Taleno.
2. Navigate to **File ➔ Preferences ➔ Plugins** (<kbd>Ctrl+Shift+X</kbd>).
3. Click the **"Open Plugins Folder"** button to automatically reveal the application data `plugins/` directory in your native file manager.
4. Create a new folder (e.g. `my-awesome-plugin`) and add `manifest.json` and `main.js`.
5. Return to Taleno and click **"Reload Plugins"**.
6. Your new plugin will immediately appear in the list! Toggle it on and verify execution in DevTools (<kbd>Ctrl+Shift+I</kbd>).

---

## 7. Publishing to the Official Registry

To make your plugin discoverable in Taleno's built-in **Marketplace**:

> [!IMPORTANT]
> **Repository Submission Rule**:
> All external plugins must be submitted to the [**BerryUIKI/Taleno-Plugins**](https://github.com/BerryUIKI/Taleno-Plugins) repository. Do **not** submit third-party plugins as Pull Requests to the core `Taleno` repository.

1. Fork the official [**BerryUIKI/Taleno-Plugins**](https://github.com/BerryUIKI/Taleno-Plugins) repository.
2. Add your plugin under `plugins/<plugin-id>/`.
3. Register your plugin in `plugins.json`.
4. Submit a Pull Request targeting the **`dev`** branch of `BerryUIKI/Taleno-Plugins`.

See the [Taleno-Plugins Submission Guidelines](https://github.com/BerryUIKI/Taleno-Plugins/blob/dev/SUBMISSION_GUIDELINES.md) for full review requirements.
