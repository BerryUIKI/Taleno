// Code-mode keystroke latency: the app against a bare textarea that receives the
// same text and the same styles. The floor run shows how much of the measured
// latency belongs to browser text editing rather than to Taleno.
//
// Two editor kinds are handled. A textarea applies a keystroke synchronously, so
// its sample ends after the document-level input listener plus a microtask. The
// CodeMirror-backed code view applies the DOM edit first and turns it into a
// transaction in a MutationObserver callback; the probe therefore observes the
// content element with its own MutationObserver, which runs after CodeMirror's,
// so the sample also covers the application's update listener.
//
// Usage: PLAYWRIGHT_CHANNEL=chrome node scripts/measure-codeview-performance.mjs BASE_URL OUTPUT_JSON [RUNS]
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://localhost:1423";
const output = process.argv[3] || "test-results/codeview-performance.json";
const runs = Number(process.argv[4] || 3);
const KEYS = 60;
const LINES = 10000;
const TEXT = "A sample line with several words.\n".repeat(LINES);

const summary = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return {
    count: sorted.length,
    p50: +sorted[Math.floor(sorted.length * 0.5)].toFixed(1),
    p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
    max: +sorted.at(-1).toFixed(1),
  };
};
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return +(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2).toFixed(1);
};

// Listeners are installed once per page; the generation counter discards
// samples from earlier runs so repeated measurements do not double-count.
async function installProbe(element, kind) {
  await element.evaluate((el, editorKind) => {
    if (el.__probeInstalled) return;
    el.__probeInstalled = true;
    el.__probeGen = 0;
    el.__inputSamples = [];
    el.__frameSamples = [];
    el.addEventListener("beforeinput", () => { el.__inputStart = performance.now(); }, true);
    const record = () => {
      const gen = el.__probeGen;
      const start = el.__inputStart;
      if (!start) return;
      el.__inputStart = 0;
      queueMicrotask(() => { if (el.__probeGen === gen) el.__inputSamples.push(performance.now() - start); });
      requestAnimationFrame(() => { if (el.__probeGen === gen) el.__frameSamples.push(performance.now() - start); });
    };
    if (editorKind === "codemirror") {
      // Registered after CodeMirror's own observer, so it fires once the editor
      // has dispatched its transaction and notified the application.
      new MutationObserver(record).observe(el, { subtree: true, childList: true, characterData: true });
    } else {
      document.addEventListener("input", (event) => { if (event.target === el) record(); });
    }
  }, kind);
}

async function typeAndCollect(page, element) {
  await element.evaluate((el) => { el.__probeGen++; el.__inputSamples = []; el.__frameSamples = []; });
  await element.focus();
  await page.keyboard.press("Control+End");
  for (let i = 0; i < KEYS; i++) { await page.keyboard.type("x"); await page.waitForTimeout(20); }
  await page.waitForTimeout(300);
  const raw = await element.evaluate((el) => ({ handler: el.__inputSamples.slice(), frames: el.__frameSamples.slice() }));
  return { handlerMs: summary(raw.handler), frameMs: summary(raw.frames) };
}

async function seedTextField(page, element) {
  await element.evaluate((el, value) => {
    el.value = value;
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }, TEXT);
  await page.waitForTimeout(250);
}

async function seedCodeMirror(page, element) {
  await element.focus();
  await page.keyboard.press("Control+A");
  // A synthetic paste reaches CodeMirror's paste handler, which replaces the
  // selection with one transaction; typing the 10k-line text key by key would
  // take minutes and is not part of what is measured.
  await element.evaluate((el, value) => {
    const data = new DataTransfer();
    data.setData("text/plain", value);
    el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
  }, TEXT);
  await page.waitForTimeout(800);
}

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
try {
  const context = await browser.newContext();
  const app = await context.newPage();
  await app.addInitScript(() => {
    window.__TAURI_INTERNALS__ = {
      invoke: async (command, args = {}) => {
        if (command === "get_cli_args" || command === "list_plugins" || command === "list_themes") return [];
        if (command === "render_markdown")
          return { html: `<p>${args.markdown}</p>`, toc: [], word_count: args.markdown.trim().split(/\s+/).length };
        return null;
      },
    };
  });
  await app.goto(baseUrl);
  await app.getByRole("button", { name: /New Document/i }).first().click();
  await app.locator(".ProseMirror").waitFor();
  await app.locator('button[title*="Source Code"]').first().click();
  // The code view is a lazy chunk; wait for either editor implementation.
  await app.locator('[data-testid="code-view"], textarea.code-view-textarea').first().waitFor({ state: "visible" });
  const codeMirror = app.locator(".cm-content");
  const isCodeMirror = (await codeMirror.count()) > 0;
  const appSource = isCodeMirror ? codeMirror.first() : app.locator("textarea.code-view-textarea").first();
  await appSource.waitFor({ state: "visible" });
  const kind = isCodeMirror ? "codemirror" : "textarea";
  await installProbe(appSource, kind);
  const seedApp = kind === "codemirror" ? seedCodeMirror : seedTextField;

  const floor = await context.newPage();
  await floor.setContent(`<!doctype html><html><body style="margin:0">
    <textarea id="t" spellcheck="false" style="display:block;width:100vw;height:100vh;box-sizing:border-box;padding:24px;border:0;outline:none;resize:none;font-family:Consolas,monospace;font-size:14px;line-height:21px;white-space:pre-wrap;word-break:break-word;tab-size:2"></textarea>
  </body></html>`);
  const floorSource = floor.locator("#t");
  await installProbe(floorSource, "textarea");

  const result = {
    baseUrl,
    measuredAt: new Date().toISOString(),
    browser: browser.version(),
    platform: process.platform,
    node: process.version,
    editor: kind,
    lines: LINES,
    keysPerRun: KEYS,
    runs: [],
  };
  for (let run = 0; run < runs; run++) {
    await app.bringToFront();
    await seedApp(app, appSource);
    if (run === 0 && kind === "codemirror") {
      const height = await app.evaluate(() => document.querySelector(".cm-scroller")?.scrollHeight ?? 0);
      if (height < LINES * 18) throw new Error(`seeding did not fill the document (scroller height ${height})`);
    }
    const appRun = await typeAndCollect(app, appSource);
    if (run === 0) {
      // Guard against measuring an editor that silently refused the keystrokes.
      const typed = await app.evaluate((keyCount) => {
        const lines = document.querySelectorAll(".cm-content .cm-line");
        if (lines.length) return lines[lines.length - 1].textContent || "";
        const textarea = document.querySelector("textarea.code-view-textarea");
        return textarea ? textarea.value.slice(-keyCount) : "";
      }, KEYS);
      if (!/x{10,}/.test(typed)) throw new Error(`keystrokes did not reach the editor: ${JSON.stringify(typed.slice(-40))}`);
    }
    await floor.bringToFront();
    await seedTextField(floor, floorSource);
    const floorRun = await typeAndCollect(floor, floorSource);
    result.runs.push({ app: appRun, floor: floorRun });
    console.log(`run ${run + 1}: app handler ${JSON.stringify(appRun.handlerMs)} frame ${JSON.stringify(appRun.frameMs)}`);
    console.log(`         floor handler ${JSON.stringify(floorRun.handlerMs)} frame ${JSON.stringify(floorRun.frameMs)}`);
  }
  result.medians = {
    app: { handlerP50: median(result.runs.map((r) => r.app.handlerMs.p50)), handlerP95: median(result.runs.map((r) => r.app.handlerMs.p95)) },
    floor: { handlerP50: median(result.runs.map((r) => r.floor.handlerMs.p50)), handlerP95: median(result.runs.map((r) => r.floor.handlerMs.p95)) },
  };
  result.limits =
    "Browser and mocked IPC on one host; no native Tauri startup or mobile hardware. Samples start at beforeinput and end once the keystroke has been applied and the application notified (a textarea synchronously in its input listener, CodeMirror in the MutationObserver callback that dispatches its transaction), so they exclude idle serialization and GPU presentation. The floor page is a bare textarea with the same text, font, padding and wrap settings and no application code.";
  writeFileSync(output, JSON.stringify(result, null, 2));
  console.log("editor:", kind, "medians:", JSON.stringify(result.medians));
} finally {
  await browser.close();
}
