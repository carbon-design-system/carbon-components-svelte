import type { Readable } from "svelte/store";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export type AsyncState<T, Q = string> = {
  /**
   * `"idle"` before the first query and below `minLength`, `"loading"` from
   * the moment a query is set until its answer arrives, then `"success"` or
   * `"error"`.
   */
  status: AsyncStatus;
  /**
   * The latest answer. While `status` is `"loading"` it is the previous
   * answer if `keepPrevious` is on (see `stale`), and `undefined` otherwise.
   */
  data: T | undefined;
  /** Why the last request failed, with `status` `"error"`. */
  error: unknown;
  /** The latest query set, which `data` may not answer yet. */
  query: Q | undefined;
  /**
   * `true` when `data` is not a fresh answer to `query`: it answers an earlier
   * query, or is a cached answer being fetched again.
   */
  stale: boolean;
};

export type AsyncStatusEdge<T, Q = string> = {
  /** The new status. */
  type: AsyncStatus;
  /** The status it replaced. */
  previous: AsyncStatus;
  state: AsyncState<T, Q>;
  /** `data.length` when `data` is an array. */
  count: number | undefined;
  /**
   * Why the state changed: `"fetch"`, `"cache"` (an answer at once, so
   * "Loading" is not worth announcing), `"more"` (a page was appended),
   * `"length"` (the query is below `minLength`), `"cancel"` or `"reset"`.
   */
  reason: "fetch" | "cache" | "more" | "length" | "cancel" | "reset";
};

export type AsyncRetryOptions = {
  /**
   * How many times to try again after a failure.
   * @default 3
   */
  count?: number;
  /**
   * Milliseconds to wait before attempt `attempt + 1` (0 for the first retry).
   * @default exponential, 500 ms doubling to 8 s
   */
  delay?: number | ((attempt: number, error: unknown) => number);
  /**
   * Whether this error is worth another try.
   * @default () => true
   */
  when?: (error: unknown, attempt: number) => boolean;
};

export type AsyncSourceOptions<T, Q = string> = {
  /**
   * Milliseconds to wait after the last `set` before calling the fetcher.
   * An answer in the cache is shown at once, without waiting.
   * @default 0
   */
  debounce?: number;
  /**
   * The shortest query, trimmed, that is fetched. A shorter string query
   * leaves the source `"idle"`. Ignored for queries that are not strings.
   * @default 0
   */
  minLength?: number;
  /**
   * Show the previous answer, with `stale: true`, while a new query loads.
   * @default true
   */
  keepPrevious?: boolean;
  /**
   * Answers by query key. `max` is the number of queries kept (least recently
   * used out first). `ttl` is how many milliseconds an answer is fresh and
   * served without a request. After that it still shows, as stale, while the
   * query is fetched again. `false` keeps nothing.
   * @default { max: 50, ttl: 0 }
   */
  cache?: false | { max?: number; ttl?: number };
  /**
   * Try again after a failure. A number is the `count`; `true` is the
   * defaults. While the browser is offline, a retry waits for the `online`
   * event instead of a timer.
   * @default 0
   */
  retry?: boolean | number | AsyncRetryOptions;
  /**
   * Fetch the current query again when the browser comes back online after a
   * failure.
   * @default true
   */
  refetchOnReconnect?: boolean;
  /**
   * The cache and dedupe key of a query.
   * @default the query itself for a string, else `JSON.stringify(query)`
   */
  key?: (query: Q) => string;
  /** An answer to start with, such as one a server render already has. */
  initialData?: T;
  /** The query `initialData` answers. Needed to cache it. */
  initialQuery?: Q;
};

export type AsyncSource<T, Q = string> = Readable<AsyncState<T, Q>> & {
  /**
   * Ask for the answer to a query. Resolves when it is settled or replaced;
   * never rejects. Setting the query that is already current does nothing,
   * unless it failed.
   */
  set(query: Q): Promise<void>;
  /** Fetch the current query again, whatever the cache holds. */
  refresh(): Promise<void>;
  /** Abort the request in progress and go back to the last answer. */
  cancel(): void;
  /** Abort the request in progress and forget the answer. The cache stays. */
  reset(): void;
  /** Fetch a query into the cache. A `set` for it then joins the request. */
  prefetch(query: Q): Promise<void>;
  /**
   * The cached answer to a query, fresh or not, or `undefined`. Reads the
   * cache only: it sends no request and does not count as a use.
   */
  peek(query: Q): T | undefined;
  /** Drop a query's cached answer, or all of them. */
  invalidate(query?: Q): void;
  /** The current state, without subscribing. */
  get(): AsyncState<T, Q>;
  /**
   * Listen for status changes, such as for an announcer. Called when `status`
   * changes, and when new `data` arrives while it stays `"success"`.
   * @returns Call to stop listening.
   */
  onStatus(listener: (edge: AsyncStatusEdge<T, Q>) => void): () => void;
};

export type PagedState<Item, Q = string, Page = unknown> = AsyncState<
  ReadonlyArray<Item>,
  Q
> & {
  /** Whether the last page came with a `nextCursor`. */
  hasMore: boolean;
  /** `true` while `loadMore` is in flight. `status` stays `"success"`. */
  loadingMore: boolean;
  /** Why the last `loadMore` failed. Cleared by the next one. */
  moreError: unknown;
  /** The response of the first page, for fields such as `total`. */
  firstPage: Page | undefined;
};

export type PagedSourceOptions<
  Item,
  Q = string,
  Page = { items: ReadonlyArray<Item>; nextCursor?: unknown },
> = Omit<AsyncSourceOptions<Page, Q>, "initialData"> & {
  /** The first page to start with. */
  initialData?: Page;
  /** Drops an item whose key an earlier page already holds. */
  itemKey?: (item: Item) => unknown;
};

export type PagedSource<
  Item,
  Q = string,
  Page = { items: ReadonlyArray<Item>; nextCursor?: unknown },
> = Omit<AsyncSource<ReadonlyArray<Item>, Q>, "subscribe" | "get"> &
  Readable<PagedState<Item, Q, Page>> & {
    get(): PagedState<Item, Q, Page>;
    /**
     * Fetch the page after the last one. Does nothing while a query is
     * loading, or when `hasMore` is `false`. A failure sets `moreError` and
     * keeps the items.
     */
    loadMore(): Promise<void>;
  };

/**
 * Turns a function that answers a query into a store that follows the latest
 * query: debounced, cancellable, cached, with only the newest answer shown.
 *
 * Nothing runs until `set` is called, so creating a source at component init
 * starts no timer and no request, on the server or in the browser. Work is
 * tied to its subscribers: when the last one leaves, the request in progress
 * is aborted and the online listener is removed.
 */
export function createAsyncSource<T, Q = string>(
  fetcher: (query: Q, context: { signal: AbortSignal }) => T | PromiseLike<T>,
  options?: AsyncSourceOptions<T, Q>,
): AsyncSource<T, Q>;

/**
 * Like `createAsyncSource` for a list that comes in pages. The fetcher
 * returns `{ items, nextCursor }`; `loadMore` asks for the next page with that
 * cursor and appends it, and a new query starts over from the first page.
 */
export function createPagedSource<
  Item,
  Q = string,
  Cursor = unknown,
  Page extends { items: ReadonlyArray<Item>; nextCursor?: Cursor | null } = {
    items: ReadonlyArray<Item>;
    nextCursor?: Cursor | null;
  },
>(
  fetcher: (
    query: Q,
    context: { signal: AbortSignal; cursor?: Cursor },
  ) => Page | PromiseLike<Page>,
  options?: PagedSourceOptions<Item, Q, Page>,
): PagedSource<Item, Q, Page>;
