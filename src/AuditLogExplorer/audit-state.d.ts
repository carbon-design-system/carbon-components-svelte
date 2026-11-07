import type { FilterState } from "../FilterPanel/filter-model.js";
import type {
  TokenFilter,
  TokenKey,
  TokenQuery,
} from "../TokenSearch/token-query.js";
import type { AuditQuery, AuditRange } from "./audit-source.js";

/** A field of an event the screen can search. */
export type AuditField = {
  /** The event's property and the qualifier: `actor` for `actor:alice`. */
  key: string;
  label: string;
  description?: string;
  /** Draw a facet and offer the values in the query bar. Without it the qualifier is a text match. */
  facet?: boolean;
  /** The values of a faceted field, until a source's counts add more. */
  values?: ReadonlyArray<string>;
  /** Display text by value. */
  valueLabels?: Record<string, string>;
};

export type TimeRangeState =
  { preset: keyof typeof RANGE_PRESETS } | { from: string; to: string };

export type AuditViewState = {
  /** The text of the query bar: free text and every qualifier, facets included. */
  q: string;
  range: TimeRangeState;
  live: boolean;
};

/** The part of a `FilterPanel` facet this module reads. */
export type FacetLike = {
  id: string;
  match?: "any" | "all";
  options?: ReadonlyArray<{ id: string | number }>;
};

export const RANGE_PRESETS: Readonly<{
  "15m": number;
  "1h": number;
  "24h": number;
  "7d": number;
  "30d": number;
}>;
export const DEFAULT_RANGE: "7d";

export function resolveRange(range: TimeRangeState, now?: number): AuditRange;
export function toSearchParams(state: AuditViewState): URLSearchParams;
export function fromSearchParams(
  input: string | URLSearchParams | URL | null | undefined,
): AuditViewState;

export function schemaFromFields(
  fields: ReadonlyArray<AuditField>,
  options?: Record<string, ReadonlyArray<string>>,
): {
  keys: TokenKey[];
  facets: Array<{
    id: string;
    label: string;
    type: "checkbox";
    options: Array<{ id: string; label: string }>;
  }>;
};

export function mergeOptions(
  listed: ReadonlyArray<string>,
  counts: Record<string, number> | undefined,
  selected: ReadonlyArray<string>,
): string[];

export function facetsFromText(
  text: string,
  facets: FacetLike[],
  keys: ReadonlyArray<TokenKey>,
): {
  query: TokenQuery;
  state: FilterState;
  rest: TokenFilter[];
  refused: Array<Pick<TokenFilter, "key" | "op" | "values" | "negated">>;
};

export function textWithFacets(
  text: string,
  facets: FacetLike[],
  next: FilterState,
  keys: ReadonlyArray<TokenKey>,
): string;

export function toAuditQuery(
  query: TokenQuery,
): Pick<AuditQuery, "q" | "filters">;
