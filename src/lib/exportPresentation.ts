import { enhanceMarkdown } from "./richRendering";

export async function prepareHtmlPresentation(html: string): Promise<{ html: string; styles: string }> {
  const container = document.createElement("div");
  container.innerHTML = html;
  // Mermaid needs actual layout to calculate SVG dimensions.
  container.style.cssText = "position:fixed;left:-100000px;top:0;width:800px;visibility:hidden";
  document.body.append(container);
  try {
    await enhanceMarkdown(container);
    let styles = "";
    if (container.querySelector(".katex")) {
      const { default: css } = await import("katex/dist/katex.min.css?raw");
      const fonts = import.meta.glob<string>("/node_modules/katex/dist/fonts/*.woff2", {
        query: "?inline", import: "default", eager: true,
      });
      styles = css.replace(/src:[^;]+;/g, source => {
        const name = source.match(/fonts\/([^)'"\s]+\.woff2)/)?.[1];
        const data = name && fonts[`/node_modules/katex/dist/fonts/${name}`];
        return data ? `src:url(${data}) format('woff2');` : source;
      });
    }
    return { html: container.innerHTML, styles };
  } finally { container.remove(); }
}
