export type Transform = { k: number; tx: number; ty: number };

export type ViewportActionOptions = {
  get(): Transform;
  set(next: Transform): void;
  /** @default 0.1 */
  min?: number;
  /** @default 8 */
  max?: number;
  /** Whether a left-button press on this target may start a pan. */
  accept?: (event: PointerEvent) => boolean;
  enabled?: boolean;
};

export function identity(): Transform;
export function toWorld(
  t: Transform,
  sx: number,
  sy: number,
): { x: number; y: number };
export function toScreen(
  t: Transform,
  wx: number,
  wy: number,
): { x: number; y: number };
/** Scale by `factor` keeping the world point under `(sx, sy)` still. */
export function zoomAt(
  t: Transform,
  factor: number,
  sx: number,
  sy: number,
  limits?: { min?: number; max?: number },
): Transform;
export function translate(t: Transform, dx: number, dy: number): Transform;
/** The transform that centers `bounds` in `size` with padding around it. */
export function fit(
  bounds: { x0: number; y0: number; x1: number; y1: number },
  size: { width: number; height: number },
  options?: { padding?: number; min?: number; max?: number },
): Transform;

/** Svelte action: wheel and drag on the element move a transform. */
export function viewport(
  node: HTMLElement,
  options: ViewportActionOptions,
): { update(next: ViewportActionOptions): void; destroy(): void };
