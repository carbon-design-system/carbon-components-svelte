export interface VirtualizeConfig {
  /** Full array of items to virtualize */
  items: any[];
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
}

export interface VirtualizeResult<T = any> {
  /** Items to render in the current viewport */
  visibleItems: T[];
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
}

export function virtualize<T = any>(
  config: VirtualizeConfig,
): VirtualizeResult<T>;
