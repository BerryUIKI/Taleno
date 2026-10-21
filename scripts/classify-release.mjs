import { appendFileSync } from "node:fs";
import { validateReleaseVersion } from "./validate-release-version.mjs";

const release = validateReleaseVersion();
if (!process.env.RELEASE_TAG) throw new Error("RELEASE_TAG is required");
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `platform=${release.platform}\n`);
}
console.log(`Release route: ${release.platform} (${release.tag})`);
