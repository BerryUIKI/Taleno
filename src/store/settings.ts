import { createSignal, createEffect } from "solid-js";

export type Theme = "light" | "dark" | "system";
export type MarkdownTheme = "Taleno" | "github" | "solarized";

export const MARKDOWN_THEME_OPTIONS: ReadonlyArray<{
  id: MarkdownTheme;
  name: string;
}> = [
  { id: "Taleno", name: "Taleno" },
  { id: "github", name: "GitHub" },
  { id: "solarized", name: "Solarized" },
];

function getSystemTheme(): "light" | "dark" {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

function getInitialTheme(): Theme {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("Taleno-theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  }
  return "system";
}

function getInitialMarkdownTheme(): MarkdownTheme {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("Taleno-markdown-theme");
    if (stored === "Taleno" || stored === "github" || stored === "solarized") {
      return stored;
    }
  }
  return "Taleno";
}

function getInitialElementShadows(): boolean {
  return (
    typeof localStorage !== "undefined" &&
    localStorage.getItem("Taleno-element-shadows") === "true"
  );
}

function getInitialAutomaticUpdateChecks(): boolean {
  return (
    typeof localStorage === "undefined" ||
    localStorage.getItem("Taleno-automatic-update-checks") !== "false"
  );
}

const [theme, setTheme] = createSignal<Theme>(getInitialTheme());
const [markdownTheme, setMarkdownTheme] = createSignal<MarkdownTheme>(
  getInitialMarkdownTheme()
);
const [elementShadows, setElementShadows] = createSignal(
  getInitialElementShadows()
);
const [automaticUpdateChecks, setAutomaticUpdateChecks] = createSignal(
  getInitialAutomaticUpdateChecks()
);
const [resolvedTheme, setResolvedTheme] = createSignal<"light" | "dark">(
  getInitialTheme() === "system" ? getSystemTheme() : (getInitialTheme() as "light" | "dark")
);

// React to theme changes
createEffect(() => {
  const current = theme();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("Taleno-theme", current);
  }

  const resolved = current === "system" ? getSystemTheme() : current;
  setResolvedTheme(resolved);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", resolved);
  }
});

createEffect(() => {
  const current = markdownTheme();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("Taleno-markdown-theme", current);
  }
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-markdown-theme", current);
  }
});

createEffect(() => {
  const enabled = elementShadows();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("Taleno-element-shadows", String(enabled));
  }
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute(
      "data-element-shadows",
      String(enabled)
    );
  }
});

createEffect(() => {
  const enabled = automaticUpdateChecks();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("Taleno-automatic-update-checks", String(enabled));
  }
});

// Listen for OS theme changes
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (theme() === "system") {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", resolved);
        }
      }
    });
}

function getInitialFontSize(): number {
  if (typeof localStorage !== "undefined") {
    const stored =
      localStorage.getItem("taleno-font-size") ||
      localStorage.getItem("Taleno-font-size");
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 10 && parsed <= 48) {
        return parsed;
      }
    }
  }
  return 16;
}

const [fontSize, setFontSize] = createSignal(getInitialFontSize());
const [workspacePath, setWorkspacePath] = createSignal<string | null>(null);
const [zenMode, setZenMode] = createSignal(false);
const [focusMode, setFocusMode] = createSignal(false);

createEffect(() => {
  const current = fontSize();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("taleno-font-size", String(current));
  }
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${current}px`
    );
  }
});

export {
  theme,
  setTheme,
  resolvedTheme,
  markdownTheme,
  setMarkdownTheme,
  elementShadows,
  setElementShadows,
  automaticUpdateChecks,
  setAutomaticUpdateChecks,
  fontSize,
  setFontSize,
  workspacePath,
  setWorkspacePath,
  zenMode,
  setZenMode,
  focusMode,
  setFocusMode,
};

export function increaseFontSize() {
  setFontSize((prev) => Math.min(48, prev + 2));
}

export function decreaseFontSize() {
  setFontSize((prev) => Math.max(10, prev - 2));
}

export function resetFontSize() {
  setFontSize(16);
}

export function cycleTheme() {
  const current = theme();
  if (current === "light") setTheme("dark");
  else if (current === "dark") setTheme("system");
  else setTheme("light");
}
