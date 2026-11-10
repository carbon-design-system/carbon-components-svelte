export type OptionId = string | number;

export interface FilterOption {
  id: OptionId;
  /** Defaults to `String(id)`. */
  label?: string;
  /** Child options of a `tree` facet. */
  children?: ReadonlyArray<FilterOption>;
}

export interface FacetBase {
  /** Names the facet in `FilterState`, in URLs and in conversions. */
  id: string;
  label: string;
  /** The record property to read. Defaults to `id`. */
  field?: string;
  /**
   * Read a record's value instead. For a `checkbox` or `tree` facet it may
   * return an array.
   */
  getValue?: (record: never) => unknown;
  /** Start the facet's group collapsed. */
  collapsed?: boolean;
}

export interface CheckboxFacet extends FacetBase {
  type: "checkbox";
  options?: ReadonlyArray<FilterOption>;
  /**
   * `"any"` (the default) matches a record with any checked value.
   * `"all"` needs every one, for a record that holds several.
   */
  match?: "any" | "all";
  /** Show a search field above the options. Defaults to on past 12 options. */
  searchable?: boolean;
  /** How many options show before "Show more". Defaults to 6. */
  limit?: number;
}

export interface RadioFacet extends FacetBase {
  type: "radio";
  options: ReadonlyArray<FilterOption>;
}

export interface RangeFacet extends FacetBase {
  type: "range";
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
}

export interface DateFacet extends FacetBase {
  type: "date";
  /** `YYYY-MM-DD`. */
  min?: string;
  /** `YYYY-MM-DD`. */
  max?: string;
}

export interface ToggleFacet extends FacetBase {
  type: "toggle";
  /** The text beside the switch. Defaults to `label`. */
  toggleLabel?: string;
}

export interface TreeFacet extends FacetBase {
  type: "tree";
  options: ReadonlyArray<FilterOption>;
}

export type Facet =
  CheckboxFacet | RadioFacet | RangeFacet | DateFacet | ToggleFacet | TreeFacet;

/**
 * A value per facet id: `OptionId[]` (checkbox, tree), `OptionId` (radio),
 * `[number | null, number | null]` (range), `[string | null, string | null]`
 * (date, `YYYY-MM-DD`), `true` (toggle). A facet with no filter has no key.
 */
// biome-ignore lint/suspicious/noExplicitAny: an empty object literal is assignable to `Record<string, any>` and not to `Record<string, unknown>`
export type FilterState = Record<string, any>;

/** The shape of TokenSearch's `query.filters` entries. */
export interface Filter {
  /** The facet id. */
  key: string;
  op: "eq" | "gt" | "gte" | "lt" | "lte" | "between";
  values: string[];
  negated: boolean;
}

/** Counts by facet id, then option id. */
export type FacetCounts = Record<string, Record<string, number>>;

export interface AppliedFilter {
  facetId: string;
  facetLabel: string;
  /** Set for an option; `null` removes the whole facet. */
  optionId: OptionId | null;
  /** The value as shown: `Acme`, `10 to 50`. */
  text: string;
  /** The chip's text: `Brand: Acme`. A toggle is its own label. */
  label: string;
}

export interface QueryConditionLike {
  id?: string;
  field: string;
  operator: string;
  value: unknown;
}

export interface QueryGroupLike {
  id?: string;
  operator: "and" | "or";
  conditions: Array<QueryConditionLike | QueryGroupLike>;
}

export interface TreeIndex {
  up: Map<string, string[]>;
  down: Map<string, string[]>;
  leaves: string[];
  labels: Map<string, string>;
}

/**
 * Return the facets as written, typed with their literal `type` values. A
 * plain `const facets = [{ type: "checkbox" }]` widens `type` to `string`,
 * which is not a facet type; this keeps the literal.
 */
export function defineFacets<const F extends ReadonlyArray<Facet>>(
  facets: F,
): F;

/** Walk a `tree` facet's options once; the result is cached per facet. */
export function treeIndex(facet: {
  options: ReadonlyArray<FilterOption>;
}): TreeIndex;

/** Every id a tree selection covers: the nodes and their descendants. */
export function expandTreeIds(facet: TreeFacet, ids: OptionId[]): string[];

/**
 * The topmost nodes of a checked set: a node whose descendants are all
 * checked stands for them.
 */
export function compactTreeIds(facet: TreeFacet, checked: OptionId[]): string[];

/** Whether a value filters anything for the facet. */
export function isFilterActive(facet: Facet, value: unknown): boolean;

/**
 * Coerce a value to the facet's shape, or `undefined` when it filters
 * nothing. Reversed range ends are swapped.
 */
export function normalizeFacetValue(facet: Facet, value: unknown): unknown;

/**
 * Keep only the schema's facets and drop what filters nothing, so two states
 * that mean the same compare deeply equal.
 */
export function normalizeFilterState(
  facets: ReadonlyArray<Facet>,
  state: FilterState | null | undefined,
): FilterState;

/**
 * The number of applied selections: one per checked option, one per range,
 * radio, date range or toggle.
 */
export function countFilters(
  facets: ReadonlyArray<Facet>,
  state: FilterState,
): number;

/** The records every active facet accepts. */
export function filterRecords<T>(
  records: T[],
  facets: ReadonlyArray<Facet>,
  state: FilterState,
): T[];

/**
 * The count of records each option would show, and how many records match.
 *
 * The count is disjunctive: a facet's own selection does not shrink its own
 * counts. A `checkbox` facet with `match: "all"` is conjunctive and counts
 * under its own selection too. A `tree` facet counts every node, its
 * descendants included. A `range` or `date` facet has no counts.
 */
export function facetCounts(
  records: ReadonlyArray<unknown>,
  facets: ReadonlyArray<Facet>,
  state: FilterState,
): { total: number; counts: FacetCounts };

/**
 * The options of a `checkbox` or `radio` facet that has none: every distinct
 * value in the records, the most common first.
 */
export function deriveOptions(
  records: ReadonlyArray<unknown>,
  facet: Facet,
): FilterOption[];

/**
 * The facets with `options` read from the records wherever a `checkbox` or
 * `radio` facet has none.
 */
export function deriveFacetOptions(
  records: ReadonlyArray<unknown>,
  facets: Facet[],
): Facet[];

/** The smallest and largest value of a `range` or `date` facet. */
export function facetDomain(
  records: ReadonlyArray<unknown>,
  facet: Facet,
): { min: number | string; max: number | string } | null;

/** The labels of a facet's options, by id. */
export function optionLabels(facet: Facet): Map<string, string>;

/** One dismissible chip per applied selection, for the summary bar. */
export function appliedFilters(
  facets: ReadonlyArray<Facet>,
  state: FilterState,
  options?: {
    range?: (facet: RangeFacet, lo: number | null, hi: number | null) => string;
  },
): AppliedFilter[];

/** The state without one chip's selection. */
export function removeApplied(
  facets: ReadonlyArray<Facet>,
  state: FilterState,
  chip: AppliedFilter,
): FilterState;

/**
 * The state as a flat list of filters, the shape of TokenSearch's
 * `query.filters`.
 */
export function toFilters(
  facets: ReadonlyArray<Facet>,
  state: FilterState,
): Filter[];

/**
 * The state from a list of filters. A filter the facets cannot show comes
 * back in `skipped`, never in the state.
 */
export function fromFilters(
  facets: ReadonlyArray<Facet>,
  filters: Filter[],
  options?: { strict?: boolean },
): { state: FilterState; skipped: Filter[] };

/** The state as a TokenSearch query: `{ text, filters }`. */
export function toQuery(
  facets: ReadonlyArray<Facet>,
  state: FilterState,
  text?: string,
): { text: string; filters: Filter[] };

/** The state from a TokenSearch query. */
export function fromQuery(
  facets: ReadonlyArray<Facet>,
  query: {
    text?: string;
    filters?: Array<Partial<Filter> & Pick<Filter, "key" | "op" | "values">>;
  },
  options?: { strict?: boolean },
): { text: string; state: FilterState; skipped: Filter[] };

/** The state as a QueryBuilder tree: one `and` group of conditions. */
export function toConditions(
  facets: ReadonlyArray<Facet>,
  state: FilterState,
): QueryGroupLike;

/**
 * The state from a QueryBuilder tree. A nested group, an `or`, a negating
 * operator or an unknown field comes back in `skipped`.
 */
export function fromConditions(
  facets: ReadonlyArray<Facet>,
  group: QueryGroupLike,
  options?: { strict?: boolean },
): {
  state: FilterState;
  skipped: Array<QueryConditionLike | QueryGroupLike>;
};

/**
 * Test a record against the conditions `toConditions` writes. Use
 * QueryBuilder's `evaluateQuery` in an app.
 */
export function matchesConditions(
  facets: ReadonlyArray<Facet>,
  group: QueryGroupLike,
  record: unknown,
): boolean;

/**
 * The state as query parameters: `brand=a&brand=b`, `price=10..50`,
 * `inStock=true`.
 */
export function toSearchParams(
  facets: ReadonlyArray<Facet>,
  state: FilterState,
  options?: { prefix?: string },
): URLSearchParams;

/**
 * The state from query parameters. It reads only the schema's names and
 * drops a value that does not parse or that `options` do not list.
 */
export function fromSearchParams(
  facets: ReadonlyArray<Facet>,
  params: URLSearchParams | string,
  options?: { prefix?: string; strict?: boolean },
): FilterState;
