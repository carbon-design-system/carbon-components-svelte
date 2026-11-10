import type { SignaturePoint } from "./signature-path.js";

/** Returns the width of text at 1 unit of font size, or `undefined` without a canvas. */
export function createTextMeasure(
  fontFamily: string,
): ((text: string) => number) | undefined;

/** Draws a signature to a canvas, or returns `null` without canvas or `Path2D`. */
export function rasterize(
  model: {
    strokes?: SignaturePoint[][];
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    image?: CanvasImageSource & {
      width?: number;
      height?: number;
      naturalWidth?: number;
      naturalHeight?: number;
    };
  },
  options: {
    width: number;
    height: number;
    scale: number;
    color: string;
    background?: string;
  },
): HTMLCanvasElement | null;

/** Encodes a canvas as a PNG blob. */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null>;

/** Decodes an image file. */
export function loadImageFile(file: Blob): Promise<HTMLImageElement>;
