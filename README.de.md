<div align="center">

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [**Deutsch**](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Русский](README.ru.md)

<img src="app-icon.svg" alt="Taleno" width="96" height="96">

# ✨ Taleno

**Ein lokaler, blitzschneller Markdown-Reader & In-Place-WYSIWYG-Editor im Typora-Stil.**

<span style="font-size: 13px;">v0.1.10 veröffentlicht · AGPL-3.0 Open Source</span>

[![Website](https://img.shields.io/badge/website-berryuiki.github.io%2FTaleno-4895ef.svg?style=for-the-badge)](https://berryuiki.github.io/Taleno/)
[![Release](https://img.shields.io/badge/release-latest-4361ee.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-10b981.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6366f1.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/BerryUIKI/Taleno/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white&color=3a0ca3)](https://github.com/BerryUIKI/Taleno/actions)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.85+-DEA584?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9+-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)

<p align="center">
  <b>🚀 Lokal zuerst</b> • <b>📝 Keine Split-Panes</b> • <b>🌐 9 Sprachen</b> • </p>

[**📥 Download**](#-sofort-downloads) · [**🖥️ Oberflächen-Vorschau**](#-oberflächen-vorschau) · [**🌟 Funktionen**](#-hauptfunktionen) · [**⌨️ Tastenkürzel**](#-tastenkürzel) · [**📚 Dokumentation**](#-dokumentation) · [**🌐 Website**](https://berryuiki.github.io/Taleno/)

</div>

> Veröffentlichte Desktop-Version: **v0.1.10 (2026-10-28)**. Spätere Entwicklungsänderungen sind noch nicht veröffentlicht. Abhängigkeiten, Quellpfade und Prüfgrenzen stehen in der [Funktions- und Plattformmatrix](docs/ARCHITECTURE.md#11-feature--platform-implementation-status-matrix). Externe Dateien, Speichern, Tastatur und sichere Bereiche unter Android/iOS warten auf Gerätetests. Signierte mobile Release-Jobs sind nicht eingerichtet. Startzeit und Paketgröße hängen von Build und Plattform ab; maßgeblich sind Messprotokolle.

---

## 📖 Inhaltsverzeichnis

- [🖥️ Oberflächen-Vorschau](#-oberflächen-vorschau)
- [📥 Sofort-Downloads](#-sofort-downloads)
- [🌟 Hauptfunktionen](#-hauptfunktionen)
- [💡 Warum Taleno?](#-warum-Taleno)
- [⌨️ Tastenkürzel](#-tastenkürzel)
- [🛠️ Architektur & Technologie-Stack](#-architektur--technologie-stack)
- [💻 Entwickler-Setup](#-entwickler-setup)
- [📚 Dokumentation](#-dokumentation)
- [🤝 Mitwirken](#-mitwirken)
- [💬 Community & Support](#-community--support)
- [❤️ Danksagungen](#-danksagungen)
- [📄 Lizenz](#-lizenz)

---

## 🖥️ Oberflächen-Vorschau

Ein Blick auf die echte Taleno-Oberfläche — Menüleiste, mehrere Tabs, Gliederungs-Seitenleiste und In-Place-WYSIWYG-Bearbeitung in einem einzigen Fenster. Keine Split-Panes, keine Vorschau, keine Ablenkung.

<p align="center">
  <img src="assets/Taleno-ui.svg" alt="Taleno In-Place-WYSIWYG Markdown-Editor" width="85%">
</p>

> **Lesen** · **Schreiben** · **Code** — drei Anzeigemodi, mit einem Tastendruck (`Ctrl+/`) umschaltbar.

---

## 📥 Sofort-Downloads

Wählen Sie Ihr Betriebssystem und Paket:

- **Windows x86_64:** [Setup (`.exe`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.exe) · [MSI](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.msi)
- **macOS Apple Silicon:** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_aarch64.dmg)
- **macOS Intel:** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_x86_64.dmg)
- **Linux x86_64:** [AppImage](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.AppImage) · [Debian/Ubuntu (`.deb`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.deb) · [Fedora/RHEL (`.rpm`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.rpm)

[Alle Releases und Quellcode-Archive anzeigen](https://github.com/BerryUIKI/Taleno/releases/latest).

---

## 📖 Einführung

**Taleno** ist ein Open-Source-Markdown-Reader und -Editor für Autoren, Entwickler und Forscher, die die Geschwindigkeit von reinem Markdown ohne den kognitiven Aufwand von Split-Screen-Vorschauen wünschen.

Mit dem modernen **Tauri 2 + Rust + SolidJS**-Stack kombiniert Taleno native Desktop-Performance mit einer minimalistischen, ablenkungsfreien Ästhetik.

---

## 🌟 Hauptfunktionen

| Funktion | Highlights | Status |
|---|---|:---:|
| 🌐 **9-Sprachen-i18n** | Native Unterstützung für **Deutsch**, English, 简体中文, 繁體中文, 日本語, 한국어, Français, Español, Русский mit automatischer Systemerkennung und Umschalten zur Laufzeit | ✅ Fertig |
| 🪟 **Plattform-natives Fenster** | Kompakte benutzerdefinierte Steuerelemente unter Windows/Linux, native Ampelschaltflächen unter macOS | ✅ Fertig |
| 🏷️ **Windows `.md`-Dateizuordnung** | Automatische Registrierung von `.md`, `.markdown`, `.mdx` und `.txt`; per Doppelklick im Explorer direkt öffnen | ✅ Fertig |
| 🔄 **Drei Anzeigemodi** | Per `Ctrl+/` nahtlos wechseln: **Lesemodus** (nur lesen), **Schreibmodus** (WYSIWYG) und **Code-Modus** (Zeilennummern synchronisiert) | ✅ Fertig |
| 📥 **Intelligentes Drag & Drop** | Datei ins Fenster ziehen zum Öffnen, auf die Tab-Leiste für neue Tabs, in den Text für formatierte Links | ✅ Fertig |
| ✍️ **In-Place-Formatierung** | Auswahl direkt formatieren mit Standardkürzeln (<kbd>Ctrl+B</kbd> fett, <kbd>Ctrl+0</kbd> Absatz, <kbd>Ctrl+1~6</kbd> Überschriften) | ✅ Fertig |
| 🔲 **Monochrome Vektor-UI** | Minimalistische, themenadaptive Vektor-SVGs (`stroke="currentColor"`), die den Fokus auf den Text lenken | ✅ Fertig |
| 💾 **Absturzsicheres atomares Speichern** | Nie Daten verlieren dank atomarer Dateischreibvorgänge (`.tmp` -> Umbenennen) und Dirty-State-Verfolgung | ✅ Fertig |
| 📂 **Arbeitsbereich & Tabs** | Mehrere Dokument-Tabs, rekursives Dateibaum-CRUD und Schnellwechsler (<kbd>Ctrl+P</kbd>) | ✅ Fertig |
| 🌈 **Syntax-Hervorhebung** | Hochleistungs-Hervorhebung von Codeblöcken via `syntect` mit Sprach-Tags und Kopier-Button | ✅ Fertig |
| 📑 **Dynamisches Inhaltsverzeichnis** | Interaktive Dokumentgliederung mit sanftem Anker-Scrollen in allen Anzeigemodi | ✅ Fertig |
| 📊 **Mermaid-Diagramme & Mathe-Layout** | Container-Rendering für Fluss- und Sequenzdiagramme (`mermaid`) sowie Serif-LaTeX-Matheblöcke (`math`/`katex`/`$$`) | ✅ Fertig |
| 🔍 **Native Arbeitsbereich-Suche** | Schnelle rekursive Suche im Rust-Backend (`src-tauri/src/commands/search.rs`) mit Zeilentreffern (<kbd>Ctrl+Shift+F</kbd>) sowie Suchen & Ersetzen im Dokument (<kbd>Ctrl+F</kbd> / <kbd>Ctrl+H</kbd>) | ✅ Fertig |
| 📤 **Standalone-HTML-Export** | Export jedes Dokuments in eigenständiges, offline gestaltetes HTML (<kbd>Ctrl+E</kbd>) | ✅ Fertig |
| 🧩 **Plugin-System & Erweiterbarkeit** | Modulare Erweiterungs-Engine mit Standard-App-Datenordner (`plugins/`), Hot-Reload, JS-Sandbox und Einstellungsmenü (<kbd>Ctrl+Shift+X</kbd>) | ✅ Fertig |

*Was als Nächstes geplant ist, finden Sie in der [Roadmap](docs/ROADMAP.md).*

---

## 💡 Warum Taleno?

| | Taleno | Split-Pane-Editoren | Web-Notizen |
|---|---|---|---|
| **Rendering** | In-Place-WYSIWYG, keine Panes | Seite-an-Seite-Vorschau | Browser-Tab-Wechsel |
| **Startzeit** | < 400 ms nativer Start | hängt vom Electron-Gewicht ab | Seitenladen + Sync-Wartezeit |
| **Datenschutz** | 100 % lokal, keine Telemetrie | Lokale Dateien | Daten in der Cloud |
| **Offline** | Vollständig offline | Vollständig offline | Netzwerk erforderlich |
| **Speicherformat** | Reines Markdown auf der Platte | Proprietäre Formate möglich | Anbieterbindung |

Taleno hält Ihre Dokumente als **reines Markdown auf der Platte** — portabel, diffbar und für immer Ihr Eigentum. Kein Cloud-Konto, keine Sync-Engine, keine Bindung.

---

## ⌨️ Tastenkürzel

| Kategorie | Kürzel | Aktion |
|---|---|---|
| **Dokument** | <kbd>Ctrl</kbd> + <kbd>N</kbd> | Neues Dokument |
| | <kbd>Ctrl</kbd> + <kbd>O</kbd> | Datei öffnen... |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> | Arbeitsbereichsordner öffnen... |
| | <kbd>Ctrl</kbd> + <kbd>S</kbd> | Aktuelles Dokument speichern |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Speichern unter... |
| | <kbd>Ctrl</kbd> + <kbd>W</kbd> | Aktuellen Tab schließen |
| | <kbd>Ctrl</kbd> + <kbd>E</kbd> | Als HTML exportieren... |
| **Bearbeiten** | <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Rückgängig / Wiederholen |
| | <kbd>Ctrl</kbd> + <kbd>B</kbd> | Fett umschalten |
| | <kbd>Ctrl</kbd> + <kbd>I</kbd> | Kursiv umschalten |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | Durchgestrichen umschalten |
| | <kbd>Ctrl</kbd> + <kbd>K</kbd> | Link einfügen / umschließen |
| | <kbd>Ctrl</kbd> + <kbd>`</kbd> | Inline-Code umschalten |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> | Als normalen Absatz formatieren |
| | <kbd>Ctrl</kbd> + <kbd>1</kbd> ~ <kbd>6</kbd> | Als Überschrift 1 ~ 6 formatieren |
| **Navigation & Suche** | <kbd>Ctrl</kbd> + <kbd>P</kbd> | Schnellwechsler für Dateien |
| | <kbd>Ctrl</kbd> + <kbd>F</kbd> | Im Dokument suchen |
| | <kbd>Ctrl</kbd> + <kbd>H</kbd> | Im Dokument ersetzen |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | Im Arbeitsbereich suchen |
| **Ansicht** | <kbd>Ctrl</kbd> + <kbd>/</kbd> | Anzeigemodus wechseln (Lesen / Schreiben / Code) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | Seitenleiste umschalten (Dateien / Gliederung) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | Fokusmodus umschalten (ablenkungsfrei) |
| | <kbd>F11</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Zen-Modus umschalten (Vollbild) |
| | <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> | Schriftgröße vergrößern / verkleinern |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> (Ziffernblock) | Schriftgröße zurücksetzen (16px) |

*(Auf macOS ersetzen Sie <kbd>Ctrl</kbd> durch <kbd>Cmd</kbd>)*

---

## 🛠️ Architektur & Technologie-Stack

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

## 💻 Entwickler-Setup

### Voraussetzungen
* [Node.js](https://nodejs.org/) 20+
* [pnpm](https://pnpm.io/) 9+
* [Rust](https://rustup.rs/) 1.85+
* [Tauri-Voraussetzungen](https://v2.tauri.app/start/prerequisites/)

### Klonen & lokal ausführen
```bash
git clone https://github.com/BerryUIKI/Taleno.git
cd Taleno

# Frontend-Abhängigkeiten installieren
pnpm install

# Lokalen Tauri-Dev-Server starten
pnpm tauri dev
```

### Tests & Verifikation
```bash
# Alle Rust-Unit-Tests ausführen
cargo test --manifest-path src-tauri/Cargo.toml

# Strikte TypeScript-Typüberprüfung
pnpm tsc --noEmit

# Frontend-Unit-Tests ausführen (Vitest)
pnpm test
```

### Produktions-Build
```bash
# Standalone-Executable & OS-Installer bauen
pnpm tauri build
```

---

## 📚 Dokumentation

| Dokument | Beschreibung |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Systemdesign & Datenfluss |
| [DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | Architektur-Entscheidungsprotokolle (ADRs) |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Entwickler-Setup & Debug-Guide |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Mitwirkungsrichtlinien & Konventionen |
| [COLLABORATION.md](docs/COLLABORATION.md) | Team-Workflow & Review-Regeln |
| [ROADMAP.md](docs/ROADMAP.md) | Phasenweise Feature-Roadmap & MoSCoW |
| [MILESTONES.md](docs/MILESTONES.md) | Meilensteine & Zeitplan |
| [NEXT_STEPS.md](docs/NEXT_STEPS.md) | Phase-2-Implementierungsplan |

---

## 🤝 Mitwirken

Beiträge sind herzlich willkommen — Bugmeldungen, Feature-Ideen, Übersetzungen und Pull Requests gleichermaßen.

1. Forken Sie das Repository und erstellen Sie einen Branch von `dev`.
2. Befolgen Sie den [Mitwirkungsleitfaden](docs/CONTRIBUTING.md) und das [Kollaborations-Handbuch](docs/COLLABORATION.md).
3. Halten Sie Commits im [Conventional-Commits](https://www.conventionalcommits.org/)-Format.
4. Öffnen Sie einen Pull Request gegen `dev`.

Alle Commit-Meldungen folgen dem Format: `<type>(<scope>): <short summary>` — z. B. `feat(editor): integrate Milkdown core in-place WYSIWYG renderer`.

---

## 💬 Community & Support

- 🐛 [Bug melden / Feature anfragen](https://github.com/BerryUIKI/Taleno/issues)
- 🌐 [Website](https://berryuiki.github.io/Taleno/)
- 💡 [Diskussion starten](https://github.com/BerryUIKI/Taleno/discussions)
- 🔒 [Sicherheitsrichtlinie](https://github.com/BerryUIKI/Taleno/security)
- 📦 [Alle Releases](https://github.com/BerryUIKI/Taleno/releases)

---

## ❤️ Danksagungen

Taleno steht auf den Schultern dieser großartigen Open-Source-Projekte:

- [Tauri 2](https://tauri.app) — leichte, sichere Desktop-Shell
- [Rust](https://www.rust-lang.org/) — speichersicheres natives Backend
- [SolidJS](https://www.solidjs.com/) — feinkörniges reaktives Frontend
- [Milkdown](https://milkdown.dev) / [ProseMirror](https://prosemirror.net) — WYSIWYG-Editor-Engine
- [pulldown-cmark](https://github.com/pulldown-cmark/pulldown-cmark) — Zero-Copy-GFM-AST-Parsing
- [syntect](https://github.com/trishume/syntect) — Code-Syntax-Hervorhebung
- [notify](https://github.com/notify-rs/notify) — Dateisystem-Überwachung
- [tokio](https://tokio.rs) — Asynchrone Runtime & Dateisuche
- [Mermaid](https://mermaid.js.org) — Diagramme
- [KaTeX](https://katex.org) — Mathematik-Rendering
- [Tailwind CSS](https://tailwindcss.com) — Utility-First-Styling

---

## 📄 Lizenz

Dieses Projekt ist unter der **GNU Affero General Public License v3.0 (AGPL-3.0)** lizenziert. Details finden Sie in der [LICENSE](LICENSE)-Datei.

Wenn Sie Taleno modifizieren und als Netzwerkdienst betreiben, verlangt AGPL-3.0, dass Sie Ihren Benutzern den modifizierten Quellcode zugänglich machen.
