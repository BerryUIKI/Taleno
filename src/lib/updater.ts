import { createSignal } from "solid-js";
import {
  check,
  type DownloadEvent,
  type Update,
} from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { automaticUpdateChecks } from "../store/settings";
import { t } from "../i18n";

const LAST_CHECK_KEY = "Taleno_last_update_check";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_STARTUP_JITTER_MS = 60 * 1000;

export type UpdateStatus = "checking" | "update_available" | "up_to_date" | "error";
export type UpdatePhase = "idle" | "downloading" | "installing";

export interface UpdateInfo {
  status: UpdateStatus;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  publishedAt: string;
  isManualCheck: boolean;
  errorMessage?: string;
}

export type InPlaceCheckStatus =
  | "idle"
  | "checking"
  | "up_to_date"
  | "update_available"
  | "error";

const [updateModalOpen, setUpdateModalOpen] = createSignal(false);
const [updateInfo, setUpdateInfo] = createSignal<UpdateInfo | null>(null);
const [isCheckingUpdate, setIsCheckingUpdate] = createSignal(false);
const [updatePhase, setUpdatePhase] = createSignal<UpdatePhase>("idle");
const [downloadProgress, setDownloadProgress] = createSignal(0);
const [appVersion, setAppVersion] = createSignal("0.1.9");
const [inPlaceCheckStatus, setInPlaceCheckStatus] = createSignal<InPlaceCheckStatus>("idle");

if (typeof window !== "undefined") {
  try {
    const verPromise = getVersion();
    if (verPromise && typeof verPromise.then === "function") {
      verPromise
        .then((ver) => {
          if (ver) setAppVersion(ver);
        })
        .catch(() => {
          // Fallback remains default
        });
    }
  } catch {
    // Ignore in non-Tauri or test contexts
  }
}

let pendingUpdate: Update | null = null;

export const isUpdateAvailable = () =>
  updateInfo()?.status === "update_available" || inPlaceCheckStatus() === "update_available";

export {
  updateModalOpen,
  setUpdateModalOpen,
  updateInfo,
  isCheckingUpdate,
  updatePhase,
  downloadProgress,
  appVersion,
  setAppVersion,
  inPlaceCheckStatus,
  setInPlaceCheckStatus,
};

export function compareVersions(remoteTag: string, localVersion: string): number {
  const remote = remoteTag.replace(/^v/, "").split(".").map(Number);
  const local = localVersion.replace(/^v/, "").split(".").map(Number);
  for (let index = 0; index < Math.max(remote.length, local.length); index += 1) {
    const difference = (remote[index] || 0) - (local[index] || 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}

function recordSuccessfulCheck(): void {
  localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
}

export function isAutomaticCheckDue(now = Date.now()): boolean {
  if (!automaticUpdateChecks()) return false;
  const lastCheck = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);
  return (
    !Number.isFinite(lastCheck) ||
    lastCheck <= 0 ||
    now - lastCheck >= ONE_DAY_MS
  );
}

function showManualCheckingStatus(): void {
  setUpdateInfo({
    status: "checking",
    currentVersion: "",
    latestVersion: "",
    releaseNotes: "",
    publishedAt: "",
    isManualCheck: true,
  });
  setUpdateModalOpen(true);
}

/** Check the signed stable-channel manifest configured in tauri.conf.json. */
export async function checkForUpdates(manual = false): Promise<void> {
  if (isCheckingUpdate()) {
    if (manual) showManualCheckingStatus();
    return;
  }
  setIsCheckingUpdate(true);

  if (manual) {
    showManualCheckingStatus();
  }

  try {
    const update = await check({ timeout: 30_000 });
    const currentVersion = update?.currentVersion || (await getVersion());
    recordSuccessfulCheck();

    if (!update) {
      pendingUpdate = null;
      if (manual) {
        setUpdateInfo({
          status: "up_to_date",
          currentVersion,
          latestVersion: currentVersion,
          releaseNotes: "",
          publishedAt: "",
          isManualCheck: true,
        });
        setUpdateModalOpen(true);
      }
      return;
    }

    pendingUpdate = update;
    setUpdateInfo({
      status: "update_available",
      currentVersion: update.currentVersion,
      latestVersion: update.version,
      releaseNotes: t("update.localizedReleaseNotes", {
        version: update.version,
      }),
      publishedAt: update.date || "",
      isManualCheck: manual,
    });
    setInPlaceCheckStatus("update_available");
    if (manual) {
      setUpdateModalOpen(true);
    }
  } catch (error) {
    console.warn("Update check failed:", error);
    if (manual) {
      setUpdateInfo({
        status: "error",
        currentVersion: "",
        latestVersion: "",
        releaseNotes: "",
        publishedAt: "",
        isManualCheck: true,
        errorMessage: String(error),
      });
      setUpdateModalOpen(true);
    }
  } finally {
    setIsCheckingUpdate(false);
  }
}

/** Schedule a due automatic check with a small startup jitter. */
export function scheduleAutomaticUpdateCheck(): () => void {
  if (!isAutomaticCheckDue()) return () => undefined;
  const delay = Math.floor(Math.random() * MAX_STARTUP_JITTER_MS);
  const timer = window.setTimeout(() => {
    if (automaticUpdateChecks()) void checkForUpdates(false);
  }, delay);
  return () => window.clearTimeout(timer);
}

/** Download, verify, install, and relaunch using Tauri's signed updater. */
export async function installPendingUpdate(): Promise<void> {
  if (!pendingUpdate || updatePhase() !== "idle") return;

  setUpdatePhase("downloading");
  setDownloadProgress(0);
  let downloaded = 0;
  let total = 0;

  try {
    await pendingUpdate.downloadAndInstall((event: DownloadEvent) => {
      if (event.event === "Started") {
        total = event.data.contentLength || 0;
      } else if (event.event === "Progress") {
        downloaded += event.data.chunkLength;
        if (total > 0) {
          setDownloadProgress(
            Math.min(100, Math.round((downloaded / total) * 100))
          );
        }
      } else if (event.event === "Finished") {
        setDownloadProgress(100);
        setUpdatePhase("installing");
      }
    });
    await relaunch();
  } catch (error) {
    console.error("Update installation failed:", error);
    setUpdatePhase("idle");
    setUpdateInfo((current) =>
      current
        ? { ...current, status: "error", errorMessage: String(error) }
        : current
    );
  }
}

/** In-place version check triggered by clicking the version number in the GUI. Does not open a modal window. */
export async function checkForUpdatesInPlace(): Promise<void> {
  if (isCheckingUpdate()) return;
  setIsCheckingUpdate(true);
  setInPlaceCheckStatus("checking");

  try {
    const update = await check({ timeout: 30_000 });
    const currentVersion = update?.currentVersion || (await getVersion());
    recordSuccessfulCheck();

    if (!update) {
      pendingUpdate = null;
      setInPlaceCheckStatus("up_to_date");
      setUpdateInfo({
        status: "up_to_date",
        currentVersion,
        latestVersion: currentVersion,
        releaseNotes: "",
        publishedAt: "",
        isManualCheck: false,
      });
      setTimeout(() => {
        if (inPlaceCheckStatus() === "up_to_date") {
          setInPlaceCheckStatus("idle");
        }
      }, 3500);
      return;
    }

    pendingUpdate = update;
    setInPlaceCheckStatus("update_available");
    setUpdateInfo({
      status: "update_available",
      currentVersion: update.currentVersion,
      latestVersion: update.version,
      releaseNotes: t("update.localizedReleaseNotes", {
        version: update.version,
      }),
      publishedAt: update.date || "",
      isManualCheck: false,
    });
  } catch (error) {
    console.warn("In-place update check failed:", error);
    setInPlaceCheckStatus("error");
    setTimeout(() => {
      if (inPlaceCheckStatus() === "error") {
        setInPlaceCheckStatus("idle");
      }
    }, 3500);
  } finally {
    setIsCheckingUpdate(false);
  }
}

export function resetUpdaterForTests(): void {
  pendingUpdate = null;
  setUpdatePhase("idle");
  setDownloadProgress(0);
  setUpdateInfo(null);
  setUpdateModalOpen(false);
  setInPlaceCheckStatus("idle");
}
