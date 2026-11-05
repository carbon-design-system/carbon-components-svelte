export type Size = { width: number; height: number };
export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Handle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

/**
 * Where bounds space lands on screen: `scale` screen pixels per source
 * pixel, and the offset of the bounds' top-left corner.
 */
export type View = { scale: number; x: number; y: number };

export function clamp(value: number, min: number, max: number): number;

/** The angle in (-180, 180]. */
export function normalizeAngle(degrees: number): number;

/** The bounding box of a rectangle rotated about its center. */
export function rotatedSize(size: Size, rotate: number): Size;

/** Turn a point clockwise (on a y-down screen) about a center. */
export function rotatePoint(
  point: Point,
  center: Point,
  degrees: number,
): Point;

/**
 * The largest factor a rect can be scaled by, about its center, and still lie
 * inside the rotated image.
 */
export function fitFactor(image: Size, rotate: number, rect: Size): number;

/**
 * The largest rect with this aspect ratio that fits inside the rotated
 * image. Without a ratio, the ratio of the bounds.
 */
export function maxCropSize(
  image: Size,
  rotate: number,
  ratio?: number | null,
): Size;

/** Whether the rect lies inside the rotated image. */
export function containsRect(
  image: Size,
  rotate: number,
  rect: Rect,
  tolerance?: number,
): boolean;

/** Hold a rect inside the rotated image: shrink, grow to a minimum, slide. */
export function clampRect(
  image: Size,
  rotate: number,
  rect: Rect,
  limits?: { minWidth?: number; minHeight?: number },
): Rect;

/** The largest centered rect of a ratio inside the rotated image. */
export function initialRect(
  image: Size,
  rotate: number,
  ratio?: number | null,
): Rect;

export function translateRect(rect: Rect, dx: number, dy: number): Rect;

/** Scale a rect so the point at `anchor` keeps its relative place in it. */
export function scaleRect(rect: Rect, factor: number, anchor?: Point): Rect;

export const HANDLE_SIGNS: Record<Handle, { sx: -1 | 0 | 1; sy: -1 | 0 | 1 }>;

/** Move one handle of a rect; the opposite edge or corner stays put. */
export function resizeRect(
  rect: Rect,
  handle: Handle,
  dx: number,
  dy: number,
  options?: { ratio?: number | null; minWidth?: number; minHeight?: number },
): Rect;

/** The largest step from `previous` toward `next` that stays in the image. */
export function limitRect(
  image: Size,
  rotate: number,
  previous: Rect,
  next: Rect,
): Rect;

/** Mirror a rect across the middle of the bounds. */
export function mirrorRect(bounds: Size, rect: Rect, axis: "x" | "y"): Rect;

/** Turn the image under the crop, keeping the point under its center. */
export function rotateRect(
  image: Size,
  from: number,
  to: number,
  rect: Rect,
  options?: { swap?: boolean; minWidth?: number; minHeight?: number },
): Rect;

/** Fit the bounds into a stage (for a box over a still image). */
export function fitView(stage: Size, bounds: Size, padding?: number): View;

/** Put the rect's top-left corner on the frame's (for a still frame). */
export function frameView(frame: Rect, rect: Rect): View;

/** The largest rect of a ratio that fits a stage, centered. */
export function fitFrame(stage: Size, ratio: number, padding?: number): Rect;

export function rectToScreen(rect: Rect, view: View): Rect;

/** The CSS transform for an image layer at its natural size. */
export function layerTransform(
  image: Size,
  rotate: number,
  flipX: boolean,
  flipY: boolean,
  view: View,
): string;

/** 1 when the crop is as large as the image allows, rising as it shrinks. */
export function zoomOf(image: Size, rotate: number, rect: Rect): number;

/** The most a crop can magnify before it falls under the minimum size. */
export function zoomLimit(
  image: Size,
  rotate: number,
  ratio: number,
  options?: { maxZoom?: number; minWidth?: number; minHeight?: number },
): number;

/** The crop in whole source pixels, held inside the bounds. */
export function roundRect(image: Size, rotate: number, rect: Rect): Rect;

/** The output size for a crop, scaled to a width or height, within a budget. */
export function outputSize(
  crop: Size,
  options?: { width?: number; height?: number; maxPixels?: number },
): Size & { limited: boolean };

export type Crop = Rect & { rotate: number; flipX?: boolean; flipY?: boolean };

/** Whether two crops are the same to the pixel. */
export function sameCrop(
  a: Crop | null | undefined,
  b: Crop | null | undefined,
): boolean;
