# Architecture Decision Records (ADR)

This document records the foundational architectural decisions made during the design and development of Taleno. Each record follows the Context, Decision, Rationale, and Consequences format.

---

## Table of Decisions

- [ADR-001: SolidJS over React for Frontend](#adr-001-solidjs-over-react-for-frontend)
- [ADR-002: Milkdown over TipTap for Editor Core](#adr-002-milkdown-over-tiptap-for-editor-core)
- [ADR-003: pulldown-cmark for Rust-side Markdown Parsing](#adr-003-pulldown-cmark-for-rust-side-markdown-parsing)
- [ADR-004: Atomic File Writes for Document Persistence](#adr-004-atomic-file-writes-for-document-persistence)
- [ADR-005: Tauri v2 Capability-Based Security Model](#adr-005-tauri-v2-capability-based-security-model)
- [ADR-006: Native Title Bar for MVP](#adr-006-native-title-bar-for-mvp)

---

## ADR-001: SolidJS over React for Frontend

### Context
A high-performance Markdown editor requires fast typing latency (<16ms), instant status updates (word count, line numbers, cursor position), and responsive sidebar navigation. React uses a Virtual DOM (VDOM) diffing mechanism that triggers component re-renders and reconciliation across component subtrees unless heavily memoized.

### Decision
Use **SolidJS** instead of React as the primary frontend UI framework.

### Rationale
- **Fine-Grained Reactivity**: SolidJS compiles JSX directly into precise DOM mutation instructions. Components execute only once during setup; individual signals trigger fine-grained DOM node updates with zero VDOM diffing overhead.
- **Minimal Memory & CPU Footprint**: Eliminating VDOM reconciliation keeps the WebView lightweight and responsive even with large documents open.
- **Clean Signal Integration**: Solid signals integrate seamlessly with ProseMirror and Milkdown event hooks without triggering entire view re-renders.

### Consequences & Trade-offs
- **Trade-off**: The SolidJS ecosystem is smaller than React's. Framework-specific wrappers for third-party tools are fewer.
- **Mitigation**: Milkdown provides a vanilla JavaScript composition API (`@milkdown/core`) which integrates cleanly into SolidJS `onMount` lifecycle hooks.

---

## ADR-002: Milkdown over TipTap for Editor Core

### Context
Taleno aims to deliver a seamless in-place WYSIWYG experience where users edit Markdown natively without switching between raw code and split-pane preview modes. Most rich text editors (such as TipTap, Slate, or Quill) model their document state internally as JSON/HTML and rely on lossy serialization layers to convert back and forth to Markdown.

### Decision
Adopt **Milkdown** (built on top of ProseMirror) as the core editor engine rather than TipTap.

### Rationale
- **Markdown-First Internal State**: Milkdown uses a Markdown Abstract Syntax Tree (AST) powered by `remark` as its native data representation. Round-tripping between disk and the editor surface is lossless and preserves custom Markdown syntax.
- **ProseMirror Foundation**: Built on the proven ProseMirror transaction model, ensuring reliable undo/redo histories, robust selection handling, and extensible plugin architecture.
- **In-Place WYSIWYG Interaction**: Milkdown is architected from the ground up for seamless inline Markdown editing.

### Consequences & Trade-offs
- **Consequences**: Complex custom ProseMirror schema extensions require familiarity with both Milkdown's plugin API and ProseMirror's transaction pipeline.

---

## ADR-003: pulldown-cmark for Rust-side Markdown Parsing

### Context
The Rust backend requires a fast, reliable Markdown parser for non-editor operations: server-side HTML/PDF export, headless document statistics, search indexing, and table of contents generation.

### Decision
Use **`pulldown-cmark`** for all Rust-side Markdown parsing and transformation tasks.

### Rationale
- **Zero-Copy Pull Parser**: `pulldown-cmark` is implemented as an event-driven pull-parser iterator with zero-copy string slicing, making it the fastest pure-Rust Markdown parser available.
- **Full CommonMark & GFM Compliance**: Comprehensive support for GitHub Flavored Markdown extensions (tables, task lists, strikethrough, footnotes, heading attributes).
- **Safety & Performance**: Pure Rust with no C/C++ FFI dependencies, minimizing compile times and memory safety risks.

### Consequences & Trade-offs
- Client-side editing runs via Milkdown/Remark, while server-side export/indexing runs via `pulldown-cmark`. Both adhere strictly to the CommonMark and GFM specifications to maintain output parity.

---

## ADR-004: Atomic File Writes for Document Persistence

### Context
In a desktop document editor, unexpected power loss, application crashes, or operating system errors during a write operation can cause catastrophic file corruption or truncation if the target file is overwritten in-place.

### Decision
Implement all document saves through an **Atomic File Write** service in Rust.

### Rationale
- **Atomic Replacement**: The file is first written to a temporary sibling file (`<path>.tmp`). Only after userspace buffers are flushed does the OS atomically rename and replace the target file (`tokio::fs::rename`). On NTFS, APFS, and ext4, atomic rename guarantees readers see either the intact pre-existing file or the completed new file, preventing torn or partially written documents.
- **Process Crash Resilience**: If an application crash or write error occurs mid-write, the original document remains completely untouched on disk.
- **Durability Distinction**: Atomic file replacement via buffer flush and rename protects against process crashes and write interruptions; confirmed hardware power-loss durability requires synchronous disk barriers (`sync_all`/`sync_data`), which carries significant I/O latency on rotating media and is distinguished from atomic replacement.
- **Platform Behavior & Failure Handling**: Temporary sibling files reside in the same parent directory to ensure rename operations stay within the same filesystem mount. If writing or renaming fails (e.g. read-only volume, permissions error, or disk quota exhaustion), an `FsError` is returned to the frontend, leaving the original target file undamaged and keeping the document dirty in the editor.

### Consequences & Trade-offs
- Requires write permissions in the target directory to create sibling `.tmp` files.
- Same-volume requirement: temporary sibling files must share the target filesystem mount for POSIX atomic rename semantics.
- Negligible disk I/O overhead on save, vastly outweighed by data safety guarantees.

---

## ADR-005: Tauri v2 Capability-Based Security Model

### Context
Desktop applications with embedded WebViews must protect against remote code execution, unauthorized filesystem access, and arbitrary IPC invocation if untrusted content is rendered.

### Decision
Utilize **Tauri v2's Capability-Based Security System** with least-privilege permissions.

### Rationale
- **Explicit Scoping**: File system read and write permissions are strictly scoped to user-selected files and opened workspace directories. No wildcard `fs:*` permissions are granted.
- **Strict Content Security Policy (CSP)**: Disallows inline script execution of untrusted scripts and forbids unauthorized network requests.
- **Zero Remote Origin Access**: Only the local frontend application bundle (`http://localhost:1420` in dev or `tauri://localhost` in production) is permitted to call Tauri commands.

### Consequences & Trade-offs
- New features requiring native capabilities must have their permissions explicitly declared in `src-tauri/capabilities/default.json`.

---

## ADR-006: Platform-Appropriate Window Chrome

### Context
Modern desktop apps often choose between standard OS-provided window decorations (native title bar) and custom client-side window frames (frameless window with custom close/minimize buttons and embedded menu bars).

### Decision
Use platform-appropriate window chrome. Windows and Linux retain Taleno's
frameless, theme-matched title bar. macOS uses native window decorations with
an overlay title bar, native traffic-light controls, and spacing in the in-app
menu row that respects those controls.

### Rationale
- **macOS Consistency & Accessibility**: Native traffic-light controls preserve familiar window management and accessibility behavior.
- **Cross-Platform Fit**: Windows and Linux keep the compact custom controls designed for Taleno's menu bar.
- **Maintainability**: Tauri's macOS-specific configuration owns the native window behavior while the frontend only adjusts layout and control visibility.

### Consequences & Trade-offs
- Platform chrome changes must be verified against both the base Tauri configuration and `tauri.macos.conf.json`.
- The menu bar must reserve enough leading space for macOS traffic-light controls.
