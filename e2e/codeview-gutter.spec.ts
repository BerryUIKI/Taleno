import { expect, test, type Page } from "@playwright/test";
import { installTauriMock } from "./helpers/mockTauri";

test.beforeEach(async ({ page }) => {
  await installTauriMock(page);
  await page.goto("/");
});

async function openCodeMode(page: Page) {
  await page.getByRole("button", { name: /New Document/i }).first().click();
  await page.locator(".ProseMirror").waitFor();
  await page.locator('button[title*="Source Code"]').first().click();
  await page.locator(".cm-content").waitFor();
}

async function setContent(page: Page, content: string) {
  await page.evaluate(async (value) => {
    const { updateDocumentContent } = await import("/src/store/editor.ts");
    updateDocumentContent(value);
  }, content);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );
}

/**
 * Visible line numbers and the visible lines they belong to, in document order.
 * CodeMirror only mounts the visible slice, so both lists cover the same range.
 */
async function readGutter(page: Page) {
  return page.evaluate(() => {
    const numbers = Array.from(
      document.querySelectorAll<HTMLElement>(".cm-lineNumbers .cm-gutterElement")
    )
      .filter((node) => node.style.visibility !== "hidden")
      .map((node) => ({
        number: Number(node.textContent),
        top: node.getBoundingClientRect().top,
      }));
    const lines = Array.from(document.querySelectorAll<HTMLElement>(".cm-content .cm-line")).map(
      (node) => node.getBoundingClientRect().top
    );
    return { numbers, lines };
  });
}

function expectNumbersOnTheirLines({ numbers, lines }: Awaited<ReturnType<typeof readGutter>>) {
  expect(numbers.length).toBeGreaterThan(5);
  for (let index = 1; index < numbers.length; index++) {
    expect(numbers[index].number).toBe(numbers[index - 1].number + 1);
  }
  // Both lists are virtualized and their edges can differ: a tall line whose
  // first row has scrolled away keeps its content mounted but loses its number.
  // Every rendered number must therefore sit exactly on a rendered line.
  for (const entry of numbers) {
    const aligned = lines.some((top) => Math.abs(top - entry.top) <= 1);
    expect(aligned, `line number ${entry.number} has no line at its offset`).toBe(true);
  }
}

test("code mode line numbers stay on the first row of soft-wrapped lines", async ({ page }) => {
  await openCodeMode(page);

  const trailing = "x\n".repeat(200);
  await setContent(page, `short\n${trailing}`);
  const shortGutter = await readGutter(page);

  const longLine = "wrap ".repeat(160);
  await setContent(page, `${longLine}\n${trailing}`);
  const longGutter = await readGutter(page);

  expectNumbersOnTheirLines(longGutter);

  const rowHeight = 24;
  // The wrapped first line occupies several visual rows, so number 2 sits below
  // all of them rather than one row under number 1.
  const firstLineRows = (await page.evaluate(() => {
    const line = document.querySelector<HTMLElement>(".cm-content .cm-line")!;
    return line.getBoundingClientRect().height;
  })) / rowHeight;
  expect(firstLineRows).toBeGreaterThan(1);

  expect(Math.abs(longGutter.numbers[1].top - longGutter.numbers[0].top - firstLineRows * rowHeight)).toBeLessThanOrEqual(1);
  expect(Math.abs(longGutter.numbers[2].top - longGutter.numbers[1].top - rowHeight)).toBeLessThanOrEqual(1);
  // The unwrapped baseline shifts by exactly one row between the two documents.
  expect(Math.abs(shortGutter.numbers[1].top - shortGutter.numbers[0].top - rowHeight)).toBeLessThanOrEqual(1);
});

test("code mode line numbers handle CJK wrapping, empty lines and scrolling", async ({ page }) => {
  await openCodeMode(page);

  const trailing = "x\n".repeat(200);
  await setContent(page, `s\n\nb\n${trailing}`);
  const shortGutter = await readGutter(page);

  const cjkLine = "中文内容测试".repeat(60);
  await setContent(page, `${cjkLine}\n\nb\n${trailing}`);
  const cjkGutter = await readGutter(page);

  expectNumbersOnTheirLines(cjkGutter);
  expect(cjkGutter.numbers[0].number).toBe(1);
  // Line 2 is empty and needs its own row, line 3 holds "b".
  const rowHeight = 24;
  expect(cjkGutter.numbers[1].top - cjkGutter.numbers[0].top).toBeGreaterThan(rowHeight);
  expect(Math.abs(cjkGutter.numbers[2].top - cjkGutter.numbers[1].top - rowHeight)).toBeLessThanOrEqual(1);
  expect(Math.abs(shortGutter.numbers[2].top - shortGutter.numbers[1].top - rowHeight)).toBeLessThanOrEqual(1);

  // Deep scroll: the visible slice must be numbered from its own first line and
  // stay aligned with the lines themselves.
  await page.evaluate(() => {
    document.querySelector<HTMLElement>(".cm-scroller")!.scrollTop = 2000;
  });
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );

  const scrolled = await readGutter(page);
  expectNumbersOnTheirLines(scrolled);
  expect(scrolled.numbers[0].number).toBeGreaterThan(1);
});

test("code mode gutter stays aligned after incremental line edits", async ({ page }) => {
  await openCodeMode(page);

  const trailing = "x\n".repeat(120);
  const base = `中文内容测试${"很长的一行".repeat(20)}\n\nb\n${trailing}`;
  const edits = [
    base,
    // Same line count, long line grows.
    `中文内容测试${"很长的一行".repeat(30)}\n\nb\n${trailing}`,
    // Insert a new line in the middle of the document.
    `中文内容测试${"很长的一行".repeat(30)}\n新增一行\n\nb\n${trailing}`,
    // Delete the inserted line again.
    `中文内容测试${"很长的一行".repeat(30)}\n\nb\n${trailing}`,
    // Shrink the long line back.
    base,
  ];

  for (const content of edits) {
    await setContent(page, content);
    expectNumbersOnTheirLines(await readGutter(page));
  }
});
