import { Component, Show } from "solid-js";
import {
  downloadProgress,
  checkForUpdates,
  installPendingUpdate,
  setUpdateModalOpen,
  updateInfo,
  updateModalOpen,
  updatePhase,
  isCheckingUpdate,
} from "../../lib/updater";
import { t } from "../../i18n";

export const UpdateModal: Component = () => {
  const info = () => updateInfo();
  const busy = () => isCheckingUpdate() || updatePhase() !== "idle";

  const beginInstall = async () => {
    await installPendingUpdate();
  };

  return (
    <Show when={updateModalOpen() && info()}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none no-select"
        onClick={() => !busy() && setUpdateModalOpen(false)}
      >
        <div
          class="w-full max-w-lg mx-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6 shadow-2xl space-y-5 text-[var(--color-text-primary)] text-left"
          role="dialog"
          aria-modal="true"
          aria-label={
            info()?.status === "error"
              ? t("update.updateErrorTitle")
              : info()?.status === "checking"
                ? t("update.checking")
              : t("update.updateAvailable")
          }
          onClick={(event) => event.stopPropagation()}
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-base font-bold tracking-tight">
                {info()?.status === "error"
                  ? t("update.updateErrorTitle")
                  : info()?.status === "checking"
                    ? t("update.checking")
                  : info()?.status === "up_to_date"
                    ? t("update.upToDate")
                    : t("update.updateAvailable")}
              </h3>
              <p class="mt-1 text-xs text-[var(--color-text-secondary)]">
                {info()?.status === "error"
                  ? t("update.updateErrorDesc")
                  : info()?.status === "checking"
                    ? t("update.checkingDesc")
                  : info()?.status === "up_to_date"
                    ? t("update.upToDateDesc")
                    : `v${info()?.latestVersion}`}
              </p>
            </div>
            <button
              class="p-1 rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] disabled:opacity-40"
              disabled={busy()}
              onClick={() => setUpdateModalOpen(false)}
              aria-label={t("dialogs.close")}
            >
              ✕
            </button>
          </div>

          <Show when={info()?.status === "checking"}>
            <div class="flex items-center gap-3 py-3 px-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]" aria-live="polite">
              <span class="w-4 h-4 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" aria-hidden="true" />
              <span>{t("update.checkingDesc")}</span>
            </div>
          </Show>

          <Show when={info()?.status === "up_to_date"}>
            <div class="flex items-center gap-3 py-3 px-3.5 rounded-xl bg-green-500/10 border border-green-500/30 text-xs text-green-600 dark:text-green-400" role="status">
              <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>{t("update.upToDateDesc")}</span>
            </div>
          </Show>

          <Show when={info()?.status === "update_available"}>
            <div class="flex items-center gap-3 py-2.5 px-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs">
              <span class="text-[var(--color-text-secondary)]">{t("update.currentVersion")}</span>
              <span class="font-mono font-semibold">v{info()?.currentVersion}</span>
              <span aria-hidden="true">→</span>
              <span class="font-mono font-semibold text-[var(--color-accent)]">v{info()?.latestVersion}</span>
            </div>
          </Show>

          <Show when={info()?.status === "update_available" && info()?.releaseNotes}>
            <div class="space-y-1.5">
              <label class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                {t("update.releaseNotes")}
              </label>
              <div class="max-h-52 overflow-y-auto rounded-xl p-3.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs leading-relaxed whitespace-pre-wrap select-text">
                {info()?.releaseNotes}
              </div>
            </div>
          </Show>

          <Show when={busy()}>
            <div class="space-y-2" aria-live="polite">
              <div class="h-2 overflow-hidden rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <div
                  class="h-full bg-[var(--color-accent)] transition-[width]"
                  style={{ width: `${downloadProgress()}%` }}
                />
              </div>
              <p class="text-xs text-[var(--color-text-secondary)]">
                {updatePhase() === "installing"
                  ? t("update.installing")
                  : t("update.downloading", { progress: downloadProgress() })}
              </p>
            </div>
          </Show>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
            <button
              class="px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] disabled:opacity-40"
              disabled={busy()}
              onClick={() => setUpdateModalOpen(false)}
            >
              {info()?.status === "update_available"
                ? t("update.remindLater")
                : t("dialogs.close")}
            </button>
            <Show when={info()?.status === "update_available"}>
              <button
                class="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:opacity-90 text-white font-semibold text-xs disabled:opacity-50"
                disabled={busy()}
                onClick={beginInstall}
              >
                {t("update.installAndRestart")}
              </button>
            </Show>
            <Show when={info()?.status === "error"}>
              <button
                class="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:opacity-90 text-white font-semibold text-xs"
                onClick={() => void checkForUpdates(true)}
              >
                {t("update.retry")}
              </button>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};
