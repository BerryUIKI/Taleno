import { test, expect } from "@playwright/test";
import { installTauriMock } from "./helpers/mockTauri";

test.describe("Document Integrity & Editor Journeys", () => {
  test.beforeEach(async ({ page }) => {
    await installTauriMock(page);
    await page.goto("/");
  });

  test("creates a new document, edits content, and updates word count and dirty indicator", async ({ page }) => {
    // 1. Initial Welcome screen should be visible
    await expect(page.locator("text=Welcome to Taleno").or(page.locator("h1"))).toBeVisible();

    // 2. Click "New Document" button to open an Untitled tab
    const newDocButton = page.getByRole("button", { name: /New Document/i }).first();
    await newDocButton.click();

    // 3. Document tab appears with initial filename
    const tab = page.locator('[data-tab-item="true"]').first();
    await expect(tab).toBeVisible();
    await expect(tab).toContainText("Untitled-1.md");

    // 4. Editor surface should be present
    const editor = page.locator(".ProseMirror").first();
    await expect(editor).toBeVisible();

    // 5. Type content into the editor
    await editor.click();
    await page.keyboard.type("Hello from Playwright E2E test.");

    // 6. Verify dirty indicator appears in StatusBar and window title
    await expect(page.locator("text=● unsaved").first()).toBeVisible();
    await expect(page.locator("text=/Untitled-1\\.md\\s*●/").first()).toBeVisible();

    // 7. Verify status bar reflects word count
    await expect(page.locator("[data-status-section='document-info']")).toContainText(/5\s*words/);
  });

  test("guards unsaved changes on tab close: cancel preserves edits, discard closes", async ({ page }) => {
    // 1. Create a new document
    const newDocButton = page.getByRole("button", { name: /New Document/i }).first();
    await newDocButton.click();

    const tab = page.locator('[data-tab-item="true"]').first();
    await expect(tab).toBeVisible();

    // 2. Type an edit to mark dirty
    const editor = page.locator(".ProseMirror").first();
    await editor.click();
    await page.keyboard.type("Unsaved work in progress.");
    await expect(page.locator("text=● unsaved").first()).toBeVisible();

    // 3. Trigger close tab button (hover to reveal)
    await tab.hover();
    const closeBtn = tab.locator('button[aria-label^="Close "]');
    await closeBtn.click();

    // 4. Close confirm modal appears
    const modal = page.locator('[data-modal="close-confirm"]');
    await expect(modal).toBeVisible();

    // 5. Clicking Cancel keeps the tab open and dirty
    const cancelBtn = modal.locator('button[data-action="cancel"]');
    await cancelBtn.click();
    await expect(modal).not.toBeVisible();
    await expect(tab).toBeVisible();
    await expect(page.locator("text=● unsaved").first()).toBeVisible();

    // 6. Trigger close again and choose Discard
    await tab.hover();
    await closeBtn.click();
    await expect(modal).toBeVisible();

    const discardBtn = modal.locator('button[data-action="discard"]');
    await discardBtn.click();
    await expect(modal).not.toBeVisible();

    // Tab is closed, returning to empty workspace / welcome hub
    await expect(page.locator('[data-tab-item="true"]')).toHaveCount(0);
  });

  test("preserves document content across Writing, Reading, and Code mode transitions", async ({ page }) => {
    // 1. Create a document
    const newDocButton = page.getByRole("button", { name: /New Document/i }).first();
    await newDocButton.click();

    const tab = page.locator('[data-tab-item="true"]').first();
    await expect(tab).toBeVisible();

    const editor = page.locator(".ProseMirror").first();
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.type("Heading Test Content");
    await expect(page.locator("text=● unsaved").first()).toBeVisible();

    // 2. Switch to Reading mode
    const readingBtn = page.locator('button[title*="Reading Mode"]').first();
    await readingBtn.click();

    // Reading view should display rendered content
    await expect(page.locator("main")).toContainText("Heading Test Content");

    // 3. Switch to Code mode
    const codeBtn = page.locator('button[title*="Source Code"]').first();
    await codeBtn.click();

    // Code view should contain source markdown
    await expect(page.locator("textarea").first()).toHaveValue(/Heading Test Content/);

    // 4. Switch back to Writing mode
    const writingBtn = page.locator('button[title*="Writing Mode"]').first();
    await writingBtn.click();

    await expect(page.locator(".ProseMirror").first()).toContainText("Heading Test Content");
  });
});
