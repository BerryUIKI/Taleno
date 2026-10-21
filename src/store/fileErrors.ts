import { createSignal } from "solid-js";

export type FileOperationType = "save" | "open" | "rename" | "delete" | "create" | "export";

export interface FileOperationError {
  id: string;
  type: FileOperationType;
  message: string;
  path?: string;
  targetPath?: string;
  canRetry?: boolean;
  retry?: () => void;
  saveAs?: () => void;
}

const [fileError, setFileError] = createSignal<FileOperationError | null>(null);

export function reportFileError(error: Omit<FileOperationError, "id">) {
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  setFileError({ ...error, id });
}

export function clearFileError() {
  setFileError(null);
}

export { fileError };
