import type { Page } from "@playwright/test";

/**
 * Where the ink of the field's text and the ink of the layer's text sit, as
 * the difference between their centres of mass in each third of the field,
 * in px. The field draws its text in black with the layer hidden; then the
 * layer draws its text in black and the field's is clear. The same method as
 * TokenSearch, InlineSuggest and FormulaInput measured with.
 */
export async function drift(
  page: Page,
  id: string,
  {
    box: boxSelector = `.bx--text-input__field-wrapper, .bx--text-area__wrapper`,
    margin: edge = 8,
  } = {},
) {
  const box = page.locator(
    boxSelector
      .split(",")
      .map((part) => `#${id} ${part.trim()}`)
      .join(", "),
  );
  const style = await page.addStyleTag({ content: "x{}" });
  const common =
    ".bx--input-layer__content *{background:none!important;border-color:transparent!important;text-decoration:none!important}" +
    "*{transition:none!important;animation:none!important}" +
    "[data-ccs-input-layer]{caret-color:transparent!important;outline:none!important}";
  const shot = async (layer: boolean) => {
    await style.evaluate(
      (node, [layer, common]) => {
        node.textContent =
          common +
          (layer
            ? ".bx--input-layer{visibility:visible!important}" +
              ".bx--input-layer__content,.bx--input-layer__content *{color:#000!important;-webkit-text-fill-color:#000!important}" +
              "[data-ccs-input-layer]{color:transparent!important;-webkit-text-fill-color:transparent!important}"
            : ".bx--input-layer{visibility:hidden!important}" +
              "[data-ccs-input-layer]{color:#000!important;-webkit-text-fill-color:#000!important}");
      },
      [layer, common] as const,
    );
    return (await box.screenshot({ animations: "disabled" })).toString(
      "base64",
    );
  };
  const field = await shot(false);
  const layer = await shot(true);
  await style.evaluate((node) => node.remove());
  return page.evaluate(
    async ([a, b, edge]) => {
      const load = (s: string) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = `data:image/png;base64,${s}`;
        });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const dpr = window.devicePixelRatio || 1;
      const w = ia.width;
      const h = ia.height;
      const margin = Math.round(edge * dpr);
      const pixels = (img: HTMLImageElement) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const x = c.getContext("2d");
        if (!x) throw new Error("no canvas");
        x.drawImage(img, 0, 0);
        return x.getImageData(0, 0, w, h).data;
      };
      const da = pixels(ia);
      const db = pixels(ib);
      const centroid = (d: Uint8ClampedArray, third: number) => {
        let mass = 0;
        let mx = 0;
        let my = 0;
        const from = margin + ((w - 2 * margin) * third) / 3;
        const to = margin + ((w - 2 * margin) * (third + 1)) / 3;
        for (let y = 0; y < h - 2 * dpr; y++) {
          for (let x = Math.floor(from); x < to; x++) {
            const v = 255 - d[(y * w + x) * 4];
            if (v > 40) {
              mass += v;
              mx += v * x;
              my += v * y;
            }
          }
        }
        return { mass, x: mx / mass / dpr, y: my / mass / dpr };
      };
      const out: Array<{ dx: number; dy: number } | null> = [];
      for (let third = 0; third < 3; third++) {
        const ca = centroid(da, third);
        const cb = centroid(db, third);
        // A third with no text has nothing to compare.
        out.push(
          ca.mass > 800 && cb.mass > 800
            ? { dx: cb.x - ca.x, dy: cb.y - ca.y }
            : null,
        );
      }
      return out;
    },
    [field, layer, edge] as const,
  );
}

/** The most the layer is off, across and down, over the thirds that had text. */
export function worst(result: Awaited<ReturnType<typeof drift>>) {
  const found = result.filter((r) => r !== null);
  return {
    thirds: found.length,
    dx: Math.max(0, ...found.map((r) => Math.abs(r.dx))),
    dy: Math.max(0, ...found.map((r) => Math.abs(r.dy))),
  };
}

export const DRIFT_ACROSS = 1.25;
export const DRIFT_DOWN = 1;

const routed = new WeakSet<object>();

/**
 * WebKit waits for web fonts before it takes a screenshot, and the fonts come
 * from a CDN. Routing them away lets the wait end.
 */
export async function routeFontsAway(page: Page) {
  const context = page.context();
  if (routed.has(context)) return;
  routed.add(context);
  await context.route(
    (url) => url.hostname !== "localhost",
    (route) => route.abort(),
  );
}

/** Wait two frames: a layer placed in the frame has been placed by then. */
export const frames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
