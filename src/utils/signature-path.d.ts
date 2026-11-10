/** A point of a stroke: `[x, y, width]`, in the pad's viewBox units. */
export type SignaturePoint = [x: number, y: number, width: number];

/** Params for `createStroke`. */
export interface SignatureStrokeOptions {
  /** The thinnest the line gets. Defaults to `0.8`. */
  minWidth?: number;
  /** The thickest the line gets. Defaults to `3.2`. */
  maxWidth?: number;
}

/** RDP tolerance, in viewBox units, when a stroke ends. */
export const SIMPLIFY_TOLERANCE: number;

/** Builds one stroke from pointer samples. */
export function createStroke(options?: SignatureStrokeOptions): {
  points: SignaturePoint[];
  add(
    x: number,
    y: number,
    sample?: { pressure?: number; time?: number; pointerType?: string },
  ): boolean;
};

/** Drops points that sit within `tolerance` of the line through their neighbours. */
export function simplify(
  points: SignaturePoint[],
  tolerance?: number,
): SignaturePoint[];

/** The outline of a stroke as SVG path data. */
export function strokePath(points: SignaturePoint[]): string;

/** A standalone SVG document for strokes. */
export function strokesToSvg(
  strokes: SignaturePoint[][],
  options: {
    width: number;
    height: number;
    color: string;
    background?: string;
    title?: string;
  },
): string;

/** A standalone SVG document for a typed signature. */
export function textToSvg(
  text: string,
  options: {
    width: number;
    height: number;
    color: string;
    background?: string;
    fontFamily: string;
    fontSize: number;
    title?: string;
  },
): string;

/** The font size that fits `text` in `maxWidth`. */
export function fitFontSize(
  text: string,
  options: {
    maxWidth: number;
    maxSize: number;
    minSize?: number;
    measure?: (text: string) => number;
  },
): number;
