// @ts-check
// A second channel beside color: a symbol per series on points, a pattern
// per series on fills, so a chart still reads in print, under forced
// colors, and to a reader who does not see the hues apart.

/** Symbols in the order series take them under `"auto"`. */
export const SYMBOLS = /** @type {const} */ ([
  "circle",
  "square",
  "triangle",
  "diamond",
  "cross",
  "star",
]);

/** Patterns in the order series take them under `"auto"`. */
export const PATTERNS = /** @type {const} */ ([
  "solid",
  "diagonal",
  "dots",
  "crosshatch",
  "horizontal",
  "vertical",
]);

/**
 * The path of a symbol centered on the origin, sized so each covers about
 * the area of a circle of radius `r`.
 * @param {import("./shapes.d.ts").Symbol} symbol
 * @param {number} r
 */
export function symbolPath(symbol, r) {
  const s = r * 0.886; // half side of a square with the circle's area
  switch (symbol) {
    case "square":
      return `M${-s},${-s}h${2 * s}v${2 * s}h${-2 * s}Z`;
    case "triangle": {
      const h = r * 1.25;
      return `M0,${-h}L${h * 1.1},${h * 0.8}L${-h * 1.1},${h * 0.8}Z`;
    }
    case "diamond": {
      const d = r * 1.3;
      return `M0,${-d}L${d},0L0,${d}L${-d},0Z`;
    }
    case "cross": {
      const a = r * 1.2;
      const w = r * 0.4;
      return `M${-w},${-a}h${2 * w}v${a - w}h${a - w}v${2 * w}h${-(a - w)}v${a - w}h${-2 * w}v${-(a - w)}h${-(a - w)}v${-2 * w}h${a - w}Z`;
    }
    case "star": {
      const outer = r * 1.4;
      const inner = outer * 0.45;
      let d = "";
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        d += `${i === 0 ? "M" : "L"}${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`;
      }
      return `${d}Z`;
    }
    default:
      return `M${-r},0a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
  }
}

/**
 * The strokes of one pattern tile, `size` square, drawn in the series
 * color over a tint of it.
 * @param {import("./shapes.d.ts").Pattern} pattern
 * @returns {{ size: number; d: string; dots?: boolean }}
 */
export function patternTile(pattern) {
  switch (pattern) {
    case "diagonal":
      return { size: 6, d: "M-1,1L1,-1M0,6L6,0M5,7L7,5" };
    case "dots":
      return { size: 6, d: "M3,3h0.01", dots: true };
    case "crosshatch":
      return {
        size: 6,
        d: "M-1,1L1,-1M0,6L6,0M5,7L7,5M-1,5L1,7M0,0L6,6M5,-1L7,1",
      };
    case "horizontal":
      return { size: 6, d: "M0,3H6" };
    case "vertical":
      return { size: 6, d: "M3,0V6" };
    default:
      return { size: 6, d: "" };
  }
}

/**
 * The symbol or pattern of each series: a fixed map, or one per series in
 * order under `"auto"`, starting after the first (a circle, or solid), so
 * a single series looks as it always did.
 * @template {string} Name
 * @param {ReadonlyArray<string | number>} keys
 * @param {"auto" | Partial<Record<string, Name>> | undefined} assignment
 * @param {ReadonlyArray<Name>} cycle
 * @returns {Map<string | number, Name>}
 */
export function assignShapes(keys, assignment, cycle) {
  /** @type {Map<string | number, Name>} */
  const out = new Map();
  if (!assignment) return out;
  keys.forEach((key, i) => {
    const given =
      assignment === "auto" ? cycle[i % cycle.length] : assignment[String(key)];
    if (given) out.set(key, given);
  });
  return out;
}
