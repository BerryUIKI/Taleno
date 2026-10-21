import { expect, test } from "@playwright/test";
import { installTauriMock } from "./helpers/mockTauri";

test.beforeEach(async ({ page }) => { await installTauriMock(page); await page.goto("/"); });

test("bundled diagrams, math and exported presentation render offline without replacing siblings", async ({ page }) => {
  const externalRequests: string[] = [];
  await page.route("**/*", route => {
    if (!new URL(route.request().url()).hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
      externalRequests.push(route.request().url()); return route.abort();
    }
    return route.continue();
  });
  const result = await page.evaluate(async () => {
    const { prepareHtmlPresentation } = await import("/src/lib/exportPresentation.ts");
    return prepareHtmlPresentation('<p id="before">Before</p><pre class="mermaid">graph TD; A[Start]--&gt;B[Finish]</pre><span class="math-inline" data-math="E=mc^2"></span><p id="after">After</p>');
  });
  expect(result.html).toContain("<svg");
  expect(result.html).toContain('id="before"');
  expect(result.html).toContain('id="after"');
  expect(result.html).toContain('class="katex"');
  expect(result.styles).toContain("data:font/");
  expect(result.styles).not.toMatch(/url\(["']?fonts\//);
  expect(externalRequests).toEqual([]);
  await page.setContent(`<style>${result.styles}</style>${result.html}`);
  await expect(page.locator("svg")).toBeVisible();
  await expect(page.locator(".katex")).toBeVisible();
});

test("invalid diagrams preserve source and adjacent document blocks", async ({ page }) => {
  await page.evaluate(async () => {
    const { enhanceMarkdown } = await import("/src/lib/richRendering.ts");
    const host = document.createElement("section"); host.id = "render-test";
    host.innerHTML = '<p>Before</p><pre class="mermaid">not a valid diagram &lt;img onerror=alert(1)&gt;</pre><p>After</p>';
    document.body.append(host); await enhanceMarkdown(host);
  });
  await expect(page.locator("#render-test .mermaid-error")).toBeVisible();
  await expect(page.locator("#render-test pre")).toContainText("not a valid diagram");
  await expect(page.locator("#render-test p")).toHaveText(["Before", "After"]);
  await expect(page.locator("#render-test img")).toHaveCount(0);
});

test("Writing link and image insertion use entered values and remain undoable", async ({ page }) => {
  await page.getByRole("button", { name: /New Document/i }).first().click();
  const editor = page.locator(".ProseMirror");
  await editor.click(); await page.keyboard.type("Hello ");
  await page.evaluate(async () => {
    const { dispatchFormat } = await import("/src/lib/formatter.ts"); dispatchFormat("link");
  });
  const link = page.getByRole("dialog", { name: "Insert link" });
  await link.getByLabel("URL", { exact: true }).fill("https://example.org/actual");
  await link.getByLabel("Text", { exact: true }).fill("Actual link");
  await link.getByRole("button", { name: "Insert", exact: true }).click();
  await expect(editor.locator("a")).toHaveAttribute("href", "https://example.org/actual");
  await page.evaluate(async () => {
    const { dispatchFormat } = await import("/src/lib/formatter.ts"); dispatchFormat("image");
  });
  const image = page.getByRole("dialog", { name: "Insert image" });
  await image.getByLabel("URL", { exact: true }).fill("./images/picture.png");
  await image.getByLabel("Alternative text").fill("Picture");
  await image.getByRole("button", { name: "Insert", exact: true }).click();
  await expect(editor.locator("img[src]")).toHaveAttribute("src", "./images/picture.png");
  await page.evaluate(async () => {
    const { dispatchFormat } = await import("/src/lib/formatter.ts"); dispatchFormat("undo");
  });
  await expect(editor.locator("img[src]")).toHaveCount(0);
  await expect(editor).toContainText("Hello");
});

test("task lists preserve text on undo and focus follows the caret without rebuilding blocks", async ({ page }) => {
  await page.getByRole("button", { name: /New Document/i }).first().click();
  const editor = page.locator(".ProseMirror");
  await editor.click(); await page.keyboard.type("First");
  await page.keyboard.press("Enter"); await page.keyboard.type("Second");
  await page.evaluate(async () => {
    const { setFocusMode, setFontSize } = await import("/src/store/settings.ts");
    setFocusMode(true); setFontSize(24);
    window.__firstBlock = document.querySelector(".ProseMirror > p");
    const { dispatchFormat } = await import("/src/lib/formatter.ts"); dispatchFormat("task_list");
  });
  await expect(editor.locator('li[data-item-type="task"], li[data-checked], li input[type="checkbox"]').first()).toBeVisible();
  await page.evaluate(async () => { const { dispatchFormat } = await import("/src/lib/formatter.ts"); dispatchFormat("undo"); });
  await expect(editor.locator("li")).toHaveCount(0);
  await expect(editor).toContainText("Second");
  await expect(editor.locator("p").first()).toHaveCSS("opacity", "0.35");
  await expect(editor.locator(".taleno-active-block")).toHaveCSS("opacity", "1");
  expect(await page.evaluate(() => document.querySelector(".ProseMirror > p") === window.__firstBlock)).toBe(true);
  await expect(editor).toHaveCSS("font-size", "24px");
  await page.evaluate(async () => { const { setFocusMode } = await import("/src/store/settings.ts"); setFocusMode(false); });
  await expect(editor.locator("p").first()).toHaveCSS("opacity", "1");
  await page.locator('button[title*="Source Code"]').first().click();
  await expect(page.locator("textarea").first()).toHaveCSS("font-size", "24px");
  expect(await page.evaluate(() => localStorage.getItem("taleno-font-size"))).toBe("24");
});

test("narrow desktop windows retain visible window controls", async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 650 });
  for (const name of ["Minimize", "Maximize", "Close"]) {
    const control = page.getByRole("button", { name, exact: true });
    await expect(control).toBeVisible();
    const bounds = await control.boundingBox();
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(600);
  }
});

test("Writing resolves local image display through IPC while preserving relative Markdown", async ({ page }) => {
  await page.getByRole("button", { name: /New Document/i }).first().click();
  await page.locator(".ProseMirror").waitFor();
  await page.evaluate(async () => {
    const original = window.__TAURI_INTERNALS__.invoke;
    window.__TAURI_INTERNALS__.invoke = (command, args) => command === "resolve_document_image"
      ? Promise.resolve(args.docPath.includes("other") ? "http://asset.localhost/other-picture.png" : "http://asset.localhost/resolved-picture.png") : original(command, args);
    const { addOrSwitchTab } = await import("/src/store/files.ts");
    const { documentFromResponse } = await import("/src/store/editor.ts");
    addOrSwitchTab(documentFromResponse({ path: "/workspace/note.md", filename: "note.md", content: "![Picture](./images/picture.png)", html: "", toc: [], word_count: 1 }));
  });
  await expect(page.locator('.ProseMirror img[alt="Picture"]')).toHaveAttribute("src", "http://asset.localhost/resolved-picture.png");
  await page.evaluate(async () => {
    const { currentDocument, setCurrentDocument } = await import("/src/store/editor.ts");
    // Save As changes the base directory even when the source and tab identity stay the same.
    setCurrentDocument({ ...currentDocument(), path: "/other/note.md" });
  });
  await expect(page.locator('.ProseMirror img[alt="Picture"]')).toHaveAttribute("src", "http://asset.localhost/other-picture.png");
  await page.locator('button[title*="Source Code"]').first().click();
  await expect(page.locator("textarea").first()).toHaveValue("![Picture](./images/picture.png)");
});
