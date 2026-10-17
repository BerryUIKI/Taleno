import { describe, it, expect } from "vitest";
import { isSupportedNode } from "../../scripts/check-node-version.js";

describe("isSupportedNode", () => {
  it("rejects Node 20.x runtimes due to synchronous ESM import limitation", () => {
    expect(isSupportedNode(20, 18, 0)).toBe(false);
  });

  it("rejects Node 22 below 22.22.2", () => {
    expect(isSupportedNode(22, 14, 0)).toBe(false);
    expect(isSupportedNode(22, 22, 1)).toBe(false);
  });

  it("accepts Node 22.22.2 and above", () => {
    expect(isSupportedNode(22, 22, 2)).toBe(true);
    expect(isSupportedNode(22, 23, 0)).toBe(true);
  });

  it("rejects Node 24 below 24.15.0", () => {
    expect(isSupportedNode(24, 14, 9)).toBe(false);
  });

  it("accepts Node 24.15.0 and above", () => {
    expect(isSupportedNode(24, 15, 0)).toBe(true);
    expect(isSupportedNode(24, 19, 0)).toBe(true);
  });

  it("accepts Node 26 and future versions", () => {
    expect(isSupportedNode(26, 0, 0)).toBe(true);
    expect(isSupportedNode(28, 1, 0)).toBe(true);
  });
});
