// Code-mode keystroke latency: the app against a bare textarea that receives the
// same text and the same styles. The floor run shows how much of the measured
// latency belongs to browser textarea layout rather than to Taleno.
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
async function installProbe(element) {
  await element.evaluate((el) => {
    if (el.__probeInstalled) return;
    el.__probeInstalled = true;
    el.__probeGen = 0;
    el.__inputSamples = [];
    el.__frameSamples = [];
    el.addEventListener("beforeinput", () => { el.__inputStart = performance.now(); }, true);
    document.addEventListener("input", (event) => {
      if (event.target !== el) return;
      const gen = el.__probeGen;
      const start = el.__inputStart;
      queueMicrotask(() => { if (el.__probeGen === gen) el.__inputSamples.push(performance.now() - start); });
      requestAnimationFrame(() => { if (el.__probeGen === gen) el.__frameSamples.push(performance.now() - start); });
    });
  });
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

async function seed(page, element) {
  await element.evaluate((el, value) => {
    el.value = value;
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }, TEXT);
  await page.waitForTimeout(250);
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
  const appSource = app.locator("textarea").first();
  await appSource.waitFor({ state: "visible" });
  await installProbe(appSource);

  const floor = await context.newPage();
  await floor.setContent(`<!doctype html><html><body style="margin:0">
    <textarea id="t" spellcheck="false" style="display:block;width:100vw;height:100vh;box-sizing:border-box;padding:24px;border:0;outline:none;resize:none;font-family:Consolas,monospace;font-size:14px;line-height:21px;white-space:pre-wrap;word-break:break-word;tab-size:2"></textarea>
  </body></html>`);
  const floorSource = floor.locator("#t");
  await installProbe(floorSource);

  const result = {
    baseUrl,
    measuredAt: new Date().toISOString(),
    browser: browser.version(),
    platform: process.platform,
    node: process.version,
    lines: LINES,
    keysPerRun: KEYS,
    runs: [],
  };
  for (let run = 0; run < runs; run++) {
    await app.bringToFront();
    await seed(app, appSource);
    const appRun = await typeAndCollect(app, appSource);
    await floor.bringToFront();
    await seed(floor, floorSource);
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
    "Browser and mocked IPC on one host; no native Tauri startup or mobile hardware. Samples start at beforeinput and end after document-level delegated handlers, so they exclude idle serialization and GPU presentation. The floor page is a bare textarea with the same text, font, padding and wrap settings and no application code.";
  writeFileSync(output, JSON.stringify(result, null, 2));
  console.log("medians:", JSON.stringify(result.medians));
} finally {
  await browser.close();
}
