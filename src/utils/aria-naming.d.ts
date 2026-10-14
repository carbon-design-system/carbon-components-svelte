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
