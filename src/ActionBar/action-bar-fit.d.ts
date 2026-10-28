export type FitEntry = {
  id: string;
  kind: "item" | "divider";
  /** Size along the main axis, in pixels, as of the last time it was shown. */
  width: number;
  /** Higher stays visible longer. */
  priority: number;
  /** Never collapses. */
  pinned: boolean;
};

/**
 * The ids that do not show: the entries that collapse into the "More" menu,
 * and the dividers that no longer sit between two shown items.
 */
export function fitActionBar(options: {
  entries: ReadonlyArray<FitEntry>;
  available: number;
  moreWidth: number;
}): Set<string>;

export function sameIds(
  a: ReadonlySet<string>,
  b: ReadonlySet<string>,
): boolean;
