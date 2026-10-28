import { expect, test } from "@playwright/test";
import { installTauriMock } from "./helpers/mockTauri";

test.beforeEach(async ({ page }) => {
  await installTauriMock(page);
  await page.goto("/");
});

test("code mode line numbers stay on the first row of soft-wrapped lines", async ({ page }) => {
  await page.getByRole("button", { name: /New Document/i }).first().click();
  await page.locator(".ProseMirror").waitFor();
  await page.locator('button[title*="Source Code"]').first().click();

  const textarea = page.locator("textarea.code-view-textarea");
  await textarea.waitFor();

  const setContent = async (content: string) => {
    await page.evaluate(async (value) => {
      const { updateDocumentContent } = await import("/src/store/editor.ts");
      updateDocumentContent(value);
    }, content);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        })
    );
  };

  const trailing = "x\n".repeat(200);
  await setContent(`short\n${trailing}`);
  const shortHeight = await textarea.evaluate((element) => element.scrollHeight);

  const longLine = "wrap ".repeat(160);
  await setContent(`${longLine}\n${trailing}`);
  const longHeight = await textarea.evaluate((element) => element.scrollHeight);

  const rowHeight = 24;
  // The textarea reserves one row for the short line, so the extra rows belong
  // to the long line itself.
  const wrappedRows = Math.round((longHeight - shortHeight) / rowHeight) + 1;
  expect(wrappedRows).toBeGreaterThan(1);

  const gutter = page.locator('[data-testid="gutter-line-number"]');
  await expect(gutter.first()).toHaveText("1");

  const tops = await gutter.evaluateAll((nodes) =>
    nodes.slice(0, 3).map((node) => node.getBoundingClientRect().top)
  );

  // Number 2 must sit below every visual row of the wrapped first line, and
  // number 3 must follow it one row later.
  expect(Math.abs(tops[1] - tops[0] - wrappedRows * rowHeight)).toBeLessThanOrEqual(1);
  expect(Math.abs(tops[2] - tops[1] - rowHeight)).toBeLessThanOrEqual(1);
});

test("code mode line numbers handle CJK wrapping, empty lines and scrolling", async ({ page }) => {
  await page.getByRole("button", { name: /New Document/i }).first().click();
  await page.locator(".ProseMirror").waitFor();
  await page.locator('button[title*="Source Code"]').first().click();

  const textarea = page.locator("textarea.code-view-textarea");
  await textarea.waitFor();

  const setContent = async (content: string) => {
    await page.evaluate(async (value) => {
      const { updateDocumentContent } = await import("/src/store/editor.ts");
      updateDocumentContent(value);
    }, content);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        })
    );
  };

  const trailing = "x\n".repeat(200);
  await setContent(`s\n\nb\n${trailing}`);
  const shortHeight = await textarea.evaluate((element) => element.scrollHeight);

  const cjkLine = "中文内容测试".repeat(60);
  await setContent(`${cjkLine}\n\nb\n${trailing}`);
  const longHeight = await textarea.evaluate((element) => element.scrollHeight);

  const rowHeight = 24;
  const wrappedRows = Math.round((longHeight - shortHeight) / rowHeight) + 1;
  expect(wrappedRows).toBeGreaterThan(1);

  // Scroll a little so the gutter must stay synced with the textarea.
  await textarea.evaluate((element) => {
    element.scrollTop = 150;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );

  const gutter = page.locator('[data-testid="gutter-line-number"]');
  await expect(gutter.first()).toHaveText("1");
  const tops = await gutter.evaluateAll((nodes) => {
    const byNumber = new Map(
      nodes.map((node) => [node.textContent?.trim(), node.getBoundingClientRect().top])
    );
    return [1, 2, 3, 4].map((number) => byNumber.get(String(number))!);
  });

  // Line 1 wraps, line 2 is empty, line 3 holds "b", line 4 is the trailing
  // empty line. Numbers must sit on each logical line's first visual row.
  expect(Math.abs(tops[1] - tops[0] - wrappedRows * rowHeight)).toBeLessThanOrEqual(1);
  expect(Math.abs(tops[2] - tops[1] - rowHeight)).toBeLessThanOrEqual(1);
  expect(Math.abs(tops[3] - tops[2] - rowHeight)).toBeLessThanOrEqual(1);

  // Deep scroll: the virtualized window must still anchor the number for the
  // line under the viewport at its measured content offset.
  const contentTop = 2000;
  await textarea.evaluate((element, top) => {
    element.scrollTop = top;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  }, contentTop + 24);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );

  const deep = await page.evaluate(
    ({ rows }) => {
      const numbers = Array.from(
        document.querySelectorAll<HTMLElement>('[data-testid="gutter-line-number"]')
      );
      const gutter = numbers[0]?.parentElement?.parentElement?.parentElement as HTMLElement | undefined;
      if (!gutter) return null;
      const paddingTop = parseFloat(getComputedStyle(gutter).paddingTop) || 0;
      const gutterTop = gutter.getBoundingClientRect().top;
      const windowContentTop = 2000;
      // From number 3 onward every line is a single row.
      const target = Math.floor(windowContentTop / 24) - rows + 2;
      const element = numbers.find((node) => Number(node.textContent) === target);
      return {
        target,
        top: element
          ? element.getBoundingClientRect().top - gutterTop - paddingTop + gutter.scrollTop
          : null,
      };
    },
    { rows: wrappedRows }
  );

  expect(deep?.top).not.toBeNull();
  expect(deep!.top!).toBeGreaterThanOrEqual(contentTop - rowHeight);
  expect(deep!.top!).toBeLessThanOrEqual(contentTop);
});

test("code mode gutter stays aligned after incremental line edits", async ({ page }) => {
  await page.getByRole("button", { name: /New Document/i }).first().click();
  await page.locator(".ProseMirror").waitFor();
  await page.locator('button[title*="Source Code"]').first().click();

  const textarea = page.locator("textarea.code-view-textarea");
  await textarea.waitFor();

  const setContent = async (content: string) => {
    await page.evaluate(async (value) => {
      const { updateDocumentContent } = await import("/src/store/editor.ts");
      updateDocumentContent(value);
    }, content);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        })
    );
  };

  /** Freshly lays out the same content as one block per logical line. */
  const referenceTops = (content: string) =>
    page.evaluate((value) => {
      const textarea = document.querySelector<HTMLTextAreaElement>("textarea.code-view-textarea")!;
      const style = getComputedStyle(textarea);
      const mirror = document.createElement("div");
      Object.assign(mirror.style, {
        position: "fixed",
        left: "-100000px",
        top: "0",
        visibility: "hidden",
        margin: "0",
        padding: "0",
        border: "0",
        boxSizing: "content-box",
        width: `${
          textarea.clientWidth -
          (parseFloat(style.paddingLeft) || 0) -
          (parseFloat(style.paddingRight) || 0)
        }px`,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        tabSize: "2",
        direction: "ltr",
      });
      const fragment = document.createDocumentFragment();
      const divs = value.split("\n").map((line) => {
        const div = document.createElement("div");
        div.textContent = line.length > 0 ? line : "\u200b";
        fragment.appendChild(div);
        return div;
      });
      mirror.appendChild(fragment);
      document.body.appendChild(mirror);
      const tops = divs.map((div) => div.offsetTop);
      mirror.remove();
      return tops;
    }, content);

  const gutterTops = () =>
    page.evaluate(() => {
      const numbers = Array.from(
        document.querySelectorAll<HTMLElement>('[data-testid="gutter-line-number"]')
      );
      const gutter = numbers[0]?.parentElement?.parentElement?.parentElement as HTMLElement;
      const paddingTop = parseFloat(getComputedStyle(gutter).paddingTop) || 0;
      const gutterTop = gutter.getBoundingClientRect().top;
      return numbers.map((node) => ({
        number: Number(node.textContent),
        top: node.getBoundingClientRect().top - gutterTop - paddingTop + gutter.scrollTop,
      }));
    });

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
    await setContent(content);
    await textarea.evaluate((element) => {
      element.scrollTop = 0;
      element.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    const expected = await referenceTops(content);
    const actual = await gutterTops();
    expect(actual.length).toBeGreaterThan(5);
    for (const item of actual) {
      expect(Math.abs(item.top - expected[item.number - 1])).toBeLessThanOrEqual(1);
    }
  }
});
