// @ts-check

/**
 * Pure geometry for `ImageCropper`.
 *
 * Every crop rect is in "bounds space": the coordinate system of the
 * bounding box of the image after it is flipped and rotated, at one unit per
 * source pixel. The image sits at the center of the bounds, and for a
 * rotation of 0 or 180 degrees the bounds are the image. Cropper.js and
 * react-easy-crop report a crop the same way.
 *
 * The transform that maps a source point to bounds space is: flip about the
 * image center (mirror x when `flipX`, y when `flipY`), then rotate clockwise
 * by `rotate` degrees about the image center, then translate the center to
 * the center of the bounds. This is the order a canvas applies when it draws
 * with `translate`, `rotate`, `scale`, then `drawImage`.
 *
 * @typedef {{ width: number; height: number }} Size
 * @typedef {{ x: number; y: number }} Point
 * @typedef {{ x: number; y: number; width: number; height: number }} Rect
 * @typedef {"n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"} Handle
 * @typedef {{ scale: number; x: number; y: number }} View
 */

const EPSILON = 1e-6;

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round away the error left by trigonometry at multiples of 90 degrees.
 * @param {number} value
 * @returns {number}
 */
function snap(value) {
  return Math.round(value * 1e9) / 1e9;
}

/**
 * @param {number} degrees
 * @returns {number} The angle in (-180, 180].
 */
export function normalizeAngle(degrees) {
  if (!Number.isFinite(degrees)) return 0;
  let angle = degrees % 360;
  if (angle > 180) angle -= 360;
  if (angle <= -180) angle += 360;
  return angle;
}

/**
 * @param {number} rotate Degrees.
 * @returns {{ cos: number; sin: number }} Absolute values.
 */
function absTrig(rotate) {
  const radians = (rotate * Math.PI) / 180;
  return {
    cos: Math.abs(snap(Math.cos(radians))),
    sin: Math.abs(snap(Math.sin(radians))),
  };
}

/**
 * The bounding box of a rectangle rotated about its center.
 * @param {Size} size
 * @param {number} rotate Degrees.
 * @returns {Size}
 */
export function rotatedSize(size, rotate) {
  const { cos, sin } = absTrig(rotate);
  return {
    width: snap(size.width * cos + size.height * sin),
    height: snap(size.width * sin + size.height * cos),
  };
}

/**
 * Turn a point about a center. A positive angle is clockwise on a screen
 * whose y axis points down, like CSS `rotate()` and `CanvasRenderingContext2D`.
 * @param {Point} point
 * @param {Point} center
 * @param {number} degrees
 * @returns {Point}
 */
export function rotatePoint(point, center, degrees) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * @param {Size} image The unrotated image.
 * @param {number} rotate
 * @returns {Point}
 */
function boundsCenter(image, rotate) {
  const bounds = rotatedSize(image, rotate);
  return { x: bounds.width / 2, y: bounds.height / 2 };
}

/**
 * The largest factor `rect` can be scaled by, about its center, and still lie
 * inside the rotated image, or `Infinity` if the rect has no area.
 * @param {Size} image
 * @param {number} rotate
 * @param {Size} rect
 * @returns {number}
 */
export function fitFactor(image, rotate, rect) {
  const { cos, sin } = absTrig(rotate);
  const spanX = rect.width * cos + rect.height * sin;
  const spanY = rect.width * sin + rect.height * cos;
  return Math.min(
    spanX > 0 ? image.width / spanX : Number.POSITIVE_INFINITY,
    spanY > 0 ? image.height / spanY : Number.POSITIVE_INFINITY,
  );
}

/**
 * The largest rect with this aspect ratio that fits inside the rotated
 * image, centered on it. Without a ratio, the ratio of the bounds.
 * @param {Size} image
 * @param {number} rotate
 * @param {number | null} [ratio] Width over height.
 * @returns {Size}
 */
export function maxCropSize(image, rotate, ratio = null) {
  const bounds = rotatedSize(image, rotate);
  const r = ratio && ratio > 0 ? ratio : bounds.width / bounds.height;
  const factor = fitFactor(image, rotate, { width: r, height: 1 });
  return { width: factor * r, height: factor };
}

/**
 * @param {Rect} rect
 * @returns {Point[]}
 */
function corners(rect) {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
}

/**
 * Whether the rect lies inside the rotated image, not only inside its
 * bounds. The empty corners of the bounds of a turned image are outside.
 * @param {Size} image
 * @param {number} rotate
 * @param {Rect} rect
 * @param {number} [tolerance]
 * @returns {boolean}
 */
export function containsRect(image, rotate, rect, tolerance = EPSILON) {
  const center = boundsCenter(image, rotate);
  return corners(rect).every((corner) => {
    const local = rotatePoint(corner, center, -rotate);
    return (
      Math.abs(local.x - center.x) <= image.width / 2 + tolerance &&
      Math.abs(local.y - center.y) <= image.height / 2 + tolerance
    );
  });
}

/**
 * Hold a rect inside the rotated image: scale it down about its center if it
 * is too big, grow it to the minimum size if the image allows, then slide it
 * to the nearest position that fits. Sliding is exact: in the image's own
 * frame the allowed centers form an axis aligned rectangle.
 * @param {Size} image
 * @param {number} rotate
 * @param {Rect} rect
 * @param {{ minWidth?: number; minHeight?: number }} [limits]
 * @returns {Rect}
 */
export function clampRect(image, rotate, rect, limits = {}) {
  const { minWidth = 0, minHeight = 0 } = limits;
  let width = Math.max(rect.width, minWidth, EPSILON);
  let height = Math.max(rect.height, minHeight, EPSILON);
  // The image wins over a minimum it can't satisfy.
  const factor = Math.min(1, fitFactor(image, rotate, { width, height }));
  width *= factor;
  height *= factor;

  const { cos, sin } = absTrig(rotate);
  const center = boundsCenter(image, rotate);
  const centered = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
  const local = rotatePoint(centered, center, -rotate);
  const limitX = Math.max(
    0,
    image.width / 2 - ((width / 2) * cos + (height / 2) * sin),
  );
  const limitY = Math.max(
    0,
    image.height / 2 - ((width / 2) * sin + (height / 2) * cos),
  );
  const slid = rotatePoint(
    {
      x: center.x + clamp(local.x - center.x, -limitX, limitX),
      y: center.y + clamp(local.y - center.y, -limitY, limitY),
    },
    center,
    rotate,
  );
  return {
    x: slid.x - width / 2,
    y: slid.y - height / 2,
    width,
    height,
  };
}

/**
 * The rect for an image's first view: the largest of this ratio, centered.
 * @param {Size} image
 * @param {number} rotate
 * @param {number | null} [ratio]
 * @returns {Rect}
 */
export function initialRect(image, rotate, ratio = null) {
  const size = maxCropSize(image, rotate, ratio);
  const center = boundsCenter(image, rotate);
  return {
    x: center.x - size.width / 2,
    y: center.y - size.height / 2,
    width: size.width,
    height: size.height,
  };
}

/**
 * @param {Rect} rect
 * @param {number} dx In bounds units.
 * @param {number} dy
 * @returns {Rect}
 */
export function translateRect(rect, dx, dy) {
  return { ...rect, x: rect.x + dx, y: rect.y + dy };
}

/**
 * Scale a rect so the point at `anchor` keeps its relative place inside it.
 * @param {Rect} rect
 * @param {number} factor Above 1 grows the rect (shows more of the image).
 * @param {Point} [anchor] Defaults to the rect's center.
 * @returns {Rect}
 */
export function scaleRect(rect, factor, anchor) {
  const at = anchor ?? {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
  const rx = rect.width > 0 ? (at.x - rect.x) / rect.width : 0.5;
  const ry = rect.height > 0 ? (at.y - rect.y) / rect.height : 0.5;
  const width = rect.width * factor;
  const height = rect.height * factor;
  return { x: at.x - rx * width, y: at.y - ry * height, width, height };
}

/**
 * Where each handle sits on the rect: -1 is the start edge, 1 the end edge.
 * @type {Record<Handle, { sx: -1 | 0 | 1; sy: -1 | 0 | 1 }>}
 */
export const HANDLE_SIGNS = {
  n: { sx: 0, sy: -1 },
  ne: { sx: 1, sy: -1 },
  e: { sx: 1, sy: 0 },
  se: { sx: 1, sy: 1 },
  s: { sx: 0, sy: 1 },
  sw: { sx: -1, sy: 1 },
  w: { sx: -1, sy: 0 },
  nw: { sx: -1, sy: -1 },
};

/**
 * Move one handle of a rect by a distance. The opposite edge or corner stays
 * put. With a ratio the rect keeps it; the box never inverts and never drops
 * below the minimum size. The result may still leave the image: pass it
 * through `limitRect`.
 * @param {Rect} rect
 * @param {Handle} handle
 * @param {number} dx
 * @param {number} dy
 * @param {{ ratio?: number | null; minWidth?: number; minHeight?: number }} [options]
 * @returns {Rect}
 */
export function resizeRect(rect, handle, dx, dy, options = {}) {
  const { ratio = null, minWidth = 1, minHeight = 1 } = options;
  const { sx, sy } = HANDLE_SIGNS[handle];
  let { x, y, width, height } = rect;

  if (!ratio) {
    if (sx === 1) {
      width = Math.max(minWidth, width + dx);
    } else if (sx === -1) {
      const next = Math.max(minWidth, width - dx);
      x += width - next;
      width = next;
    }
    if (sy === 1) {
      height = Math.max(minHeight, height + dy);
    } else if (sy === -1) {
      const next = Math.max(minHeight, height - dy);
      y += height - next;
      height = next;
    }
    return { x, y, width, height };
  }

  const floorWidth = Math.max(minWidth, minHeight * ratio);
  let nextWidth;
  if (sx === 0) {
    nextWidth = (height + sy * dy) * ratio;
  } else if (sy === 0) {
    nextWidth = width + sx * dx;
  } else {
    // A corner follows whichever axis the pointer went further on.
    nextWidth = Math.max(width + sx * dx, (height + sy * dy) * ratio);
  }
  nextWidth = Math.max(nextWidth, floorWidth);
  const nextHeight = nextWidth / ratio;
  // The opposite edge stays: for the end edge that is where x already is.
  if (sx === -1) x += width - nextWidth;
  else if (sx === 0) x += (width - nextWidth) / 2;
  if (sy === -1) y += height - nextHeight;
  else if (sy === 0) y += (height - nextHeight) / 2;
  return { x, y, width: nextWidth, height: nextHeight };
}

/**
 * Keep a proposed rect inside the rotated image by backing off from the last
 * valid rect: the largest step toward `next` that still fits. Containment is
 * convex in the rect's four numbers, so a binary search finds it. A rect
 * that changes its ratio, in an image turned by a multiple of 90 degrees,
 * is cut at the image's edges instead.
 * @param {Size} image
 * @param {number} rotate
 * @param {Rect} previous A rect that fits.
 * @param {Rect} next
 * @returns {Rect}
 */
export function limitRect(image, rotate, previous, next) {
  if (containsRect(image, rotate, next)) return next;
  // With a free ratio and square bounds, each edge stops on its own, so a
  // corner slides along the image's edge instead of sticking to it.
  const quarter = Math.abs(rotate % 90) < EPSILON;
  const ratioHeld =
    Math.abs(previous.width * next.height - next.width * previous.height) <
    EPSILON * Math.max(1, previous.width * next.height);
  if (quarter && !ratioHeld) {
    const bounds = rotatedSize(image, rotate);
    const left = clamp(next.x, 0, bounds.width);
    const top = clamp(next.y, 0, bounds.height);
    const right = clamp(next.x + next.width, 0, bounds.width);
    const bottom = clamp(next.y + next.height, 0, bounds.height);
    return { x: left, y: top, width: right - left, height: bottom - top };
  }
  if (!containsRect(image, rotate, previous)) {
    return clampRect(image, rotate, previous);
  }
  let low = 0;
  let high = 1;
  for (let i = 0; i < 32; i++) {
    const mid = (low + high) / 2;
    const candidate = lerpRect(previous, next, mid);
    if (containsRect(image, rotate, candidate)) low = mid;
    else high = mid;
  }
  return lerpRect(previous, next, low);
}

/**
 * @param {Rect} a
 * @param {Rect} b
 * @param {number} t
 * @returns {Rect}
 */
function lerpRect(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    width: a.width + (b.width - a.width) * t,
    height: a.height + (b.height - a.height) * t,
  };
}

/**
 * Mirror a rect across the middle of the bounds.
 * @param {Size} bounds
 * @param {Rect} rect
 * @param {"x" | "y"} axis `"x"` mirrors left to right.
 * @returns {Rect}
 */
export function mirrorRect(bounds, rect, axis) {
  return axis === "x"
    ? { ...rect, x: bounds.width - rect.x - rect.width }
    : { ...rect, y: bounds.height - rect.y - rect.height };
}

/**
 * Turn the image under the crop. The point of the image under the center of
 * the rect stays under it; the size stays, then is held inside the image.
 * With `swap` the width and height trade places, for a quarter turn of a box
 * with no ratio.
 * @param {Size} image
 * @param {number} from Degrees.
 * @param {number} to Degrees.
 * @param {Rect} rect
 * @param {{ swap?: boolean; minWidth?: number; minHeight?: number }} [options]
 * @returns {Rect}
 */
export function rotateRect(image, from, to, rect, options = {}) {
  const { swap = false, minWidth, minHeight } = options;
  const oldCenter = boundsCenter(image, from);
  const newCenter = boundsCenter(image, to);
  const local = rotatePoint(
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
    oldCenter,
    -from,
  );
  const turned = rotatePoint(
    {
      x: newCenter.x + (local.x - oldCenter.x),
      y: newCenter.y + (local.y - oldCenter.y),
    },
    newCenter,
    to,
  );
  const width = swap ? rect.height : rect.width;
  const height = swap ? rect.width : rect.height;
  return clampRect(
    image,
    to,
    { x: turned.x - width / 2, y: turned.y - height / 2, width, height },
    {
      minWidth: swap ? minHeight : minWidth,
      minHeight: swap ? minWidth : minHeight,
    },
  );
}

/**
 * Where bounds space lands on screen when the image is fitted into a stage,
 * for a box that moves over a still image.
 * @param {Size} stage
 * @param {Size} bounds
 * @param {number} [padding]
 * @returns {View}
 */
export function fitView(stage, bounds, padding = 0) {
  const availableWidth = Math.max(1, stage.width - padding * 2);
  const availableHeight = Math.max(1, stage.height - padding * 2);
  const scale = Math.min(
    availableWidth / bounds.width,
    availableHeight / bounds.height,
  );
  return {
    scale,
    x: (stage.width - bounds.width * scale) / 2,
    y: (stage.height - bounds.height * scale) / 2,
  };
}

/**
 * Where bounds space lands on screen when a frame is fixed and the image
 * moves under it: the rect's top-left corner sits on the frame's.
 * @param {Rect} frame In screen pixels.
 * @param {Rect} rect In bounds units.
 * @returns {View}
 */
export function frameView(frame, rect) {
  const scale = rect.width > 0 ? frame.width / rect.width : 1;
  return {
    scale,
    x: frame.x - rect.x * scale,
    y: frame.y - rect.y * scale,
  };
}

/**
 * The largest rect of a ratio that fits a stage, centered.
 * @param {Size} stage
 * @param {number} ratio
 * @param {number} [padding]
 * @returns {Rect}
 */
export function fitFrame(stage, ratio, padding = 0) {
  const availableWidth = Math.max(1, stage.width - padding * 2);
  const availableHeight = Math.max(1, stage.height - padding * 2);
  const width = Math.min(availableWidth, availableHeight * ratio);
  const height = width / ratio;
  return {
    x: (stage.width - width) / 2,
    y: (stage.height - height) / 2,
    width,
    height,
  };
}

/**
 * @param {Rect} rect Bounds units.
 * @param {View} view
 * @returns {Rect} Screen pixels.
 */
export function rectToScreen(rect, view) {
  return {
    x: view.x + rect.x * view.scale,
    y: view.y + rect.y * view.scale,
    width: rect.width * view.scale,
    height: rect.height * view.scale,
  };
}

/**
 * The CSS transform that places an image layer at its natural size with its
 * top-left at the origin, given the view of its bounds.
 * @param {Size} image
 * @param {number} rotate
 * @param {boolean} flipX
 * @param {boolean} flipY
 * @param {View} view
 * @returns {string}
 */
export function layerTransform(image, rotate, flipX, flipY, view) {
  const bounds = rotatedSize(image, rotate);
  const cx = view.x + (bounds.width / 2) * view.scale;
  const cy = view.y + (bounds.height / 2) * view.scale;
  return `translate(${cx}px, ${cy}px) scale(${view.scale}) rotate(${rotate}deg) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1}) translate(${-image.width / 2}px, ${-image.height / 2}px)`;
}

/**
 * The relative magnification of a crop: 1 when it is as large as the image
 * allows, rising as it shrinks.
 * @param {Size} image
 * @param {number} rotate
 * @param {Rect} rect
 * @returns {number}
 */
export function zoomOf(image, rotate, rect) {
  const max = maxCropSize(image, rotate, rect.width / rect.height);
  return rect.width > 0 ? Math.max(1, max.width / rect.width) : 1;
}

/**
 * The widest zoom a crop allows: the most the view can magnify before the
 * crop falls under the minimum output size, capped by `maxZoom`.
 * @param {Size} image
 * @param {number} rotate
 * @param {number} ratio Width over height.
 * @param {{ maxZoom?: number; minWidth?: number; minHeight?: number }} [options]
 * @returns {number} At least 1.
 */
export function zoomLimit(image, rotate, ratio, options = {}) {
  const { maxZoom = 8, minWidth = 1, minHeight = 1 } = options;
  const max = maxCropSize(image, rotate, ratio);
  const floor = Math.max(minWidth, minHeight * ratio, EPSILON);
  return Math.max(1, Math.min(maxZoom, max.width / floor));
}

/**
 * The crop in whole source pixels, held inside the bounds.
 * @param {Size} image
 * @param {number} rotate
 * @param {Rect} rect
 * @returns {Rect}
 */
export function roundRect(image, rotate, rect) {
  const bounds = rotatedSize(image, rotate);
  const x = clamp(
    Math.round(rect.x),
    0,
    Math.max(0, Math.floor(bounds.width) - 1),
  );
  const y = clamp(
    Math.round(rect.y),
    0,
    Math.max(0, Math.floor(bounds.height) - 1),
  );
  return {
    x,
    y,
    width: clamp(
      Math.round(rect.width),
      1,
      Math.max(1, Math.floor(bounds.width - x)),
    ),
    height: clamp(
      Math.round(rect.height),
      1,
      Math.max(1, Math.floor(bounds.height - y)),
    ),
  };
}

/**
 * The size of the output for a crop: its own size, or scaled to a width
 * or a height, and never past a pixel budget (Safari's canvas limit is
 * 16,777,216 pixels).
 * @param {Size} crop
 * @param {{ width?: number; height?: number; maxPixels?: number }} [options]
 * @returns {Size & { limited: boolean }}
 */
export function outputSize(crop, options = {}) {
  const { width, height, maxPixels = 16_777_216 } = options;
  let scale = 1;
  if (width && width > 0) scale = width / crop.width;
  else if (height && height > 0) scale = height / crop.height;
  let outWidth = Math.max(1, Math.round(crop.width * scale));
  let outHeight = Math.max(1, Math.round(crop.height * scale));
  let limited = false;
  if (outWidth * outHeight > maxPixels) {
    const shrink = Math.sqrt(maxPixels / (outWidth * outHeight));
    outWidth = Math.max(1, Math.floor(outWidth * shrink));
    outHeight = Math.max(1, Math.floor(outHeight * shrink));
    limited = true;
  }
  return { width: outWidth, height: outHeight, limited };
}

/**
 * Whether two crops are the same to the pixel.
 * @typedef {Rect & { rotate: number; flipX?: boolean; flipY?: boolean }} Crop
 * @param {Crop | null | undefined} a
 * @param {Crop | null | undefined} b
 * @returns {boolean}
 */
export function sameCrop(a, b) {
  if (!a || !b) return a === b;
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.rotate === b.rotate &&
    Boolean(a.flipX) === Boolean(b.flipX) &&
    Boolean(a.flipY) === Boolean(b.flipY)
  );
}
