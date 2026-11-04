/**
 * A `tabindex` prop's value, for an element's `tabindex` attribute. The
 * prop takes a string, as markup passes it (`tabindex="0"`), and the
 * attribute renders the same either way; Svelte's element types take only
 * a number.
 */
export function tabindexAttribute(
  value: number | string | null | undefined,
): number | null | undefined;
