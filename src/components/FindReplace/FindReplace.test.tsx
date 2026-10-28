import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FindReplace } from "./FindReplace";
import { currentDocument, setCurrentDocument } from "../../store/editor";
import * as formatter from "../../lib/formatter";

describe("FindReplace Component", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  beforeEach(() => {
    setCurrentDocument({
      path: "/test/file.md",
      filename: "file.md",
      content: "Hello world, hello universe. Test 123.",
      renderedContent: "Hello world, hello universe. Test 123.",
      html: "<p>Hello world, hello universe. Test 123.</p>",
      toc: [],
      wordCount: 6,
      isDirty: false,
      externallyModified: false,
    });
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
  });

  it("renders when open and focuses find input", async () => {
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => <FindReplace isOpen={true} onClose={vi.fn()} />,
      container
    );

    const input = container.querySelector<HTMLInputElement>('input[placeholder="Find..."]');
    expect(input).toBeTruthy();
  });

  it("handles case sensitive toggle and finds matches accordingly", async () => {
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => <FindReplace isOpen={true} onClose={vi.fn()} />,
      container
    );

    const findInput = container.querySelector<HTMLInputElement>('input[placeholder="Find..."]')!;
    const caseBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Match Case"]')!;

    // Case insensitive by default -> "hello" finds 2 matches
    findInput.value = "hello";
    findInput.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 10));
    expect(container.textContent).toContain("1/2");

    // Toggle case sensitive -> "hello" only matches "hello" (1 match)
    caseBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(container.textContent).toContain("1/1");
  });

  it("shows error indicator on invalid regular expression", async () => {
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => <FindReplace isOpen={true} onClose={vi.fn()} />,
      container
    );

    const findInput = container.querySelector<HTMLInputElement>('input[placeholder="Find..."]')!;
    const regexBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Use Regular Expression"]')!;

    // Turn on regex
    regexBtn.click();

    // Type invalid regex
    findInput.value = "[unclosed";
    findInput.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 10));
    const errorBadge = container.querySelector('[data-testid="regex-error"]');
    expect(errorBadge).toBeTruthy();
    expect(errorBadge?.textContent?.length).toBeGreaterThan(0);
  });

  it("replaces one match with regex capture group support", async () => {
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => <FindReplace isOpen={true} onClose={vi.fn()} />,
      container
    );

    const findInput = container.querySelector<HTMLInputElement>('input[placeholder="Find..."]')!;
    const replaceInput = container.querySelector<HTMLInputElement>('input[placeholder*="Replace with"]')!;
    const regexBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Use Regular Expression"]')!;
    const replaceOneBtn = container.querySelector<HTMLButtonElement>('button[title="Replace single match"]')!;

    // Enable regex
    regexBtn.click();

    findInput.value = "Test (\\d+)";
    findInput.dispatchEvent(new Event("input", { bubbles: true }));

    replaceInput.value = "Number: $1";
    replaceInput.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 10));

    replaceOneBtn.click();

    expect(currentDocument().content).toContain("Number: 123");
  });

  it("replaces all matches with plain text preserving special characters", async () => {
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => <FindReplace isOpen={true} onClose={vi.fn()} />,
      container
    );

    const findInput = container.querySelector<HTMLInputElement>('input[placeholder="Find..."]')!;
    const replaceInput = container.querySelector<HTMLInputElement>('input[placeholder*="Replace with"]')!;
    const replaceAllBtn = container.querySelector<HTMLButtonElement>('button[title="Replace all matches"]')!;

    findInput.value = "hello";
    findInput.dispatchEvent(new Event("input", { bubbles: true }));

    // Plain replacement containing $1 should NOT be treated as a capture group
    replaceInput.value = "$1 dollar";
    replaceInput.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 10));

    replaceAllBtn.click();

    expect(currentDocument().content).toContain("$1 dollar world, $1 dollar universe.");
  });

  it("navigates next and prev matches and calls revealMatchAt", async () => {
    const revealSpy = vi.spyOn(formatter, "revealMatchAt").mockReturnValue(true);

    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => <FindReplace isOpen={true} onClose={vi.fn()} />,
      container
    );

    const findInput = container.querySelector<HTMLInputElement>('input[placeholder="Find..."]')!;
    const nextBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Next Match"]')!;
    const prevBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Previous Match"]')!;

    findInput.value = "hello";
    findInput.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((r) => setTimeout(r, 20));
    expect(revealSpy).toHaveBeenCalled();

    revealSpy.mockClear();
    nextBtn.click();
    expect(revealSpy).toHaveBeenCalledWith(13, 18); // second "hello"

    revealSpy.mockClear();
    prevBtn.click();
    expect(revealSpy).toHaveBeenCalledWith(0, 5); // first "Hello"

    revealSpy.mockRestore();
  });
});
