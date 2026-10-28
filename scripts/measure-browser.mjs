// Run against production previews: node scripts/measure-browser.mjs BASE_URL OUTPUT_JSON
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
async function main() {
const [baseUrl = "http://localhost:1423", output = "test-results/browser-performance.json"] = process.argv.slice(2);
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
try {
const page = await browser.newPage();
await page.addInitScript(() => {
  window.__TAURI_INTERNALS__ = { invoke: async (command, args = {}) => {
    if (command === "get_cli_args" || command === "list_plugins" || command === "list_themes") return [];
    if (command === "render_markdown") return { html: `<p>${args.markdown}</p>`, toc: [], word_count: args.markdown.trim().split(/\s+/).length };
    return null;
  } };
});
const startup = [];
const requests = new Set();
page.on("request", request => { if (request.resourceType() === "script") requests.add(request.url()); });
for (let i = 0; i < 5; i++) {
  await page.goto(baseUrl);
  await page.getByRole("button", { name: /New Document/i }).first().waitFor();
  startup.push(await page.evaluate(() => performance.now()));
}
const initialScripts = [...requests];
await page.getByRole("button", { name: /New Document/i }).first().click();
await page.locator(".ProseMirror").waitFor();
await page.locator('button[title*="Source Code"]').first().click();
const source = page.locator("textarea").first();
await source.waitFor({ state: "visible" });
console.log("Seeding 10000 source lines");
await source.evaluate(element => { element.value = "A sample line with several words.\n".repeat(10000); element.dispatchEvent(new InputEvent("input", { bubbles: true })); });
const measure = async locator => {
  await locator.evaluate(element => {
    window.__inputSamples = []; window.__frameSamples = [];
    element.addEventListener("beforeinput", () => { window.__inputStart = performance.now(); }, true);
    // Solid delegates input events to document. Register after that listener so
    // the sample includes application work as well as the native textarea edit.
    document.addEventListener("input", event => {
      if (event.target !== element) return;
      const start = window.__inputStart;
      queueMicrotask(() => window.__inputSamples.push(performance.now() - start));
      requestAnimationFrame(() => window.__frameSamples.push(performance.now() - start));
    });
  });
  await locator.focus();
  await page.keyboard.press("Control+End");
  for (let i = 0; i < 60; i++) { await page.keyboard.type("x"); await page.waitForTimeout(20); }
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const stats = list => {
      const values = list.filter(Number.isFinite).sort((a, b) => a - b);
      return { count: values.length, p50: values[Math.floor(values.length * .5)], p95: values[Math.floor(values.length * .95)], max: values.at(-1) };
    };
    return { handlerMs: stats(window.__inputSamples), nextAnimationFrameMs: stats(window.__frameSamples) };
  });
};
const sourceMetrics = await measure(source);
console.log("Seeding 500 writing paragraphs");
await source.evaluate(element => { element.value = "A sample paragraph with **bold** content.\n\n".repeat(500); element.dispatchEvent(new InputEvent("input", { bubbles: true })); });
await page.locator('button[title*="Writing Mode"]').first().click();
const editor = page.locator(".ProseMirror"); await editor.waitFor();
const writingMetrics = await measure(editor);
const result = { baseUrl, measuredAt: new Date().toISOString(), browser: browser.version(), platform: process.platform, node: process.version, startupMs: startup, initialScripts, source: { lines: 10000, ...sourceMetrics }, writing: { paragraphs: 500, ...writingMetrics }, limits: "Browser on this host with mocked IPC; no native Tauri startup, device acceptance or universal frame-budget guarantee. Input samples run after document-level delegated handlers, excluding idle serialization. Animation-frame samples include scheduling, not GPU presentation. Startup probe: new browser context, then four reloads; time until the New Document action is available." };
writeFileSync(output, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
}
main().catch(error => { console.error(error.message.split("\n")[0]); process.exitCode = 1; });
