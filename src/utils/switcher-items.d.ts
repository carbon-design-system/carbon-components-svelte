export type SwitcherItemLike = {
  id: string | number;
  text: string;
  description?: string;
  group?: string;
};

export type SwitcherSection<Item extends SwitcherItemLike> = {
  /** Stable key for a keyed `{#each}`. */
  key: string;
  /** `undefined` for items that have no group. */
  heading: string | undefined;
  items: Item[];
};

export function matchesSwitcherQuery(
  item: SwitcherItemLike,
  query: string,
): boolean;

export function buildSwitcherSections<Item extends SwitcherItemLike>(options: {
  items: ReadonlyArray<Item>;
  query: string;
  /** `undefined` turns the recent section off. */
  recentIds?: ReadonlyArray<string | number> | undefined;
  recentLimit?: number;
  selectedId?: string | number | undefined;
  recentHeading?: string;
  matches?: (item: Item, query: string) => boolean;
}): SwitcherSection<Item>[];

export function pushRecentId(
  recentIds: ReadonlyArray<string | number>,
  previousId: string | number | undefined,
  nextId: string | number,
  limit: number,
): Array<string | number>;
