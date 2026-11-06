import type {
  FacetCounts,
  FilterState,
} from "../../../src/FilterPanel/filter-model.js";
import type { CatalogItem } from "./catalog-data.js";

export interface CatalogQuery {
  /** Free text. Every word must match somewhere. */
  q: string;
  /** The applied facets, by facet id. */
  filters: FilterState;
  sort: string;
  /** `null` for the first page; otherwise a `nextCursor` the source returned. */
  cursor: string | null;
  limit: number;
  signal?: AbortSignal;
}

export interface CatalogResult {
  items: CatalogItem[];
  /** `null` on the last page. */
  nextCursor: string | null;
  /** Every match, not just this page. */
  total: number;
  /**
   * Option counts by facet id, ignoring each facet's own choice. On the first
   * page only; a later page does not change them.
   */
  counts?: FacetCounts;
}

export interface CatalogSource {
  query(query: CatalogQuery): Promise<CatalogResult>;
  /** The most results one query returns. */
  maxLimit?: number;
}

export function createMemorySource(options?: {
  size?: number;
  items?: CatalogItem[];
  latency?: number;
  maxLimit?: number;
}): CatalogSource;

export function loadCatalog(
  source: CatalogSource,
  state: {
    q: string;
    filters: FilterState;
    sort: string;
    pages: number;
  },
  options: { pageSize: number; signal?: AbortSignal },
): Promise<CatalogResult>;
