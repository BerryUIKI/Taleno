import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { closeWindow } from "./commands";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: vi.fn() }));

describe("closeWindow", () => {
  const destroy = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getCurrentWindow).mockReturnValue({ destroy } as unknown as ReturnType<typeof getCurrentWindow>);
    destroy.mockResolvedValue(undefined);
  });

  it("destroys the window without waiting for a custom command", async () => {
    await closeWindow();

    expect(destroy).toHaveBeenCalledOnce();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("falls back to the native command if the window API fails", async () => {
    destroy.mockRejectedValue(new Error("window API unavailable"));

    await closeWindow();

    expect(invoke).toHaveBeenCalledExactlyOnceWith("close_window");
  });

  it("reports failure when neither close operation succeeds", async () => {
    destroy.mockRejectedValue(new Error("window API unavailable"));
    vi.mocked(invoke).mockRejectedValue(new Error("native close failed"));

    await expect(closeWindow()).rejects.toThrow("native close failed");
  });
});
