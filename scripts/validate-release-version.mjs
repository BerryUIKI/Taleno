import { readFileSync } from "node:fs";

export function validateReleaseVersion({
  packageJsonPath = "package.json",
  cargoTomlPath = "src-tauri/Cargo.toml",
  tauriConfigPath = "src-tauri/tauri.conf.json",
  releaseTag = process.env.RELEASE_TAG,
  targetPlatform = process.env.RELEASE_PLATFORM,
} = {}) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const cargoToml = readFileSync(cargoTomlPath, "utf8");
  const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, "utf8"));
  const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];

  if (tauriConfig.version !== "../package.json") {
    throw new Error("tauri.conf.json must derive its version from ../package.json");
  }
  if (cargoVersion !== packageJson.version) {
    throw new Error(`Cargo version ${cargoVersion} does not match package version ${packageJson.version}`);
  }

  if (releaseTag) {
    const desktopTag = `v${packageJson.version}`;
    const androidTag = `v${packageJson.version}-android`;
    const iosTag = `v${packageJson.version}-ios`;

    const tagPattern = /^v(\d+\.\d+\.\d+)(?:-(android|ios))?$/;
    const match = releaseTag.match(tagPattern);
    if (!match) {
      throw new Error(
        `Invalid release tag format '${releaseTag}'. Expected '${desktopTag}', '${androidTag}', or '${iosTag}'.`
      );
    }

    const tagVersion = match[1];
    const platformSuffix = match[2]; // 'android' | 'ios' | undefined

    if (tagVersion !== packageJson.version) {
      throw new Error(
        `Release tag version ${tagVersion} does not match project version ${packageJson.version}`
      );
    }

    if (targetPlatform === "desktop" && platformSuffix) {
      throw new Error(
        `Desktop release workflow only accepts desktop tag '${desktopTag}', got '${releaseTag}'.`
      );
    }
    if (targetPlatform === "android" && platformSuffix !== "android") {
      throw new Error(
        `Android release workflow only accepts Android tag '${androidTag}', got '${releaseTag}'.`
      );
    }
    if (targetPlatform === "ios" && platformSuffix !== "ios") {
      throw new Error(
        `iOS release workflow only accepts iOS tag '${iosTag}', got '${releaseTag}'.`
      );
    }

    return {
      version: packageJson.version,
      platform: platformSuffix || "desktop",
      tag: releaseTag,
    };
  }

  return {
    version: packageJson.version,
    platform: "desktop",
    tag: `v${packageJson.version}`,
  };
}

const isDirectRun = process.argv[1] && (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` ||
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))
);

if (isDirectRun) {
  const result = validateReleaseVersion();
  console.log(`Release version validated: ${result.version} (platform: ${result.platform})`);
}
