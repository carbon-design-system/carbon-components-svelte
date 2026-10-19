/**
 * Svelte action: while the pointer is over `node`, give it a `title` with
 * its full text when the text is cut off, and none otherwise.
 */
export function titleWhenTruncated(node: HTMLElement): { destroy(): void };
