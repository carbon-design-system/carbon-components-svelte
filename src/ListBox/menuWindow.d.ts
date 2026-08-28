export type MenuWindowSize = "xs" | "sm" | "md" | "lg" | "xl";

export type MenuWindowUpdateOptions<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** The collection the menu renders, filtered where there is a filter. */
  items: Item[];
  /** What identifies an option across a rebuild of `items`. */
  getKey?: (item: Item, index: number) => unknown;
  /** The threshold gate, from `shouldVirtualizeMenu`. */
  shouldVirtualize: boolean;
  virtualize: boolean | object | undefined;
  /**
   * Wrapping makes options unequal in height, so it is what turns measuring on.
   * Nothing else does: a `measured` key on `virtualize` is dropped.
   */
  wrapOptions?: boolean;
  size?: MenuWindowSize;
  /** Whether menu items render at the fluid height. */
  fluid?: boolean;
  scrollTop: number;
};

export type MenuWindowState<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  itemsToRender: Item[];
  isVirtualized: boolean;
  startIndex: number;
  offsetY: number;
  totalHeight: number;
  /** A CSS length: the windowed viewport, or the size-based maximum. */
  menuMaxHeight: string;
  /**
   * Whether a windowing configuration was resolved, which differs from the list
   * being windowed: one below the threshold resolves a config and still renders
   * whole. `menuMaxHeight` came from the viewport when this is `true`, so an
   * overflow rule gates on this.
   */
  isWindowed: boolean;
  isMeasured: boolean;
};

export type MenuWindow<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Resolve the window for the options the menu is about to render. */
  update(options: MenuWindowUpdateOptions<Item>): MenuWindowState<Item>;
  /**
   * Bring the option at `index` into view, on whichever of the measured and
   * fixed-height paths the menu is on.
   */
  scrollIntoView(index: number, align: "top" | "nearest"): void;
  /**
   * Reconcile height observation against what the menu now renders and
   * re-satisfy any outstanding scroll request. Call it after a render.
   */
  sync(): void | Promise<void>;
  /** Note a scroll event, so the reader supersedes an outstanding request. */
  noteScroll(scrollTop: number): void;
  /**
   * Drop the outstanding request, keeping what was measured for it.
   */
  cancelRequest(): void;
  /** Forget the measurements on close; the estimate they averaged to survives. */
  reset(): void;
  /** Stop observing for good. */
  destroy(): void;
};

export type CreateMenuWindowOptions<
  Item extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** The menu's scroll container, or nothing when the menu is not rendered. */
  getContainer: () => HTMLElement | null | undefined;
  /** The scroll position the container actually took. */
  onScrollTop: (scrollTop: number) => void;
  /** Called with a state resolved again because measurement moved it. */
  onState?: (state: MenuWindowState<Item>) => void;
};

/**
 * Which options a listbox menu renders and where they sit: the windowing
 * configuration, the visible slice, the measured heights and the estimate that
 * outlives them, scroll placement, and the menu's maximum height.
 *
 * Builds on the offset arithmetic in `src/utils/virtualize.js` and the DOM
 * height observation in `src/utils/heightMeasurer.js`.
 */
export declare function createMenuWindow<
  Item extends Record<string, unknown> = Record<string, unknown>,
>(options: CreateMenuWindowOptions<Item>): MenuWindow<Item>;
