export type DesktopPlatform = "macos" | "windows" | "linux" | "unknown";
export type AppPlatform = "ios" | "android" | "macos" | "windows" | "linux" | "unknown";

/**
 * Detect the host platform from WebView-provided browser metadata.
 */
export function detectPlatform(
  platform = navigator.platform,
  userAgent = navigator.userAgent,
  maxTouchPoints = navigator.maxTouchPoints || 0,
): AppPlatform {
  const p = (platform || "").toLowerCase();
  const ua = (userAgent || "").toLowerCase();

  // iOS detection (iPhone, iPod, iPad including iPadOS which reports as MacIntel with touch points)
  if (
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    ua.includes("ipad") ||
    (p.includes("mac") && maxTouchPoints > 1)
  ) {
    return "ios";
  }

  // Android detection
  if (ua.includes("android")) {
    return "android";
  }

  // Desktop macOS
  if (p.includes("mac") || ua.includes("macintosh")) {
    return "macos";
  }

  // Desktop Windows
  if (p.includes("win") || ua.includes("windows")) {
    return "windows";
  }

  // Desktop Linux
  if (p.includes("linux") || p.includes("x11") || ua.includes("linux")) {
    return "linux";
  }

  return "unknown";
}

/**
 * Detect the host desktop platform from WebView-provided browser metadata.
 * Backward compatible with existing desktop checks.
 */
export function detectDesktopPlatform(
  platform = navigator.platform,
  userAgent = navigator.userAgent,
): DesktopPlatform {
  const resolved = detectPlatform(platform, userAgent, 0);
  if (resolved === "macos" || resolved === "windows" || resolved === "linux") {
    return resolved;
  }
  return "unknown";
}

export function detectIsMobile(
  platform = navigator.platform,
  userAgent = navigator.userAgent,
  maxTouchPoints = navigator.maxTouchPoints || 0,
): boolean {
  const p = detectPlatform(platform, userAgent, maxTouchPoints);
  return p === "ios" || p === "android";
}

export const currentPlatform = detectPlatform();
export const isMobile = detectIsMobile();
export const isiOS = currentPlatform === "ios";
export const isAndroid = currentPlatform === "android";
export const desktopPlatform = detectDesktopPlatform();
export const isMacOS = desktopPlatform === "macos" && !isiOS;
