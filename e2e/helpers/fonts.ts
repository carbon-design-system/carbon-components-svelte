import type { BrowserContext } from "@playwright/test";

/**
 * Make `document.fonts.ready` settle in WebKit. There `document.fonts.status`
 * stays "loading" for good, with no face loading, so a test that awaits
 * `ready` hangs until it times out. A face that fails to load (the IBM Plex
 * `local()` sources) is one cause. Elsewhere `ready` is untouched.
 *
 * In WebKit, `ready` settles when the native promise does, or once no face
 * is loading, checked after two frames so a load that layout starts is seen.
 */
export async function settleFontsReady(context: BrowserContext) {
  await context.addInitScript(() => {
    const { userAgent } = navigator;
    // Chromium's user agent also names AppleWebKit.
    if (!userAgent.includes("AppleWebKit") || userAgent.includes("Chrom"))
      return;
    const native = Object.getOwnPropertyDescriptor(
      FontFaceSet.prototype,
      "ready",
    )?.get;
    if (!native) return;

    // On the prototype: an own property on `document.fonts` does not stick.
    Object.defineProperty(FontFaceSet.prototype, "ready", {
      configurable: true,
      get(this: FontFaceSet) {
        const idle = new Promise<FontFaceSet>((resolve) => {
          const poll = () => {
            if ([...this].some((face) => face.status === "loading"))
              setTimeout(poll, 50);
            else resolve(this);
          };
          requestAnimationFrame(() => requestAnimationFrame(poll));
        });
        return Promise.race([native.call(this), idle]);
      },
    });
  });
}
