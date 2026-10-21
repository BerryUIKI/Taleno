# Taleno Mobile Development Guide (iOS & Android)

> Current status (2026-10-21): this is a development/design guide. Shared responsive UI exists; Android SAF and iOS security-scoped bookmark adapters and signed mobile release jobs are not implemented. Commands/examples below describe work needed and do not establish acceptance. Mobile tags fail explicitly before desktop packaging. #84, #96 and #102 await physical-device testing; the owner currently has no devices available.


This guide provides technical specifications, architectural constraints, setup instructions, development workflows, and debugging strategies for building and maintaining **Taleno** on mobile platforms (**iOS** and **Android**) using **Tauri 2**, **Rust**, and **SolidJS**.

---

## 1. Architectural Mental Model for Mobile

Taleno on mobile operates under the same core local-first philosophy as desktop, but with critical adaptations for mobile operating systems, sandboxed file storage, touch-first ergonomics, and responsive display viewports:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Mobile Frontend (SolidJS + Webview)                  │
│   • Responsive Shell (Drawer Navigation, Bottom Action Bar, FAB)       │
│   • Safe-Area & Viewport Management (env(safe-area-inset-*), VVP API)  │
│   • Touch-Optimized Editor (Tap-to-focus, selection handles, haptics)  │
│   • Typed IPC Layer (Commands, Events, Native Pickers)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Tauri 2 IPC Bridge
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Rust Native Core (Tauri 2 Mobile)                   │
│   • Shared Business Logic (Parser, syntect, atomic state)              │
│   • Mobile File Services (App Sandbox, Cache, Scoped Storage)          │
│   • Native Integration (UIDocumentPicker / SAF DocumentProvider)       │
│   • Mobile Lifecycle Hooks (Background, Foreground, Resume, Suspend)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JNI / C-FFI / Swift Bridge
┌───────────────────────────────────▼────────────────────────────────────┐
│                   Host OS Platforms (iOS & Android)                    │
│   • iOS: WebKit WKWebView + Swift / Objective-C runtime                │
│   • Android: Android System WebView (Chromium) + Kotlin / NDK runtime  │
│   • Sandboxed Storage & Cloud Providers (Files.app / iCloud, SAF)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Prerequisites

Before developing or compiling for mobile targets, configure your local environment according to the target operating system.

### 2.1. Common Prerequisites
- **Node.js**: `v20.0.0+`
- **pnpm**: `v9.0.0+`
- **Rust Toolchain**: `v1.85.0+` (`rustup default stable`)
- **Tauri CLI**: `v2.0.0+` (`pnpm add -D @tauri-apps/cli@latest`)

---

### 2.2. iOS Development Prerequisites (macOS Host Only)
1. **Xcode**: Xcode 15.0+ with Command Line Tools (`xcode-select --install`).
2. **CocoaPods** or **Swift Package Manager**: Recommended `brew install cocoapods`.
3. **Rust iOS Targets**:
   ```bash
   rustup target add aarch64-apple-ios          # Physical iOS devices (arm64)
   rustup target add aarch64-apple-ios-sim      # Apple Silicon iOS Simulator (M1/M2/M3/M4)
   rustup target add x86_64-apple-ios           # Intel Mac iOS Simulator
   ```
4. **iOS Simulator**: Installed via Xcode `Settings > Platforms > iOS`.

---

### 2.3. Android Development Prerequisites (macOS, Linux, or Windows Host)
1. **Android Studio**: Latest stable release (Ladybug / Hedgehog or newer).
2. **Android SDK & Build Tools**:
   - Android SDK Platform `API 34` (or `API 35`).
   - Android SDK Build-Tools `34.0.0+`.
   - Android NDK `r26` or higher (`ndk;26.x.x` or `ndk;27.x.x`).
   - Android SDK Command-line Tools (latest).
   - CMake `3.22.1+`.
3. **JDK (Java Development Kit)**: OpenJDK 17 or 21 (`brew install openjdk@17` or via Android Studio bundled JDK).
4. **Environment Variables**: Add to `~/.zshrc` or `~/.bashrc`:
   ```bash
   export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" # macOS example
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk 2>/dev/null | sort -V | tail -n 1)"
   export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
   ```
5. **Rust Android Targets**:
   ```bash
   rustup target add aarch64-linux-android      # Modern 64-bit ARM devices
   rustup target add armv7-linux-androideabi    # 32-bit ARM devices
   rustup target add i686-linux-android         # 32-bit x86 emulators
   rustup target add x86_64-linux-android       # 64-bit x86_64 emulators
   ```

---

## 3. Project Initialization for Mobile

To generate native iOS and Android host projects within Tauri 2:

```bash
# 1. Initialize iOS project structure (creates src-tauri/gen/apple)
pnpm tauri ios init

# 2. Initialize Android project structure (creates src-tauri/gen/android)
pnpm tauri android init
```

### Generated Directory Layout:
```
src-tauri/
├── capabilities/
│   ├── default.json          # Desktop permissions
│   └── mobile.json           # Mobile-specific least-privilege capability permissions
├── gen/
│   ├── android/              # Generated Android Studio Gradle project
│   │   ├── app/
│   │   └── build.gradle.kts
│   └── apple/                # Generated Xcode workspace & project
│       ├── Taleno_iOS/
│       └── Taleno.xcodeproj
├── src/
│   └── lib.rs                # Entry point annotated with #[cfg_attr(mobile, tauri::mobile_entry_point)]
└── tauri.conf.json
```

---

## 4. Mobile Development Workflows

### 4.1. Running in Development Mode

#### iOS Simulator / Device:
```bash
# List available iOS simulators
xcrun simctl list devices available | grep -i "iphone"

# Run on the default iOS Simulator with HMR
pnpm tauri ios dev

# Run on a specific target device or simulator
pnpm tauri ios dev --target aarch64-apple-ios-sim
```

#### Android Emulator / Device:
```bash
# List available Android emulators (AVDs)
emulator -list-avds

# Start an Android emulator
emulator -avd Pixel_8_API_34 &

# Run on connected Android device or running emulator with HMR
pnpm tauri android dev
```

---

### 4.2. Production Builds & Packaging

#### iOS (Archive & IPA):
```bash
# Build production iOS app bundle
pnpm tauri ios build

# Open Xcode workspace for signing, provisioning profiles, and TestFlight distribution
open src-tauri/gen/apple/Taleno.xcodeproj
```

#### Android (APK & AAB):
```bash
# Build universal APK for local testing / sideloading
pnpm tauri android build --apk

# Build Google Play production Android App Bundle (AAB)
pnpm tauri android build --aab
```

---

## 5. Mobile Architectural Adaptations

### 5.1. Storage & Sandboxed File Access
Desktop operating systems provide arbitrary filesystem access subject to user privileges. Mobile operating systems strictly isolate apps in secure sandboxes:

| Concern | iOS | Android |
| :--- | :--- | :--- |
| **App-Private Storage** | `NSDocumentDirectory` / `NSCachesDirectory` | `Context.getFilesDir()` / `Context.getCacheDir()` |
| **External Documents** | `UIDocumentPickerViewController` / Security-Scoped Bookmarks | Storage Access Framework (SAF) / Content URIs (`content://`) |
| **iCloud / Cloud Drive** | Native Files.app container integration (`UbiquityContainer`) | Google Drive / OneDrive SAF document providers |
| **File Watching** | Polling or FSEvents on local container; suspend on background | FileObserver / notify with pause on background |

#### Atomic Writes on Mobile:
The atomic file write service (`write to .tmp` -> `flush` -> `fs::rename`) implemented in `fs_service.rs` must operate within the app's sandboxed document root or over resolved security-scoped paths.

---

### 5.2. Viewport, Safe-Area & Virtual Keyboard

1. **Safe-Area Insets**:
   Mobile devices feature notches, dynamic islands, home indicator bars, and rounded display corners. All root containers must utilize CSS env variables:
   ```css
   .mobile-root-container {
     padding-top: env(safe-area-inset-top, 0px);
     padding-bottom: env(safe-area-inset-bottom, 0px);
     padding-left: env(safe-area-inset-left, 0px);
     padding-right: env(safe-area-inset-right, 0px);
   }
   ```

2. **Virtual Keyboard Handling**:
   When the on-screen keyboard appears on iOS and Android:
   - Use `window.visualViewport` to dynamically adjust the editor container height without squishing toolbars.
   - Maintain cursor visibility by scrolling active ProseMirror selection into view upon `focus` and `selectionChange`.
   - Prevent unwanted elastic scroll on root containers with `overscroll-behavior-y: none`.

3. **Touch-First UI Patterns**:
   - **Navigation Drawer**: Replace the desktop three-column layout on compact viewports (< 768px) with a swipeable slide-over navigation drawer.
   - **Bottom Action Bar**: Position primary markdown actions (Bold, Italic, Heading, List, Undo/Redo) within reach of the thumb at the bottom of the screen.
   - **Target Sizing**: All touch targets must adhere to a minimum size of `44x44 pt` (iOS HIG) / `48x48 dp` (Material Design).

---

## 6. Remote Debugging & Diagnostics

### 6.1. Debugging iOS WebView (Safari Web Inspector)
1. In the iOS Simulator or on a connected iPhone: Open `Settings > Safari > Advanced` and enable **Web Inspector**.
2. On macOS host: Open **Safari** > `Develop > [Device Name] > Taleno`.
3. Inspect DOM trees, debug SolidJS signals, view console logs, and monitor network requests.

### 6.2. Debugging Android WebView (Chrome DevTools)
1. On connected Android device: Enable **Developer Options** and **USB Debugging**.
2. On host machine: Open Google Chrome and navigate to `chrome://inspect/#devices`.
3. Click **Inspect** under the `Taleno` WebView process to open standard Chrome DevTools with full source maps and memory profiler.

---

## 7. Mobile Security & Capabilities in Tauri v2

Mobile capability configurations must be strictly defined in `src-tauri/capabilities/mobile.json` with least-privilege scoping:

```json
{
  "$schema": "../gen/schemas/mobile-schema.json",
  "identifier": "mobile-capability",
  "description": "Permissions for mobile runtime on iOS and Android",
  "windows": ["main"],
  "platforms": ["iOS", "android"],
  "permissions": [
    "core:default",
    "dialog:default",
    "fs:default",
    "process:default"
  ]
}
```

---

## 8. Quality Assurance & Mobile Acceptance Checklist

Before submitting a pull request for mobile features, verify the following:

- [ ] **Cross-Platform Compilation**: Rust backend compiles for both `aarch64-apple-ios-sim` and `aarch64-linux-android` without target-specific compiler errors.
- [ ] **Layout Responsiveness**: UI adapts gracefully from small phone screens (375px width) to tablets/iPads (1024px+ width).
- [ ] **Safe-Area Compliance**: Content is never obscured by notches, dynamic islands, or navigation gesture bars.
- [ ] **Keyboard Ergonomics**: Typing and scrolling in WYSIWYG, Reading, and Code modes remain responsive with the virtual keyboard active.
- [ ] **File Integrity**: Creating, reading, editing, and saving Markdown documents within the mobile document container succeeds without data loss.
- [ ] **Battery & Memory Efficiency**: Inactive timers and background file watchers pause when the mobile app is sent to the background (`visibilitychange` / `app:paused`).

---

## 9. Platform-Split Release Track & Git Tag Conventions

Taleno adopts a unified single-repository architecture with **independent platform release tags** to enable decoupled release schedules across desktop and mobile app stores:

| Platform Target | Git Tag Format | Example Tag | Output Package | Distribution Channel |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop / PC** | `vX.Y.Z` | `v0.2.0` | `.dmg`, `.msi`, `.exe`, `.deb` | GitHub Releases / Direct Download |
| **Android** | `vX.Y.Z-android` | `v0.1.9-android` | `app-universal-release.aab`, `.apk` | Google Play Store / GitHub Releases |
| **iOS** | `vX.Y.Z-ios` | `v0.1.9-ios` | `.ipa`, Archive | Apple App Store / TestFlight |

### Build & Release Commands

```bash
# 1. Android Release Packaging (Google Play AAB & Direct APK)
pnpm tauri android build --aab
pnpm tauri android build --apk --target aarch64

# 2. iOS Release Packaging (App Store / TestFlight Archive)
pnpm tauri ios build
```
