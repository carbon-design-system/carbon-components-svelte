/**
 * Whether `element` is an open modal dialog: one with `aria-modal="true"`,
 * or a `<dialog>` opened with `showModal()`, which sets no `aria-modal`.
 */
export function isModalDialog(element: Element): boolean;
