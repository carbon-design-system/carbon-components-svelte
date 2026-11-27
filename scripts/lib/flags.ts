/**
 * Compiles a flag spec (a short list of layers) to the inner markup of a
 * 32 x 24 SVG. The spec lives in scripts/flags/spec.ts; scripts/build-flags.ts
 * writes the result to src/flags/.
 *
 * Every size is in grid units of the 32 x 24 frame, or a fraction of the box
 * the layer sits in (a canton is a smaller box). A size in grid units scales
 * with the box, so a Union Jack drawn once reads the same in a canton.
 */

/** The flag palette: Carbon colors, so flags sit beside Carbon icons. */
export const PALETTE = {
  white: "#fff", // white
  black: "#161616", // gray-100
  red: "#da1e28", // red-60
  maroon: "#a2191f", // red-70
  orange: "#ff832b", // orange-40
  yellow: "#f1c21b", // yellow-30
  green: "#198038", // green-60
  forest: "#0e6027", // green-70
  sky: "#33b1ff", // cyan-40
  blue: "#00539a", // cyan-70
  royal: "#002d9c", // blue-80
  navy: "#001d6c", // blue-90
} as const;

export type Color = keyof typeof PALETTE;
export type Stripe = Color | readonly [Color, number];
export type Point = readonly [number, number];

export type Layer =
  | readonly ["fill", Color]
  | readonly ["h" | "v", ...Stripe[]]
  | readonly ["rect", Color, number, number, number, number]
  | readonly ["cross", Color, number, number?, number?]
  | readonly ["saltire", Color, number, ("/" | "\\")?]
  | readonly ["poly", Color, readonly Point[]]
  | readonly ["disc", Color, number, number, number]
  | readonly ["ring", Color, number, number, number, number]
  | readonly ["oval", Color, number, number, number, number]
  | readonly ["star", Color, number, number, number, number?, number?, number?]
  | readonly ["crescent", Color, number, number, number, number, number]
  | readonly ["yinyang", Color, Color, number, number, number, number]
  | readonly ["trigram", Color, number, number, number, string]
  | readonly ["wheel", Color, number, number, number, number, number]
  | readonly ["canton", number, number, readonly Layer[]]
  | readonly ["ref", string]
  | readonly ["path", Color, string];

export type FlagSpec = readonly Layer[];

export const FRAME = { w: 32, h: 24 } as const;

type Box = { x: number; y: number; w: number; h: number };
type Piece = { fill: Color; d: string; hard: boolean };

export type CompiledFlag = {
  body: string;
  /** Layer kinds used, for coverage. */
  kinds: Set<string>;
  /** Whether a hand-authored path is used. */
  freehand: boolean;
};

const LEADING_ZERO = /^(-?)0\./;

const n = (value: number): string => {
  const text = (Math.round(value * 100) / 100).toString();
  return text === "-0" ? "0" : text.replace(LEADING_ZERO, "$1.");
};

const points = (list: readonly Point[]): string =>
  `M${list.map(([x, y]) => `${n(x)} ${n(y)}`).join(" ")}z`;

const rectD = (x: number, y: number, w: number, h: number): string =>
  `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;

/** Clip a convex polygon to a box (Sutherland-Hodgman). */
function clip(poly: Point[], box: Box): Point[] {
  const edges: Array<(p: Point) => number> = [
    (p) => p[0] - box.x,
    (p) => box.x + box.w - p[0],
    (p) => p[1] - box.y,
    (p) => box.y + box.h - p[1],
  ];
  let out = poly;
  for (const inside of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const a = input[i];
      const b = input[(i + 1) % input.length];
      const da = inside(a);
      const db = inside(b);
      if (da >= 0) out.push(a);
      if (da >= 0 !== db >= 0) {
        const t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    if (out.length === 0) break;
  }
  return out;
}

function starPoints(
  cx: number,
  cy: number,
  r: number,
  count: number,
  rot: number,
  ratio: number,
): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < count * 2; i++) {
    const angle = ((rot + (i * 180) / count) * Math.PI) / 180;
    const radius = i % 2 === 0 ? r : r * ratio;
    out.push([cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)]);
  }
  return out;
}

const stripeRatio = (count: number): number => {
  const half = Math.PI / count;
  return Math.cos(2 * half) / Math.cos(half);
};

function circleD(cx: number, cy: number, r: number, reverse = false): string {
  const sweep = reverse ? 1 : 0;
  return `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 ${sweep} ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 ${sweep} ${n(-2 * r)} 0z`;
}

export function compileFlag(
  spec: FlagSpec,
  lookup: (code: string) => FlagSpec | undefined,
): CompiledFlag {
  const pieces: Piece[] = [];
  const kinds = new Set<string>();
  let freehand = false;

  function run(layers: readonly Layer[], box: Box): void {
    const s = box.h / FRAME.h;
    const px = (f: number) => box.x + f * box.w;
    const py = (f: number) => box.y + f * box.h;
    const add = (fill: Color, d: string, hard = false) =>
      pieces.push({ fill, d, hard });

    for (const layer of layers) {
      const kind = layer[0];
      if (kind !== "ref" && kind !== "canton") kinds.add(kind);
      switch (kind) {
        case "fill":
          add(layer[1], rectD(box.x, box.y, box.w, box.h), true);
          break;
        case "h":
        case "v": {
          const stripes = (layer.slice(1) as Stripe[]).map((stripe) =>
            typeof stripe === "string" ? ([stripe, 1] as const) : stripe,
          );
          const total = stripes.reduce((sum, [, weight]) => sum + weight, 0);
          let at = 0;
          for (const [color, weight] of stripes) {
            const size = weight / total;
            if (kind === "h") {
              add(color, rectD(box.x, py(at), box.w, size * box.h), true);
            } else {
              add(color, rectD(px(at), box.y, size * box.w, box.h), true);
            }
            at += size;
          }
          break;
        }
        case "rect": {
          const [, color, x, y, w, h] = layer;
          add(color, rectD(px(x), py(y), w * box.w, h * box.h), true);
          break;
        }
        case "cross": {
          const [, color, thick, cx = 0.5, cy = 0.5] = layer;
          const t = thick * s;
          add(
            color,
            rectD(box.x, py(cy) - t / 2, box.w, t) +
              rectD(px(cx) - t / 2, box.y, t, box.h),
            true,
          );
          break;
        }
        case "saltire": {
          const [, color, thick, only] = layer;
          const t = thick * s;
          const diagonals: Array<[Point, Point]> = [
            [
              [box.x, box.y],
              [box.x + box.w, box.y + box.h],
            ],
            [
              [box.x + box.w, box.y],
              [box.x, box.y + box.h],
            ],
          ];
          let d = "";
          for (const [i, [a, b]] of diagonals.entries()) {
            if (only && (only === "\\") !== (i === 0)) continue;
            const dx = b[0] - a[0];
            const dy = b[1] - a[1];
            const len = Math.hypot(dx, dy);
            const ux = dx / len;
            const uy = dy / len;
            const nx = (-uy * t) / 2;
            const ny = (ux * t) / 2;
            const k = len;
            const band: Point[] = [
              [a[0] - ux * k + nx, a[1] - uy * k + ny],
              [b[0] + ux * k + nx, b[1] + uy * k + ny],
              [b[0] + ux * k - nx, b[1] + uy * k - ny],
              [a[0] - ux * k - nx, a[1] - uy * k - ny],
            ];
            d += points(clip(band, box));
          }
          add(color, d);
          break;
        }
        case "poly": {
          const [, color, list] = layer;
          add(color, points(list.map(([x, y]) => [px(x), py(y)] as Point)));
          break;
        }
        case "disc": {
          const [, color, cx, cy, r] = layer;
          add(color, circleD(px(cx), py(cy), r * box.h));
          break;
        }
        case "oval": {
          const [, color, cx, cy, rx, ry] = layer;
          const a = rx * box.h;
          const b = ry * box.h;
          add(
            color,
            `M${n(px(cx) - a)} ${n(py(cy))}a${n(a)} ${n(b)} 0 1 0 ${n(2 * a)} 0a${n(a)} ${n(b)} 0 1 0 ${n(-2 * a)} 0z`,
          );
          break;
        }
        case "ring": {
          const [, color, cx, cy, r, w] = layer;
          const R = r * box.h;
          add(
            color,
            circleD(px(cx), py(cy), R) +
              circleD(px(cx), py(cy), R - w * s, true),
          );
          break;
        }
        case "star": {
          const [, color, cx, cy, r, count = 5, rot = 0, ratio] = layer;
          add(
            color,
            points(
              starPoints(
                px(cx),
                py(cy),
                r * box.h,
                count,
                rot,
                ratio ?? stripeRatio(count),
              ),
            ),
          );
          break;
        }
        case "crescent": {
          // An outer disc less an inner disc of radius r2 * r, whose centre
          // sits dx * r towards the fly.
          const [, color, cx, cy, r, dx, r2] = layer;
          const R = r * box.h;
          const x0 = px(cx);
          const y0 = py(cy);
          const R2 = R * r2;
          const d = R * dx;
          // Circles meet where x = (d^2 + R^2 - R2^2) / (2d).
          const xm = (d * d + R * R - R2 * R2) / (2 * d);
          const ym = Math.sqrt(Math.max(0, R * R - xm * xm));
          add(
            color,
            `M${n(x0 + xm)} ${n(y0 - ym)}A${n(R)} ${n(R)} 0 1 0 ${n(x0 + xm)} ${n(y0 + ym)}A${n(R2)} ${n(R2)} 0 ${xm > d ? 1 : 0} 1 ${n(x0 + xm)} ${n(y0 - ym)}z`,
          );
          break;
        }
        case "yinyang": {
          const [, light, dark, cx, cy, r, rot] = layer;
          const R = r * box.h;
          const x0 = px(cx);
          const y0 = py(cy);
          const a = (rot * Math.PI) / 180;
          const at = (x: number, y: number) =>
            `${n(x0 + x * Math.cos(a) - y * Math.sin(a))} ${n(y0 + x * Math.sin(a) + y * Math.cos(a))}`;
          const h = R / 2;
          add(dark, circleD(x0, y0, R));
          add(
            light,
            `M${at(-R, 0)}A${n(R)} ${n(R)} 0 0 1 ${at(R, 0)}A${n(h)} ${n(h)} 0 0 0 ${at(0, 0)}A${n(h)} ${n(h)} 0 0 1 ${at(-R, 0)}z`,
          );
          break;
        }
        case "trigram": {
          // Bars laid across a line at angle `rot` from the centre: "1" is a
          // solid bar and "0" a broken one.
          const [, color, cx, cy, rot, bits] = layer;
          const barW = 6 * s;
          const barH = 1.4 * s;
          const gap = 1.1 * s;
          const a = (rot * Math.PI) / 180;
          const x0 = px(cx);
          const y0 = py(cy);
          const at = (x: number, y: number): Point => [
            x0 + x * Math.cos(a) - y * Math.sin(a),
            y0 + x * Math.sin(a) + y * Math.cos(a),
          ];
          let d = "";
          const rows = bits.length;
          for (let i = 0; i < rows; i++) {
            const y = (i - (rows - 1) / 2) * (barH + gap) - barH / 2;
            const spans =
              bits[i] === "1"
                ? [[-barW / 2, barW / 2]]
                : [
                    [-barW / 2, -gap * 0.6],
                    [gap * 0.6, barW / 2],
                  ];
            for (const [x1, x2] of spans) {
              d += points([
                at(x1, y),
                at(x2, y),
                at(x2, y + barH),
                at(x1, y + barH),
              ]);
            }
          }
          add(color, d);
          break;
        }
        case "wheel": {
          const [, color, cx, cy, r, w, count] = layer;
          const R = r * box.h;
          const x0 = px(cx);
          const y0 = py(cy);
          let d = circleD(x0, y0, R) + circleD(x0, y0, R - w * s, true);
          const half = (0.6 * s) / 2;
          for (let i = 0; i < count; i++) {
            const a = (i * Math.PI) / count;
            const c = Math.cos(a);
            const sn = Math.sin(a);
            const e = R - (w * s) / 2;
            d += points([
              [x0 - c * e - sn * half, y0 - sn * e + c * half],
              [x0 + c * e - sn * half, y0 + sn * e + c * half],
              [x0 + c * e + sn * half, y0 + sn * e - c * half],
              [x0 - c * e + sn * half, y0 - sn * e - c * half],
            ]);
          }
          add(color, d);
          break;
        }
        case "canton": {
          const [, w, h, inner] = layer;
          run(inner, { x: box.x, y: box.y, w: w * box.w, h: h * box.h });
          break;
        }
        case "ref": {
          const other = lookup(layer[1]);
          if (!other) throw new Error(`unknown ref ${layer[1]}`);
          run(other, box);
          break;
        }
        case "path": {
          freehand = true;
          const [, color, d] = layer;
          if (box.w === FRAME.w) add(color, d);
          else throw new Error("a path can only sit in the full frame");
          break;
        }
        default:
          throw new Error(`unknown layer ${String(kind)}`);
      }
    }
  }

  run(spec, { x: 0, y: 0, w: FRAME.w, h: FRAME.h });

  // Same fill in a row: one path.
  const merged: Piece[] = [];
  for (const piece of pieces) {
    const last = merged[merged.length - 1];
    if (last && last.fill === piece.fill) {
      last.d += piece.d;
      last.hard &&= piece.hard;
    } else {
      merged.push({ ...piece });
    }
  }
  const crisp = merged.every((piece) => piece.hard);
  const markup = merged
    .map((piece) => `<path fill="${PALETTE[piece.fill]}" d="${piece.d}"/>`)
    .join("");
  return {
    body: crisp ? `<g shape-rendering="crispEdges">${markup}</g>` : markup,
    kinds,
    freehand,
  };
}
