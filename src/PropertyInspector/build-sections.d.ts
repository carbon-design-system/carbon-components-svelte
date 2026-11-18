export interface SectionProperty {
  id: string;
  label: string;
  group?: string;
  /** Properties with the same `row` in a group share a line. */
  row?: string;
  /** The label of the shared line. Defaults to the first property's `label`. */
  rowLabel?: string;
  /** Extra words search matches. */
  keywords?: ReadonlyArray<string>;
}

export interface Row<P = unknown> {
  id: string;
  label: string;
  properties: ReadonlyArray<P>;
}

export interface Section<P = unknown> {
  id: string;
  label: string;
  rows: Row<P>[];
  /** The number of properties shown. */
  count: number;
}

export function queryTokens(query: string): string[];

export function matchesQuery(
  property: SectionProperty,
  groupLabel: string,
  tokens: ReadonlyArray<string>,
  /** The label of the row the property shares, when its own `rowLabel` is unset. */
  rowLabel?: string,
): boolean;

export function buildSections<P extends SectionProperty>(
  properties: ReadonlyArray<P>,
  states: { get(id: string): { applicable: boolean } | undefined },
  options?: {
    query?: string;
    groups?: ReadonlyArray<string | { id: string; label?: string }>;
  },
): Section<P>[];
