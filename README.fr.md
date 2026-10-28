<div align="center">

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [**Français**](README.fr.md) · [Español](README.es.md) · [Русский](README.ru.md)

<img src="app-icon.svg" alt="Taleno" width="96" height="96">

# ✨ Taleno

**Un lecteur & éditeur Markdown WYSIWYG ultra-rapide, local-first, dans le style de Typora.**

<span style="font-size: 13px;">v0.1.10 publiée · Open source sous AGPL-3.0</span>

[![Website](https://img.shields.io/badge/website-berryuiki.github.io%2FTaleno-4895ef.svg?style=for-the-badge)](https://berryuiki.github.io/Taleno/)
[![Release](https://img.shields.io/badge/release-latest-4361ee.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-10b981.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6366f1.svg?style=for-the-badge)](https://github.com/BerryUIKI/Taleno/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/BerryUIKI/Taleno/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white&color=3a0ca3)](https://github.com/BerryUIKI/Taleno/actions)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.85+-DEA584?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9+-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)

<p align="center">
  <b>🚀 Local-first</b> • <b>📝 Pas de double volet</b> • <b>🌐 9 langues</b> • <b>📦 Ultra-léger (~3.6 Mo)</b>
</p>

[**📥 Télécharger**](#-téléchargements-directs) · [**🖥️ Aperçu de l'interface**](#-aperçu-de-linterface) · [**🌟 Fonctionnalités**](#-fonctionnalités-principales) · [**⌨️ Raccourcis**](#-raccourcis-clavier) · [**📚 Documentation**](#-documentation) · [**🌐 Site web**](https://berryuiki.github.io/Taleno/)

</div>

> Version de bureau publiée : **v0.1.10 (2026-10-28)**. Les modifications de développement ultérieures ne sont pas publiées. Consultez la [matrice des fonctions et plateformes](docs/ARCHITECTURE.md#11-feature--platform-implementation-status-matrix) pour les dépendances, les chemins sources et les limites de validation. Les fichiers externes, la sauvegarde, le clavier et les zones sûres Android/iOS attendent des tests sur appareil. Les tâches de publication mobile signée ne sont pas configurées. Le démarrage et la taille varient selon la compilation et la plateforme ; les mesures font référence.

---

## 📖 Table des matières

- [🖥️ Aperçu de l'interface](#-aperçu-de-linterface)
- [📥 Téléchargements directs](#-téléchargements-directs)
- [🌟 Fonctionnalités principales](#-fonctionnalités-principales)
- [💡 Pourquoi Taleno ?](#-pourquoi-Taleno)
- [⌨️ Raccourcis clavier](#-raccourcis-clavier)
- [🛠️ Architecture & Stack technique](#-architecture--stack-technique)
- [💻 Configuration développeur](#-configuration-développeur)
- [📚 Documentation](#-documentation)
- [🤝 Contribuer](#-contribuer)
- [💬 Communauté & Support](#-communauté--support)
- [❤️ Remerciements](#-remerciements)
- [📄 Licence](#-licence)

---

## 🖥️ Aperçu de l'interface

Un aperçu de la vraie interface de Taleno — barre de menus, onglets multiples, panneau latéral de plan et édition WYSIWYG en place, le tout dans une seule fenêtre. Pas de double volet, pas d'aperçu séparé, aucune distraction.

<p align="center">
  <img src="assets/Taleno-ui.svg" alt="Éditeur Markdown WYSIWYG en place Taleno" width="85%">
</p>

> **Lecture** · **Écriture** · **Code** — trois modes d'affichage, un seul raccourci (`Ctrl+/`) pour basculer.

---

## 📥 Téléchargements directs

Choisissez votre système et votre paquet :

- **Windows x86_64 :** [Installateur (`.exe`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.exe) · [MSI](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Windows_x86_64.msi)
- **macOS Apple Silicon :** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_aarch64.dmg)
- **macOS Intel :** [DMG](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_macOS_x86_64.dmg)
- **Linux x86_64 :** [AppImage](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.AppImage) · [Debian/Ubuntu (`.deb`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.deb) · [Fedora/RHEL (`.rpm`)](https://github.com/BerryUIKI/Taleno/releases/latest/download/Taleno_Linux_x86_64.rpm)

[Voir toutes les versions et archives sources](https://github.com/BerryUIKI/Taleno/releases/latest).

---

## 📖 Introduction

**Taleno** est un lecteur et éditeur Markdown open source conçu pour les rédacteurs, développeurs et chercheurs qui veulent la vitesse du Markdown en texte brut sans la surcharge cognitive des aperçus en écran partagé.

Construit sur **Tauri 2** et **Rust** avec un frontend **SolidJS** réactif à grain fin, Taleno allie la réactivité native du bureau à une esthétique minimaliste, sans distraction.

---

## 🌟 Fonctionnalités principales

| Fonctionnalité | Points forts | Statut |
|---|---|:---:|
| 🌐 **i18n en 9 langues** | Prise en charge native du **français**, de l'English, 简体中文, 繁體中文, 日本語, 한국어, Deutsch, Español et Русский avec détection automatique de la langue du système et bascule en cours d'exécution | ✅ Terminé |
| 🪟 **Chrome de fenêtre natif** | Contrôles personnalisés compacts sous Windows/Linux, feux tricolores natifs sous macOS | ✅ Terminé |
| 🏷️ **Association `.md` sous Windows** | Associe automatiquement `.md`, `.markdown`, `.mdx` et `.txt` ; double-clic dans l'Explorateur pour ouvrir directement | ✅ Terminé |
| 🔄 **Trois modes d'affichage** | Basculez d'une touche (`Ctrl+/`) entre **Lecture** (lecture seule), **Écriture** (WYSIWYG) et **Code** (source synchronisée avec les numéros de ligne) | ✅ Terminé |
| 📥 **Glisser-déposer intelligent** | Glissez un fichier dans la fenêtre pour l'ouvrir, sur la barre d'onglets pour un nouvel onglet, dans le texte pour insérer des liens formatés | ✅ Terminé |
| ✍️ **Mise en forme en place** | Formatez la sélection avec les raccourcis standard (<kbd>Ctrl+B</kbd> gras, <kbd>Ctrl+0</kbd> paragraphe, <kbd>Ctrl+1~6</kbd> titres) | ✅ Terminé |
| 🔲 **UI vectorielle monochrome** | SVG vectoriels minimalistes adaptés au thème (`stroke="currentColor"`) pour garder le focus sur le texte | ✅ Terminé |
| 💾 **Enregistrement atomique anti-crash** | Ne perdez jamais votre travail grâce aux écritures atomiques (`.tmp` -> renommage) et au suivi de l'état modifié | ✅ Terminé |
| 📂 **Espace de travail & onglets** | Onglets multi-documents, arborescence récursive avec opérations CRUD et commutateur rapide (<kbd>Ctrl+P</kbd>) | ✅ Terminé |
| 🌈 **Coloration syntaxique** | Coloration haute performance via `syntect` avec étiquettes de langage et bouton de copie | ✅ Terminé |
| 📑 **Table des matières dynamique** | Plan de document interactif avec défilement fluide vers les ancres dans tous les modes | ✅ Terminé |
| 📊 **Diagrammes Mermaid & rendu maths** | Rendu conteneur pour flux/séquences (`mermaid`) et formules LaTeX à empattement (`math`/`katex`/`$$`) | ✅ Terminé |
| 🔍 **Recherche native d'espace de travail** | Recherche récursive dans le backend Rust (`src-tauri/src/commands/search.rs`) avec correspondances de ligne (<kbd>Ctrl+Shift+F</kbd>) et recherche/remplacement (<kbd>Ctrl+F</kbd> / <kbd>Ctrl+H</kbd>) | ✅ Terminé |
| 📤 **Export HTML autonome** | Exportez tout document en HTML autonome et stylé hors ligne (<kbd>Ctrl+E</kbd>) | ✅ Terminé |
| 🧩 **Système de plugins & extensibilité** | Moteur modulaire avec scan du répertoire de données applicatif standard (`plugins/`), rechargement à chaud, bac à sable JS et sous-menu Préférences (<kbd>Ctrl+Shift+X</kbd>) | ✅ Terminé |

*Ce qui est prévu ensuite figure dans la [Feuille de route](docs/ROADMAP.md).*

---

## 💡 Pourquoi Taleno

| | Taleno | Éditeurs à double volet | Notes en ligne |
|---|---|---|---|
| **Rendu** | WYSIWYG en place, zéro volet | Aperçu côte à côte | Aller-retour entre onglets |
| **Démarrage** | < 400 ms natif | dépend du poids d'Electron | Chargement + attente de synchronisation |
| **Confidentialité** | 100 % local, zéro télémétrie | Fichiers locaux | Données dans le cloud |
| **Taille** | ~3.6 Mo d'installeur | 100+ Mo d'installeur | N/A |
| **Hors ligne** | Entièrement hors ligne | Entièrement hors ligne | Nécessite le réseau |
| **Format de stockage** | Markdown pur sur disque | Formats propriétaires possibles | Verrouillage fournisseur |

Taleno conserve vos documents en **pur Markdown sur disque** — portables, différenciables et vôtres pour toujours. Pas de compte cloud, pas de moteur de synchronisation, aucune dépendance.

---

## ⌨️ Raccourcis clavier

| Catégorie | Raccourci | Action |
|---|---|---|
| **Document** | <kbd>Ctrl</kbd> + <kbd>N</kbd> | Nouveau document |
| | <kbd>Ctrl</kbd> + <kbd>O</kbd> | Ouvrir un fichier... |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd> | Ouvrir un dossier de travail... |
| | <kbd>Ctrl</kbd> + <kbd>S</kbd> | Enregistrer le document |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Enregistrer sous... |
| | <kbd>Ctrl</kbd> + <kbd>W</kbd> | Fermer l'onglet actif |
| | <kbd>Ctrl</kbd> + <kbd>E</kbd> | Exporter en HTML... |
| **Édition** | <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Annuler / Rétablir |
| | <kbd>Ctrl</kbd> + <kbd>B</kbd> | Basculer en gras |
| | <kbd>Ctrl</kbd> + <kbd>I</kbd> | Basculer en italique |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | Basculer en barré |
| | <kbd>Ctrl</kbd> + <kbd>K</kbd> | Insérer / envelopper un lien |
| | <kbd>Ctrl</kbd> + <kbd>`</kbd> | Basculer en code en ligne |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> | Formater en paragraphe normal |
| | <kbd>Ctrl</kbd> + <kbd>1</kbd> ~ <kbd>6</kbd> | Formater en titre 1 ~ 6 |
| **Navigation & recherche** | <kbd>Ctrl</kbd> + <kbd>P</kbd> | Commutateur rapide de fichiers |
| | <kbd>Ctrl</kbd> + <kbd>F</kbd> | Rechercher dans le document |
| | <kbd>Ctrl</kbd> + <kbd>H</kbd> | Remplacer dans le document |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | Rechercher dans l'espace de travail |
| **Affichage** | <kbd>Ctrl</kbd> + <kbd>/</kbd> | Changer de mode (Lecture / Écriture / Code) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | Basculer le panneau latéral (Fichiers / Plan) |
| | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> | Mode focus (sans distraction) |
| | <kbd>F11</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Mode zen (plein écran) |
| | <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> | Agrandir / réduire la police |
| | <kbd>Ctrl</kbd> + <kbd>0</kbd> (pavé numérique) | Réinitialiser la police (16px) |

*(Sur macOS, remplacez <kbd>Ctrl</kbd> par <kbd>Cmd</kbd>)*

---

## 🛠️ Architecture & Stack technique

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

## 💻 Configuration développeur

### Prérequis
* [Node.js](https://nodejs.org/) 20+
* [pnpm](https://pnpm.io/) 9+
* [Rust](https://rustup.rs/) 1.85+
* [Prérequis Tauri](https://v2.tauri.app/start/prerequisites/)

### Cloner & exécuter localement
```bash
git clone https://github.com/BerryUIKI/Taleno.git
cd Taleno

# Installer les dépendances frontend
pnpm install

# Démarrer le serveur de dev Tauri
pnpm tauri dev
```

### Tests & vérification
```bash
# Exécuter tous les tests unitaires Rust
cargo test --manifest-path src-tauri/Cargo.toml

# Vérification stricte des types TypeScript
pnpm tsc --noEmit

# Exécuter les tests unitaires frontend (Vitest)
pnpm test
```

### Build de production
```bash
# Construire l'exécutable autonome et les installateurs OS
pnpm tauri build
```

---

## 📚 Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Conception du système & flux de données |
| [DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | Décisions d'architecture (ADRs) |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Guide de configuration & débogage |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Directives de contribution & conventions |
| [COLLABORATION.md](docs/COLLABORATION.md) | Workflow d'équipe & règles de revue |
| [ROADMAP.md](docs/ROADMAP.md) | Feuille de route par phases & MoSCoW |
| [MILESTONES.md](docs/MILESTONES.md) | Jalons & calendrier |
| [NEXT_STEPS.md](docs/NEXT_STEPS.md) | Plan d'implémentation Phase 2 |

---

## 🤝 Contribuer

Les contributions sont chaleureusement bienvenues — rapports de bugs, idées de fonctionnalités, traductions et pull requests.

1. Forkez le dépôt et créez une branche depuis `dev`.
2. Suivez le [guide de contribution](docs/CONTRIBUTING.md) et le [manuel de collaboration](docs/COLLABORATION.md).
3. Respectez le format [Conventional Commits](https://www.conventionalcommits.org/).
4. Ouvrez une pull request vers `dev`.

Tous les messages de commit suivent le format : `<type>(<scope>): <short summary>` — ex. `feat(editor): integrate Milkdown core in-place WYSIWYG renderer`.

---

## 💬 Communauté & Support

- 🐛 [Signaler un bug / demander une fonctionnalité](https://github.com/BerryUIKI/Taleno/issues)
- 🌐 [Site web](https://berryuiki.github.io/Taleno/)
- 💡 [Lancer une discussion](https://github.com/BerryUIKI/Taleno/discussions)
- 🔒 [Politique de sécurité](https://github.com/BerryUIKI/Taleno/security)
- 📦 [Toutes les versions](https://github.com/BerryUIKI/Taleno/releases)

---

## ❤️ Remerciements

Taleno se tient sur les épaules de ces merveilleux projets open source :

- [Tauri 2](https://tauri.app) — coquille de bureau légère et sécurisée
- [Rust](https://www.rust-lang.org/) — backend natif sûr pour la mémoire
- [SolidJS](https://www.solidjs.com/) — frontend réactif à grain fin
- [Milkdown](https://milkdown.dev) / [ProseMirror](https://prosemirror.net) — moteur d'édition WYSIWYG
- [pulldown-cmark](https://github.com/pulldown-cmark/pulldown-cmark) — parsing AST GFM zéro copie
- [syntect](https://github.com/trishume/syntect) — coloration syntaxique
- [notify](https://github.com/notify-rs/notify) — surveillance du système de fichiers
- [tokio](https://tokio.rs) — exécution asynchrone et recherche de fichiers
- [Mermaid](https://mermaid.js.org) — diagrammes
- [KaTeX](https://katex.org) — rendu mathématique
- [Tailwind CSS](https://tailwindcss.com) — styles utilitaires

---

## 📄 Licence

Ce projet est sous licence **GNU Affero General Public License v3.0 (AGPL-3.0)**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

Si vous modifiez Taleno et l'exécutez comme service réseau, l'AGPL-3.0 exige que vous rendiez votre code source modifié disponible à ses utilisateurs.
