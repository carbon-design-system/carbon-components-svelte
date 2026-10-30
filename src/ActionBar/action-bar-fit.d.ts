export type FitEntry = {
  id: string;
  kind: "item" | "divider";
  /** Size along the main axis, in pixels, as of the last time it was shown. */
  width: number;
  /** Higher stays visible longer. */
  priority: number;
  /** Never collapses. */
  pinned: boolean;
  /**
   * Set for an entry that shrinks, such as a field: the least size it takes
   * while any entry shows. The fit counts this size.
   */
  minWidth?: number;
};

/**
 * The ids that do not show: the entries that collapse into the "More" menu,
 * and the dividers that no longer sit between two shown items. With
 * `previous` and `slack`, a collapsed entry comes back only once it fits
 * with `slack` to spare.
 */
export function fitActionBar(options: {
  entries: ReadonlyArray<FitEntry>;
  available: number;
  moreWidth: number;
  /** The ids hidden before. */
  previous?: ReadonlySet<string>;
  /** Room an entry needs beyond its own size to come back out of the menu. */
  slack?: number;
}): Set<string>;

/** The size the shown entries take, with each field at its `minWidth`. */
export function shownSize(
  entries: ReadonlyArray<FitEntry>,
  hidden: ReadonlySet<string>,
): number;

export function sameIds(
  a: ReadonlySet<string>,
  b: ReadonlySet<string>,
): boolean;
