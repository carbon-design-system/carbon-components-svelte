export interface ScrollEdgeState {
  /** Content is wider than the scroller. */
  isXScrollable: boolean;
  /** Content is taller than the scroller. */
  isYScrollable: boolean;
  atTop: boolean;
  atBottom: boolean;
  /** Inline start edge: the left in LTR, the right in RTL. */
  atStart: boolean;
  /** Inline end edge: the right in LTR, the left in RTL. */
  atEnd: boolean;
}

export interface ScrollEdgesParams {
  /** Called after mount and whenever the state changes. */
  onChange: (state: ScrollEdgeState) => void;
  /**
   * Pixels of slack that still count as at an edge.
   * @default 1
   */
  tolerance?: number;
  /**
   * Set to `false` to stop listening.
   * @default true
   */
  enabled?: boolean;
}

/** Read the scroll edge state from the scroll metrics of an element. */
export function getScrollEdgeState(
  metrics: Pick<
    Element,
    | "scrollLeft"
    | "scrollTop"
    | "scrollWidth"
    | "scrollHeight"
    | "clientWidth"
    | "clientHeight"
  >,
  tolerance?: number,
): ScrollEdgeState;

/**
 * Reports whether a scroller overflows and which edges it has reached.
 * Shares one `ResizeObserver` with the rest of the app.
 */
export function scrollEdges(
  node: HTMLElement,
  params: ScrollEdgesParams,
): {
  update: (params: ScrollEdgesParams) => void;
  destroy: () => void;
};
