import { describe, it, expect } from "vitest";
import { validateReleaseVersion } from "./validate-release-version.mjs";

describe("validateReleaseVersion", () => {
  it("validates current desktop release tag successfully", () => {
    const res = validateReleaseVersion({ releaseTag: "v0.1.9" });
    expect(res.version).toBe("0.1.9");
    expect(res.platform).toBe("desktop");
    expect(res.tag).toBe("v0.1.9");
  });

  it("validates mobile platform tags successfully", () => {
    const androidRes = validateReleaseVersion({ releaseTag: "v0.1.9-android" });
    expect(androidRes.platform).toBe("android");
    expect(androidRes.tag).toBe("v0.1.9-android");

    const iosRes = validateReleaseVersion({ releaseTag: "v0.1.9-ios" });
    expect(iosRes.platform).toBe("ios");
    expect(iosRes.tag).toBe("v0.1.9-ios");
  });

  it("enforces platform routing when targetPlatform is desktop", () => {
    expect(() =>
      validateReleaseVersion({
        releaseTag: "v0.1.9",
        targetPlatform: "desktop",
      })
    ).not.toThrow();

    expect(() =>
      validateReleaseVersion({
        releaseTag: "v0.1.9-android",
        targetPlatform: "desktop",
      })
    ).toThrowError(/Desktop release workflow only accepts desktop tag/);

    expect(() =>
      validateReleaseVersion({
        releaseTag: "v0.1.9-ios",
        targetPlatform: "desktop",
      })
    ).toThrowError(/Desktop release workflow only accepts desktop tag/);
  });

  it("enforces platform routing when targetPlatform is android or ios", () => {
    expect(() =>
      validateReleaseVersion({
        releaseTag: "v0.1.9-android",
        targetPlatform: "android",
      })
    ).not.toThrow();

    expect(() =>
      validateReleaseVersion({
        releaseTag: "v0.1.9",
        targetPlatform: "android",
      })
    ).toThrowError(/Android release workflow only accepts Android tag/);

    expect(() =>
      validateReleaseVersion({
        releaseTag: "v0.1.9-ios",
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
      validateReleaseVersion({ releaseTag: "v0.1.9-beta" })
    ).toThrowError(/Invalid release tag format/);

    expect(() =>
      validateReleaseVersion({ releaseTag: "0.1.9" })
    ).toThrowError(/Invalid release tag format/);
  });
});
