export interface SelectionUrlOptions {
  /** Name of the query parameter. Defaults to `"id"`. */
  param?: string;
}

export interface SelectionUrl {
  /**
   * Current id from the URL, or `""` when the parameter is missing and on
   * the server.
   */
  read(): string;
  /**
   * Link to an id that keeps the other parameters and the hash.
   * `""` links to the list.
   */
  hrefFor(id: string): string;
  /** Add a history entry for `id`. */
  push(id: string): void;
  /** Change the current history entry to `id`. */
  replace(id: string): void;
  /**
   * Leave the detail view. Steps back when the current entry was pushed by
   * `push` and returns `true`; the new id then arrives through `listen`.
   * Otherwise it replaces the entry with the list and returns `false`, so a
   * deep link never leaves the page.
   */
  back(): boolean;
  /**
   * Call `callback` with the id after back and forward navigation.
   * Returns a function that stops listening.
   */
  listen(callback: (id: string) => void): () => void;
}

/**
 * Keep one selected id in a URL query parameter, such as `?id=42`, so a
 * reload or a shared link restores it. Safe to call on the server, where
 * `read` returns `""` and the rest do nothing.
 */
export function syncSelectionToUrl(options?: SelectionUrlOptions): SelectionUrl;
