/** Whether `node` is disabled by an ancestor `<fieldset disabled>`, outside its first `<legend>`. */
export function isInDisabledFieldset(node: Element): boolean;

/** Svelte action: call `onChange` when an ancestor `<fieldset disabled>` disables or enables `node`. */
export function fieldsetDisabled(
  node: Element,
  onChange: (disabled: boolean) => void,
): {
  update: (onChange: (disabled: boolean) => void) => void;
  destroy: () => void;
};
