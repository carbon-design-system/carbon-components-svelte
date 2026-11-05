// @ts-check
// Keeps an overlay on its anchor. One shared listener or observer serves
// every overlay that is open, so a page of open tooltips costs the same as
// one: a window listener per event type, one scroll listener per scrolling
// box, one ResizeObserver, one MutationObserver. Updates run in the frame
// jobs' two stages, so every overlay reads layout before any writes it.

import { createFrameJob } from "./frame-batch.js";
import { getScrollableAncestors } from "./get-scrollable-ancestors.js";
import { observeResize } from "./shared-observer.js";
import { addPooledListener } from "./window-listener-pool.js";

/**
 * @typedef {{
 *   getBoundingClientRect: () => { top: number, bottom: number, left: number, right: number, width: number, height: number },
 *   contextElement?: Element | null,
 * }} VirtualAnchor
 *   An anchor that is not an element: a caret, a pointer, a range. Give it a
 *   `contextElement` when it lives inside a scrolling box, so a scroll there
 *   moves the overlay.
 *
 * @typedef {object} AutoUpdateOptions
 * @property {boolean} [ancestorScroll] Update when a box around the anchor
 *   scrolls, and when the window does. On by default.
 * @property {boolean} [ancestorResize] Update when the window resizes. On by
 *   default.
 * @property {boolean} [elementResize] Update when the anchor or the floating
 *   box changes size, in the frame it did, before it paints. On by default.
 * @property {boolean} [motion] Update while an ancestor of the anchor runs a
 *   transition or an animation, a frame at a time, and once more when it
 *   ends. On by default.
 * @property {boolean} [attributes] Update when the anchor's `style` or
 *   `class` changes. On by default.
 * @property {boolean} [immediate] Run `update` before returning. On by
 *   default. Turn it off when the caller places once the floating box has
 *   its content.
 */

/**
 * The element a virtual anchor stands in.
 * @param {Element | VirtualAnchor} anchor
 * @returns {Element | null}
 */
export function anchorElement(anchor) {
  if (typeof Element !== "undefined" && anchor instanceof Element) {
    return anchor;
  }
  return /** @type {VirtualAnchor} */ (anchor).contextElement ?? null;
}

// One scroll listener per scrolling box, shared by every overlay under it.
/** @type {Map<EventTarget, { handle: () => void, subscribers: Set<() => void> }>} */
const scrollers = new Map();

/**
 * @param {EventTarget} box
 * @param {() => void} callback
 * @returns {() => void}
 */
function onScroll(box, callback) {
  let entry = scrollers.get(box);
  if (!entry) {
    /** @type {Set<() => void>} */
    const subscribers = new Set();
    const handle = () => {
      for (const subscriber of [...subscribers]) subscriber();
    };
    entry = { handle, subscribers };
    scrollers.set(box, entry);
    box.addEventListener("scroll", handle, { passive: true });
  }
  entry.subscribers.add(callback);
  const shared = entry;
  return () => {
    shared.subscribers.delete(callback);
    if (shared.subscribers.size === 0) {
      box.removeEventListener("scroll", shared.handle);
      scrollers.delete(box);
    }
  };
}

// One MutationObserver for every anchor's attributes.
/** @type {MutationObserver | null} */
let attributeObserver = null;
/** @type {Map<Element, Set<() => void>>} */
const attributeWatchers = new Map();

/**
 * @param {Element} element
 * @param {() => void} callback
 * @returns {() => void}
 */
function onAttributes(element, callback) {
  if (typeof MutationObserver === "undefined") return () => {};
  attributeObserver ??= new MutationObserver((records) => {
    for (const record of records) {
      for (const watcher of [
        ...(attributeWatchers.get(/** @type {Element} */ (record.target)) ??
          []),
      ]) {
        watcher();
      }
    }
  });
  let watchers = attributeWatchers.get(element);
  if (!watchers) {
    watchers = new Set();
    attributeWatchers.set(element, watchers);
    attributeObserver.observe(element, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }
  watchers.add(callback);
  return () => {
    watchers.delete(callback);
    if (watchers.size === 0) attributeWatchers.delete(element);
    // `observe` has no per-target stop. A target left observed with no
    // watchers costs a skipped record, until the last watcher goes.
    if (attributeWatchers.size === 0) {
      attributeObserver?.disconnect();
      attributeObserver = null;
    }
  };
}

// Transitions and animations of ancestors, from one set of window listeners.
/**
 * @typedef {{ anchor: Element, run: () => void, running: Set<unknown> }} Motion
 * @type {Set<Motion>}
 */
const motions = new Set();
/** @type {Array<() => void>} */
let motionStops = [];

// A transition of these properties never moves anything.
const PAINT_ONLY =
  /^(opacity|color|background|border-.*color|outline|box-shadow|filter|fill|stroke|visibility|text-decoration|caret-color|cursor)/;

/**
 * @param {Event} event
 * @param {"start" | "end"} phase
 */
function handleMotion(event, phase) {
  const { target } = event;
  if (!(target instanceof Node)) return;
  const property = /** @type {TransitionEvent} */ (event).propertyName;
  if (property && PAINT_ONLY.test(property)) return;
  for (const motion of [...motions]) {
    if (!target.contains(motion.anchor)) continue;
    if (phase === "start") motion.running.add(target);
    else motion.running.delete(target);
    motion.run();
  }
}

function listenForMotion() {
  if (motionStops.length > 0) return;
  motionStops = [
    addPooledListener("transitionrun", (e) => handleMotion(e, "start")),
    addPooledListener("animationstart", (e) => handleMotion(e, "start")),
    addPooledListener("transitionend", (e) => handleMotion(e, "end")),
    addPooledListener("transitioncancel", (e) => handleMotion(e, "end")),
    addPooledListener("animationend", (e) => handleMotion(e, "end")),
    addPooledListener("animationcancel", (e) => handleMotion(e, "end")),
  ];
}

/**
 * Run `update` now and whenever the anchor, the floating box, or what is
 * around them moves, until the returned function is called. `update` reads
 * layout and may return a function: those run after every overlay's `update`
 * of the frame has read, so many open overlays force one layout between
 * them. A resize runs both at once, in the frame the size changed, so the box
 * never paints off its anchor.
 *
 * Without `window` (server rendering) nothing is listened for.
 *
 * @param {Element | VirtualAnchor} anchor
 * @param {Element | null} floating
 * @param {() => void | (() => void)} update
 * @param {AutoUpdateOptions} [options]
 * @returns {(() => void) & { update: () => void }} Stops updating. Its
 *   `update()` asks for one more update in the next frame.
 * @example
 * ```js
 * const stop = autoUpdate(anchor, floating, () => {
 *   const { x, y } = computePosition(rect(anchor), size(floating), options);
 *   return () => Object.assign(floating.style, { left: `${x}px`, top: `${y}px` });
 * });
 * ```
 */
export function autoUpdate(anchor, floating, update, options = {}) {
  if (typeof window === "undefined") {
    return Object.assign(() => {}, { update() {} });
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = true,
    motion = true,
    attributes = true,
    immediate = true,
  } = options;

  let active = true;
  const job = createFrameJob([
    () => (active ? update() : undefined),
    /** @param {void | (() => void)} write */
    (write) => {
      if (active && typeof write === "function") write();
    },
  ]);
  const schedule = () => job.schedule();

  /** @type {Array<() => void>} */
  const stops = [];
  const context = anchorElement(anchor);

  if (ancestorScroll) {
    stops.push(addPooledListener("scroll", schedule, { passive: true }));
    /** @type {Set<EventTarget>} */
    const boxes = new Set();
    for (const el of [context, floating]) {
      if (el) {
        for (const box of getScrollableAncestors(
          /** @type {HTMLElement} */ (el),
        )) {
          if (box instanceof Element) boxes.add(box);
        }
      }
    }
    for (const box of boxes) stops.push(onScroll(box, schedule));
  }
  if (ancestorResize) {
    stops.push(addPooledListener("resize", schedule, { passive: true }));
  }
  if (elementResize) {
    const now = () => {
      if (!active) return;
      const write = update();
      if (typeof write === "function") write();
    };
    // The anchor's first report is its size as it was when placed. The
    // floating box's is the first sight of its content, so it places again.
    let anchorSeen = false;
    if (context === anchor && anchor instanceof Element) {
      stops.push(
        observeResize(anchor, () => {
          if (anchorSeen) now();
          anchorSeen = true;
        }),
      );
    }
    if (floating) stops.push(observeResize(floating, now));
  }
  if (attributes && context === anchor && context) {
    stops.push(onAttributes(context, schedule));
  }
  if (motion && context) {
    /** @type {Motion} */
    const entry = {
      anchor: context,
      running: new Set(),
      run() {
        schedule();
        if (entry.running.size > 0) trackFrames();
      },
    };
    let tracking = false;
    function trackFrames() {
      if (tracking) return;
      tracking = true;
      requestAnimationFrame(function frame() {
        if (!active || entry.running.size === 0) {
          tracking = false;
          return;
        }
        schedule();
        requestAnimationFrame(frame);
      });
    }
    // A browser reports a transition to a listener that was there when it
    // began, so one already running when the overlay opens, or one that
    // begins in the frame it opens in, is found by asking.
    function adopt() {
      if (!active || typeof document.getAnimations !== "function") return;
      for (const animation of document.getAnimations()) {
        const target = /** @type {KeyframeEffect | null} */ (animation.effect)
          ?.target;
        if (
          !target ||
          animation.playState !== "running" ||
          entry.running.has(animation) ||
          !target.contains(context)
        ) {
          continue;
        }
        const property = /** @type {CSSTransition} */ (animation)
          .transitionProperty;
        if (property && PAINT_ONLY.test(property)) continue;
        entry.running.add(animation);
        const release = () => {
          entry.running.delete(animation);
          if (active) entry.run();
        };
        animation.finished.then(release, release);
      }
      if (entry.running.size > 0) entry.run();
    }
    listenForMotion();
    motions.add(entry);
    adopt();
    // The transition a change made in this frame starts is created after
    // this frame's callbacks, so look again in the next two.
    requestAnimationFrame(() => {
      adopt();
      requestAnimationFrame(adopt);
    });
    stops.push(() => {
      motions.delete(entry);
      if (motions.size === 0) {
        for (const stop of motionStops) stop();
        motionStops = [];
      }
    });
  }

  if (immediate) {
    const first = update();
    if (typeof first === "function") first();
  }

  return Object.assign(
    () => {
      active = false;
      job.cancel();
      for (const stop of stops) stop();
    },
    { update: schedule },
  );
}
