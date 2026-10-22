import type { Readable } from "svelte/store";

export type CanvasPaintContext = {
  /** The chart's logical size, which painters draw in. */
  width: number;
  height: number;
  /** A CSS color for a token such as `var(--cds-viz-group-1-1-1)`. */
  resolve(color: string): string;
};

export type CanvasPainter = {
  draw(context: CanvasRenderingContext2D, paint: CanvasPaintContext): void;
  /** Whether the whole layer should fade while a point is hovered. */
  dimOnHover?: boolean;
};

export type CanvasLayer = {
  /** How many painters are registered. The chart mounts a canvas above zero. */
  count: Readable<number>;
  /** Whether any painter asked to fade on hover. */
  dimming: Readable<boolean>;
  /** Add a painter. Returns a function that removes it. */
  register(painter: CanvasPainter): () => void;
  /** Take over a mounted canvas inside the figure. Returns a detach function. */
  attach(canvas: HTMLCanvasElement, figure: HTMLElement): () => void;
  /** Tell the layer the chart's logical size. */
  resize(width: number, height: number): void;
  /** Repaint on the next frame. */
  invalidate(): void;
  /** Paint now and return the pixels as a PNG data URL, or `null`. */
  snapshot(): string | null;
};

export function createCanvasLayer(): CanvasLayer;
