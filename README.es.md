<div align="center">

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [**Español**](README.es.md) · [Русский](README.ru.md)

<img src="app-icon.svg" alt="Taleno" width="96" height="96">

# ✨ Taleno

**Un lector y editor Markdown WYSIWYG local, ultrarrápido y al estilo de Typora.**

<span style="font-size: 13px;">v0.1.9 publicada · Código abierto AGPL-3.0</span>

[![Website](https://img.shields.io/badge/website-berryuiki.github.io%2FTaleno-4895ef.svg?style=for-the-badge)](https://berryuiki.github.io/Taleno/)
[![Release](https://img.shields.io/badge/release-latest-4361ee.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-10b981.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6366f1.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/BerryUIKI/Taleno/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white&color=3a0ca3)](https://github.com/BerryUIKI/Taleno/actions)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.85+-DEA584?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9+-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)

<p align="center">
  <b>🚀 Local primero</b> • <b>⚡ Inicio instantáneo (&lt;400ms)</b> • <b>📝 Sin doble panel</b> • <b>🌐 9 idiomas</b> • <b>📦 Ligero (~3.6 MB)</b>
</p>

[**📥 Descargar**](#-descargas-directas) · [**🖥️ Vista previa de la interfaz**](#-vista-previa-de-la-interfaz) · [**🌟 Características**](#-características-principales) · [**⌨️ Atajos**](#-atajos-de-teclado) · [**📚 Documentación**](#-documentación) · [**🌐 Sitio web**](https://berryuiki.github.io/Taleno/)

</div>

---

## 📖 Tabla de contenidos

- [🖥️ Vista previa de la interfaz](#-vista-previa-de-la-interfaz)
- [📥 Descargas directas](#-descargas-directas)
- [🌟 Características principales](#-características-principales)
- [💡 ¿Por qué Taleno?](#-por-qué-Taleno)
- [⌨️ Atajos de teclado](#-atajos-de-teclado)
- [🛠️ Arquitectura y stack tecnológico](#-arquitectura-y-stack-tecnológico)
- [💻 Configuración para desarrolladores](#-configuración-para-desarrolladores)
- [📚 Documentación](#-documentación)
- [🤝 Contribuir](#-contribuir)
- [💬 Comunidad y soporte](#-comunidad-y-soporte)
- [❤️ Agradecimientos](#-agradecimientos)
- [📄 Licencia](#-licencia)

---

## 🖥️ Vista previa de la interfaz

Una mirada real a la interfaz de Taleno — barra de menús, múltiples pestañas, panel lateral de esquema y edición WYSIWYG en el lugar, todo en una sola ventana. Sin paneles divididos, sin vista previa, sin distracciones.

<p align="center">
  <img src="assets/Taleno-ui.svg" alt="Editor Markdown WYSIWYG en el lugar de Taleno" width="85%">
</p>

> **Lectura** · **Escritura** · **Código** — tres modos de visualización, con una sola tecla (`Ctrl+/`) para cambiar.

---

## 📥 Descargas directas

Elija su sistema y paquete:

- **Windows x86_64:** [Instalador (`.exe`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.exe) · [MSI](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.msi)
- **macOS Apple Silicon:** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_aarch64.dmg)
- **macOS Intel:** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_x86_64.dmg)
- **Linux x86_64:** [AppImage](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.AppImage) · [Debian/Ubuntu (`.deb`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.deb) · [Fedora/RHEL (`.rpm`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.rpm)

[Ver todas las versiones y archivos de código fuente](https://github.com/BerryUIKI/Taleno/releases/latest).

---

## 📖 Introducción

**Taleno** es un lector y editor de Markdown de código abierto diseñado para escritores, desarrolladores e investigadores que quieren la velocidad del Markdown en texto plano sin la carga cognitiva de las vistas previas en pantalla dividida.

Construido sobre **Tauri 2** y **Rust** con un frontend **SolidJS** reactivo de grano fino, Taleno combina la capacidad de respuesta nativa del escritorio con una estética minimalista y sin distracciones.

---

## 🌟 Características principales

| Característica | Destacados | Estado |
|---|---|:---:|
| 🌐 **i18n en 9 idiomas** | Soporte nativo de **español**, English, 简体中文, 繁體中文, 日本語, 한국어, Deutsch, Français y Русский con detección automática del sistema y cambio en tiempo de ejecución | ✅ Completo |
| 🪟 **Chrome de ventana nativo** | Controles personalizados compactos en Windows/Linux, luces de tráfico nativas en macOS | ✅ Completo |
| 🏷️ **Asociación de `.md` en Windows** | Asocia automáticamente `.md`, `.markdown`, `.mdx` y `.txt`; doble clic en el Explorador para abrir directamente | ✅ Completo |
| 🔄 **Tres modos de visualización** | Cambie con una tecla (`Ctrl+/`) entre **Lectura** (solo lectura), **Escritura** (WYSIWYG) y **Código** (fuente con números de línea sincronizados) | ✅ Completo |
| 📥 **Arrastrar y soltar inteligente** | Arrastre un archivo a la ventana para abrirlo, a la barra de pestañas para una nueva pestaña, o al texto para insertar enlaces formateados | ✅ Completo |
| ✍️ **Formato en el lugar** | Formatee la selección con atajos estándar (<kbd>Ctrl+B</kbd> negrita, <kbd>Ctrl+0</kbd> párrafo, <kbd>Ctrl+1~6</kbd> encabezados) | ✅ Completo |
| 🔲 **UI vectorial monocromática** | SVGs vectoriales minimalistas adaptables al tema (`stroke="currentColor"`) que mantienen el foco en el texto | ✅ Completo |
| 💾 **Guardado atómico a prueba de fallos** | Nunca pierda su trabajo con escrituras atómicas (`.tmp` -> renombrado) y seguimiento de estado modificado | ✅ Completo |
| 📂 **Espacio de trabajo y pestañas** | Pestañas de múltiples documentos, árbol de archivos recursivo con CRUD y conmutador rápido (<kbd>Ctrl+P</kbd>) | ✅ Completo |
| 🌈 **Resaltado de sintaxis** | Resaltado de alto rendimiento vía `syntect` con etiquetas de idioma y botón de copiar | ✅ Completo |
| 📑 **Tabla de contenidos dinámica** | Esquema de documento interactivo con desplazamiento suave hacia anclas en todos los modos | ✅ Completo |
| 📊 **Diagramas Mermaid y diseño de matemáticas** | Renderizado en contenedor para diagramas de flujo/secuencia (`mermaid`) y bloques matemáticos serif LaTeX (`math`/`katex`/`$$`) | ✅ Completo |
| 🔍 **Búsqueda nativa en espacio de trabajo** | Búsqueda recursiva en el backend de Rust (`src-tauri/src/commands/search.rs`) con coincidencias por línea (<kbd>Ctrl+Shift+F</kbd>) y buscar/reemplazar (<kbd>Ctrl+F</kbd> / <kbd>Ctrl+H</kbd>) | ✅ Completo |
| 📤 **Exportación HTML independiente** | Exporte cualquier documento a HTML autónomo y con estilo sin conexión (<kbd>Ctrl+E</kbd>) | ✅ Completo |
| 🧩 **Sistema de extensiones y plugins** | Motor modular con escaneo del directorio estándar de datos de la app (`plugins/`), recarga en caliente, sandbox JS y submenú Preferencias (<kbd>Ctrl+Shift+X</kbd>) | ✅ Completo |

*Lo que sigue está en la [Hoja de ruta](docs/ROADMAP.md).*

---

## 💡 ¿Por qué Taleno?

| | Taleno | Editores de panel dividido | Notas en línea |
|---|---|---|---|
| **Renderizado** | WYSIWYG en el lugar, cero paneles | Vista previa lado a lado | Cambio de pestañas del navegador |
| **Arranque** | < 400 ms nativo | Depende del peso de Electron | Carga de página + espera de sincronización |
| **Privacidad** | 100 % local, cero telemetría | Archivos locales | Datos en la nube |
| **Tamaño** | Instalador ~3.6 MB | Instaladores 100+ MB | N/A |
| **Sin conexión** | Totalmente sin conexión | Totalmente sin conexión | Requiere red |
| **Formato de almacenamiento** | Markdown puro en disco | Posibles formatos propietarios | Bloqueo de proveedor |

Taleno mantiene sus documentos como **Markdown puro en disco** — portátiles, diferenciales y suyos para siempre. Sin cuenta en la nube, sin motor de sincronización, sin bloqueos.

---

## ⌨️ Atajos de teclado

| Categoría | Atajo | Acción |
|---|---|---|
| **Documento** | <kbd>Ctrl</kbd> + <kbd>N</kbd> | Nuevo documento |
| | <kbd>Ctrl</kbd> + <kbd>O</kbd> | Abrir archivo... |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> | Abrir carpeta de trabajo... |
| | <kbd>Ctrl</kbd> + <kbd>S</kbd> | Guardar documento actual |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Guardar como... |
| | <kbd>Ctrl</kbd> + <kbd>W</kbd> | Cerrar pestaña actual |
| | <kbd>Ctrl</kbd> + <kbd>E</kbd> | Exportar como HTML... |
| **Edición** | <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Deshacer / Rehacer |
| | <kbd>Ctrl</kbd> + <kbd>B</kbd> | Alternar negrita |
| | <kbd>Ctrl</kbd> + <kbd>I</kbd> | Alternar cursiva |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | Alternar tachado |
| | <kbd>Ctrl</kbd> + <kbd>K</kbd> | Insertar / envolver enlace |
| | <kbd>Ctrl</kbd> + <kbd>`</kbd> | Alternar código en línea |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> | Formatear como párrafo normal |
| | <kbd>Ctrl</kbd> + <kbd>1</kbd> ~ <kbd>6</kbd> | Formatear como encabezado 1 ~ 6 |
| **Navegación y búsqueda** | <kbd>Ctrl</kbd> + <kbd>P</kbd> | Conmutador rápido de archivos |
| | <kbd>Ctrl</kbd> + <kbd>F</kbd> | Buscar en el documento |
| | <kbd>Ctrl</kbd> + <kbd>H</kbd> | Reemplazar en el documento |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | Buscar en el espacio de trabajo |
| **Vista** | <kbd>Ctrl</kbd> + <kbd>/</kbd> | Cambiar modo (Lectura / Escritura / Código) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | Alternar barra lateral (Archivos / Esquema) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | Modo enfoque (sin distracciones) |
| | <kbd>F11</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Modo zen (pantalla completa) |
| | <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> | Aumentar / reducir tamaño de fuente |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> (teclado numérico) | Restablecer tamaño de fuente (16px) |

*(En macOS, reemplace <kbd>Ctrl</kbd> por <kbd>Cmd</kbd>)*

---

## 🛠️ Arquitectura y stack tecnológico

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

## 💻 Configuración para desarrolladores

### Requisitos previos
* [Node.js](https://nodejs.org/) 20+
* [pnpm](https://pnpm.io/) 9+
* [Rust](https://rustup.rs/) 1.85+
* [Requisitos de Tauri](https://v2.tauri.app/start/prerequisites/)

### Clonar y ejecutar localmente
```bash
git clone https://github.com/BerryUIKI/Taleno.git
cd Taleno

# Instalar dependencias del frontend
pnpm install

# Iniciar el servidor de desarrollo Tauri
pnpm tauri dev
```

### Pruebas y verificación
```bash
# Ejecutar todas las pruebas unitarias de Rust
cargo test --manifest-path src-tauri/Cargo.toml

# Verificación estricta de tipos TypeScript
pnpm tsc --noEmit

# Ejecutar pruebas unitarias del frontend (Vitest)
pnpm test
```

### Compilación de producción
```bash
# Compilar el ejecutable independiente y los instaladores del sistema
pnpm tauri build
```

---

## 📚 Documentación

| Documento | Descripción |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diseño del sistema y flujo de datos |
| [DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | Registros de decisiones de arquitectura (ADRs) |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Guía de configuración y depuración |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Directrices y convenciones de contribución |
| [COLLABORATION.md](docs/COLLABORATION.md) | Flujo de trabajo del equipo y reglas de revisión |
| [ROADMAP.md](docs/ROADMAP.md) | Hoja de ruta por fases y MoSCoW |
| [MILESTONES.md](docs/MILESTONES.md) | Hitos y calendario |
| [NEXT_STEPS.md](docs/NEXT_STEPS.md) | Plan de implementación de la Fase 2 |

---

## 🤝 Contribuir

Las contribuciones son muy bienvenidas: informes de errores, ideas de funciones, traducciones y solicitudes de extracción.

1. Haga un fork del repositorio y cree una rama desde `dev`.
2. Siga la [guía de contribución](docs/CONTRIBUTING.md) y el [manual de colaboración](docs/COLLABORATION.md).
3. Mantenga los commits en formato [Conventional Commits](https://www.conventionalcommits.org/).
4. Abra una solicitud de extracción contra `dev`.

Todos los mensajes de commit siguen el formato: `<type>(<scope>): <short summary>` — ej. `feat(editor): integrate Milkdown core in-place WYSIWYG renderer`.

---

## 💬 Comunidad y soporte

- 🐛 [Informar un error / solicitar una función](https://github.com/BerryUIKI/Taleno/issues)
- 🌐 [Sitio web](https://berryuiki.github.io/Taleno/)
- 💡 [Iniciar una discusión](https://github.com/BerryUIKI/Taleno/discussions)
- 🔒 [Política de seguridad](https://github.com/BerryUIKI/Taleno/security)
- 📦 [Todas las versiones](https://github.com/BerryUIKI/Taleno/releases)

---

## ❤️ Agradecimientos

Taleno se apoya en estos maravillosos proyectos de código abierto:

- [Tauri 2](https://tauri.app) — carcasa de escritorio ligera y segura
- [Rust](https://www.rust-lang.org/) — backend nativo seguro para la memoria
- [SolidJS](https://www.solidjs.com/) — frontend reactivo de grano fino
- [Milkdown](https://milkdown.dev) / [ProseMirror](https://prosemirror.net) — motor de edición WYSIWYG
- [pulldown-cmark](https://github.com/pulldown-cmark/pulldown-cmark) — análisis AST GFM de copia cero
- [syntect](https://github.com/trishume/syntect) — resaltado de sintaxis de código
- [notify](https://github.com/notify-rs/notify) — vigilancia del sistema de archivos
- [tokio](https://tokio.rs) — tiempo de ejecución asíncrono y búsqueda de archivos
- [Mermaid](https://mermaid.js.org) — diagramas
- [KaTeX](https://katex.org) — renderizado matemático
- [Tailwind CSS](https://tailwindcss.com) — estilos basados en utilidades

---

## 📄 Licencia

Este proyecto está bajo la licencia **GNU Affero General Public License v3.0 (AGPL-3.0)**. Consulte el archivo [LICENSE](LICENSE) para más detalles.

Si modifica Taleno y lo ejecuta como un servicio de red, AGPL-3.0 exige que ponga a disposición de sus usuarios el código fuente modificado.
