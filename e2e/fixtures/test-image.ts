/**
 * Test pictures, drawn in the page when a test runs so no image is stored.
 * Four colored quadrants tell orientation, flips and crops apart:
 * top left red, top right green, bottom left blue, bottom right yellow.
 */

export type Spec = {
  width: number;
  height: number;
  type?: "png" | "jpeg";
  /** Write an EXIF orientation (1 to 8) into a JPEG. */
  exif?: number;
  /** Scatter small random shapes over the quadrants, so the file is as hard to decode as a photograph. */
  noise?: boolean;
};

export const QUADRANTS = {
  tl: [255, 0, 0],
  tr: [0, 200, 0],
  bl: [0, 0, 255],
  br: [255, 255, 0],
} as const;

function drawQuadrants(canvas: HTMLCanvasElement, noise = false) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  const { width, height } = canvas;
  const hw = width / 2;
  const hh = height / 2;
  const fill = (color: readonly number[], x: number, y: number) => {
    context.fillStyle = `rgb(${color.join(",")})`;
    context.fillRect(x, y, hw, hh);
  };
  fill(QUADRANTS.tl, 0, 0);
  fill(QUADRANTS.tr, hw, 0);
  fill(QUADRANTS.bl, 0, hh);
  fill(QUADRANTS.br, hw, hh);
  if (noise) {
    for (let i = 0; i < 40000; i++) {
      context.fillStyle = `hsla(${Math.random() * 360}, 70%, 50%, 0.35)`;
      const size = 4 + Math.random() * 40;
      context.fillRect(
        Math.random() * width,
        Math.random() * height,
        size,
        size,
      );
    }
  }
  // A coarse grid, so a zoomed view has detail and a pan shows where it is.
  context.strokeStyle = "rgba(255,255,255,0.5)";
  context.lineWidth = Math.max(1, Math.round(width / 600));
  const step = Math.round(Math.max(width, height) / 12);
  context.beginPath();
  for (let x = step; x < width; x += step) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let y = step; y < height; y += step) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();
}

/** Put an EXIF orientation tag after the SOI marker of a JPEG. */
export function withExifOrientation(
  jpeg: Uint8Array,
  orientation: number,
): Uint8Array {
  const exif = new Uint8Array([
    0xff,
    0xe1,
    0x00,
    0x22,
    0x45,
    0x78,
    0x69,
    0x66,
    0x00,
    0x00,
    // TIFF header, big endian, IFD0 at offset 8.
    0x4d,
    0x4d,
    0x00,
    0x2a,
    0x00,
    0x00,
    0x00,
    0x08,
    // One entry: tag 0x0112 (orientation), SHORT, count 1, the value.
    0x00,
    0x01,
    0x01,
    0x12,
    0x00,
    0x03,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    orientation,
    0x00,
    0x00,
    // No next IFD.
    0x00,
    0x00,
    0x00,
    0x00,
  ]);
  const out = new Uint8Array(jpeg.length + exif.length);
  out.set(jpeg.subarray(0, 2), 0);
  out.set(exif, 2);
  out.set(jpeg.subarray(2), 2 + exif.length);
  return out;
}

export async function makeImage(spec: Spec): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  drawQuadrants(canvas, spec.noise);
  const type = spec.type ?? (spec.exif ? "jpeg" : "png");
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("no blob"))),
      `image/${type}`,
      0.92,
    ),
  );
  // Release the canvas's pixels now: a 6000 by 4000 one is 96 MB.
  canvas.width = canvas.height = 1;
  if (!spec.exif) return blob;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return new Blob([withExifOrientation(bytes, spec.exif)], {
    type: "image/jpeg",
  });
}

/**
 * Decode a blob and read the pixel at each fractional point, as [r, g, b, a].
 */
export async function samplePixels(
  blob: Blob,
  points: ReadonlyArray<[number, number]>,
): Promise<{ width: number; height: number; pixels: number[][] }> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  context.drawImage(bitmap, 0, 0);
  const pixels = points.map(([fx, fy]) => {
    const x = Math.min(bitmap.width - 1, Math.floor(fx * bitmap.width));
    const y = Math.min(bitmap.height - 1, Math.floor(fy * bitmap.height));
    return [...context.getImageData(x, y, 1, 1).data];
  });
  return { width: bitmap.width, height: bitmap.height, pixels };
}
