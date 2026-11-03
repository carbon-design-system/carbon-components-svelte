/**
 * Split the naming and description attributes out of a component's rest
 * props. Rest props spread onto the root element, but these attributes
 * only work on the element that takes focus or carries the role. When
 * that is a child, the component places them there and spreads `rest`
 * on the root.
 */
export function splitAriaNaming<T extends Record<string, unknown>>(
  restProps: T,
): {
  ariaLabel: string | undefined;
  ariaLabelledBy: string | undefined;
  ariaDescribedBy: string | undefined;
  rest: Omit<T, "aria-label" | "aria-labelledby" | "aria-describedby">;
};

/**
 * Split every `aria-*` attribute out of a component's rest props, for a
 * component whose root is a wrapper with no role, such as a presentational
 * `li`. Those attributes describe the control inside it. The rest stay on
 * the wrapper.
 */
export function splitAria<T extends Record<string, unknown>>(
  restProps: T,
): {
  aria: Record<`aria-${string}`, string | undefined>;
  rest: Omit<T, `aria-${string}`>;
};
