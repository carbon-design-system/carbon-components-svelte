// @ts-check
// The placement math every anchored overlay shares: where a floating box
// goes next to an anchor, on which side, aligned how, and whether it has to
// give way to the edges around it. Pure arithmetic on rects, so a caller
// measures once, reads the answer, and writes once.

/**
 * @typedef {{ top: number, bottom: number, left: number, right: number, width: number, height: number }} RectLike
 * @typedef {"top" | "bottom" | "left" | "right"} Side
 * @typedef {"start" | "center" | "end"} Align
 *   A physical alignment along the anchor's edge: `start` is the left edge
 *   of a box above or below the anchor and the top edge of one beside it.
 * @typedef {{ left: number, top: number, right: number, bottom: number }} Edges
 * @typedef {{ main?: number, cross?: number }} Offset
 *   `main` is the gap between anchor and box, `cross` slides the box along
 *   the anchor's edge: positive moves it to the right, or down.
 * @typedef {{ side: Side, align: Align }} Resolved
 * @typedef {object} FlipOptions
 * @property {boolean} [side] On by default. Set to `false` to keep the
 *   preferred side, and still fit the alignment.
 * @property {boolean} [fallbackAxis] When neither side along the main axis
 *   has room, open below, or above, or beside, on the other axis.
 * @property {false | true | "any"} [align] Take another alignment when the
 *   box runs past the boundary along the anchor's edge. `true` tries the
 *   opposite edge, and from center the edge with room. `"any"` also tries
 *   center from an edge.
 * @property {boolean} [bestFit] On by default. When no side or alignment
 *   fits, take the one that overflows least. Turn it off to move only to one
 *   that fits, and otherwise stay on the preferred one.
 * @typedef {object} ShiftOptions
 * @property {number} [padding] Room to keep between the box and the boundary.
 * @property {boolean} [mainAxis] Also slide the box across the side it opens
 *   on, to pin it to the boundary when no side fits.
 * @typedef {object} ArrowOptions
 * @property {number} size The arrow's length along the anchor's edge.
 * @property {number} [padding] Least distance from the box's corners.
 * @typedef {object} ComputePositionOptions
 * @property {string} [placement] `bottom`, `top-start`, `left-end`, `start`
 *   (the inline start side), `bottom-left`, `right-top`. A bare side centers.
 *   On a top or bottom side, `start` and `end` are inline sides and swap in
 *   RTL; on a left or right side they are the top and the bottom.
 * @property {boolean} [rtl] Read `start` and `end` for a right-to-left page.
 * @property {number | Offset | ((resolved: Resolved) => number | Offset)} [offset]
 * @property {boolean | FlipOptions} [flip] On by default. Takes the other
 *   side when the preferred one overflows `boundary` and the other overflows
 *   less.
 * @property {boolean | ShiftOptions} [shift] Slide the box along the
 *   anchor's edge to stay inside the boundary. Reported in the result, so a
 *   caller can slide the content and keep an arrow on the anchor.
 * @property {boolean | { padding?: number }} [size] Report the room left on
 *   the placed side, for a max size.
 * @property {ArrowOptions} [arrow]
 * @property {Edges | Edges[] | null} [boundary] The box the overlay stays in
 *   (several are intersected). Without one nothing flips or shifts.
 * @property {number | { main?: number, cross?: number }} [padding] Room kept
 *   inside the boundary: towards the side the box opens on when flipping it,
 *   and along the anchor's edge when fitting its alignment or sliding it.
 *
 * @typedef {object} PositionResult
 * @property {number} x Left edge of the box, in the anchor rect's coordinates.
 * @property {number} y Top edge.
 * @property {{ x: number, y: number }} reference Where the box's alignment
 *   meets the anchor: along the anchor's edge, the point `align` names
 *   (start, center or end) plus the cross offset. A box placed by this point
 *   and slid back by CSS (`translateX(-50%)`) never depends on its own size.
 *   Before any slide.
 * @property {Side} side The side the box settled on.
 * @property {Align} align The physical alignment it settled on.
 * @property {string} placement `side` and `align` in the form that was asked
 *   for: logical (`bottom-start`) for a logical placement, else physical.
 * @property {boolean} flipped Whether `side` is not the preferred one.
 * @property {{ x: number, y: number }} shift How far the box slid.
 * @property {{ x?: number, y?: number, offset: number } | undefined} arrow
 *   Where the arrow starts along the box, and how far it sits from the
 *   anchor's center when the box could not reach it.
 * @property {{ width: number, height: number } | undefined} available
 */

/** @type {Record<Side, Side>} */
const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };

/** @type {Record<"start" | "end", "start" | "end">} */
const OPPOSITE_ALIGN = { start: "end", end: "start" };

/** @param {Side} side */
function isVertical(side) {
  return side === "top" || side === "bottom";
}

/**
 * Read a placement into a side and a physical alignment.
 * @param {string} placement
 * @param {boolean} [rtl]
 * @returns {Resolved}
 */
export function parsePlacement(placement, rtl = false) {
  const [first, second] = placement.split("-");
  /** @type {Side} */
  const side =
    first === "start"
      ? rtl
        ? "right"
        : "left"
      : first === "end"
        ? rtl
          ? "left"
          : "right"
        : /** @type {Side} */ (first);
  /** @type {Align} */
  let align = "center";
  if (second === "left" || second === "top") align = "start";
  else if (second === "right" || second === "bottom") align = "end";
  else if (second === "start" || second === "end") {
    // Inline on the top and bottom, so it follows the page's direction.
    const inlineStart = isVertical(side) && rtl ? "end" : "start";
    align = second === "start" ? inlineStart : OPPOSITE_ALIGN[inlineStart];
  }
  return { side, align };
}

/**
 * Name a side and a physical alignment as a placement.
 * @param {Side} side
 * @param {Align} align
 * @param {{ rtl?: boolean, logical?: boolean }} [options] `logical` names the
 *   alignment `start` or `end`, as in `bottom-start`; otherwise it is
 *   physical, as in `bottom-left`.
 * @returns {string}
 */
export function formatPlacement(side, align, { rtl = false, logical } = {}) {
  if (align === "center") return side;
  const vertical = isVertical(side);
  if (logical) {
    return `${side}-${vertical && rtl ? OPPOSITE_ALIGN[align] : align}`;
  }
  const edge =
    align === "start"
      ? vertical
        ? "left"
        : "top"
      : vertical
        ? "right"
        : "bottom";
  return `${side}-${edge}`;
}

/**
 * @param {Side} side
 * @param {Align} align
 * @param {RectLike} a
 * @param {number} fw
 * @param {number} fh
 * @param {{ main: number, cross: number }} offset
 * @returns {{ x: number, y: number }}
 */
function place(side, align, a, fw, fh, { main, cross }) {
  if (isVertical(side)) {
    return {
      y: side === "top" ? a.top - fh - main : a.bottom + main,
      x:
        align === "start"
          ? a.left + cross
          : align === "end"
            ? a.right - fw + cross
            : a.left + a.width / 2 - fw / 2 + cross,
    };
  }
  return {
    x: side === "left" ? a.left - fw - main : a.right + main,
    y:
      align === "start"
        ? a.top + cross
        : align === "end"
          ? a.bottom - fh + cross
          : a.top + a.height / 2 - fh / 2 + cross,
  };
}

/** @param {Edges | Edges[] | null | undefined} boundary @returns {Edges | null} */
function intersect(boundary) {
  if (!boundary) return null;
  if (!Array.isArray(boundary)) return boundary;
  return boundary.reduce((box, next) => ({
    left: Math.max(box.left, next.left),
    top: Math.max(box.top, next.top),
    right: Math.min(box.right, next.right),
    bottom: Math.min(box.bottom, next.bottom),
  }));
}

/**
 * @param {number} lo
 * @param {number} hi
 * @param {number} size
 * @param {number} at
 */
function overflowAlong(lo, hi, size, at) {
  return Math.max(0, lo - at) + Math.max(0, at + size - hi);
}

/**
 * How far a box of `size` that starts at `at` has to slide to sit between
 * `min` and `max`. A box longer than the room keeps its start in view.
 * @param {number} at
 * @param {number} size
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function slideWithin(at, size, min, max) {
  return Math.max(min, Math.min(at, max - size)) - at;
}

/**
 * Where a floating box of `floating`'s size goes next to `anchor`. Reads no
 * DOM and writes none: the caller supplies rects (`getBoundingClientRect()`
 * of an element, a caret or a pointer) and a boundary, in one coordinate
 * space, and gets that space back.
 *
 * The order is the one Floating UI's middleware runs in: offset, flip, align
 * fit, shift, then the arrow and the size for the placement that won.
 *
 * @param {RectLike} anchor
 * @param {{ width: number, height: number }} floating
 * @param {ComputePositionOptions} [options]
 * @returns {PositionResult}
 */
export function computePosition(anchor, floating, options = {}) {
  const {
    placement = "bottom",
    rtl = false,
    offset = 0,
    flip = true,
    shift = false,
    size = false,
    arrow,
    padding: paddingOption = 0,
  } = options;
  const padMain =
    typeof paddingOption === "number"
      ? paddingOption
      : (paddingOption.main ?? 0);
  const padCross =
    typeof paddingOption === "number"
      ? paddingOption
      : (paddingOption.cross ?? 0);
  const fw = floating.width;
  const fh = floating.height;
  const bounds = intersect(options.boundary);
  const preferred = parsePlacement(placement, rtl);

  /**
   * @param {Side} side
   * @param {Align} align
   */
  function at(side, align) {
    const raw = typeof offset === "function" ? offset({ side, align }) : offset;
    const resolved =
      typeof raw === "number"
        ? { main: raw, cross: 0 }
        : { main: raw.main ?? 0, cross: raw.cross ?? 0 };
    return { ...place(side, align, anchor, fw, fh, resolved), ...resolved };
  }

  /**
   * How far the box runs past the boundary on the side it opens towards,
   * which is the room it lacks.
   * @param {Side} side
   * @param {{ x: number, y: number }} point
   */
  function mainOverflow(side, { x, y }) {
    if (!bounds) return 0;
    if (side === "top") return bounds.top + padMain - y;
    if (side === "bottom") return y + fh - (bounds.bottom - padMain);
    if (side === "left") return bounds.left + padMain - x;
    return x + fw - (bounds.right - padMain);
  }

  /** @param {Side} side @param {{ x: number, y: number }} point */
  function crossOverflow(side, { x, y }) {
    if (!bounds) return 0;
    return isVertical(side)
      ? overflowAlong(bounds.left + padCross, bounds.right - padCross, fw, x)
      : overflowAlong(bounds.top + padCross, bounds.bottom - padCross, fh, y);
  }

  let { side, align } = preferred;
  let point = at(side, align);

  // A box with no layout (zero size) has nothing to fit.
  const flipOptions = fw > 0 || fh > 0 ? (flip === true ? {} : flip) : false;
  if (
    flipOptions &&
    flipOptions.side !== false &&
    bounds &&
    mainOverflow(side, point) > 0
  ) {
    // The first side with room wins. With none, the one that overflows least,
    // the preferred side on a tie.
    let best = { side, overflow: mainOverflow(side, point) };
    const other = OPPOSITE[side];
    const otherOverflow = mainOverflow(other, at(other, align));
    if (
      otherOverflow < best.overflow &&
      (flipOptions.bestFit !== false || otherOverflow <= 0)
    ) {
      best = { side: other, overflow: otherOverflow };
    }
    if (best.overflow > 0 && flipOptions.fallbackAxis) {
      /** @type {Side[]} */
      const across = isVertical(side) ? ["right", "left"] : ["bottom", "top"];
      const fit = across.find((candidate) => {
        return mainOverflow(candidate, at(candidate, "center")) <= 0;
      });
      // None fits: the first, as the room below is what a page scrolls to.
      best = { side: fit ?? across[0], overflow: 0 };
      align = "center";
    }
    side = best.side;
    point = at(side, align);
  }

  if (flipOptions && bounds && flipOptions.align) {
    const current = crossOverflow(side, point);
    if (current > 0) {
      /** @type {Align[]} */
      const tries =
        align === "center"
          ? ["start", "end"]
          : [align === "start" ? "end" : "start"];
      if (align !== "center" && flipOptions.align === "any") {
        tries.push("center");
      }
      let bestAlign = align;
      let least = current;
      let bestPoint = point;
      for (const candidate of tries) {
        const next = at(side, candidate);
        const overflow = crossOverflow(side, next);
        if (
          overflow < least &&
          (flipOptions.bestFit !== false || overflow <= 0)
        ) {
          bestAlign = candidate;
          least = overflow;
          bestPoint = next;
        }
      }
      align = bestAlign;
      point = bestPoint;
    }
  }

  let { x, y } = point;
  const slid = { x: 0, y: 0 };
  if (shift && bounds && fw > 0 && fh > 0) {
    const pad = shift === true ? padCross : (shift.padding ?? padCross);
    // The box slides along the anchor's edge only. A box wider than the room
    // keeps its leading edge in view.
    if (isVertical(side)) {
      slid.x = slideWithin(x, fw, bounds.left + pad, bounds.right - pad);
      x += slid.x;
      if (shift !== true && shift.mainAxis) {
        slid.y = slideWithin(y, fh, bounds.top + pad, bounds.bottom - pad);
        y += slid.y;
      }
    } else {
      slid.y = slideWithin(y, fh, bounds.top + pad, bounds.bottom - pad);
      y += slid.y;
      if (shift !== true && shift.mainAxis) {
        slid.x = slideWithin(x, fw, bounds.left + pad, bounds.right - pad);
        x += slid.x;
      }
    }
  }

  /** @type {PositionResult["arrow"]} */
  let arrowResult;
  if (arrow) {
    const edge = arrow.padding ?? 0;
    if (isVertical(side)) {
      const center = anchor.left + anchor.width / 2 - x;
      const start = Math.max(
        edge,
        Math.min(center - arrow.size / 2, fw - arrow.size - edge),
      );
      arrowResult = { x: start, offset: start + arrow.size / 2 - center };
    } else {
      const center = anchor.top + anchor.height / 2 - y;
      const start = Math.max(
        edge,
        Math.min(center - arrow.size / 2, fh - arrow.size - edge),
      );
      arrowResult = { y: start, offset: start + arrow.size / 2 - center };
    }
  }

  /** @type {PositionResult["available"]} */
  let available;
  if (size && bounds) {
    const pad = size === true ? 0 : (size.padding ?? 0);
    const main = point.main;
    const width = bounds.right - bounds.left - 2 * pad;
    const height = bounds.bottom - bounds.top - 2 * pad;
    available = isVertical(side)
      ? {
          width,
          height:
            side === "bottom"
              ? bounds.bottom - pad - anchor.bottom - main
              : anchor.top - main - (bounds.top + pad),
        }
      : {
          height,
          width:
            side === "right"
              ? bounds.right - pad - anchor.right - main
              : anchor.left - main - (bounds.left + pad),
        };
  }

  const along = isVertical(side)
    ? {
        start: anchor.left,
        center: anchor.left + anchor.width / 2,
        end: anchor.right,
      }[align]
    : {
        start: anchor.top,
        center: anchor.top + anchor.height / 2,
        end: anchor.bottom,
      }[align];
  const reference = isVertical(side)
    ? { x: along + point.cross, y }
    : { x, y: along + point.cross };

  const logical =
    placement.split("-")[1] === "start" ||
    placement.split("-")[1] === "end" ||
    placement.startsWith("start") ||
    placement.startsWith("end");
  return {
    x,
    y,
    reference,
    side,
    align,
    placement: formatPlacement(side, align, { rtl, logical }),
    flipped: side !== preferred.side,
    shift: slid,
    arrow: arrowResult,
    available,
  };
}
