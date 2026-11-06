import type { FilterState } from "../../../src/FilterPanel/filter-model.js";

export interface CatalogState {
  q: string;
  filters: FilterState;
  sort: string;
  view: "grid" | "list";
  /** How many pages the first load covers: the depth to put a reader back at. */
  pages: number;
}

export const MAX_PAGES: number;
export const DEFAULT_STATE: Readonly<CatalogState>;

export function parseCatalogUrl(search: string | URLSearchParams): CatalogState;

export function formatCatalogUrl(
  state: CatalogState,
  current?: string | URLSearchParams,
): string;

export function sameQuery(a: CatalogState, b: CatalogState): boolean;
