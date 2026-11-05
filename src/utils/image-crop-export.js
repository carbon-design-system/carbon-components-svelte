// @ts-check

import { normalizeAngle, outputSize, rotatedSize } from "./image-crop.js";

/**
 * @typedef {import("./image-crop-export.js").CropData} CropData
 * @typedef {import("./image-crop-export.js").CropToBlobOptions} CropToBlobOptions
 */

/** Browsers other than Safari can't decode HEIC or HEIF. */
const HEIC = /\.(heic|heif)(?:[?#]|$)/i;
const HEIC_TYPE = /^image\/hei[cf]/i;

/**
 * An error from loading or exporting an image.
 * `code` is `"load"` (the file isn't an image, or the request failed),
 * `"unsupported"` (HEIC or HEIF in a browser that can't decode it),
 * `"tainted"` (a cross-origin image without CORS headers: the canvas can't
 * be read back), `"export"` (the browser could not encode the canvas) or
 * `"aborted"`.
 */
export class ImageCropError extends Error {
  /**
   * @param {"load" | "unsupported" | "tainted" | "export" | "aborted"} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "ImageCropError";
    this.code = code;
  }
}

/**
 * @param {string | Blob} source
 * @returns {boolean}
 */
export function looksLikeHeic(source) {
  if (typeof source === "string") return HEIC.test(source);
  const name = /** @type {{ name?: string }} */ (source).name ?? "";
  return HEIC_TYPE.test(source.type) || HEIC.test(name);
}

/**
 * Load an image into an element. The browser applies the EXIF orientation,
 * so `naturalWidth` and `naturalHeight` are the upright size.
 * @param {string} url
 * @param {string | undefined} [crossOrigin] `"anonymous"` to read pixels back
 *   from a cross-origin image whose server sends CORS headers.
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageElement(url, crossOrigin) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = crossOrigin;
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new ImageCropError("load", "The image could not be loaded."));
    image.src = url;
  });
}

/**
 * Draw an image into a canvas no larger than `maxEdge` on its long side, so
 * the editor holds a small bitmap instead of a 6000 by 4000 decode.
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} image
 * @param {number} maxEdge
 * @returns {{ width: number; height: number; scale: number }} The natural
 *   size and the preview's scale of it.
 */
export function drawPreview(canvas, image, maxEdge) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (context) {
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  }
  return { width, height, scale };
}

/**
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement | OffscreenCanvas}
 */
function createCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 * @param {string} type
 * @param {number | undefined} quality
 * @returns {Promise<Blob>}
 */
function encode(canvas, type, quality) {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(
              new ImageCropError(
                "export",
                "The browser could not encode the image.",
              ),
            ),
      type,
      quality,
    );
  });
}

/**
 * Cut a crop out of an image with a canvas: flip and rotate about the
 * image's center, then take the rect.
 *
 * `data` is what `ImageCropper` reports. The rect is in the bounds of the
 * flipped and rotated image (see `image-crop.js`). The returned blob's
 * `type` is what the browser wrote, which is `image/png` when it can't
 * encode the type asked for (Safari and WebP).
 * @param {HTMLImageElement | string | Blob} source
 * @param {CropData} data
 * @param {CropToBlobOptions} [options]
 * @returns {Promise<Blob>}
 */
export async function cropToBlob(source, data, options = {}) {
  const {
    type = "image/png",
    quality,
    width,
    height,
    background,
    signal,
    crossOrigin,
    maxPixels,
  } = options;
  const aborted = () =>
    new ImageCropError("aborted", "The export was cancelled.");
  if (signal?.aborted) throw aborted();

  /** @type {string | null} */
  let objectUrl = null;
  try {
    /** @type {HTMLImageElement} */
    let image;
    if (typeof source === "string" || source instanceof Blob) {
      if (typeof source !== "string") {
        objectUrl = URL.createObjectURL(source);
      }
      image = await loadImageElement(objectUrl ?? String(source), crossOrigin);
    } else {
      image = source;
    }
    if (signal?.aborted) throw aborted();

    const natural = { width: image.naturalWidth, height: image.naturalHeight };
    const rotate = normalizeAngle(data.rotate ?? 0);
    const bounds = rotatedSize(natural, rotate);
    const out = outputSize(data, { width, height, maxPixels });
    const canvas = createCanvas(out.width, out.height);
    const context =
      /** @type {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null} */ (
        canvas.getContext("2d")
      );
    if (!context) {
      throw new ImageCropError(
        "export",
        "The browser could not create a canvas.",
      );
    }
    // JPEG has no alpha: transparent pixels would turn black.
    const fill = background ?? (type === "image/jpeg" ? "#ffffff" : undefined);
    if (fill) {
      context.fillStyle = fill;
      context.fillRect(0, 0, out.width, out.height);
    }
    context.imageSmoothingQuality = "high";
    context.scale(out.width / data.width, out.height / data.height);
    context.translate(-data.x, -data.y);
    context.translate(bounds.width / 2, bounds.height / 2);
    context.rotate((rotate * Math.PI) / 180);
    context.scale(data.flipX ? -1 : 1, data.flipY ? -1 : 1);
    context.drawImage(image, -natural.width / 2, -natural.height / 2);

    try {
      return await encode(canvas, type, quality);
    } catch (error) {
      if (error instanceof ImageCropError) throw error;
      if (/** @type {{ name?: string }} */ (error)?.name === "SecurityError") {
        throw new ImageCropError(
          "tainted",
          "The image is from another origin that does not allow it to be read.",
        );
      }
      throw new ImageCropError(
        "export",
        "The browser could not encode the image.",
      );
    }
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
