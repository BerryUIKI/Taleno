import { describe, expect, it, vi } from "vitest";
import { createZenWindow } from "./zenWindow";

describe("Zen fullscreen restoration", () => {
  it.each([false, true])("restores prior fullscreen=%s after rapid toggles", async previous => {
    const window = { isFullscreen: vi.fn().mockResolvedValue(previous), setFullscreen: vi.fn().mockResolvedValue(undefined) };
    const error = vi.fn();
    const toggle = createZenWindow(window, error);
    void toggle(false);
    void toggle(true);
    await toggle(false);
    expect(window.setFullscreen.mock.calls).toEqual([[true], [previous]]);
    expect(error).not.toHaveBeenCalled();
  });
});
