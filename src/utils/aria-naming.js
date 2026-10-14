/**
 * Split the naming and description attributes out of a component's rest
 * props. Rest props spread onto the root element, but these attributes
 * only work on the element that takes focus or carries the role. When
 * that is a child, the component places them there and spreads `rest`
 * on the root.
 *
 * @param {Record<string, any>} restProps
 */
export function splitAriaNaming(restProps) {
  const {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    ...rest
  } = restProps;
  return { ariaLabel, ariaLabelledBy, ariaDescribedBy, rest };
}
