import { Component, Show } from "solid-js";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import {
  appVersion,
  checkForUpdates,
  isCheckingUpdate,
  updateInfo,
} from "../../lib/updater";
import { t } from "../../i18n";

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: Component<AboutModalProps> = (props) => {
  const handleOpenLink = async (url: string) => {
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleCheckUpdates = () => {
    void checkForUpdates(true);
  };

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none no-select animate-in fade-in duration-150"
        onClick={props.onClose}
      >
        <div
          class="w-full max-w-md mx-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6 shadow-2xl space-y-6 text-center text-[var(--color-text-primary)] animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Logo & App Info */}
          <div class="flex flex-col items-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center border border-[var(--color-accent)]/20 shadow-xs">
              <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold tracking-tight">Taleno</h2>
              <p class="text-xs text-[var(--color-text-secondary)] font-mono mt-0.5">
                Version {appVersion()}
              </p>
            </div>
          </div>

          <p class="text-xs text-[var(--color-text-secondary)] leading-relaxed px-2">
            {t("app.description")}
          </p>

          {/* Action Row: Check for Updates & Links */}
          <div class="flex flex-wrap items-center justify-center gap-2.5">
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/20 text-xs font-semibold transition-colors shadow-xs"
              onClick={handleCheckUpdates}
              disabled={isCheckingUpdate()}
            >
              <Show
                when={!isCheckingUpdate()}
                fallback={<span class="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] animate-spin" aria-hidden="true" />}
              >
                <Show
                  when={updateInfo()?.status === "up_to_date"}
                  fallback={
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                  }
                >
                  <svg class="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-label={t("update.upToDate")}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </Show>
              </Show>
              <span>{isCheckingUpdate() ? t("update.checking") : t("help.checkForUpdates")}</span>
            </button>

            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-xs font-semibold transition-colors"
              onClick={() => handleOpenLink("https://berryuiki.github.io/Taleno/")}
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
              </svg>
              <span>{t("help.website")}</span>
            </button>

            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-xs font-semibold transition-colors"
              onClick={() => handleOpenLink("https://github.com/BerryUIKI/Taleno")}
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>{t("welcome.github")}</span>
            </button>

            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-xs font-semibold transition-colors"
              onClick={() => handleOpenLink("https://github.com/BerryUIKI/Taleno#readme")}
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span>{t("help.documentation")}</span>
            </button>
          </div>

          {/* Tech Stack Meta & AGPL-3.0 Notice */}
          <div class="pt-3 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] space-y-1">
            <p>{t("app.licenseNotice")} &bull; {t("app.copyright")}</p>
            <p class="opacity-60 font-mono text-[10px]">Tauri 2 &bull; Rust &bull; SolidJS &bull; Milkdown &bull; pulldown-cmark</p>
          </div>

          {/* Close Button */}
          <div>
            <button
              class="w-full py-2 rounded-xl bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity active:scale-98"
              onClick={props.onClose}
            >
              {t("dialogs.close")}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
