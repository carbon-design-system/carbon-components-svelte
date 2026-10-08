export type RequiredInvalidOptions = {
  /** `true` when an empty required control blocks submission, `false` on form reset. */
  onChange: (missing: boolean) => void;
  /** The element to focus in place of the empty control. */
  getFocusTarget?: () => HTMLElement | null | undefined;
};

/**
 * Shows a field's own invalid state instead of the browser's error bubble
 * when a required control in `node` is empty. SSR-safe.
 */
export function requiredInvalid(
  node: HTMLElement,
  options: RequiredInvalidOptions,
): {
  update: (options: RequiredInvalidOptions) => void;
  destroy: () => void;
};
