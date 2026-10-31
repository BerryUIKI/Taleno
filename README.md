<div align="center">

[**English**](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Русский](README.ru.md)

<img src="app-icon.svg" alt="Taleno" width="96" height="96">

# ✨ Taleno

**A Typora-style, local-first, high-performance Markdown reader & in-place WYSIWYG editor.**

<span style="font-size: 13px;">v0.1.11 Released · AGPL-3.0 Open Source</span>

[![Website](https://img.shields.io/badge/website-berryuiki.github.io%2FTaleno-4895ef.svg?style=for-the-badge)](https://berryuiki.github.io/Taleno/)
[![Release](https://img.shields.io/badge/release-latest-4361ee.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-10b981.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6366f1.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/BerryUIKI/Taleno/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white&color=3a0ca3)](https://github.com/BerryUIKI/Taleno/actions)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.85+-DEA584?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9+-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)

<p align="center">
  <b>🚀 Local-first</b> • <b>📝 Zero split-panes</b> • <b>🌐 9 Languages</b> • </p>

[**📥 Download**](#-instant-downloads) · [**🖥️ Interface Preview**](#-interface-preview) · [**🌟 Key Features**](#-key-features) · [**⌨️ Keyboard Shortcuts**](#-keyboard-shortcuts) · [**📚 Documentation**](#-documentation) · [**🌐 Website**](https://berryuiki.github.io/Taleno/)

</div>

> Published desktop release: **v0.1.11 (2026-11-01)**. Later development changes are unreleased. See the [implementation and platform matrix](docs/ARCHITECTURE.md#11-feature--platform-implementation-status-matrix) for actual dependencies, source paths and verification limits. Android/iOS external files, saves and keyboard/safe-area behavior still require device acceptance; signed mobile release jobs are not configured. Startup time and package size vary by build and platform; the performance record, rather than a fixed marketing figure, is authoritative.

---

## 📖 Table of Contents

- [🖥️ Interface Preview](#-interface-preview)
- [📥 Instant Downloads](#-instant-downloads)
- [🌟 Key Features](#-key-features)
- [📊 Feature & Platform Status Matrix](#-feature--platform-status-matrix)
- [💡 Why Taleno?](#-why-Taleno)
- [⌨️ Keyboard Shortcuts](#-keyboard-shortcuts)
- [🛠️ Architecture & Tech Stack](#-architecture--tech-stack)
- [💻 Developer Setup](#-developer-setup)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [💬 Community & Support](#-community--support)
- [❤️ Acknowledgments](#-acknowledgments)
- [📄 License](#-license)

---

## 🖥️ Interface Preview

A real look at Taleno in action — menu bar, multi-tabs, outline sidebar, and in-place WYSIWYG editing, all in one window. No split panes, no previews, no distractions.

<p align="center">
  <img src="assets/Taleno-ui.svg" alt="Taleno in-place WYSIWYG Markdown editor" width="85%">
</p>

> **Reading** · **Writing** · **Code** — three display modes, one keystroke (`Ctrl+/`) to switch.

---

## 📥 Instant Downloads

Choose your platform and package:

- **Windows x86_64:** [Setup (`.exe`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.exe) · [MSI](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.msi)
- **macOS Apple Silicon:** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_aarch64.dmg)
- **macOS Intel:** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_x86_64.dmg)
- **Linux x86_64:** [AppImage](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.AppImage) · [Debian/Ubuntu (`.deb`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.deb) · [Fedora/RHEL (`.rpm`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.rpm)

[View all releases and source archives](https://github.com/BerryUIKI/Taleno/releases/latest).

---

## 📖 Introduction

**Taleno** is an open-source Markdown reader and editor engineered for writers, developers, and researchers who want the speed of plain-text Markdown without the cognitive overhead of split-screen previews.

Built on **Tauri 2** and **Rust** with a fine-grained reactive **SolidJS** frontend, Taleno combines native desktop responsiveness with a minimalist, distraction-free aesthetic.

---

## 🌟 Key Features

| Feature | Highlights | Status |
|---|---|:---:|
| 🌐 **9-Language i18n System** | Native support for **English**, **简体中文**, **繁體中文**, **日本語**, **한국어**, **Deutsch**, **Français**, **Español**, and **Русский** with OS auto-detection and runtime switching | ✅ Complete |
| 🪟 **Platform-Native Window Chrome** | Theme-matched menus with compact custom controls on Windows/Linux and native traffic-light window controls on macOS | ✅ Complete |
| 🏷️ **Windows `.md` File Association** | Automatically associates `.md`, `.markdown`, `.mdx`, and `.txt` files; double-click in Windows Explorer to open directly | ✅ Complete |
| 🔄 **Tri-State Display Modes** | Quickly switch between **Reading** (read-only), **Writing** (Typora-style WYSIWYG), and **Code** (source code with line sync) via `Ctrl+/` | ✅ Complete |
| 📥 **Intelligent Drag & Drop** | Drag file into window to open; drag onto tab bar for new tabs; drag into text to insert formatted Markdown links | ✅ Complete |
| ✍️ **In-Place Formatting** | Format selections directly with standard shortcuts (<kbd>Ctrl+B</kbd> for bold, <kbd>Ctrl+0</kbd> for paragraph, <kbd>Ctrl+1~6</kbd> for headings) | ✅ Complete |
| 🔲 **Monochrome Vector UI** | Pure, minimalist theme-adaptive vector SVGs (`stroke="currentColor"`) that keep focus on your text | ✅ Complete |
| 💾 **Crash-Safe Atomic Saving** | Never lose your work with atomic file writes (`write to .tmp -> rename`) and dirty state tracking | ✅ Complete |
| 📂 **Workspace Tree & Tabs** | Multi-document tabs, recursive file tree CRUD operations, and quick file switcher (<kbd>Ctrl+P</kbd>) | ✅ Complete |
| 🌈 **Code Syntax Highlighting** | High-performance code block highlighting via `syntect` with language tags and copy button | ✅ Complete |
| 📑 **Dynamic Table of Contents** | Interactive document outline with smooth anchor scrolling across all display modes | ✅ Complete |
| 📊 **Mermaid Diagrams & Math Layout** | HTML/CSS containers for flowcharts, sequence diagrams (`mermaid`), and serif LaTeX math formatting (`math`/`katex`/`$$`) | ✅ Complete |
| 🔍 **Native Workspace Search** | Recursive file search in Rust backend (`src-tauri/src/commands/search.rs`) with line match extraction (<kbd>Ctrl+Shift+F</kbd>) and in-document Find & Replace (<kbd>Ctrl+F</kbd> / <kbd>Ctrl+H</kbd>) | ✅ Complete |
| 📤 **Standalone HTML Export** | Export any document to self-contained, offline-styled HTML (<kbd>Ctrl+E</kbd>) | ✅ Complete |
| 🧩 **Plugin System & Extensibility** | Modular extension engine with identifier-derived directory scanning (`plugins/`), hot-reload, sandboxed JS context, and Preferences sub-menu (<kbd>Ctrl+Shift+X</kbd>) | ✅ Complete |

*See the [Roadmap](docs/ROADMAP.md) and [Milestones](docs/MILESTONES.md) for what's planned next.*

---

## 📊 Feature & Platform Status Matrix

### Core Feature Implementation Pathways

| Component | Technology & Implementation Path | Architecture Details | Verification Status |
| :--- | :--- | :--- | :---: |
| **Markdown WYSIWYG Editor** | Milkdown v7 + ProseMirror | In-place editing, ProseMirror transactions, history stack | ✅ Production Ready |
| **GFM AST Parser** | Rust `pulldown-cmark` crate | Zero-copy AST traversal, slugified heading anchors | ✅ Production Ready |
| **Syntax Highlighting** | Rust `syntect` crate | Sublime syntax definitions, language badges, copy button | ✅ Production Ready |
| **Diagram Containers** | Rust parser HTML wrapper | Fenced `mermaid` code transformed into `.mermaid-diagram` container | ✅ Production Ready |
| **Math Block Containers** | Rust parser HTML wrapper | `math`/`katex` and `$$...$$` rendered into styled `.math-block` | ✅ Production Ready |
| **Workspace Search** | Rust async recursive walker | `tokio::fs` directory recursion, case-insensitive line matches | ✅ Production Ready |
| **Crash-Safe File I/O** | Rust atomic tempfile writer | `<filename>.tmp` write + buffer flush + atomic `fs::rename` | ✅ Production Ready |
| **Plugin Runtime** | Sandboxed `TalenoPluginContext` | Isolated storage, lifecycle hooks, identifier-derived data path | ✅ Production Ready |
| **Theme Runtime** | CSS variable token injector | Hot CSS variable overrides on `:root` via `theme.json` + `theme.css` | ✅ Production Ready |
| **Cloud Synchronization** | *None (Intentionally omitted)* | 100% local-first architecture; zero telemetry or cloud lock-in | ⛔ Out of Scope |

### Target Platform Support Matrix

| Platform | Target Architecture | Distribution Formats | Verification Status | Known Limitations & Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Windows** | x86_64, aarch64 | NSIS Installer (`.exe`), WiX MSI (`.msi`) | ✅ Verified | Fully tested on Windows 10/11 local host and CI runners. |
| **macOS** | Apple Silicon (`aarch64`), Intel (`x86_64`) | Apple Disk Image (`.dmg`), App Bundle (`.app`) | ⚠️ CI Verified | Compiles cleanly in GitHub Actions CI. Code signing and notarization require Apple Developer certificate (see [macOS Signing](docs/MACOS_RELEASE_SIGNING.md)). |
| **Linux** | x86_64, aarch64 | AppImage, Debian Package (`.deb`), RPM Package (`.rpm`) | ⚠️ CI Verified | Built in CI matrix. Requires system `webkit2gtk-4.1` and `gtk3` runtime libraries. |
| **Android** | arm64-v8a, armeabi-v7a, x86_64 | Android Package (`.apk`), App Bundle (`.aab`) | 🔄 In Progress | Responsive single-column UI, navigation drawer, and visual viewport virtual keyboard scrolling implemented. Physical device hardware testing and SAF scoped storage validation pending. |
| **iOS** | arm64 | iOS App Archive (`.ipa`) | 🔄 In Progress | Responsive mobile shell and safe-area insets implemented. Physical device testing and security-scoped bookmark sandbox validation pending. |

---

## 💡 Why Taleno?

| | Taleno | Split-Pane Editors | Web-Based Notes |
|---|---|---|---|
| **Rendering** | In-place WYSIWYG, zero panes | Side-by-side preview | Browser tab juggling |
| **Startup** | < 400 ms native cold start | Depends on Electron weight | Page load + sync wait |
| **Privacy** | 100% local-first, zero telemetry | Local files | Data stored on cloud |
| **Offline** | Fully offline | Fully offline | Requires network |
| **Formatting** | Pure Markdown on disk | Proprietary formats possible | Vendor lock-in |

Taleno keeps your documents as **pure Markdown on disk** — portable, diffable, and yours forever. No cloud account, no sync engine, no lock-in.

---

## ⌨️ Keyboard Shortcuts

| Category | Shortcut | Action |
|---|---|---|
| **Document** | <kbd>Ctrl</kbd> + <kbd>N</kbd> | New Document |
| | <kbd>Ctrl</kbd> + <kbd>O</kbd> | Open File... |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> | Open Workspace Folder... |
| | <kbd>Ctrl</kbd> + <kbd>S</kbd> | Save Current Document |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Save As... |
| | <kbd>Ctrl</kbd> + <kbd>W</kbd> | Close Current Tab |
| | <kbd>Ctrl</kbd> + <kbd>E</kbd> | Export Document as HTML... |
| **Editing** | <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Undo / Redo |
| | <kbd>Ctrl</kbd> + <kbd>B</kbd> | Toggle Bold Formatting |
| | <kbd>Ctrl</kbd> + <kbd>I</kbd> | Toggle Italic Formatting |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | Toggle Strikethrough |
| | <kbd>Ctrl</kbd> + <kbd>K</kbd> | Insert / Wrap Link |
| | <kbd>Ctrl</kbd> + <kbd>`</kbd> | Toggle Inline Code |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> | Format as Normal Paragraph |
| | <kbd>Ctrl</kbd> + <kbd>1</kbd> ~ <kbd>6</kbd> | Format as Heading 1 ~ Heading 6 |
| **Navigation & Search** | <kbd>Ctrl</kbd> + <kbd>P</kbd> | Quick File Switcher |
| | <kbd>Ctrl</kbd> + <kbd>F</kbd> | Find in Current Document |
| | <kbd>Ctrl</kbd> + <kbd>H</kbd> | Replace in Current Document |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | Search Across Workspace |
| **View** | <kbd>Ctrl</kbd> + <kbd>/</kbd> | Switch Display Mode (Reading / Writing / Code) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | Toggle Sidebar (Files / Outline) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | Toggle Focus Mode (Distraction-Free) |
| | <kbd>F11</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Toggle Zen Mode (Full-Screen) |
| | <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> | Zoom In / Zoom Out Font Size |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> (NumPad) | Reset Font Size (16px) |
| **Preferences & Plugins** | <kbd>Ctrl</kbd> + <kbd>,</kbd> | Open Preferences / Settings |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | Open Plugins Management Tab |

*(On macOS, replace <kbd>Ctrl</kbd> with <kbd>Cmd</kbd>)*

---

## 🛠️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│               Frontend (SolidJS + Webview)             │
│   • Reactive UI Components (MenuBar, Sidebar, Tabs)   │
│   • Editor Engine (Milkdown / ProseMirror WYSIWYG)     │
│   • Multi-language Engine (Solid Signals, 9 Locales)   │
│   • Typed IPC Wrappers (invoke / listen)               │
└──────────────────────────┬─────────────────────────────┘
                           │ IPC Bridge (JSON / Events)
┌──────────────────────────▼─────────────────────────────┐
│                 Backend (Rust Native App)              │
│   • State Management (Mutex<AppState>)                 │
│   • Native Update Checker (HTTPS Reqwest Client)       │
│   • Atomic File I/O & FS Watcher (notify crate)        │
│   • Zero-Copy AST Parser (pulldown-cmark)              │
│   • Code Syntax Highlighter (syntect)                  │
└────────────────────────────────────────────────────────┘
```

---

## 💻 Developer Setup

### Prerequisites
* [Node.js](https://nodejs.org/) ^22.22.2 || ^24.15.0 || >=26.0.0 (Node 24 LTS recommended)
* [pnpm](https://pnpm.io/) 9+
* [Rust](https://rustup.rs/) 1.85+
* [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Clone & Run Locally
```bash
git clone https://github.com/BerryUIKI/Taleno.git
cd Taleno

# Install frontend dependencies
pnpm install

# Start local Tauri dev server
pnpm tauri dev
```

### Tests & Verification
```bash
# Strict TypeScript type check and linter
pnpm lint

# Run all Rust unit tests
cargo test --manifest-path src-tauri/Cargo.toml

# Run frontend unit tests (Vitest)
pnpm test
```

### Production Build
```bash
# Build standalone executable & OS installers
pnpm tauri build
```

---

## 📚 Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design & data flow |
| [DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | Architecture Decision Records (ADRs) |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Developer setup & debug guide |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Contribution guidelines & conventions |
| [COLLABORATION.md](docs/COLLABORATION.md) | Team workflow & review rules |
| [ROADMAP.md](docs/ROADMAP.md) | Phased feature roadmap & MoSCoW |
| [MILESTONES.md](docs/MILESTONES.md) | Milestones & schedule |
| [NEXT_STEPS.md](docs/NEXT_STEPS.md) | Phase 2 implementation blueprint |
| [PLUGIN_DEVELOPMENT.md](docs/PLUGIN_DEVELOPMENT.md) | Plugin developer guide, APIs & standards |
| [THEME_DEVELOPMENT.md](docs/THEME_DEVELOPMENT.md) | Theme & skin developer guide, CSS tokens & palette spec |

---

## 🤝 Contributing

Contributions are warmly welcome — bug reports, feature ideas, translations, and pull requests alike.

1. Fork the repository and create a branch from `dev`.
2. Follow the [Contributing Guide](docs/CONTRIBUTING.md) and [Collaboration Handbook](docs/COLLABORATION.md).
3. Keep commits in [Conventional Commits](https://www.conventionalcommits.org/) format.
4. Open a pull request against `dev`.

All commit messages follow the format: `<type>(<scope>): <short summary>` — e.g. `feat(editor): integrate Milkdown core in-place WYSIWYG renderer`.

---

## 💬 Community & Support

- 🐛 [Report a Bug / Request a Feature](https://github.com/BerryUIKI/Taleno/issues)
- 🌐 [Website](https://berryuiki.github.io/Taleno/)
- 💡 [Start a Discussion](https://github.com/BerryUIKI/Taleno/discussions)
- 🔒 [Security Policy](https://github.com/BerryUIKI/Taleno/security)
- 📦 [All Releases](https://github.com/BerryUIKI/Taleno/releases)

---

## ❤️ Acknowledgments

Taleno stands on the shoulders of these amazing open-source projects:

- [Tauri 2](https://tauri.app) — lightweight, secure desktop shell
- [Rust](https://www.rust-lang.org/) — memory-safe native backend
- [SolidJS](https://www.solidjs.com/) — fine-grained reactive frontend
- [Milkdown](https://milkdown.dev) / [ProseMirror](https://prosemirror.net) — WYSIWYG editing engine
- [pulldown-cmark](https://github.com/pulldown-cmark/pulldown-cmark) — zero-copy GFM AST parsing
- [syntect](https://github.com/trishume/syntect) — code syntax highlighting
- [notify](https://github.com/notify-rs/notify) — file system watching
- [tokio](https://tokio.rs) — asynchronous runtime & file search
- [Mermaid](https://mermaid.js.org) — diagrams
- [KaTeX](https://katex.org) — math rendering
- [Tailwind CSS](https://tailwindcss.com) — utility-first styling

---

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for details.

If you modify Taleno and run it as a network service, AGPL-3.0 requires you to make your modified source code available to its users.
