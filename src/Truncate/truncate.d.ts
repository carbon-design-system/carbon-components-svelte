interface TruncateOptions {
  clamp?: "end" | "front";
}

/**
 * Svelte action that applies single-line text truncation to an element.
 * @param node - The element to truncate
 * @param options - Optional clamp direction ("end" or "front")
 * @returns Object with update method (options may be undefined when action is updated with no args)
 */
export function truncate(
  node: HTMLElement,
  options?: TruncateOptions,
): {
  update: (options?: TruncateOptions) => void;
};

export default truncate;
