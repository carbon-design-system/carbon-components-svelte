export type RequiredInvalidOptions = {
  /** `true` when an empty required control blocks submission, `false` on form reset. */
  onChange: (missing: boolean) => void;
  /** The element to focus in place of the empty control. */
  getFocusTarget?: () => HTMLElement | null | undefined;
  /** Always cancel `invalid`, for a hidden input validating for a list box. */
  proxy?: boolean;
  /** Also handle a `pattern` mismatch, for a pattern the user never wrote. */
  pattern?: boolean;
  /** Set to `false` while the field isn't required, so it adds no listeners. */
  enabled?: boolean;
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
