interface TruncateOptions {
  /**
   * `"front"` keeps the end of the text visible. Wrap the content in
   * `<bdi>` so a leading slash or a trailing period stays in place.
   */
  clamp?: "end" | "front";
  /** Number of visible lines before truncating. Values above 1 use multiline mode (end clamp only). */
  lines?: number;
}

/**
 * Svelte action that truncates text on an element.
 * @param node - The element to truncate
 * @param options - Clamp direction and line count
 * @returns Object with update method (options may be undefined when action is updated with no args)
 */
export function truncate(
  node: HTMLElement,
  options?: TruncateOptions,
): {
  update: (options?: TruncateOptions) => void;
};
