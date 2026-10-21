import { afterEach, expect, it, vi } from "vitest";
import { Suspense } from "solid-js";
import { render } from "solid-js/web";
import { lazyWithRetry } from "./lazyWithRetry";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); document.body.replaceChildren(); });

it("recovers a failed chunk load without discarding document state", async () => {
  const load = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ default: () => <p>Loaded editor</p> });
  const Lazy = lazyWithRetry(load);
  const host = document.createElement("div"); document.body.append(host);
  dispose = render(() => <Suspense fallback={<p>Loading...</p>}><Lazy /></Suspense>, host);
  await vi.waitFor(() => expect(host.querySelector('[role="alert"]')).not.toBeNull());
  host.querySelector<HTMLButtonElement>("button")!.click();
  await vi.waitFor(() => expect(host.textContent).toBe("Loaded editor"));
  expect(load).toHaveBeenCalledTimes(2);
});
