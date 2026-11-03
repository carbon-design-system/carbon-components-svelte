/** Options for `titleWhenTruncated`. */
export interface TitleWhenTruncatedOptions {
  /** Selector for the descendant whose text truncates. Defaults to `node`. */
  measure?: string;
  /** Set to `false` to skip the element. Defaults to `true`. */
  enabled?: boolean;
}

/**
 * Svelte action: while the pointer is over `node`, give it a `title` with
 * its full text when the text is cut off, and none otherwise.
 */
export function titleWhenTruncated(
  node: HTMLElement,
  options?: TitleWhenTruncatedOptions,
): {
  update(options?: TitleWhenTruncatedOptions): void;
  destroy(): void;
};
