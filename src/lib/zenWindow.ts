interface FullscreenWindow {
  isFullscreen(): Promise<boolean>;
  setFullscreen(value: boolean): Promise<void>;
}

/** Serialize rapid toggles and restore the fullscreen state from before Zen. */
export function createZenWindow(window: FullscreenWindow, onError: (error: unknown) => void) {
  let previous: boolean | undefined;
  let queue = Promise.resolve();
  return (enabled: boolean) => {
    queue = queue.then(async () => {
      if (enabled && previous === undefined) {
        previous = await window.isFullscreen();
        await window.setFullscreen(true);
      } else if (!enabled && previous !== undefined) {
        const restore = previous;
        await window.setFullscreen(restore);
        previous = undefined;
      }
    }).catch(onError);
    return queue;
  };
}
