// @ts-check
// One canvas behind a chart's SVG, shared by every mark that paints its
// bulk marks as pixels instead of elements. The chart owns the element,
// the pixel density, and the redraw; a mark only registers a painter.

import { writable } from "svelte/store";

/**
 * Schedule a paint on the next frame, or soon after where frames do not
 * exist, as in a test.
 * @param {() => void} fn
 */
function schedule(fn) {
  if (typeof requestAnimationFrame === "function") {
    return requestAnimationFrame(fn);
  }
  return setTimeout(fn, 16);
}

/**
 * @returns {import("./canvas-layer.d.ts").CanvasLayer}
 */
export function createCanvasLayer() {
  /** @type {import("./canvas-layer.d.ts").CanvasPainter[]} */
  let painters = [];
  /** @type {HTMLCanvasElement | null} */
  let canvas = null;
  /** @type {HTMLElement | null} */
  let host = null;
  let width = 0;
  let height = 0;
  let frame = 0;
  const count = writable(0);
  const dimming = writable(false);

  /**
   * A token is a `var()` reference, which means nothing to a canvas: read
   * it through an element that inherits the chart's theme.
   * @param {Map<string, string>} cache
   */
  function resolver(cache) {
    return (/** @type {string} */ color) => {
      const hit = cache.get(color);
      if (hit !== undefined) return hit;
      let resolved = color;
      if (host && color.includes("var(")) {
        const probe = document.createElement("span");
        probe.style.color = color;
        host.appendChild(probe);
        resolved = getComputedStyle(probe).color || color;
        probe.remove();
      }
      cache.set(color, resolved);
      return resolved;
    };
  }

  function paint() {
    frame = 0;
    if (!canvas || width <= 0 || height <= 0) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    // The element may be narrower than the chart's logical size when a fixed
    // width is squeezed: scale so painters draw in the chart's coordinates.
    const cssWidth = canvas.clientWidth || width;
    const cssHeight = canvas.clientHeight || height;
    const dpr = typeof devicePixelRatio === "number" ? devicePixelRatio : 1;
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    context.setTransform(
      (cssWidth / width) * dpr,
      0,
      0,
      (cssHeight / height) * dpr,
      0,
      0,
    );
    context.clearRect(0, 0, width, height);
    const resolve = resolver(new Map());
    for (const painter of painters) {
      context.save();
      painter.draw(context, { width, height, resolve });
      context.restore();
    }
  }

  function invalidate() {
    if (frame || !canvas) return;
    frame = schedule(paint);
  }

  function sync() {
    count.set(painters.length);
    dimming.set(painters.some((painter) => painter.dimOnHover === true));
  }

  return {
    count,
    dimming,
    register(painter) {
      painters = [...painters, painter];
      sync();
      invalidate();
      return () => {
        painters = painters.filter((entry) => entry !== painter);
        sync();
        invalidate();
      };
    },
    attach(node, figure) {
      canvas = node;
      host = figure;
      invalidate();
      // A theme swap changes every token: repaint when the document's
      // theme attributes move.
      const observer =
        typeof MutationObserver === "function"
          ? new MutationObserver(() => invalidate())
          : null;
      if (observer) {
        for (const target of [document.documentElement, document.body]) {
          observer.observe(target, {
            attributes: true,
            attributeFilter: ["class", "style", "data-carbon-theme"],
          });
        }
      }
      return () => {
        observer?.disconnect();
        if (canvas === node) canvas = null;
      };
    },
    resize(nextWidth, nextHeight) {
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      invalidate();
    },
    invalidate,
    snapshot() {
      if (!canvas || painters.length === 0) return null;
      if (frame) {
        if (typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(frame);
        } else {
          clearTimeout(frame);
        }
        frame = 0;
      }
      paint();
      try {
        return canvas.toDataURL("image/png");
      } catch {
        return null;
      }
    },
  };
}
