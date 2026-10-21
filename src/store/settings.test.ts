import { describe, it, expect, beforeEach } from "vitest";
import {
  theme,
  setTheme,
  cycleTheme,
  fontSize,
  setFontSize,
  markdownTheme,
  setMarkdownTheme,
  elementShadows,
  setElementShadows,
  automaticUpdateChecks,
  setAutomaticUpdateChecks,
  increaseFontSize,
  decreaseFontSize,
  resetFontSize,
  zenMode,
  setZenMode,
  focusMode,
  setFocusMode,
} from "./settings";

describe("Settings Store", () => {
  beforeEach(() => {
    setTheme("light");
    setMarkdownTheme("Taleno");
    setElementShadows(false);
    setAutomaticUpdateChecks(true);
    setFontSize(16);
  });

  it("should set and read theme correctly", () => {
    expect(theme()).toBe("light");
    setTheme("dark");
    expect(theme()).toBe("dark");
  });

  it("should cycle themes in order: light -> dark -> system -> light", () => {
    setTheme("light");
    cycleTheme();
    expect(theme()).toBe("dark");
    cycleTheme();
    expect(theme()).toBe("system");
    cycleTheme();
    expect(theme()).toBe("light");
  });

  it("should update, persist, and apply font size to document CSS properties (#98)", () => {
    expect(fontSize()).toBe(16);
    setFontSize(18);
    expect(fontSize()).toBe(18);
    expect(window.localStorage.getItem("taleno-font-size")).toBe("18");
    expect(document.documentElement.style.getPropertyValue("--editor-font-size")).toBe("18px");

    increaseFontSize();
    expect(fontSize()).toBe(20);
    expect(document.documentElement.style.getPropertyValue("--editor-font-size")).toBe("20px");

    decreaseFontSize();
    expect(fontSize()).toBe(18);

    resetFontSize();
    expect(fontSize()).toBe(16);
    expect(document.documentElement.style.getPropertyValue("--editor-font-size")).toBe("16px");
  });

  it("should toggle zenMode and focusMode (#99, #100)", () => {
    expect(zenMode()).toBe(false);
    setZenMode(true);
    expect(zenMode()).toBe(true);
    setZenMode(false);
    expect(zenMode()).toBe(false);

    expect(focusMode()).toBe(false);
    setFocusMode(true);
    expect(focusMode()).toBe(true);
    setFocusMode(false);
    expect(focusMode()).toBe(false);
  });

  it("should select a Markdown theme independently of light and dark mode", () => {
    setMarkdownTheme("github");
    expect(markdownTheme()).toBe("github");
    expect(theme()).toBe("light");

    setTheme("dark");
    expect(markdownTheme()).toBe("github");
  });

  it("should keep element shadows disabled by default until enabled", () => {
    expect(elementShadows()).toBe(false);
    setElementShadows(true);
    expect(elementShadows()).toBe(true);
  });

  it("should expose theme settings as document attributes", () => {
    setMarkdownTheme("solarized");
    setElementShadows(true);

    expect(document.documentElement.getAttribute("data-markdown-theme")).toBe(
      "solarized"
    );
    expect(document.documentElement.getAttribute("data-element-shadows")).toBe(
      "true"
    );
  });

  it("should enable automatic update checks by default and allow opting out", () => {
    expect(automaticUpdateChecks()).toBe(true);
    setAutomaticUpdateChecks(false);
    expect(automaticUpdateChecks()).toBe(false);
    expect(window.localStorage.getItem("Taleno-automatic-update-checks")).toBe("false");
  });
});
