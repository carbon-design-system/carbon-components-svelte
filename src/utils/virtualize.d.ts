export type VirtualizeConfig<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Full array of items to virtualize */
  items: Item[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Visible container height in pixels */
  containerHeight: number;
  /** Current scroll position */
  scrollTop: number;
  /** Extra items to render above/below viewport (default: 3) */
  overscan?: number;
  /** Cap maximum rendered items */
  maxItems?: number;
  /** Minimum items before virtualization activates (default: 100) */
  threshold?: number;
};

export type VirtualizeResult<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Items to render in the current viewport */
  visibleItems: Item[];
  /** Index of first visible item */
  startIndex: number;
  /** Index after last visible item */
  endIndex: number;
  /** Y offset for positioning visible items */
  offsetY: number;
  /** Total height of all items */
  totalHeight: number;
  /** Whether virtualization is active */
  isVirtualized: boolean;
};

export function virtualize<
  Item extends Record<string, unknown> = Record<string, unknown>,
>(config: VirtualizeConfig<Item>): VirtualizeResult<Item>;
