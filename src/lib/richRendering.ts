// Visual renderers are loaded only when the Rust-produced HTML contains their nodes.
let diagramSequence = 0;
let mermaidLoader: Promise<typeof import("mermaid")> | undefined;

export async function enhanceMarkdown(container: HTMLElement): Promise<void> {
  const math = [...container.querySelectorAll<HTMLElement>(".math-inline, .math-display")];
  const diagrams = [...container.querySelectorAll<HTMLElement>("pre.mermaid")];
  if (math.length) {
    const [{ default: katex }] = await Promise.all([
      import("katex"), import("katex/dist/katex.min.css"),
    ]);
    for (const el of math) {
      if (el.dataset.katexRendered) continue;
      katex.render(el.dataset.math ?? el.textContent ?? "", el, {
        displayMode: el.classList.contains("math-display"), throwOnError: false, trust: false,
      });
      el.dataset.katexRendered = "true";
    }
  }
  if (diagrams.length) {
    mermaidLoader ??= import("mermaid").then(module => {
      module.default.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true });
      return module;
    }).catch(error => { mermaidLoader = undefined; throw error; });
    const { default: mermaid } = await mermaidLoader;
    for (const pre of diagrams) {
      if (pre.dataset.mermaidRendered) continue;
      pre.dataset.mermaidRendered = "pending";
      try {
        const { svg } = await mermaid.render(`taleno-diagram-${++diagramSequence}`, pre.textContent ?? "");
        const rendered = document.createElement("div");
        rendered.className = "mermaid-rendered";
        rendered.innerHTML = svg;
        // Replace only this diagram; adjacent document blocks must survive.
        pre.replaceWith(rendered);
      } catch (error) {
        pre.dataset.mermaidRendered = "error";
        const message = document.createElement("div");
        message.className = "mermaid-error";
        message.setAttribute("role", "status");
        message.textContent = `Mermaid Diagram Error: ${error instanceof Error ? error.message : String(error)}`;
        pre.before(message);
      }
    }
  }
}
