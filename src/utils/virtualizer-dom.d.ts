import type { GridVirtualizer, Virtualizer } from "./virtualizer.js";

/**
 * Drive a virtualizer from a scrolling element, along one axis. It reports the
 * element's scroll position and size, and writes the positions the virtualizer
 * asks for once Svelte has flushed. Along the inline axis, a right-to-left
 * element is mirrored.
 *
 * @returns A function that stops following the element.
 */
export function attachScroller(
  virtualizer: Virtualizer,
  element: HTMLElement,
  options?: {
    /** @default "y" */
    axis?: "x" | "y";
  },
): () => void;

/**
 * Drive a grid virtualizer from one scrolling element: rows along the block
 * axis, columns along the inline axis.
 *
 * @returns A function that stops following the element.
 */
export function attachGridScroller(
  grid: GridVirtualizer,
  element: HTMLElement,
): () => void;

/**
 * Keep scrollers at one scroll position, as two panes of a comparison do.
 * Scrolling one scrolls the rest, and the scroll each write causes is not
 * echoed back.
 *
 * @returns A function that stops syncing.
 */
export function syncScroll(
  elements: ReadonlyArray<HTMLElement>,
  options?: {
    /** @default "y" */
    axis?: "x" | "y" | "both";
    /**
     * Where `to` goes when `from` scrolls to `offset`, for panes whose content
     * differs in length. By default, the same distance.
     */
    map?: (
      offset: number,
      from: HTMLElement,
      to: HTMLElement,
      axis: "x" | "y",
    ) => number;
  },
): () => void;
