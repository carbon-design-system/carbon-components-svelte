import { tick } from "svelte";

/**
 * Replaces `new Image()` with a real, detached `<img>` that jsdom never loads,
 * so a test settles it by hand. A real element lets `ImageLoader` put it in a
 * `<picture>`. Call the returned `restore` (or `vi.unstubAllGlobals()`) after.
 */
export function stubPreloader(
  options: { cached?: boolean } = {},
): HTMLImageElement[] {
  const instances: HTMLImageElement[] = [];
  vi.stubGlobal(
    "Image",
    class {
      constructor() {
        const img = document.createElement("img");
        if (options.cached) {
          Object.defineProperty(img, "complete", { value: true });
          Object.defineProperty(img, "naturalWidth", { value: 10 });
        }
        instances.push(img);
        return img;
      }
    },
  );
  return instances;
}

/** Settle a preload the way the browser does, then let Svelte flush. */
export async function settlePreload(
  img: HTMLImageElement,
  outcome: "onload" | "onerror",
) {
  img[outcome]?.(new Event(outcome === "onload" ? "load" : "error"));
  await tick();
}
