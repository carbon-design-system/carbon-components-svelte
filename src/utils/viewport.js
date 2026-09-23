// @ts-check
// A 2D viewport: a scale and a translation from world to screen, with the
// math for zooming about a point and fitting content, and an action that
// wires wheel and drag to it.

import { trackPointerDrag } from "./pointer-drag.js";
import { rafThrottle } from "./raf-throttle.js";

/** @typedef {import("./viewport.d.ts").Transform} Transform */

/** @returns {Transform} */
export function identity() {
  return { k: 1, tx: 0, ty: 0 };
}

/**
 * @param {Transform} t
 * @param {number} sx
 * @param {number} sy
 */
export function toWorld(t, sx, sy) {
  return { x: (sx - t.tx) / t.k, y: (sy - t.ty) / t.k };
}

/**
 * @param {Transform} t
 * @param {number} wx
 * @param {number} wy
 */
export function toScreen(t, wx, wy) {
  return { x: wx * t.k + t.tx, y: wy * t.k + t.ty };
}

/**
 * Scale by `factor` keeping the world point under screen `(sx, sy)` still.
 *
 * @param {Transform} t
 * @param {number} factor
 * @param {number} sx
 * @param {number} sy
 * @param {{ min?: number; max?: number }} [limits]
 * @returns {Transform}
 */
export function zoomAt(t, factor, sx, sy, limits = {}) {
  const { min = 0.1, max = 8 } = limits;
  const k = Math.min(max, Math.max(min, t.k * factor));
  const ratio = k / t.k;
  return {
    k,
    tx: sx - (sx - t.tx) * ratio,
    ty: sy - (sy - t.ty) * ratio,
  };
}

/**
 * @param {Transform} t
 * @param {number} dx Screen pixels.
 * @param {number} dy
 * @returns {Transform}
 */
export function translate(t, dx, dy) {
  return { k: t.k, tx: t.tx + dx, ty: t.ty + dy };
}

/**
 * The transform that shows `bounds` centered in `size` with `padding`
 * around it, never larger than `max`.
 *
 * @param {{ x0: number; y0: number; x1: number; y1: number }} bounds
 * @param {{ width: number; height: number }} size
 * @param {{ padding?: number; min?: number; max?: number }} [options]
 * @returns {Transform}
 */
export function fit(bounds, size, options = {}) {
  const { padding = 24, min = 0.1, max = 1 } = options;
  const w = Math.max(bounds.x1 - bounds.x0, 1);
  const h = Math.max(bounds.y1 - bounds.y0, 1);
  const room = {
    width: Math.max(size.width - padding * 2, 1),
    height: Math.max(size.height - padding * 2, 1),
  };
  const k = Math.min(
    max,
    Math.max(min, Math.min(room.width / w, room.height / h)),
  );
  return {
    k,
    tx: (size.width - w * k) / 2 - bounds.x0 * k,
    ty: (size.height - h * k) / 2 - bounds.y0 * k,
  };
}

/**
 * Svelte action: wheel and drag on `node` move a transform. A plain wheel
 * pans, a pinch or a wheel with Ctrl or Cmd zooms about the pointer, and a
 * drag on an accepted target pans. The action never holds the transform:
 * it reads `get()` and writes through `set()`, so the component owns it.
 *
 * @param {HTMLElement} node
 * @param {import("./viewport.d.ts").ViewportActionOptions} options
 */
export function viewport(node, options) {
  let current = options;

  /** @param {WheelEvent} event */
  function onWheel(event) {
    if (current.enabled === false) return;
    event.preventDefault();
    const t = current.get();
    if (event.ctrlKey || event.metaKey) {
      const rect = node.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * 0.01);
      current.set(
        zoomAt(t, factor, event.clientX - rect.left, event.clientY - rect.top, {
          min: current.min,
          max: current.max,
        }),
      );
    } else {
      current.set(translate(t, -event.deltaX, -event.deltaY));
    }
  }

  // Moves between frames add up, so a throttled frame never drops one.
  let pendingX = 0;
  let pendingY = 0;
  const flush = rafThrottle(() => {
    current.set(translate(current.get(), pendingX, pendingY));
    pendingX = 0;
    pendingY = 0;
  });
  /**
   * @param {number} dx
   * @param {number} dy
   */
  function pan(dx, dy) {
    pendingX += dx;
    pendingY += dy;
    flush();
  }
  const stopDrag = trackPointerDrag(node, {
    buttons: [0, 1],
    accept: (event) =>
      current.enabled !== false &&
      (event.button === 1 || (current.accept?.(event) ?? true)),
    onStart: () => node.classList.add("bx--viewport--panning"),
    onMove: (dx, dy) => pan(dx, dy),
    onEnd: () => node.classList.remove("bx--viewport--panning"),
  });

  node.addEventListener("wheel", onWheel, { passive: false });
  return {
    /** @param {import("./viewport.d.ts").ViewportActionOptions} next */
    update(next) {
      current = next;
    },
    destroy() {
      node.removeEventListener("wheel", onWheel);
      stopDrag();
      flush.cancel();
    },
  };
}
