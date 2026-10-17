import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a Node.js global
const host = process.env.TAURI_DEV_HOST;

if (process.env.VITEST) {
  const version = process.versions.node;
  const [major, minor, patch] = version.split(".").map(Number);
  const isSupported =
    (major === 22 && (minor > 22 || (minor === 22 && patch >= 2))) ||
    (major === 24 && (minor > 15 || (minor === 15 && patch >= 0))) ||
    major >= 26;
  if (!isSupported) {
    console.error(
      `\n\x1b[31;1m[Taleno] Unsupported Node.js version detected: v${version}\x1b[0m\n` +
        `The frontend test suite and jsdom require Node.js ^22.22.2 || ^24.15.0 || >=26.0.0.\n` +
        `Current runtime (v${version}) cannot load ESM packages synchronously inside CommonJS dependencies.\n` +
        `Please switch to a supported Node.js version (Node 24 LTS recommended).\n`
    );
    process.exit(1);
  }
}

export default defineConfig(async () => ({
  plugins: [solid(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
}));
