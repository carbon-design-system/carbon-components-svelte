/**
 * The tallest scrollable content a browser lays out, for lists that
 * virtualize more rows than it can scroll.
 */

/** The limit used on the server, and where the browser reports none. */
export const FALLBACK_MAX_SCROLL_HEIGHT: number;

/** The most pixels of content this browser scrolls, measured once. */
export function getMaxScrollHeight(): number;
