export type Edges = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

/** The edges of the area `box` clips its content to: its padding box. */
export function clipEdges(box: Element): Edges;

/**
 * Whether `style` clips what overflows it, and on which axes. `overflow`
 * other than `visible`, paint containment and `content-visibility: auto` or
 * `hidden` all clip.
 */
export function clipAxes(style: CSSStyleDeclaration): {
  x: boolean;
  y: boolean;
};

/**
 * The first box that cuts `el` off, counting only boxes that position `el`.
 * `null` when nothing clips it or `el` has no layout (zero size).
 */
export function clippedBy(el: HTMLElement): HTMLElement | null;

/**
 * The nearest dialog, popover or fullscreen element around `anchor`, which
 * an overlay has to render inside to stay visible and on top. `null` for
 * the page, where `<body>` does.
 */
export function portalRoot(
  anchor: Element | null | undefined,
): HTMLElement | null;

/**
 * The edges the nearest box that clips `node` leaves it on an axis, within
 * the window. Without such a box, the window.
 */
export function clippingBoundary(
  node: Element,
  axis?: "x" | "y" | "both",
): Edges;

/**
 * Whether a `position: fixed` box under `el` is placed from an ancestor's
 * own edge instead of the window's (a transform, a filter, containment).
 */
export function hasFixedBlock(el: Element): boolean;

/**
 * Where a fixed box put at `x` and `y` landed, as the difference to
 * subtract. Reads layout.
 */
export function fixedBlockOffset(
  el: HTMLElement,
  x: number,
  y: number,
): { x: number; y: number };
