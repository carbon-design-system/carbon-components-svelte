// @ts-check

import { BoundedFifoCache } from "./bounded-fifo-cache.js";

/**
 * Results of a hover card's `load`, shared by `cacheKey`. Only the browser
 * writes to it, once a fetch settles, so a server never fills it.
 * @type {BoundedFifoCache<string, { data: unknown, at: number }>}
 */
export const hoverCardResults = new BoundedFifoCache(100);

/**
 * The hover card that is open, page-wide. One card shows at a time.
 * @type {{ close: () => void } | null}
 */
let current = null;

/**
 * Claim the open slot for a card and close the card that held it. A no-op
 * on the server, where the slot would be shared by every request and
 * nothing would release it.
 * @param {{ close: () => void }} card
 */
export function claimHoverCard(card) {
  if (typeof window === "undefined") return;
  const previous = current;
  current = card;
  if (previous && previous !== card) previous.close();
}

/**
 * Release the open slot, if `card` holds it.
 * @param {{ close: () => void }} card
 */
export function releaseHoverCard(card) {
  if (current === card) current = null;
}

/**
 * Whether keyboard focus is on `node`, as `:focus-visible` reports it. A
 * click on a button does not match it and a Tab does. Where the selector
 * is unknown, every focus counts.
 * @param {Element} node
 * @returns {boolean}
 */
export function isFocusVisible(node) {
  try {
    return node.matches(":focus-visible");
  } catch {
    return true;
  }
}
