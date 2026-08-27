/**
 * Attribute a virtualized component stamps on every element in its rendered
 * window, carrying the index of the item that element renders.
 */
export const VIRTUAL_INDEX_ATTRIBUTE: "data-virtual-index";

export type HeightMeasurerOptions = {
  /**
   * Called with the heights indexed by item, sparse wherever an item has not
   * been measured, and the heights they replace. Only called when a report
   * differs from the heights already held.
   */
  onMeasure: (heights: number[], previousHeights: number[]) => void;
};

export type HeightMeasurer = {
  /**
   * Reconcile what is observed against what `container` currently renders.
   * Call after the DOM has been committed; pass a falsy container when the
   * window is gone.
   */
  sync: (container: Element | null | undefined) => void;
  /**
   * Forget every measurement, as when a menu closes or its item collection is
   * replaced. Observation stops too, so the next `sync` measures the rendered
   * elements again rather than waiting for one of them to resize.
   */
  clear: () => void;
  /** Stop observing for good. */
  disconnect: () => void;
};

/**
 * Track the heights the elements of a virtualized window render at, so measured
 * virtualization has real heights to place offsets from. A single shared
 * `ResizeObserver` covers the window, falling back to a one-shot height read
 * where there is no `ResizeObserver`.
 */
export function createHeightMeasurer(
  options: HeightMeasurerOptions,
): HeightMeasurer;
