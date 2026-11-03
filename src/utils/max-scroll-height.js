// @ts-check

/**
 * The tallest scrollable content most browsers lay out. Firefox stops at about
 * 17.9 million pixels, and drops a taller spacer altogether, so a list that
 * tall cannot scroll at all. Chromium and Safari go up to about 33.5 million.
 */
export const FALLBACK_MAX_SCROLL_HEIGHT = 16_000_000;

/** @type {number | undefined} */
let measured;

/**
 * The most pixels of content this browser scrolls, measured once by asking it
 * to lay out an element far taller than any browser allows. A browser that
 * ignores an oversized height reports 0, so that reads as the safe fallback.
 * Returns the fallback on the server.
 * @returns {number}
 */
export function getMaxScrollHeight() {
  if (measured !== undefined) return measured;
  if (typeof document === "undefined") return FALLBACK_MAX_SCROLL_HEIGHT;

  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;inline-size:1px;block-size:100000000px";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();

  measured =
    height > 0
      ? Math.min(Math.floor(height * 0.95), 100_000_000)
      : FALLBACK_MAX_SCROLL_HEIGHT;
  return measured;
}
