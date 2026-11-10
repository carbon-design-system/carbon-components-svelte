import type { BoundedFifoCache } from "./bounded-fifo-cache.js";

/** Results of a hover card's `load`, shared by `cacheKey`. */
export const hoverCardResults: BoundedFifoCache<
  string,
  { data: unknown; at: number }
>;

/** Claim the page-wide open slot, closing the card that held it. */
export function claimHoverCard(card: { close: () => void }): void;

/** Release the open slot, if `card` holds it. */
export function releaseHoverCard(card: { close: () => void }): void;

/** Whether keyboard focus is on `node`, as `:focus-visible` reports it. */
export function isFocusVisible(node: Element): boolean;
