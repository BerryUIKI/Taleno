import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  relaunch: vi.fn(),
  getVersion: vi.fn(),
  downloadAndInstall: vi.fn(),
  install: vi.fn(),
  ask: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-updater", () => ({ check: mocks.check }));
vi.mock("@tauri-apps/plugin-process", () => ({ relaunch: mocks.relaunch }));
vi.mock("@tauri-apps/api/app", () => ({ getVersion: mocks.getVersion }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ ask: mocks.ask }));

import { setAutomaticUpdateChecks } from "../store/settings";
import { setLocale } from "../i18n";
import { addOrSwitchTab, setOpenTabs, setActiveTabId } from "../store/files";
import { documentFromResponse, updateDocumentContent } from "../store/editor";
import {
  checkForUpdates,
  checkForUpdatesInPlace,
  downloadProgress,
  installPendingUpdate,
  isCheckingUpdate,
  inPlaceCheckStatus,
  isUpdateAvailable,
  isAutomaticCheckDue,
  resetUpdaterForTests,
  updateInfo,
  updateModalOpen,
} from "./updater";

describe("native updater", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setAutomaticUpdateChecks(true);
    setLocale("en-US");
    resetUpdaterForTests();
    vi.clearAllMocks();
    mocks.getVersion.mockResolvedValue("0.1.4");
    setActiveTabId(null); setOpenTabs([]);
    mocks.ask.mockResolvedValue(false);
  });

  it("checks daily unless the user opts out", () => {
    expect(isAutomaticCheckDue(100_000_000)).toBe(true);
    window.localStorage.setItem("Taleno_last_update_check", "99999999");
    expect(isAutomaticCheckDue(100_000_000)).toBe(false);
    setAutomaticUpdateChecks(false);
    expect(isAutomaticCheckDue(200_000_000)).toBe(false);
  });

  it("opens a visible checking state before a manual request completes", async () => {
    let resolveCheck: (value: null) => void = () => undefined;
    mocks.check.mockReturnValue(
      new Promise<null>((resolve) => {
        resolveCheck = resolve;
      })
    );

    const request = checkForUpdates(true);
    expect(isCheckingUpdate()).toBe(true);
    expect(updateModalOpen()).toBe(true);
    expect(updateInfo()?.status).toBe("checking");

    resolveCheck(null);
    await request;
    expect(isCheckingUpdate()).toBe(false);
    expect(updateInfo()?.status).toBe("up_to_date");
  });

  it("reveals an automatic check when the user requests status", async () => {
    let resolveCheck: (value: null) => void = () => undefined;
    mocks.check.mockReturnValue(
      new Promise<null>((resolve) => {
        resolveCheck = resolve;
      })
    );

    const automaticRequest = checkForUpdates(false);
    expect(updateModalOpen()).toBe(false);

    await checkForUpdates(true);
    expect(updateModalOpen()).toBe(true);
    expect(updateInfo()?.status).toBe("checking");

    resolveCheck(null);
    await automaticRequest;
  });

  it("uses in-app localized notes and installs with progress", async () => {
    setLocale("zh-CN");
    mocks.downloadAndInstall.mockImplementation(async (onEvent) => {
      onEvent({ event: "Started", data: { contentLength: 100 } });
      onEvent({ event: "Progress", data: { chunkLength: 40 } });
      onEvent({ event: "Finished" });
    });
    mocks.check.mockResolvedValue({
      currentVersion: "0.1.3",
      version: "0.1.4",
      date: "2026-08-27T00:00:00Z",
      body: "English-only GitHub release notes",
      downloadAndInstall: mocks.downloadAndInstall,
      download: mocks.downloadAndInstall,
      install: mocks.install,
    });

    await checkForUpdates(true);
    expect(updateInfo()?.latestVersion).toBe("0.1.4");
    expect(updateInfo()?.releaseNotes).toContain("版本 0.1.4");
    expect(updateInfo()?.releaseNotes).not.toContain("GitHub release notes");

    await installPendingUpdate();
    expect(downloadProgress()).toBe(100);
    expect(mocks.relaunch).toHaveBeenCalledOnce();
  });

  it("cancels installation for active unsaved edits and rechecks edits made during download", async () => {
    addOrSwitchTab(documentFromResponse({ path: "/a.md", filename: "a.md", content: "disk", html: "", toc: [], word_count: 1 }));
    mocks.check.mockResolvedValue({ currentVersion: "0.1.10", version: "0.1.11", download: mocks.downloadAndInstall, install: mocks.install });
    await checkForUpdates(true);
    updateDocumentContent("active unsaved");
    await installPendingUpdate();
    expect(mocks.ask).toHaveBeenCalledOnce();
    expect(mocks.downloadAndInstall).not.toHaveBeenCalled();
    expect(mocks.install).not.toHaveBeenCalled();
    expect(mocks.relaunch).not.toHaveBeenCalled();
    mocks.ask.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    mocks.downloadAndInstall.mockImplementation(async () => { updateDocumentContent("new edit during download"); });
    await installPendingUpdate();
    expect(mocks.downloadAndInstall).toHaveBeenCalledOnce();
    expect(mocks.install).not.toHaveBeenCalled();
    expect(mocks.relaunch).not.toHaveBeenCalled();
  });

  it("checks updates in-place without opening a modal and highlights available updates", async () => {
    mocks.check.mockResolvedValue({
      currentVersion: "0.1.10",
      version: "0.1.11",
      date: "2026-10-28T00:00:00Z",
      body: "v0.1.11 release",
      downloadAndInstall: mocks.downloadAndInstall,
    });

    const promise = checkForUpdatesInPlace();
    expect(isCheckingUpdate()).toBe(true);
    expect(inPlaceCheckStatus()).toBe("checking");
    expect(updateModalOpen()).toBe(false);

    await promise;
    expect(isCheckingUpdate()).toBe(false);
    expect(inPlaceCheckStatus()).toBe("update_available");
    expect(isUpdateAvailable()).toBe(true);
    expect(updateModalOpen()).toBe(false);
  });
});
