// @ts-check
import {
  isHeaderRendered,
  UI_SHELL_HEADER_HEIGHT,
} from "../UIShell/nav-store.js";
import { observeResize } from "./shared-observer.js";
import { insertByDomOrder } from "./sort-by-dom-order.js";

const CLIPPING_OVERFLOW = /auto|scroll|hidden|overlay/;

/**
 * @typedef {object} StackEntry
 * @property {HTMLElement} node
 * @property {boolean} stacked Whether the stack sets the entry's `top`.
 * @property {(top: number) => void} onTop Called with a stacked entry's `top` in pixels.
 */

/**
 * @typedef {object} Stack
 * @property {HTMLElement} container
 * @property {StackEntry[]} entries Top-edge sticky elements, in DOM order.
 * @property {Map<HTMLElement, number>} heights
 * @property {boolean} header Whether a UI Shell `Header` covers the top.
 * @property {boolean} queued
 * @property {() => void} stopHeader
 */

/** @type {Map<HTMLElement, Stack>} */
const stacks = new Map();

/**
 * The element `node` sticks within: its nearest ancestor that clips
 * overflow, or the root element when the page scrolls.
 *
 * @param {HTMLElement} node
 * @returns {HTMLElement}
 */
export function stickyContainer(node) {
  const root = node.ownerDocument.documentElement;
  const body = node.ownerDocument.body;
  for (
    let element = node.parentElement;
    element && element !== body && element !== root;
    element = element.parentElement
  ) {
    const { overflowX, overflowY } = getComputedStyle(element);
    if (CLIPPING_OVERFLOW.test(overflowX + overflowY)) return element;
  }
  return root;
}

/** @param {Stack} stack */
function layout(stack) {
  if (stack.entries.length === 0) return;
  // Read every fixed `top` before writing the stacked ones.
  const fixed = stack.entries.map((entry) =>
    entry.stacked ? 0 : Number.parseFloat(getComputedStyle(entry.node).top),
  );
  let bottom = stack.header ? UI_SHELL_HEADER_HEIGHT : 0;
  /** @type {Array<[StackEntry, number]>} */
  const stackedTops = [];
  stack.entries.forEach((entry, index) => {
    const top = entry.stacked ? bottom : fixed[index] || 0;
    if (entry.stacked) stackedTops.push([entry, top]);
    bottom = Math.max(bottom, top + (stack.heights.get(entry.node) ?? 0));
  });
  for (const [entry, top] of stackedTops) entry.onTop(top);
  // Only a stack publishes, so a page whose bars keep their own offsets
  // reads as it did, in a `TableOfContents` too.
  if (stackedTops.length > 0) {
    stack.container.style.setProperty("--ccs-sticky-offset", `${bottom}px`);
  } else {
    stack.container.style.removeProperty("--ccs-sticky-offset");
  }
}

/** @param {Stack} stack */
function schedule(stack) {
  if (stack.queued) return;
  stack.queued = true;
  queueMicrotask(() => {
    stack.queued = false;
    layout(stack);
  });
}

/**
 * Add a top-edge sticky element to the stack of its scroll container. A
 * stacked entry sticks below the UI Shell `Header` (when the page scrolls)
 * and below every entry before it. The container publishes the bottom of
 * the lowest entry as `--ccs-sticky-offset`, in pixels, while it holds a
 * stacked entry.
 *
 * @param {HTMLElement} node
 * @param {boolean} stacked
 * @param {(top: number) => void} onTop
 * @returns {{ update: (stacked: boolean) => void, leave: () => void }}
 */
export function joinStack(node, stacked, onTop) {
  const container = stickyContainer(node);
  let stack = stacks.get(container);
  if (!stack) {
    const created = /** @type {Stack} */ ({
      container,
      entries: [],
      heights: new Map(),
      header: false,
      queued: false,
      stopHeader: () => {},
    });
    if (container === container.ownerDocument.documentElement) {
      created.stopHeader = isHeaderRendered.subscribe((rendered) => {
        created.header = rendered;
        schedule(created);
      });
    }
    stack = created;
    stacks.set(container, stack);
  }
  const current = stack;

  /** @type {StackEntry} */
  const entry = { node, stacked, onTop };
  current.entries = insertByDomOrder(current.entries, entry);
  const stopResize = observeResize(node, (resized) => {
    current.heights.set(
      node,
      resized.borderBoxSize?.[0]?.blockSize ??
        node.getBoundingClientRect().height,
    );
    schedule(current);
  });
  schedule(current);

  return {
    update(next) {
      if (next === entry.stacked) return;
      entry.stacked = next;
      schedule(current);
    },
    leave() {
      stopResize();
      current.heights.delete(node);
      current.entries = current.entries.filter((item) => item !== entry);
      if (current.entries.length > 0) {
        schedule(current);
        return;
      }
      current.stopHeader();
      current.container.style.removeProperty("--ccs-sticky-offset");
      stacks.delete(current.container);
    },
  };
}
