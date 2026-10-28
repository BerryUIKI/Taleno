import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  navigateToHeading,
  registerWritingHeadingRevealer,
  registerCodeHeadingRevealer,
} from "./headingNavigation";
import { setDisplayMode, type TocEntry } from "../store/editor";

describe("Heading Navigation Adapter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    registerWritingHeadingRevealer(null);
    registerCodeHeadingRevealer(null);
    vi.restoreAllMocks();
  });

  describe("Reading Mode", () => {
    beforeEach(() => {
      setDisplayMode("reading");
    });

    it("navigates to heading element matching unique occurrence ID", () => {
      const h1 = document.createElement("h1");
      h1.id = "intro-1";
      const scrollSpy = vi.fn();
      h1.scrollIntoView = scrollSpy;
      const container = document.createElement("div");
      container.className = "markdown-body";
      container.append(h1);
      const unrelated = document.createElement("div");
      unrelated.id = h1.id;
      unrelated.scrollIntoView = vi.fn();
      document.body.append(unrelated, container);

      const entry: TocEntry = { level: 1, text: "Intro", id: "intro-1" };
      const result = navigateToHeading(entry, 1);

      expect(result).toBe(true);
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
      expect(unrelated.scrollIntoView).not.toHaveBeenCalled();
    });

    it("falls back to occurrence index in markdown-body when ID is missing", () => {
      const container = document.createElement("div");
      container.className = "markdown-body";
      const h1First = document.createElement("h1");
      const h1Second = document.createElement("h1");
      const scrollSpy = vi.fn();
      h1Second.scrollIntoView = scrollSpy;

      container.appendChild(h1First);
      container.appendChild(h1Second);
      document.body.appendChild(container);

      const entry: TocEntry = { level: 1, text: "Second Heading", id: "missing-id" };
      const result = navigateToHeading(entry, 1);

      expect(result).toBe(true);
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    });

    it("returns false if heading cannot be located in reading view", () => {
      const entry: TocEntry = { level: 1, text: "Non-existent", id: "not-found" };
      const result = navigateToHeading(entry, 0);
      expect(result).toBe(false);
    });
  });

  describe("Writing Mode", () => {
    beforeEach(() => {
      setDisplayMode("writing");
    });

    it("dispatches to registered writing revealer with entry and index", () => {
      const revealerSpy = vi.fn().mockReturnValue(true);
      registerWritingHeadingRevealer(revealerSpy);

      const entry: TocEntry = { level: 2, text: "Duplicate", id: "duplicate-1" };
      const result = navigateToHeading(entry, 1);

      expect(result).toBe(true);
      expect(revealerSpy).toHaveBeenCalledWith(entry, 1);
    });

    it("falls back to milkdown container DOM heading occurrence index when revealer is not registered", () => {
      const container = document.createElement("div");
      container.className = "milkdown-container";
      const h1 = document.createElement("h1");
      const h2 = document.createElement("h2");
      const scrollSpy = vi.fn();
      h2.scrollIntoView = scrollSpy;

      container.appendChild(h1);
      container.appendChild(h2);
      document.body.appendChild(container);

      const entry: TocEntry = { level: 2, text: "Section Two", id: "section-two" };
      const result = navigateToHeading(entry, 1);

      expect(result).toBe(true);
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    });

    it("clears registered writing revealer when null is passed", () => {
      const revealerSpy = vi.fn().mockReturnValue(true);
      registerWritingHeadingRevealer(revealerSpy);
      registerWritingHeadingRevealer(null);

      const entry: TocEntry = { level: 1, text: "Test", id: "test" };
      navigateToHeading(entry, 0);

      expect(revealerSpy).not.toHaveBeenCalled();
    });
  });

  describe("Code Mode", () => {
    beforeEach(() => {
      setDisplayMode("code");
    });

    it("dispatches to registered code revealer with entry and index", () => {
      const revealerSpy = vi.fn().mockReturnValue(true);
      registerCodeHeadingRevealer(revealerSpy);

      const entry: TocEntry = { level: 1, text: "Title", id: "title" };
      const result = navigateToHeading(entry, 0);

      expect(result).toBe(true);
      expect(revealerSpy).toHaveBeenCalledWith(entry, 0);
    });

    it("falls back to textarea regex occurrence scanning when revealer is not registered", () => {
      const textarea = document.createElement("textarea");
      textarea.value = `# First Heading\nSome text\n\n# Duplicate Heading\nMore text\n\n# Duplicate Heading\nLast line`;
      document.body.appendChild(textarea);

      const focusSpy = vi.spyOn(textarea, "focus");
      const setSelectionSpy = vi.spyOn(textarea, "setSelectionRange");

      const entry: TocEntry = { level: 1, text: "Duplicate Heading", id: "duplicate-heading-1" };
      // Target the 2nd duplicate (3rd heading overall, index 2)
      const result = navigateToHeading(entry, 2);

      expect(result).toBe(true);
      expect(focusSpy).toHaveBeenCalled();
      // Line index calculation:
      // Line 0: "# First Heading" (15 chars + 1 newline = 16)
      // Line 1: "Some text" (9 chars + 1 = 10 -> total 26)
      // Line 2: "" (0 chars + 1 = 1 -> total 27)
      // Line 3: "# Duplicate Heading" (19 chars + 1 = 20 -> total 47)
      // Line 4: "More text" (9 chars + 1 = 10 -> total 57)
      // Line 5: "" (0 chars + 1 = 1 -> total 58)
      // Line 6: "# Duplicate Heading" (starts at 58, length 19)
      expect(setSelectionSpy).toHaveBeenCalledWith(58, 58 + 19);
    });
  });
});
