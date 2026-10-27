import type { Writable } from "svelte/store";
import type { ColumnSettings } from "../utils/column-settings.js";

export type TableState = {
  /** The header key to sort by, or `null` for no sort. */
  sortKey: string | null;
  sortDirection: "none" | "ascending" | "descending";
  /** The current page, starting at 1. */
  page: number;
  pageSize: number;
  search: string;
  selectedRowIds: ReadonlyArray<unknown>;
  columns?: ColumnSettings;
};

export type TableStateCodec<Value = unknown> = {
  /** Read a search parameter. Return `undefined` to reject the raw value. */
  parse: (raw: string) => Value | undefined;
  /** Write a search parameter. Return `null`, `undefined` or `""` to leave it out. */
  serialize: (value: Value) => string | null | undefined;
};

export type TableStateOptions<State extends TableState = TableState> = {
  /**
   * State keys, besides `search`, `pageSize`, `sortKey` and `sortDirection`,
   * whose change resets `page` to 1.
   */
  resetPageOn?: ReadonlyArray<Extract<keyof State, string>>;
  /** Search-param codecs for keys beyond the built-in ones. */
  codecs?: { [Key in keyof State]?: TableStateCodec<State[Key]> };
  /** Allowed page sizes. Any other size falls back to the default. */
  pageSizes?: ReadonlyArray<number>;
  /** Allowed sort keys. Any other key falls back to the default. */
  sortKeys?: ReadonlyArray<string>;
};

export type TableStateSearchParamsOptions<
  State extends TableState = TableState,
> = {
  /** Values that are left out of the parameters when they match. */
  defaults?: Partial<State>;
  /** Prepended to every parameter name. */
  prefix?: string;
  /** Rename the built-in parameters. Defaults are `sort`, `page`, `pageSize` and `q`. */
  params?: Partial<Record<"sort" | "page" | "pageSize" | "search", string>>;
  codecs?: { [Key in keyof State]?: TableStateCodec<State[Key]> };
  pageSizes?: ReadonlyArray<number>;
  sortKeys?: ReadonlyArray<string>;
  /** Parameters to keep and add to. Only used when writing. */
  base?: string | URLSearchParams;
};

export type TableStateStore<State extends TableState = TableState> =
  Writable<State> & {
    /** Merge `partial` into the current state. */
    patch(partial: Partial<State>): void;
    /** Set the state back to the initial state. */
    reset(): void;
  };

/**
 * A writable store for the state a data table shares with its toolbar,
 * pagination and the request a server table makes.
 *
 * Changing `search`, `pageSize`, `sortKey` or `sortDirection` resets `page`
 * to 1 unless the same write sets `page`. A write that changes nothing wakes
 * no subscriber. Create it inside a component, not at module scope.
 */
export function createTableState<State extends TableState = TableState>(
  initial?: Partial<State>,
  options?: TableStateOptions<State>,
): TableStateStore<State>;

/**
 * Read a table state out of search parameters. Missing or invalid parameters
 * fall back to `defaults`. The result is a complete state, so it can be the
 * initial state of `createTableState`, on the server too.
 */
export function tableStateFromSearchParams<
  State extends TableState = TableState,
>(
  params: string | URLSearchParams,
  options?: TableStateSearchParamsOptions<State>,
): State;

/**
 * Write a table state as search parameters, for a URL or for the request a
 * server table makes. With `defaults`, a value equal to its default is left
 * out.
 */
export function tableStateToSearchParams<State extends TableState = TableState>(
  state: State,
  options?: TableStateSearchParamsOptions<State>,
): URLSearchParams;
