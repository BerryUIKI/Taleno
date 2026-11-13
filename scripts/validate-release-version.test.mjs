import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateReleaseVersion } from "./validate-release-version.mjs";

// Read the project version instead of pinning it, so cutting a release does not
// break this suite.
const projectVersion = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8")
).version;
const desktopTag = `v${projectVersion}`;

describe("validateReleaseVersion", () => {
  it("validates current desktop release tag successfully", () => {
    const res = validateReleaseVersion({ releaseTag: desktopTag });
    expect(res.version).toBe(projectVersion);
    expect(res.platform).toBe("desktop");
    expect(res.tag).toBe(desktopTag);
  });

  it("validates mobile platform tags successfully", () => {
    const androidRes = validateReleaseVersion({ releaseTag: `${desktopTag}-android` });
    expect(androidRes.platform).toBe("android");
    expect(androidRes.tag).toBe(`${desktopTag}-android`);

    const iosRes = validateReleaseVersion({ releaseTag: `${desktopTag}-ios` });
    expect(iosRes.platform).toBe("ios");
    expect(iosRes.tag).toBe(`${desktopTag}-ios`);
  });

  it("enforces platform routing when targetPlatform is desktop", () => {
    expect(() =>
      validateReleaseVersion({
        releaseTag: desktopTag,
        targetPlatform: "desktop",
      })
    ).not.toThrow();

    expect(() =>
      validateReleaseVersion({
        releaseTag: `${desktopTag}-android`,
        targetPlatform: "desktop",
      })
    ).toThrowError(/Desktop release workflow only accepts desktop tag/);

    expect(() =>
      validateReleaseVersion({
        releaseTag: `${desktopTag}-ios`,
        targetPlatform: "desktop",
      })
    ).toThrowError(/Desktop release workflow only accepts desktop tag/);
  });

  it("enforces platform routing when targetPlatform is android or ios", () => {
    expect(() =>
      validateReleaseVersion({
        releaseTag: `${desktopTag}-android`,
        targetPlatform: "android",
      })
    ).not.toThrow();

    expect(() =>
      validateReleaseVersion({
        releaseTag: desktopTag,
        targetPlatform: "android",
      })
    ).toThrowError(/Android release workflow only accepts Android tag/);

    expect(() =>
      validateReleaseVersion({
        releaseTag: `${desktopTag}-ios`,
        targetPlatform: "ios",
      })
    ).not.toThrow();
  });

  it("rejects mismatched version numbers in release tags", () => {
    expect(() =>
      validateReleaseVersion({ releaseTag: "v0.1.8" })
    ).toThrowError(/Release tag version 0.1.8 does not match project version/);

    expect(() =>
      validateReleaseVersion({ releaseTag: "v0.1.8-android" })
    ).toThrowError(/Release tag version 0.1.8 does not match project version/);
  });

  it("rejects malformed release tags", () => {
    expect(() =>
      validateReleaseVersion({ releaseTag: `${desktopTag}-beta` })
    ).toThrowError(/Invalid release tag format/);

    expect(() =>
      validateReleaseVersion({ releaseTag: projectVersion })
    ).toThrowError(/Invalid release tag format/);
  });
});
