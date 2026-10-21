import { Component, Show } from "solid-js";
import { fileError, clearFileError } from "../../store/fileErrors";

export interface FileErrorBannerProps {
  onRetrySave?: () => void;
  onSaveAs?: () => void;
}

export const FileErrorBanner: Component<FileErrorBannerProps> = (_props) => {
  const err = () => fileError();

  return (
    <Show when={err()}>
      {(error) => (
        <div
          role="alert"
          class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full mx-auto px-4 py-3 rounded-lg shadow-xl border flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 duration-200"
          style={{
            background: "var(--color-bg-primary)",
            "border-color": "#ef4444",
            color: "var(--color-text-primary)",
          }}
        >
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="text-base text-red-500 flex-shrink-0" aria-hidden="true">⚠️</span>
            <div class="flex flex-col truncate">
              <span class="font-semibold text-red-500 capitalize">
                File {error().type} Error
              </span>
              <span class="truncate text-[var(--color-text-secondary)]" title={error().message}>
                {error().message}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <Show when={error().type === "save"}>
              <Show when={error().retry}>
                <button
                  class="px-2.5 py-1 rounded bg-[var(--color-accent)] text-white hover:opacity-90 font-medium transition-colors"
                  onClick={() => {
                    const retry = error().retry;
                    clearFileError();
                    retry?.();
                  }}
                >
                  Retry
                </button>
              </Show>
              <Show when={error().saveAs}>
                <button
                  class="px-2.5 py-1 rounded bg-[var(--color-hover)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] transition-colors"
                  onClick={() => {
                    const saveAs = error().saveAs;
                    clearFileError();
                    saveAs?.();
                  }}
                >
                  Save As...
                </button>
              </Show>
            </Show>
            <button
              class="px-2 py-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              onClick={clearFileError}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </Show>
  );
};
