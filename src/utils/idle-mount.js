// @ts-check

/**
 * One queue for content waiting on the browser to be idle, so many
 * `LazyMount when="idle"` instances mount one after another, a single
 * mount each idle period, instead of all in the first one. Content above
 * the viewport is left for the reader to scroll near: mounting it would
 * change its height and move what's on screen, and Safari doesn't anchor
 * the scroll to make up for it.
 */

/** @typedef {{ element: Element; mount: () => void }} Pending */

/** @type {Set<Pending>} */
const queue = new Set();
/**
 * Cancels the scheduled run, if one is scheduled.
 * @type {(() => void) | undefined}
 */
let cancelRun;

/**
 * Without `requestIdleCallback` (Safari), wait this long between mounts:
 * long enough for a page to settle and for a scroll to start.
 */
const FALLBACK_PAUSE_MS = 250;

function schedule() {
  if (cancelRun || queue.size === 0) return;
  // A callback asked for during an idle period runs in the next one, so
  // each mount gets an idle period to itself.
  if (typeof requestIdleCallback === "function") {
    const handle = requestIdleCallback(run);
    cancelRun = () => cancelIdleCallback(handle);
  } else {
    const handle = setTimeout(run, FALLBACK_PAUSE_MS);
    cancelRun = () => clearTimeout(handle);
  }
}

function run() {
  cancelRun = undefined;
  for (const pending of queue) {
    queue.delete(pending);
    if (pending.element.getBoundingClientRect().bottom < 0) continue;
    pending.mount();
    break;
  }
  schedule();
}

/**
 * Queue `mount` for when the browser is idle, after what was queued
 * before, unless `element` is above the viewport by then. Returns a
 * function that takes it off the queue.
 *
 * @param {Element} element
 * @param {() => void} mount
 * @returns {() => void}
 */
export function queueIdleMount(element, mount) {
  /** @type {Pending} */
  const pending = { element, mount };
  queue.add(pending);
  schedule();
  return () => {
    queue.delete(pending);
    if (queue.size === 0) {
      cancelRun?.();
      cancelRun = undefined;
    }
  };
}
