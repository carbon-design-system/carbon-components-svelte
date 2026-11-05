/** A crop of an image: a rect and the turn it was made after. */
export interface CropData {
  /**
   * Left edge of the crop, in source pixels, in the bounds of the flipped
   * and rotated image (the image itself when `rotate` is 0 or 180).
   */
  x: number;
  /** Top edge of the crop, in the same space. */
  y: number;
  /** Width of the crop in source pixels. */
  width: number;
  /** Height of the crop in source pixels. */
  height: number;
  /** Clockwise turn in degrees, in (-180, 180]. Applied after the flips. */
  rotate: number;
  /** Mirror the image left to right, about its center, before the turn. */
  flipX: boolean;
  /** Mirror the image top to bottom, about its center, before the turn. */
  flipY: boolean;
}

export interface CropToBlobOptions {
  /** MIME type to encode. Defaults to `"image/png"`. */
  type?: string;
  /** Quality from 0 to 1 for `image/jpeg` and `image/webp`. */
  quality?: number;
  /** Scale the output to this width in pixels. Defaults to the crop's. */
  width?: number;
  /** Scale the output to this height; ignored when `width` is set. */
  height?: number;
  /** Fill color under the image. White for JPEG. */
  background?: string;
  /** Cancels the export. */
  signal?: AbortSignal;
  /** Set to `"anonymous"` when loading a cross-origin `source` URL. */
  crossOrigin?: string;
  /** Output pixel budget. Defaults to 16,777,216, Safari's canvas limit. */
  maxPixels?: number;
}

export class ImageCropError extends Error {
  constructor(
    code: "load" | "unsupported" | "tainted" | "export" | "aborted",
    message: string,
  );
  code: "load" | "unsupported" | "tainted" | "export" | "aborted";
}

export function looksLikeHeic(source: string | Blob): boolean;

export function loadImageElement(
  url: string,
  crossOrigin?: string,
): Promise<HTMLImageElement>;

export function drawPreview(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  maxEdge: number,
): { width: number; height: number; scale: number };

/** Cut a crop out of an image with a canvas and encode it. */
export function cropToBlob(
  source: HTMLImageElement | string | Blob,
  data: CropData,
  options?: CropToBlobOptions,
): Promise<Blob>;
