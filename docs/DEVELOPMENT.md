# Taleno Development Guide

Welcome to the Taleno developer documentation! This guide covers the prerequisites, setup instructions, development workflows, project conventions, and debugging tips needed to build and contribute to Taleno.

---

## 1. Prerequisites

Before setting up Taleno locally, ensure your environment meets the following requirements:

- **Node.js**: `^22.22.2 || ^24.15.0 || >=26.0.0` (Node 24 LTS recommended; required by jsdom 30+ ESM dependency chain)
- **Package Manager**: `pnpm` `v9.0.0` or higher (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Rust Toolchain**: `v1.85.0` or higher (Rust 2024 edition compatible)
  - Install via [rustup.rs](https://rustup.rs/): `rustup update stable`
- **Tauri v2 Prerequisites**: Native system libraries for building desktop webviews:
  - **Windows**: Microsoft Visual Studio C++ Build Tools & WebView2 Runtime
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: WebKitGTK, libsoup, and build essentials (e.g., `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`)
  - **Mobile (iOS & Android)**: Xcode 15+ / iOS simulator targets, Android Studio / NDK r26+ / Android SDK API 34+ / JDK 17+. See detailed [Mobile Development Guide](MOBILE_DEVELOPMENT.md).
  - Refer to the official [Tauri v2 Prerequisites Guide](https://v2.tauri.app/start/prerequisites/) for OS-specific instructions.

---

## 2. Getting Started

### 2.1. Clone and Install Dependencies

```bash
# Clone repository
git clone https://github.com/your-username/Taleno.git
cd Taleno

# Install frontend dependencies
pnpm install
```

### 2.2. Start the Development Server

Launch both Vite and the Tauri desktop development shell:

```bash
pnpm tauri dev
```

This starts the Vite HMR server on `http://localhost:1420` and compiles the Rust backend in debug mode, opening the native application window.

---

## 3. Project Structure Overview

```
Taleno/
├── .github/                  # CI/CD workflows and issue templates
├── docs/                     # Project architecture and technical guides
├── src/                      # SolidJS Frontend Application
│   ├── assets/               # Icons, images, fonts
│   ├── components/           # SolidJS UI components
│   │   ├── common/           # Shared buttons, dialogs, dropdowns
│   │   ├── editor/           # Milkdown editor wrapper & toolbar
│   │   ├── sidebar/          # Workspace file tree
│   │   └── statusbar/        # Document statistics & status bar
│   ├── lib/                  # Library wrappers & helpers
│   │   ├── milkdown/         # Milkdown plugins and themes
│   │   ├── tauri/            # Typed Tauri IPC wrappers
│   │   └── utils/            # Helper utilities (platform, shortcuts)
│   ├── store/                # SolidJS state management (signals & stores)
│   ├── styles/               # CSS variables and Tailwind styling
│   ├── types/                # Shared TypeScript definitions
│   ├── App.tsx               # Root application shell
│   ├── index.html            # Main HTML entry point
│   └── main.tsx              # Application mount script
├── src-tauri/                # Rust Backend (Tauri 2)
│   ├── capabilities/         # Tauri security capabilities & permissions
│   ├── icons/                # Multi-platform app icons
│   ├── src/
│   │   ├── commands/         # Tauri IPC command entry points
│   │   ├── models/           # Domain data structures
│   │   ├── services/         # Business logic (atomic I/O, parsing, highlighting)
│   │   ├── state.rs          # Managed AppState
│   │   ├── lib.rs            # Application builder & plugin registration
│   │   └── main.rs           # Desktop process entry point
│   ├── Cargo.toml            # Rust dependencies & metadata
│   └── tauri.conf.json       # Tauri 2 configuration
├── package.json              # Frontend dependencies & scripts
├── tsconfig.json             # TypeScript configuration (strict)
└── vite.config.ts            # Vite 6 configuration
```

---

## 4. Development Commands

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Run Vite development server only (browser-mode preview). |
| `pnpm tauri dev` | Launch full Tauri 2 desktop app in development mode with HMR. |
| `pnpm build` | Type-check TypeScript and build production frontend assets. |
| `pnpm tauri build` | Compile optimized production desktop binary and installers. |
| `pnpm tauri ios init` | Scaffold native iOS project (`src-tauri/gen/apple/`). |
| `pnpm tauri ios dev` | Run development build on connected iOS simulator or device with HMR. |
| `pnpm tauri ios build` | Compile production iOS app bundle and archive. |
| `pnpm tauri android init` | Scaffold native Android Studio project (`src-tauri/gen/android/`). |
| `pnpm tauri android dev` | Run development build on connected Android emulator or device with HMR. |
| `pnpm tauri android build --apk` | Build standalone production Android APK package. |
| `pnpm tauri android build --aab` | Build Google Play production Android App Bundle (AAB). |
| `pnpm test` | Run frontend unit and integration tests via **Vitest**. |
| `pnpm test:e2e` | Run end-to-end desktop test suite via **Playwright**. |
| `cargo test --manifest-path src-tauri/Cargo.toml` | Execute Rust unit and integration test suites. |
| `cargo clippy --manifest-path src-tauri/Cargo.toml` | Run Rust linter and static analysis checks. |
| `pnpm lint` | Run strict TypeScript compiler verification without emitting assets (`tsc --noEmit`). |

---

## 5. Frontend Development

### 5.1. SolidJS Components
- Taleno leverages SolidJS's fine-grained reactivity. Use `createSignal`, `createMemo`, and `createEffect` deliberately.
- Avoid wrapping UI in heavy lifecycle abstractions. Solid components execute only **once** during setup; reactive JSX bindings update specific DOM nodes directly.
- Maintain isolated component state in `src/store/` using Solid's `createStore` or modular signals.

### 5.2. Milkdown Editor Integration
- Milkdown wraps ProseMirror inside a modular plugin architecture.
- All editor interactions (formatting, block creation, markdown serialization) must be managed through Milkdown actions or ProseMirror commands.
- Editor instances are initialized via the Milkdown composition API (`Editor.make()`) and mounted in `src/components/editor/MilkdownEditor.tsx`.

### 5.3. Tailwind CSS 4 Styling
- Use utility classes defined in `src/styles/`.
- Dynamic theming (dark/light mode) is driven via CSS variables in `src/styles/theme.css` and mapped to Tailwind colors (e.g., `bg-[var(--bg-primary)]`, `text-[var(--text-primary)]`).

---

## 6. Backend Development

### 6.1. Architecture Principles
- **Commands (`src-tauri/src/commands/`)**: Lightweight handler functions annotated with `#[tauri::command]`. Validate inputs and delegate immediately to services.
- **Services (`src-tauri/src/services/`)**: Pure business logic (e.g., atomic file writes, GFM parsing, syntax highlighting). Keep services decoupled from the Tauri window runtime where possible for easier unit testing.
- **Models (`src-tauri/src/models/`)**: Serializable Rust structs representing data contracts between Rust and TypeScript.

---

## 7. Step-by-Step: Adding a New IPC Command

Follow these steps whenever you create a new backend command:

### Step 1: Define the Data Model
If the command requires structured input or output, define the types in `src-tauri/src/models/`:

```rust
// src-tauri/src/models/payload.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WordCountResult {
    pub words: usize,
    pub characters: usize,
}
```

### Step 2: Implement the Service Logic
Implement pure logic inside `src-tauri/src/services/`:

```rust
// src-tauri/src/services/parser.rs
pub fn count_words_and_chars(text: &str) -> (usize, usize) {
    let words = text.split_whitespace().count();
    let characters = text.chars().count();
    (words, characters)
}
```

### Step 3: Implement the Command Handler
Create the command in `src-tauri/src/commands/`:

```rust
// src-tauri/src/commands/editor.rs
use tauri::command;
use crate::models::payload::WordCountResult;
use crate::services::parser;

#[command]
pub async fn calculate_stats(content: String) -> Result<WordCountResult, String> {
    let (words, characters) = parser::count_words_and_chars(&content);
    Ok(WordCountResult { words, characters })
}
```

### Step 4: Register the Command in `lib.rs`
Register your command handler in the invoke handler macro in `src-tauri/src/lib.rs`:

```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        commands::editor::calculate_stats,
        // other commands...
    ])
```

### Step 5: Expose Strongly Typed Frontend Wrapper
Define the TypeScript interface and wrapper in `src/lib/tauri/commands.ts`:

```typescript
// src/lib/tauri/commands.ts
import { invoke } from "@tauri-apps/api/core";

export interface WordCountResult {
  words: number;
  characters: number;
}

export async function calculateStats(content: string): Promise<WordCountResult> {
  return await invoke<WordCountResult>("calculate_stats", { content });
}
```

---

## 8. Testing Strategy & Coverage

Taleno maintains a multi-tiered automated verification strategy:

### 8.1. Rust Unit & Integration Tests
- **Scope**: Atomic file operations, parent directory path containment, manifest validation, crash recovery rollback, zero-copy markdown parsing, syntect syntax highlighting, and filesystem watchers.
- **Run command**: `cargo test --manifest-path src-tauri/Cargo.toml`
- **Lint & style**: `cargo fmt --manifest-path src-tauri/Cargo.toml --check` and `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`.

### 8.2. Frontend Unit & Integration Tests (Vitest)
- **Scope**: Reactive signals and stores, document integrity guards, tab management, format actions, internationalization, updater guards, and component rendering in simulated jsdom environments.
- **Run command**: `pnpm test`
- **Prerequisites**: Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`.

### 8.3. Browser End-to-End Tests (Playwright)
- **Scope**: Complete user journeys including document creation, live ProseMirror typing, word counting, dirty state indicators, tab switching, unsaved changes close protection modal, and display mode transitions (Writing, Reading, Code).
- **Run command**: `pnpm test:e2e`
- **Prerequisites**: Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`, Chromium installed via `pnpm exec playwright install chromium`.
- **Browser vs Native Coverage**:
  - *Browser E2E (`pnpm test:e2e`)*: Verifies DOM reactivity, editor state, tab isolation, and modal flows via mock IPC bridge in Chromium.
  - *Native Desktop Verification*: Native OS file pickers, system shell operations, OS window management, updater downloads, and mobile sandbox / visualViewport interactions require native desktop builds (`pnpm tauri dev` / `pnpm tauri build`) or physical device testing.

---

## 9. Code Style & Conventions

- **TypeScript**:
  - Strict mode enabled (`"strict": true` in `tsconfig.json`).
  - No `any` types; prefer `unknown` or explicit generic types.
  - PascalCase for components (`FileTree.tsx`), camelCase for utilities (`atomicWriter.ts`).
- **Rust**:
  - Rust 2024 edition conventions.
  - Follow standard `rustfmt` formatting.
  - Return `Result<T, AppError>` for all fallible operations; avoid `unwrap()` or `expect()` in command handlers.
- **Git Commit Messages**: Follow the Conventional Commits specification (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

---

## 10. Debugging Tips

### 10.1. Frontend & WebView DevTools
- In development mode (`pnpm tauri dev`), right-click anywhere in the app window and select **Inspect Element** to open DevTools.
- Alternatively, toggle DevTools programmatically or press `F12` (on Windows/Linux) or `Option+Cmd+I` (on macOS).

### 10.2. Rust Backend Logging
- Taleno includes structured logging via the `tracing` or `log` crate.
- View real-time backend logs directly in your terminal where `pnpm tauri dev` is running.
- Set log level via environment variables:
  ```bash
  RUST_LOG=Taleno=debug,tauri=info pnpm tauri dev
  ```

### 10.3. Tauri IPC Debugging
- Log IPC payloads in the frontend console by inspecting `window.__TAURI_INTERNALS__` if needed.
- Write unit tests for command handlers directly in Rust using mock state containers.
