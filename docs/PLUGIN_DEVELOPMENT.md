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

## 5. Security & Sandbox Constraints

Taleno's architecture prioritizes user data protection and stability:

1. **Least-Privilege Scopes**:
   - `commands`: Ability to register actions into the command palette.
   - `editor:read`: Ability to inspect document Markdown text.
   - `editor:write`: Ability to append or replace Markdown text.
   - `storage`: Isolated persistent key-value configuration.
2. **Forbidden Practices**:
   - Dynamic remote code execution (`eval`, unpinned remote `import()`).
   - Unsandboxed network exfiltration or background telemetry.
   - Modifying non-Markdown binary formats or tampering with system files.

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
