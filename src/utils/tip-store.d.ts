import type { Readable } from "svelte/store";

/**
 * Where a tip store keeps the ids of the tips a user dismissed.
 * `read` and `write` may be asynchronous, as for preferences synced with a
 * server. `subscribe` reports changes made elsewhere, such as in another tab,
 * and returns a function that stops listening.
 */
export interface TipStorage {
  read(): string[] | Promise<string[]>;
  write(ids: string[]): void | Promise<void>;
  subscribe?(callback: (ids: string[]) => void): () => void;
}

export interface TipStoreState {
  /**
   * `true` once the dismissed ids are known: from `initial`, or after the
   * storage was read.
   */
  ready: boolean;
  dismissed: ReadonlySet<string>;
  /** What a tip renders while `ready` is `false`. */
  pending: "hide" | "show";
}

export interface TipStoreOptions {
  /** Defaults to `localTipStorage()`. */
  storage?: TipStorage;
  /**
   * Dismissed ids the server already knows, such as read from a cookie.
   * The store is `ready` from the first render, so the server and the first
   * client paint agree and nothing shifts.
   */
  initial?: string[];
  /**
   * What a tip renders until the stored ids are known, on the server and for
   * the first client paint. `"hide"` (default) shows nothing, so a returning
   * user never sees a tip flash and vanish. `"show"` prints the tip, so a new
   * user's page never grows after load.
   * @default "hide"
   */
  pending?: "hide" | "show";
  /**
   * Called when a read or a write fails. The dismissals still hold for the
   * session.
   */
  onError?: (error: unknown) => void;
}

export interface TipStore extends Readable<TipStoreState> {
  /** Remember that the tip(s) were dismissed. */
  dismiss(ids: string | string[]): void;
  /** Show the tip(s) again, or every tip when no id is given. */
  reset(ids?: string | string[]): void;
  /** Read without subscribing. */
  isDismissed(id: string): boolean;
  /**
   * Read the storage once and listen for changes from other tabs. Call it
   * in `onMount`. Returns a function that lets go; the store stops listening
   * when every caller has.
   */
  connect(): () => void;
}

/**
 * Keep the dismissed ids in `localStorage` (or `sessionStorage`) as a JSON
 * array under `key`. A write also tells other stores that share the key, on
 * the page and in other tabs.
 */
export function localTipStorage(
  key?: string,
  type?: "localStorage" | "sessionStorage",
): TipStorage;

/**
 * Read the dismissed ids from a cookie header, as a server does before it
 * renders. Pass the result to `createTipStore({ initial })`.
 */
export function parseTipCookie(
  cookieHeader: string | null | undefined,
  name?: string,
): string[];

/**
 * Keep the dismissed ids in a cookie, so the server can render a tip that was
 * dismissed already. Read it on the server with `parseTipCookie`.
 */
export function cookieTipStorage(options?: {
  name?: string;
  maxAge?: number;
  path?: string;
}): TipStorage;

/**
 * Remember which tips a user dismissed, by tip id. Share one store between
 * the tips of a page with `setTipStore`, or pass it as the `store` prop.
 * Create it inside a component, not at module scope.
 */
export function createTipStore(options?: TipStoreOptions): TipStore;

/**
 * Share a tip store with every `InlineTip` and `Guidebanner` below the
 * calling component. Call it while a component initializes.
 */
export function setTipStore(store: TipStore): void;

/** The store `setTipStore` shared with this component, if any. */
export function getTipStore(): TipStore | undefined;

/**
 * The wiring `InlineTip` and `Guidebanner` share: which store to use, and
 * when to read it.
 */
export function createTipStoreBinding(): {
  resolve: (given: TipStore | undefined) => TipStore;
  connect: (store: TipStore, enabled: boolean) => void;
  release: () => void;
};
