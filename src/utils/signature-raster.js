// @ts-check

import { strokePath } from "./signature-path.js";

/** The font size text is measured at; widths scale linearly from it. */
const MEASURE_SIZE = 100;

/** @type {CanvasRenderingContext2D | null | undefined} */
let scratch;

/**
 * One context for measuring, made on first use. A missing one is cached too,
 * so an environment without canvas is asked once.
 * @returns {CanvasRenderingContext2D | null}
 */
function scratchContext() {
  if (typeof document === "undefined") return null;
  if (scratch === undefined) {
    try {
      scratch = document.createElement("canvas").getContext("2d");
    } catch {
      scratch = null;
    }
  }
  return scratch;
}

/**
 * A function that returns the width of text at 1 unit of font size in the
 * given family, or `undefined` where there is no canvas to measure with.
 *
 * @param {string} fontFamily
 * @returns {((text: string) => number) | undefined}
 */
export function createTextMeasure(fontFamily) {
  const context = scratchContext();
  if (!context) return undefined;
  return (text) => {
    context.font = `${MEASURE_SIZE}px ${fontFamily}`;
    return context.measureText(text).width / MEASURE_SIZE;
  };
}

/**
 * Draw a signature at `scale` pixels per viewBox unit and return the canvas,
 * or `null` where canvas or `Path2D` is missing. Strokes are filled from the
 * same path data the SVG uses.
 *
 * @param {Object} model
 * @param {import("./signature-path.js").SignaturePoint[][]} [model.strokes]
 * @param {string} [model.text]
 * @param {number} [model.fontSize]
 * @param {string} [model.fontFamily]
 * @param {CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }} [model.image]
 * @param {Object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} options.scale
 * @param {string} options.color
 * @param {string} [options.background]
 * @returns {HTMLCanvasElement | null}
 */
export function rasterize(model, { width, height, scale, color, background }) {
  if (typeof document === "undefined" || typeof Path2D === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  let context = null;
  try {
    context = canvas.getContext("2d");
  } catch {
    return null;
  }
  if (!context) return null;

  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.scale(scale, scale);
  context.fillStyle = color;

  if (model.strokes) {
    for (const points of model.strokes) {
      context.fill(new Path2D(strokePath(points)));
    }
  } else if (model.text) {
    context.font = `${model.fontSize ?? 48}px ${model.fontFamily ?? "cursive"}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(model.text, width / 2, height / 2);
  } else if (model.image) {
    const source = model.image;
    const w = source.naturalWidth || source.width || 0;
    const h = source.naturalHeight || source.height || 0;
    if (w > 0 && h > 0) {
      // Fit inside the pad, keeping the picture's shape.
      const fit = Math.min(width / w, height / h);
      const drawn = [w * fit, h * fit];
      context.drawImage(
        source,
        (width - drawn[0]) / 2,
        (height - drawn[1]) / 2,
        drawn[0],
        drawn[1],
      );
    }
  }
  return canvas;
}

/**
 * Encode a canvas as a PNG blob. PNG is the one type every browser's
 * `toBlob` writes, so there is no fallback to reason about.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob | null>}
 */
export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * Decode an image file. The picture is drawn to a canvas afterwards, so a
 * script inside an SVG file never runs and metadata is dropped.
 *
 * @param {Blob} file
 * @returns {Promise<HTMLImageElement>}
 */
export async function loadImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}
