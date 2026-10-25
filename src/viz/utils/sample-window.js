// @ts-check
// A queue for samples that arrive faster than a chart should redraw. Many
// in one frame draw once: the queue is flushed on the next animation frame,
// which the browser stops running in a hidden tab, so a background
// dashboard costs nothing until it is looked at. Before mount, and on the
// server, a flush is synchronous: the sample is part of the first render.

/**
 * @template T
 * @param {import("./sample-window.d.ts").SampleWindowOptions<T>} options
 * @returns {import("./sample-window.d.ts").SampleWindow<T>}
 */
export function createSampleWindow({ capacity, onFlush }) {
  /** @type {T[]} */
  let queue = [];
  let frame = 0;
  let mounted = false;
  let paused = false;
  let destroyed = false;

  function flush() {
    frame = 0;
    if (queue.length === 0 || destroyed) return;
    const batch = queue;
    queue = [];
    onFlush(batch);
  }

  function schedule() {
    if (frame || paused || destroyed || queue.length === 0) return;
    if (!mounted || typeof requestAnimationFrame !== "function") {
      flush();
      return;
    }
    if (typeof document !== "undefined" && document.hidden) return;
    frame = requestAnimationFrame(flush);
  }

  function onVisibility() {
    if (!document.hidden) schedule();
  }

  return {
    push(samples) {
      for (const sample of samples) queue.push(sample);
      // The queue never needs more than the window.
      const limit = capacity();
      if (limit !== undefined && queue.length > limit) {
        queue.splice(0, queue.length - limit);
      }
      schedule();
    },
    pause(next) {
      paused = next;
      if (!paused) schedule();
    },
    mount() {
      mounted = true;
      document.addEventListener("visibilitychange", onVisibility);
      schedule();
      return () => {
        destroyed = true;
        document.removeEventListener("visibilitychange", onVisibility);
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      };
    },
  };
}

/**
 * The rows plus the new ones, keeping only the last `max`: the reassign
 * idiom for a sliding window, `data = appendWindow(data, rows, 500)`.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {ReadonlyArray<T>} incoming
 * @param {number} [max]
 * @returns {T[]}
 */
export function appendWindow(rows, incoming, max) {
  const all = rows.concat(incoming);
  return max !== undefined && all.length > max
    ? all.slice(all.length - max)
    : all;
}
