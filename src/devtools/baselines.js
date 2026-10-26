// @ts-check
import { cssPath } from "./audit.js";
import { rowDelta } from "./geometry.js";
import { typeTokens } from "./inspect.js";
import { createLayerLookup, DEV_TOOL, inBand } from "./page-scan.js";

/**
 * Glyph baselines of text on the page, as plain DOM code: GridOverlay
 * draws them, and `baselines` returns them as data.
 * @typedef {{ el: Element; x: number; y: number; width: number; rtl: boolean; pinned: boolean }} BaselineLine
 */

// Caps the number of lines so a huge page cannot stall a measure.
const MAX_LINES = 2000;

/**
 * Distance from the top of a font's content area to its alphabetic
 * baseline, measured with a zero-size inline-block, whose top edge sits on
 * the baseline. `host` is a dev tool element, so adding the probe does not
 * count as a page change.
 * @param {Element} host
 * @param {CSSStyleDeclaration} style
 * @param {Map<string, number>} cache
 */
function measureAscent(host, style, cache) {
  const font = [
    style.fontStyle,
    style.fontWeight,
    style.fontStretch,
    style.fontSize,
    style.fontFamily,
  ].join(" ");
  const cached = cache.get(font);
  if (cached !== undefined) return cached;

  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;line-height:normal;font-style:${style.fontStyle};font-weight:${style.fontWeight};font-stretch:${style.fontStretch};font-size:${style.fontSize};font-family:${style.fontFamily}`;
  probe.textContent = "x";
  const marker = document.createElement("span");
  marker.style.cssText = "display:inline-block;width:0;height:0";
  probe.append(marker);
  host.append(probe);
  const ascent =
    marker.getBoundingClientRect().top - probe.getBoundingClientRect().top;
  probe.remove();
  cache.set(font, ascent);
  return ascent;
}

/**
 * The baseline of every line of text outside the dev tools, in page
 * coordinates, or in viewport coordinates for text in a fixed box
 * (`pinned`). With `band`, only text near it.
 * @param {{ host: Element; band?: import("./page-scan.js").ScanBand | null }} options
 * @returns {BaselineLine[]}
 */
export function measureBaselines({ host, band = null }) {
  // A font may have loaded since the last pass, changing its metrics.
  /** @type {Map<string, number>} */
  const ascents = new Map();
  /** @type {BaselineLine[]} */
  const lines = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(text) {
        const parent = text.parentElement;
        if (!parent || !text.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
        if (parent.closest(`${DEV_TOOL}, script, style`)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );
  const range = document.createRange();
  const fixedBox = createLayerLookup(["fixed"]);
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  for (
    let text = walker.nextNode();
    text && lines.length < MAX_LINES;
    text = walker.nextNode()
  ) {
    const parent = /** @type {HTMLElement} */ (text.parentElement);
    // Skip text far from the viewport before paying for its style.
    if (band && !inBand(parent.getBoundingClientRect(), band, scrollY)) {
      continue;
    }
    const style = getComputedStyle(parent);
    if (style.visibility === "hidden") continue;
    range.selectNodeContents(text);
    const ascent = measureAscent(host, style, ascents);
    const pinned = fixedBox(parent) !== null;
    const dx = pinned ? 0 : scrollX;
    const dy = pinned ? 0 : scrollY;
    for (const rect of range.getClientRects()) {
      if (rect.width < 1 || rect.height < 1) continue;
      lines.push({
        el: parent,
        x: Math.round((rect.left + dx) * 10) / 10,
        y: Math.round((rect.top + dy + ascent) * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        // Right-to-left text ends on the left, so a label goes there.
        rtl: style.direction === "rtl",
        pinned,
      });
    }
  }
  range.detach();
  return lines;
}

/**
 * Glyph baselines of the page's text against rows every `step` pixels
 * from `offset`, as data: each line's distance to its nearest row, and how
 * many sit on one. With `scope`, only text inside it. Runs once over the
 * whole page. CSS places a baseline inside the line box by font metrics,
 * so read the deltas for consistency (the same type style lands at the
 * same offset), not for zero.
 * @param {{ step?: number; offset?: number; scope?: string }} [options]
 */
export function baselines(options = {}) {
  const { step = 8, offset = 0, scope = "" } = options;
  const host = document.createElement("div");
  host.setAttribute("data-ccs-dev-tool", "");
  host.style.cssText = "position:absolute;top:0;left:0;visibility:hidden";
  document.body.append(host);
  const measured = measureBaselines({ host });
  host.remove();
  const scrollY = window.scrollY;
  const lines = measured
    .filter((line) => !scope || line.el.closest(scope))
    .map((line) => {
      const pageY = line.pinned ? line.y + scrollY : line.y;
      const style = getComputedStyle(line.el);
      const round = (/** @type {number} */ n) => Math.round(n * 10) / 10;
      return {
        selector: cssPath(line.el),
        text: (line.el.textContent ?? "").trim().slice(0, 40),
        font: `${round(Number.parseFloat(style.fontSize))}/${round(Number.parseFloat(style.lineHeight)) || "normal"}`,
        // The Carbon type style, so lines of one style can be compared.
        type: typeTokens(style)[0] ?? null,
        x: line.x,
        y: pageY,
        width: line.width,
        delta: rowDelta(pageY, step, offset),
      };
    });
  return {
    step,
    offset,
    total: lines.length,
    onRow: lines.filter((line) => line.delta === 0).length,
    lines,
  };
}
