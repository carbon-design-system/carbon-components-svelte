export type AddSelectKey = string | number;

export type AddSelectCrumb = {
  id: AddSelectKey;
  title: string;
};

export type AddSelectItem = {
  id: AddSelectKey;
  title: string;
  description?: string;
  meta?: ReadonlyArray<string>;
  hasChildren?: boolean;
  childCount?: number;
  disabled?: boolean;
  parentId?: AddSelectKey | null;
  attributes?: Record<string, string | ReadonlyArray<string>>;
  path?: ReadonlyArray<AddSelectCrumb>;
};

export type AddSelectRequest = {
  query: string;
  parentId: AddSelectKey | null;
  filters: Record<string, ReadonlyArray<string>>;
  scope: "level" | "all";
};

export type AddSelectPage = {
  items: ReadonlyArray<AddSelectItem>;
  nextCursor: number | null;
  total: number;
};

/** Answer an `AddSelect` request from a flat array of items. */
export function createItemsFetcher(
  items: ReadonlyArray<AddSelectItem>,
  options?: { pageSize?: number },
): (
  request: AddSelectRequest,
  context?: { cursor?: number | null },
) => AddSelectPage;

export function formatItemPath(
  path: ReadonlyArray<AddSelectCrumb> | undefined,
  separator?: string,
): string;

export function activeFilters(
  filterValue: Record<string, ReadonlyArray<string>>,
): Record<string, ReadonlyArray<string>>;
