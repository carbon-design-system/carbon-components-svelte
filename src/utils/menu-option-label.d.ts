/**
 * Read a menu option's accessible label text: its
 * `.bx--menu-option__label` child if present, else the element's own
 * text content, trimmed.
 */
export function menuOptionLabel(item: HTMLElement): string;
