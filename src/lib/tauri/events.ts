import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface FileChangedPayload {
  path: string;
}

/**
 * Listen for file-changed-on-disk events from the Rust backend.
 */
export async function onFileChanged(
  callback: (payload: FileChangedPayload) => void
): Promise<UnlistenFn> {
  return listen<FileChangedPayload>("file-changed", (event) => {
    callback(event.payload);
  });
}

/**
 * Listen for single-instance-open events when another instance is launched with file arguments.
 */
export async function onSingleInstanceOpen(
  callback: (files: string[]) => void
): Promise<UnlistenFn> {
  return listen<string[]>("single-instance-open", (event) => {
    callback(event.payload);
  });
}
