/**
 * Validates that the active Node.js runtime meets the requirements of
 * locked frontend test dependencies (jsdom 30.0.1 requires ^22.22.2 || ^24.15.0 || >=26.0.0).
 */
const version = process.versions.node;
const [major, minor, patch] = version.split(".").map(Number);

export function isSupportedNode(major, minor, patch) {
  if (major === 22) {
    return minor > 22 || (minor === 22 && patch >= 2);
  }
  if (major === 24) {
    return minor > 15 || (minor === 15 && patch >= 0);
  }
  if (major >= 26) {
    return true;
  }
  return false;
}

if (!isSupportedNode(major, minor, patch)) {
  console.error(
    `\n\x1b[31;1m[Taleno] Unsupported Node.js version detected: v${version}\x1b[0m\n` +
      `The frontend test suite and jsdom require Node.js ^22.22.2 || ^24.15.0 || >=26.0.0.\n` +
      `Current runtime (v${version}) cannot load ESM packages synchronously inside CommonJS dependencies.\n` +
      `Please switch to a supported Node.js version (Node 24 LTS recommended).\n`
  );
  process.exit(1);
}
